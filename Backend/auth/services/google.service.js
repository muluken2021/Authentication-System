/**
 * Google OAuth 2.0 service using Authorization Code flow.
 *
 * Flow:
 *  1.  generateAuthUrl()  → send user to Google
 *  2.  handleCallback()   → exchange code for tokens, verify identity,
 *                           find-or-create user, issue our own JWT pair
 *
 * Security:
 *  - State param (CSRF protection): generated here, validated in the controller
 *  - Google Client Secret never leaves this file / the backend process
 *  - Only verified Google email addresses are accepted
 *  - Existing local accounts with the same email are linked automatically
 */

import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import config from "../../../config/index.js";
import User from "../models/User.model.js";
import RefreshToken from "../models/RefreshToken.model.js";
import { signAccessToken, signRefreshToken } from "../../../shared/utils/jwt.js";
import { hashToken } from "../../../shared/utils/hash.js";
import { AuthenticationError, AppError } from "../../../shared/errors/index.js";
import { USER_STATUS } from "../../../shared/constants/index.js";

// ─── OAuth2 client (lazy singleton) ──────────────────────────────────────────

let _client = null;

function getOAuthClient() {
  if (_client) return _client;

  if (!config.google.isConfigured) {
    throw new AppError(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL.",
      500,
      "GOOGLE_OAUTH_NOT_CONFIGURED"
    );
  }

  _client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.callbackUrl
  );

  return _client;
}

// ─── State token helpers (CSRF protection) ───────────────────────────────────

/**
 * Generate a cryptographically secure state token.
 * The value is stored in a short-lived cookie and compared on callback.
 * @returns {string}
 */
export function generateOAuthState() {
  return crypto.randomBytes(24).toString("hex");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build the Google authorization URL with the given state value.
 * @param {string} state - CSRF state token (store in cookie before redirecting)
 * @returns {string}
 */
export function generateAuthUrl(state) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });
}

/**
 * Handle the OAuth callback: exchange code → verify identity → find/create user.
 *
 * @param {string} code   - Authorization code from Google
 * @param {string} state  - State param from Google (must match cookie)
 * @param {string} storedState - State value stored in the cookie
 * @returns {{ user: object, accessToken: string, rawRefreshToken: string }}
 */
export async function handleGoogleCallback(code, state, storedState) {
  // ── CSRF check ─────────────────────────────────────────────────────────────
  if (!storedState || !state || state !== storedState) {
    throw new AuthenticationError("OAuth state mismatch. Please try signing in again.");
  }

  const client = getOAuthClient();

  // ── Exchange authorization code for tokens ─────────────────────────────────
  let tokens;
  try {
    const response = await client.getToken(code);
    tokens = response.tokens;
  } catch (err) {
    console.error(`[Google OAuth] Token exchange failed (${err.code ?? err.message})`);
    throw new AuthenticationError("Failed to complete Google authentication. Please try again.");
  }

  // ── Verify the ID token and extract claims ─────────────────────────────────
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.google.clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error(`[Google OAuth] ID token verification failed (${err.message})`);
    throw new AuthenticationError("Google identity verification failed. Please try again.");
  }

  const { sub: googleId, email, email_verified, name, given_name } = payload;

  // ── Require a verified email from Google ──────────────────────────────────
  if (!email_verified) {
    throw new AuthenticationError(
      "Your Google account email is not verified. Please verify it with Google first."
    );
  }

  // ── Find or create the user ────────────────────────────────────────────────
  const user = await findOrCreateGoogleUser({ googleId, email, name, given_name });

  // ── Issue our own JWT pair (reuses existing helpers) ──────────────────────
  const accessToken    = signAccessToken(user._id.toString());
  const rawRefreshToken = signRefreshToken(user._id.toString());
  const tokenHash      = hashToken(rawRefreshToken);
  const expiresAt      = new Date(Date.now() + config.jwt.refreshExpiresInSeconds * 1000);

  await RefreshToken.create({ userId: user._id, tokenHash, expiresAt });

  return { user: user.toPublicJSON(), accessToken, rawRefreshToken };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Find an existing user by Google ID or email, or create a new one.
 * Handles three cases:
 *  1. Returning Google user   → return as-is
 *  2. Existing local account  → link Google ID to it
 *  3. Brand new user          → create with googleId, no password
 */
async function findOrCreateGoogleUser({ googleId, email, name, given_name }) {
  // Case 1: already linked
  let user = await User.findOne({ googleId });
  if (user) {
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new AuthenticationError(
        "Your account has been suspended. Please contact support."
      );
    }
    return user;
  }

  // Case 2: existing local account with same email → link it
  user = await User.findOne({ email });
  if (user) {
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new AuthenticationError(
        "Your account has been suspended. Please contact support."
      );
    }
    user.googleId       = googleId;
    user.authProvider   = "google";
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
    return user;
  }

  // Case 3: new user
  const fullName = name ?? given_name ?? email.split("@")[0];
  user = await User.create({
    fullName,
    email,
    googleId,
    authProvider: "google",
    isEmailVerified: true,
    // password intentionally omitted — OAuth user
  });

  return user;
}
