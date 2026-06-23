import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppName from '../components/branding/AppName'
import MarketingAuthLayout from '../components/Auth/MarketingAuthLayout'
import { getHomePathForRole } from '../utils/roleRedirect'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const loggedInUser = await login(email, password)
      navigate(getHomePathForRole(loggedInUser.role))
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingAuthLayout
      title={
        <>
          Sign in to <AppName accentClassName="text-blue-600" />
        </>
      }
      subtitle="Vendors and clients use the same sign-in page"
      footnote="First time here? If your vendor sent you a link, open that invite link to create your account — you cannot sign in until you have done that once."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Event vendor?{' '}
          <Link to="/register" className="auth-link">
            Create a vendor account
          </Link>
        </p>
      </form>
    </MarketingAuthLayout>
  )
}

export default Login