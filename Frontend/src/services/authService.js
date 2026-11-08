/**
 * src/features/auth/services/authService.js
 *
 * All authentication API calls, isolated from UI components.
 * Uses the shared `api` Axios instance (with interceptors).
 *
 * Response envelope from the backend:
 *   Success → { success: true,  message?, data? }
 *   Error   → { success: false, message,  code, details? }
 *
 * Every function here either:
 *   - Returns the relevant `data` payload on success, OR
 *   - Re-throws a normalised Error with a human-readable `.message`
 *     and an optional `.details` array for field-level validation errors.
 */
import api from '../../../services/api.js'

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the most useful error message from an Axios error.
 * Falls back to a generic string if the backend response is unavailable.
 */
function extractError(err) {
  const payload = err.response?.data
  const error   = new Error(
    payload?.message ?? 'Something went wrong. Please try again.',
  )
  error.status  = err.response?.status
  error.code    = payload?.code
  error.details = payload?.details ?? null  // field-level Zod errors
  return error
}

// ─── auth endpoints ───────────────────────────────────────────────────────────

/**
 * Register a new account.
 * POST /auth/register
 *
 * @param {{ fullName: string, email: string, password: string }} body
 * @returns {{ user, accessToken, expiresIn }}
 */
export async function register({ fullName, email, password }) {
  try {
    const { data } = await api.post('/auth/register', { fullName, email, password })
    return data.data  // { user: {id, fullName, email}, accessToken, expiresIn }
  } catch (err) {
    throw extractError(err)
  }
}

/**
 * Log in with email + password.
 * POST /auth/login
 *
 * @param {{ email: string, password: string }} body
 * @returns {{ user, accessToken, expiresIn }}
 */
export async function login({ email, password }) {
  try {
    const { data } = await api.post('/auth/login', { email, password })
    return data.data  // { user: {id, fullName, email}, accessToken, expiresIn }
  } catch (err) {
    throw extractError(err)
  }
}

/**
 * Silently refresh the access token using the HTTP-only cookie.
 * POST /auth/refresh
 *
 * @returns {{ accessToken, expiresIn }}
 */
export async function refreshToken() {
  try {
    const { data } = await api.post('/auth/refresh')
    return data.data  // { accessToken, expiresIn }
  } catch (err) {
    throw extractError(err)
  }
}

/**
 * Fetch the authenticated user's profile.
 * GET /auth/me  (requires Authorization header — handled by interceptor)
 *
 * @returns {{ id, fullName, email, isEmailVerified, status, createdAt }}
 */
export async function getMe() {
  try {
    const { data } = await api.get('/auth/me')
    return data.data
  } catch (err) {
    throw extractError(err)
  }
}

/**
 * Log out — revokes the refresh token and clears the cookie.
 * POST /auth/logout  (protected)
 */
export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {
    // Ignore errors — the client-side state is cleared regardless
  }
}

/**
 * Request a password-reset email.
 * POST /auth/forgot-password
 *
 * The backend always returns 200 regardless of whether the email exists
 * (prevents user enumeration).
 */
export async function forgotPassword(email) {
  try {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data   // { success: true, message }
  } catch (err) {
    throw extractError(err)
  }
}

/**
 * Reset the user's password with the token from the email link.
 * POST /auth/reset-password
 *
 * @param {{ token: string, password: string }} body
 */
export async function resetPassword({ token, password }) {
  try {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data   // { success: true, message }
  } catch (err) {
    throw extractError(err)
  }
}

/**
 * Returns the full backend URL that initiates the Google OAuth flow.
 * The browser navigates to this URL directly — it is NOT an Axios call.
 */
export function googleAuthUrl() {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1'
  return `${base}/auth/google`
}
