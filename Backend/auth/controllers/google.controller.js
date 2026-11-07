/**
 * Google OAuth controllers — Authorization Code flow
 *
 * GET  /api/v1/auth/google           → redirect to Google
 * GET  /api/v1/auth/google/callback  → handle Google's response
 *
 * Security: access token is delivered to the frontend via a short-lived
 * HTTP-only cookie (not a URL query param) to prevent it appearing in
 * server logs, browser history, or Referer headers.
 */

import {
  generateOAuthState,
  generateAuthUrl,
  handleGoogleCallback,
} from "../services/google.service.js";
import { setRefreshTokenCookie } from "../../../shared/utils/cookie.js";
import config from "../../../config/index.js";

// Cookie names
const OAUTH_STATE_COOKIE       = "oauth_state";
const OAUTH_ACCESS_TOKEN_COOKIE = "oauth_at";   // short-lived handoff cookie

// State cookie: must survive the round-trip to Google and back (≤ 10 min)
const STATE_COOKIE_MAX_AGE = 10 * 60 * 1000;

// Access token handoff cookie: consumed immediately by AuthCallbackPage (≤ 2 min)
const ACCESS_TOKEN_HANDOFF_MAX_AGE = 2 * 60 * 1000;

/**
 * GET /api/v1/auth/google
 * Generate a state token, store it in a cookie, redirect to Google.
 */
export function initiateGoogleAuth(req, res) {
  const state = generateOAuthState();

  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: "lax",
    maxAge: STATE_COOKIE_MAX_AGE,
    path: "/",
  });

  const authUrl = generateAuthUrl(state);
  return res.redirect(authUrl);
}

/**
 * GET /api/v1/auth/google/callback
 * Exchange code, verify identity, issue tokens, redirect to frontend.
 *
 * The access token is delivered via a short-lived HTTP-only cookie that the
 * frontend's /auth/callback page reads via a dedicated endpoint rather than
 * from the URL, keeping the token out of browser history and server logs.
 */
export async function googleCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.warn(`[Google OAuth] Provider error: ${error}`);
      return res.redirect(`${config.frontend.url}/login?error=google_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${config.frontend.url}/login?error=google_auth_failed`);
    }

    const storedState = req.cookies?.[OAUTH_STATE_COOKIE];

    // Clear the state cookie immediately — it is single-use
    res.clearCookie(OAUTH_STATE_COOKIE, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: "lax",
      path: "/",
    });

    const { user, accessToken, rawRefreshToken } = await handleGoogleCallback(
      code,
      state,
      storedState,
    );

    // Attach long-lived refresh token as HTTP-only cookie
    setRefreshTokenCookie(res, rawRefreshToken);

    // Deliver the access token via a short-lived HTTP-only cookie.
    // AuthCallbackPage will immediately call GET /auth/google/token to read it.
    res.cookie(OAUTH_ACCESS_TOKEN_COOKIE, JSON.stringify({
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    }), {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_HANDOFF_MAX_AGE,
      path: "/",
    });

    // Redirect to the callback page — no token in the URL
    return res.redirect(`${config.frontend.url}/auth/callback`);
  } catch (err) {
    const message = encodeURIComponent(
      err.message ?? "Authentication failed. Please try again.",
    );
    return res.redirect(`${config.frontend.url}/login?error=${message}`);
  }
}

/**
 * GET /api/v1/auth/google/token
 * Called by AuthCallbackPage immediately after the redirect.
 * Returns the access token from the short-lived handoff cookie, then clears it.
 */
export function getGoogleToken(req, res) {
  const raw = req.cookies?.[OAUTH_ACCESS_TOKEN_COOKIE];

  // Always clear the handoff cookie regardless of outcome
  res.clearCookie(OAUTH_ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: "lax",
    path: "/",
  });

  if (!raw) {
    return res.status(400).json({
      success: false,
      message: "OAuth handoff token not found or already consumed.",
      code: "OAUTH_TOKEN_NOT_FOUND",
    });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid OAuth handoff token.",
      code: "OAUTH_TOKEN_INVALID",
    });
  }

  return res.json({ success: true, data: payload });
}
