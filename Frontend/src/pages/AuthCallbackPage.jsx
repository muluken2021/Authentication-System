/**
 * AuthCallbackPage — /auth/callback
 *
 * Called after a successful Google OAuth flow.
 *
 * Security model (updated):
 *  The backend no longer passes the access token in the URL.
 *  Instead it stores it in a short-lived HTTP-only cookie and this page
 *  immediately calls GET /auth/google/token to retrieve and consume it.
 *  This prevents the token from ever appearing in browser history,
 *  server logs, or Referer headers.
 */
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../../../services/api.js'

export default function AuthCallbackPage() {
  const navigate                  = useNavigate()
  const [params]                  = useSearchParams()
  const { loginWithGoogleResult } = useAuth()
  const processed                 = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    // Backend redirects here with ?error=... on failure
    const error = params.get('error')
    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      return
    }

    // Exchange the short-lived HTTP-only handoff cookie for the access token
    api.get('/auth/google/token')
      .then(({ data }) => {
        const { accessToken, user } = data.data
        loginWithGoogleResult({ accessToken, user })
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        navigate('/login?error=Google+authentication+failed.', { replace: true })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-10 h-10 rounded-full border-[3px] border-neutral-200 border-t-neutral-900 animate-spin" />
      <p className="text-sm text-neutral-500">Completing sign-in…</p>
    </div>
  )
}
