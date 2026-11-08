import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthInput from '../components/AuthInput.jsx'
import AuthButton from '../components/AuthButton.jsx'
import { useForgotPassword } from '../hooks/useForgotPassword.js'

export default function ForgotPassword() {
  const { sendResetLink, loading, sent, error, clearError } = useForgotPassword()
  const [email, setEmail]       = useState('')
  const [localError, setLocalError] = useState('')

  function validate() {
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
    return ''
  }

  function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setLocalError(err); return }
    sendResetLink(email)
  }

  const displayError = localError || error

  if (sent) {
    return (
      <AuthLayout>
        <div>
          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Check your inbox</h1>
          <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
            If an account exists for <strong className="text-neutral-900">{email}</strong>, we&apos;ve sent a reset link. Check your spam folder if you don&apos;t see it.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 mb-7">
            ✓ Reset link sent to {email}
          </div>
          <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 hover:underline underline-offset-2">
            ← Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-7 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/>
          </svg>
          Back to Sign In
        </Link>

        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Forgot password?</h1>
        <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
          No worries. Enter your email and we&apos;ll send you a reset link.
        </p>

        {displayError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-5">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="Email" id="email" name="email" type="email"
            autoComplete="email" placeholder="Enter your email"
            value={email}
            onChange={e => { setEmail(e.target.value); setLocalError(''); clearError() }}
            required
          />
          <AuthButton loading={loading} disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </AuthButton>
        </form>
      </div>
    </AuthLayout>
  )
}
