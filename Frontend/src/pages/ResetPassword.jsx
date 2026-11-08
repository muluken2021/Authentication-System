import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthInput from '../components/AuthInput.jsx'
import AuthButton from '../components/AuthButton.jsx'
import { useResetPassword } from '../hooks/useResetPassword.js'

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

function ToggleEye({ show, onToggle }) {
  return (
    <button
      type="button" onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="text-neutral-400 hover:text-neutral-600 cursor-pointer bg-transparent border-0 p-0 flex items-center"
    >
      <EyeIcon open={show} />
    </button>
  )
}

export default function ResetPassword() {
  const { doReset, loading, success, apiError, missingToken, clearError } = useResetPassword()

  const [form, setForm]         = useState({ password: '', confirm: '' })
  const [localErrors, setLocalErrors] = useState({})
  const [showPwd, setShowPwd]   = useState(false)
  const [showConf, setShowConf] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setLocalErrors(er => ({ ...er, [name]: '' }))
    clearError()
  }

  function validate() {
    const errs = {}
    if (!form.password)
      errs.password = 'New password is required.'
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    if (!form.confirm)
      errs.confirm = 'Please confirm your password.'
    else if (form.password !== form.confirm)
      errs.confirm = 'Passwords do not match.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setLocalErrors(errs); return }
    doReset(form.password)
  }

  // ── Missing token in URL ──────────────────────────────────────────────────
  if (missingToken) {
    return (
      <AuthLayout>
        <div>
          <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Invalid reset link</h1>
          <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
            This password reset link is missing a token. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <AuthButton type="button">Request new link</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout>
        <div>
          <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Password reset!</h1>
          <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link to="/login">
            <AuthButton type="button">Sign in</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
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

        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Reset password</h1>
        <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
          Choose a strong new password for your account.
        </p>

        {apiError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-5">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="New password" id="password" name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password" placeholder="Enter new password"
            value={form.password} onChange={handleChange}
            error={localErrors.password}
            hint={!localErrors.password ? 'Min 8 chars with uppercase, lowercase, number & special character.' : ''}
            required
            rightSlot={<ToggleEye show={showPwd} onToggle={() => setShowPwd(v => !v)} />}
          />

          <AuthInput
            label="Confirm password" id="confirm" name="confirm"
            type={showConf ? 'text' : 'password'}
            autoComplete="new-password" placeholder="Confirm new password"
            value={form.confirm} onChange={handleChange}
            error={localErrors.confirm} required
            rightSlot={<ToggleEye show={showConf} onToggle={() => setShowConf(v => !v)} />}
          />

          {form.password && form.confirm && !localErrors.confirm && (
            <p className={`text-xs -mt-2 mb-4 ${form.password === form.confirm ? 'text-green-600' : 'text-red-500'}`}>
              {form.password === form.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          <AuthButton loading={loading} disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </AuthButton>
        </form>
      </div>
    </AuthLayout>
  )
}
