/**
 * useSignUp — handles the registration form submission.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function useSignUp() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  const [loading,      setLoading]      = useState(false)
  const [apiError,     setApiError]     = useState('')
  const [fieldErrors,  setFieldErrors]  = useState({})

  /**
   * @param {{ fullName: string, email: string, password: string }} data
   */
  async function signUp(data) {
    setApiError('')
    setFieldErrors({})
    setLoading(true)
    try {
      await register(data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // Map backend field-level validation errors back to form fields
      if (err.details?.length) {
        const mapped = {}
        err.details.forEach(d => { if (d.field) mapped[d.field] = d.message })
        setFieldErrors(mapped)
      } else {
        setApiError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp,
    loading,
    apiError,
    fieldErrors,
    clearError: () => { setApiError(''); setFieldErrors({}) },
  }
}
