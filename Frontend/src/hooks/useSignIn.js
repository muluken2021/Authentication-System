/**
 * useSignIn — handles the login form submission.
 *
 * Keeps all API interaction and state out of the UI component.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function useSignIn() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  /**
   * @param {{ email: string, password: string }} credentials
   */
  async function signIn(credentials) {
    setApiError('')
    setLoading(true)
    try {
      await login(credentials)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { signIn, loading, apiError, clearError: () => setApiError('') }
}
