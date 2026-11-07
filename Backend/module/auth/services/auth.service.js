import User from "../models/User.model.js";
import RefreshToken from "../models/RefreshToken.model.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../../shared/utils/jwt.js";
import { generateSecureToken, hashToken, comparePasswordDirectly } from "../../../shared/utils/hash.js";
import config from "../../../config/index.js";
import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
  AppError,
} from "../../../shared/errors/index.js";
import { USER_STATUS, PASSWORD_RESET_EXPIRES_MS } from "../../../shared/constants/index.js";
import { sendPasswordResetEmail } from "../../../shared/services/email.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a RefreshToken document and return the raw token string.
 * Only the hash is stored in MongoDB.
 * @param {string} userId
 * @returns {{ rawToken: string, refreshTokenDoc: import("mongoose").Document }}
 */
async function createRefreshTokenRecord(userId) {
  const rawToken = signRefreshToken(userId);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiresInSeconds * 1000);

  const refreshTokenDoc = await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return { rawToken, refreshTokenDoc };
}

/**
 * Build the access + refresh token pair for a response.
 * @param {string} userId
 * @returns {{ accessToken: string, rawRefreshToken: string }}
 */
async function issueTokenPair(userId) {
  const accessToken = signAccessToken(userId);
  const { rawToken: rawRefreshToken } = await createRefreshTokenRecord(userId);
  return { accessToken, rawRefreshToken };
}

/**
 * Revoke all active refresh tokens for a user.
 * Used after password change or password reset.
 * @param {string} userId
 */
async function revokeAllUserRefreshTokens(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Register a new user.
 * @param {{ fullName: string, email: string, password: string }} data
 * @returns {{ user: object, accessToken: string, rawRefreshToken: string }}
 */
export async function registerUser({ fullName, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const user = await User.create({ fullName, email, password });
  const { accessToken, rawRefreshToken } = await issueTokenPair(user._id.toString());

  return { user: user.toPublicJSON(), accessToken, rawRefreshToken };
}

/**
 * Authenticate a user with email + password.
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, accessToken: string, rawRefreshToken: string }}
 */
export async function loginUser({ email, password }) {
  // Explicitly select password because it is excluded by default
  const user = await User.findOne({ email }).select("+password");

  // Perform a constant-time bcrypt comparison even when the user does not exist.
  // This prevents timing attacks that could reveal whether an email is registered
  // by measuring the response time difference (bcrypt compare vs. early return).
  const DUMMY_HASH =
    "$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsa";

  const passwordToCheck = user?.password ?? DUMMY_HASH;
  const isPasswordValid = await comparePasswordDirectly(password, passwordToCheck);

  if (!user || !isPasswordValid) {
    // Intentionally identical message for both cases (user enumeration prevention)
    throw new AuthenticationError("Invalid email or password.");
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AuthenticationError("Your account has been suspended. Please contact support.");
  }

  const { accessToken, rawRefreshToken } = await issueTokenPair(user._id.toString());

  return { user: user.toPublicJSON(), accessToken, rawRefreshToken };
}

/**
 * Rotate a refresh token.
 * Revokes the old token, issues a new pair.
 * Detects reuse attacks: if the old token is already revoked, all sessions are revoked.
 * @param {string} rawRefreshToken - Token from the HTTP-only cookie.
 * @returns {{ accessToken: string, rawRefreshToken: string }}
 */
export async function refreshTokens(rawRefreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new AuthenticationError("Invalid or expired refresh token.");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    throw new AuthenticationError("Refresh token not found.");
  }

  // Reuse attack: token already revoked → revoke all sessions for safety
  if (storedToken.revokedAt) {
    await revokeAllUserRefreshTokens(decoded.sub);
    throw new AuthenticationError("Refresh token reuse detected. All sessions have been revoked.");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AuthenticationError("Refresh token has expired.");
  }

  // Verify the user still exists and is active
  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new AuthenticationError("User not found.");
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AuthenticationError("Account suspended.");
  }

  // Rotate: revoke old token
  storedToken.revokedAt = new Date();

  // Issue new pair
  const newAccessToken = signAccessToken(user._id.toString());
  const newRawRefreshToken = signRefreshToken(user._id.toString());
  const newTokenHash = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiresInSeconds * 1000);

  const newRefreshTokenDoc = await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    expiresAt,
  });

  storedToken.replacedByTokenId = newRefreshTokenDoc._id;
  await storedToken.save();

  return { accessToken: newAccessToken, rawRefreshToken: newRawRefreshToken };
}

/**
 * Revoke the user's current refresh token (logout).
 * @param {string} rawRefreshToken
 */
export async function logoutUser(rawRefreshToken) {
  if (!rawRefreshToken) return; // already no session

  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

/**
 * Initiate the forgot-password flow.
 *
 * Always returns the same shape { sent: true } so the controller can
 * respond identically regardless of whether the email existed.
 * When the email service is not configured, throws an AppError so the
 * caller can surface a 502 rather than silently doing nothing.
 *
 * IMPORTANT: never reveal whether an account exists for the given email.
 *
 * @param {string} email
 * @returns {Promise<{ sent: true }>}
 */
export async function forgotPassword(email) {
  const user = await User.findOne({ email });

  // Silently succeed when no account matches — prevents user enumeration.
  if (!user) {
    return { sent: true };
  }

  // Generate a single-use, cryptographically secure token.
  const rawResetToken = generateSecureToken(32);
  const tokenHash     = hashToken(rawResetToken);

  user.passwordResetTokenHash  = tokenHash;
  user.passwordResetExpiresAt  = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS);
  await user.save({ validateBeforeSave: false });

  // Build the frontend reset URL.
  const resetUrl = `${config.frontend.url}/reset-password?token=${rawResetToken}`;

  // Send via Gmail SMTP — throws AppError on delivery failure.
  await sendPasswordResetEmail({
    to:       user.email,
    resetUrl,
    fullName: user.fullName,
  });

  return { sent: true };
}

/**
 * Reset the user's password using a valid reset token.
 * Invalidates all existing refresh sessions.
 * @param {{ token: string, password: string }} data
 */
export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) {
    throw new AppError("Password reset token is invalid or has expired.", 400, "INVALID_TOKEN");
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Invalidate all active sessions
  await revokeAllUserRefreshTokens(user._id.toString());
}

/**
 * Change the authenticated user's password.
 * Invalidates all existing refresh sessions.
 * @param {{ userId: string, currentPassword: string, newPassword: string }} data
 */
export async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    throw new AuthenticationError("Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all active sessions so all other devices are logged out
  await revokeAllUserRefreshTokens(userId);
}
