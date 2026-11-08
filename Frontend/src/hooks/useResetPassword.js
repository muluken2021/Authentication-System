/**
 * useResetPassword — handles the reset-password form submission.
 * Reads the `token` query parameter from the URL automatically.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as authService from '../services/authService.js'

export function useResetPassword() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token') ?? ''

  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [apiError, setApiError] = useState('')

  const missingToken = !token

  async function doReset(password) {
    if (!token) {
      setApiError('Reset token is missing. Please use the link from your email.')
      return
    }
    setApiError('')
    setLoading(true)
    try {
      await authService.resetPassword({ token, password })
      setSuccess(true)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    doReset,
    loading,
    success,
    apiError,
    missingToken,
    clearError: () => setApiError(''),
  }
}
