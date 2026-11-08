import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthInput from '../components/AuthInput.jsx'
import AuthButton from '../components/AuthButton.jsx'
import GoogleAuthButton from '../components/GoogleAuthButton.jsx'
import { useSignIn } from '../hooks/useSignIn.js'

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function SignIn() {
  const [searchParams]              = useSearchParams()
  const { signIn, loading, apiError, clearError } = useSignIn()

  const [form, setForm]             = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPwd, setShowPwd]       = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Surface an error passed via redirect (e.g. failed Google OAuth).
  // Sanitise the URL param — only show it if it matches a known safe pattern
  // to prevent reflected content injection from attacker-crafted URLs.
  const rawUrlError = searchParams.get('error') ?? ''
  const SAFE_ERROR_PATTERN = /^[a-zA-Z0-9 _.,'!?-]{0,200}$/
  const urlError = SAFE_ERROR_PATTERN.test(rawUrlError) ? rawUrlError : 'Authentication failed. Please try again.'

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFieldErrors(er => ({ ...er, [name]: '' }))
    clearError()
  }

  function validate() {
    const errs = {}
    if (!form.email.trim())
      errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Please enter a valid email address.'
    if (!form.password)
      errs.password = 'Password is required.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    signIn({ email: form.email, password: form.password })
  }

  const displayError = apiError || urlError

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Welcome back</h1>
        <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
          Sign in to your BizFinance account.
        </p>

        {displayError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-5 leading-relaxed">
            {displayError}
          </div>
        )}

        <GoogleAuthButton label="Sign in with Google" disabled={loading} />

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-neutral-400 shrink-0">OR</span>
          <span className="flex-1 h-px bg-neutral-200" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="Email" id="email" name="email" type="email"
            autoComplete="email" placeholder="Enter your email"
            value={form.email} onChange={handleChange}
            error={fieldErrors.email} required
          />

          <AuthInput
            label="Password" id="password" name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password" placeholder="Enter your password"
            value={form.password} onChange={handleChange}
            error={fieldErrors.password} required
            rightSlot={
              <button
                type="button" onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer bg-transparent border-0 p-0 flex items-center"
              >
                <EyeIcon open={showPwd} />
              </button>
            }
          />

          <div className="flex items-center justify-between -mt-1 mb-5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-neutral-900 cursor-pointer shrink-0"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-neutral-900 font-medium hover:underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>

          <AuthButton loading={loading} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </AuthButton>
        </form>

        <p className="text-center mt-6 text-sm text-neutral-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-neutral-900 font-semibold underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
