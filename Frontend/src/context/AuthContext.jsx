/**
 * AuthContext — global authentication state.
 *
 * Security model:
 *  - Access token stored in memory only (never localStorage) → XSS-safe.
 *  - Refresh token lives in an HTTP-only cookie managed by the backend.
 *  - On mount, a silent /auth/refresh call restores the session from the cookie.
 *  - The shared `api` Axios instance is wired here:
 *      • setAccessToken() keeps the interceptor's in-memory copy in sync.
 *      • setUnauthenticatedCallback() lets the interceptor clear React state
 *        when a refresh attempt fails mid-session.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import {
  setAccessToken  as storeToken,
  setUnauthenticatedCallback,
} from '../../../services/api.js'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Keep the api.js in-memory token in sync whenever user state changes ──
  // (access token is stored in context AND in api.js, both in memory)
  const [accessToken, _setAccessToken] = useState(null)
  function syncToken(token) {
    _setAccessToken(token)
    storeToken(token)
  }

  // ── Tell api.js how to clear React state on a failed refresh ─────────────
  useEffect(() => {
    setUnauthenticatedCallback(() => {
      syncToken(null)
      setUser(null)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hydrate on mount: silent refresh → restore session from cookie ────────
  useEffect(() => {
    authService.refreshToken()
      .then(({ accessToken: token }) => {
        syncToken(token)
        return authService.getMe()
      })
      .then(userData => setUser(userData))
      .catch(() => { /* no active session — that's fine */ })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)  // throws on failure
    syncToken(result.accessToken)
    setUser(result.user)
    return result
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    const result = await authService.register(data)      // throws on failure
    syncToken(result.accessToken)
    setUser(result.user)
    return result
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout()   // revokes refresh token cookie server-side
    syncToken(null)
    setUser(null)
  }, [])

  // ── Called by AuthCallbackPage after Google OAuth redirect ────────────────
  const loginWithGoogleResult = useCallback(({ accessToken: token, user: u }) => {
    syncToken(token)
    setUser(u)
  }, [])

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    loginWithGoogleResult,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
