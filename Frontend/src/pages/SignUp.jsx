/**
 * SignUp — registration page.
 *
 * The backend requires: fullName, email, password
 * Password rules (from Zod schema): min 8, uppercase, lowercase, digit, special char.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import AuthInput from '../components/AuthInput.jsx'
import AuthButton from '../components/AuthButton.jsx'
import GoogleAuthButton from '../components/GoogleAuthButton.jsx'
import { useSignUp } from '../hooks/useSignUp.js'

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

function Req({ met, text }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-neutral-400'}`}>
      <span className="text-[11px]">{met ? '✓' : '○'}</span>
      {text}
    </div>
  )
}

export default function SignUp() {
  const { signUp, loading, apiError, fieldErrors, clearError } = useSignUp()

  const [form, setForm]           = useState({ fullName: '', email: '', password: '' })
  const [localErrors, setLocalErrors] = useState({})
  const [showPwd, setShowPwd]     = useState(false)

  const pwd = form.password
  const reqs = {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number:    /\d/.test(pwd),
    special:   /[^A-Za-z0-9]/.test(pwd),
  }

  // Merge local client-side errors with backend field errors
  const errors = { ...localErrors, ...fieldErrors }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setLocalErrors(er => ({ ...er, [name]: '' }))
    clearError()
  }

  function validate() {
    const errs = {}
    if (!form.fullName.trim())
      errs.fullName = 'Full name is required.'
    else if (form.fullName.trim().length < 2)
      errs.fullName = 'Full name must be at least 2 characters.'
    if (!form.email.trim())
      errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Please enter a valid email address.'
    if (!form.password)
      errs.password = 'Password is required.'
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setLocalErrors(errs); return }
    signUp({ fullName: form.fullName.trim(), email: form.email, password: form.password })
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-medium text-neutral-900 tracking-tight mb-2">Create account</h1>
        <p className="text-[15px] text-neutral-500 mb-7 leading-relaxed">
          Start managing your business finances today.
        </p>

        {apiError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-5 leading-relaxed">
            {apiError}
          </div>
        )}

        <GoogleAuthButton label="Sign up with Google" disabled={loading} />

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-neutral-400 shrink-0">OR</span>
          <span className="flex-1 h-px bg-neutral-200" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <AuthInput
            label="Full name" id="fullName" name="fullName" type="text"
            autoComplete="name" placeholder="Enter your full name"
            value={form.fullName} onChange={handleChange}
            error={errors.fullName} required
          />

          <AuthInput
            label="Email" id="email" name="email" type="email"
            autoComplete="email" placeholder="Enter your email"
            value={form.email} onChange={handleChange}
            error={errors.email} required
          />

          <AuthInput
            label="Password" id="password" name="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password" placeholder="Create a password"
            value={form.password} onChange={handleChange}
            error={errors.password} required
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

          {pwd ? (
            <div className="bg-neutral-50 rounded-lg px-3 py-2.5 -mt-1 mb-4 flex flex-col gap-1">
              <Req met={reqs.length}    text="At least 8 characters" />
              <Req met={reqs.uppercase} text="One uppercase letter" />
              <Req met={reqs.lowercase} text="One lowercase letter" />
              <Req met={reqs.number}    text="One number" />
              <Req met={reqs.special}   text="One special character" />
            </div>
          ) : (
            <p className="text-xs text-neutral-400 -mt-1 mb-4">
              Min 8 chars with uppercase, lowercase, number &amp; special character.
            </p>
          )}

          <AuthButton loading={loading} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </AuthButton>
        </form>

        <p className="text-center mt-6 text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="text-neutral-900 font-semibold underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
