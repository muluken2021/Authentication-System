import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../../../shared/utils/cookie.js";
import { COOKIE_NAMES } from "../../../shared/constants/index.js";
import config from "../../../config/index.js";

/**
 * POST /api/v1/auth/register
 */
export async function register(req, res) {
  const { fullName, email, password } = req.body;

  const { user, accessToken, rawRefreshToken } = await authService.registerUser({
    fullName,
    email,
    password,
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Account created successfully.",
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      accessToken,
      expiresIn: config.jwt.accessExpiresInSeconds,
    },
  });
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req, res) {
  const { email, password } = req.body;

  const { user, accessToken, rawRefreshToken } = await authService.loginUser({
    email,
    password,
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Login successful.",
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
      accessToken,
      expiresIn: config.jwt.accessExpiresInSeconds,
    },
  });
}

/**
 * POST /api/v1/auth/refresh
 * The refresh token is read from the HTTP-only cookie.
 */
export async function refresh(req, res) {
  const rawRefreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

  if (!rawRefreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not provided.",
      code: "AUTHENTICATION_ERROR",
    });
  }

  const { accessToken, rawRefreshToken: newRawRefreshToken } =
    await authService.refreshTokens(rawRefreshToken);

  setRefreshTokenCookie(res, newRawRefreshToken);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Token refreshed successfully.",
    data: {
      accessToken,
      expiresIn: config.jwt.accessExpiresInSeconds,
    },
  });
}

/**
 * POST /api/v1/auth/logout
 * Protected — requires a valid access token.
 */
export async function logout(req, res) {
  const rawRefreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];

  await authService.logoutUser(rawRefreshToken);
  clearRefreshTokenCookie(res);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Logged out successfully.",
  });
}

/**
 * GET /api/v1/auth/me
 * Protected — requires a valid access token.
 */
export async function getMe(req, res) {
  // req.user is attached by the authenticate middleware
  const { user } = req;

  return sendSuccess(res, {
    statusCode: 200,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
}

/**
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;

  // The service handles user-not-found silently to prevent enumeration.
  // Any AppError thrown (e.g. email delivery failure) propagates to the
  // global error handler automatically.
  await authService.forgotPassword(email);

  return sendSuccess(res, {
    statusCode: 200,
    message: "If an account exists with this email, a password reset link has been sent.",
  });
}

/**
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req, res) {
  const { token, password } = req.body;

  await authService.resetPassword({ token, password });

  return sendSuccess(res, {
    statusCode: 200,
    message: "Password reset successfully. Please log in with your new password.",
  });
}

/**
 * PATCH /api/v1/auth/change-password
 * Protected — requires a valid access token.
 */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id.toString();

  await authService.changePassword({ userId, currentPassword, newPassword });

  // Clear the current session cookie — user must log in again
  clearRefreshTokenCookie(res);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Password changed successfully. Please log in again.",
  });
}
