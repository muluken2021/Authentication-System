/**
 * useForgotPassword — handles the forgot-password form submission.
 */
import { useState } from 'react'
import * as authService from '../services/authService.js'

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function sendResetLink(email) {
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { sendResetLink, loading, sent, error, clearError: () => setError('') }
}
