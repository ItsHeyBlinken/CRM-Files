import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppName from '../components/branding/AppName'
import MarketingAuthLayout from '../components/Auth/MarketingAuthLayout'
import { APP_TAGLINE } from '../constants/branding'
import { getHomePathForRole } from '../utils/roleRedirect'

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    jobTitle: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone || undefined,
        formData.company || undefined,
        formData.jobTitle || undefined
      )
      navigate('/dashboard/onboarding')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MarketingAuthLayout
      maxWidth="lg"
      title="Create your vendor account"
      subtitle={
        <>
          <AppName className="font-semibold" accentClassName="font-semibold text-blue-600" /> —{' '}
          {APP_TAGLINE}
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="auth-input"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="auth-input"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
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
              value={formData.email}
              onChange={handleChange}
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
              autoComplete="new-password"
              required
              className="auth-input"
              placeholder="Password (min. 8 characters)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="auth-input"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="phone" className="sr-only">
              Phone (optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="auth-input"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="company" className="sr-only">
              Company (optional)
            </label>
            <input
              id="company"
              name="company"
              type="text"
              className="auth-input"
              placeholder="Business name (optional)"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="jobTitle" className="sr-only">
              Job Title (optional)
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              className="auth-input"
              placeholder="Job title (optional)"
              value={formData.jobTitle}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </form>
    </MarketingAuthLayout>
  )
}

export default Register
