import React, { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { getHomePathForRole } from '../utils/roleRedirect'

interface InviteDetails {
  email: string
  projectTitle: string
  clientDisplayName: string | null
  vendorBusinessName: string
  expiresAt: string
  projectHasClient?: boolean
  linkedClientEmail?: string | null
}

const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { registerClient, isAuthenticated, user, loading: authLoading, logout } = useAuth()

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      setLoadingInvite(false)
      return
    }

    const loadInvite = async () => {
      try {
        const response = await api.get(`/auth/invite/${token}`)
        setInvite(response.data)
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined
        setError(message || 'This invite link is invalid or expired')
      } finally {
        setLoadingInvite(false)
      }
    }

    loadInvite()
  }, [token])

  const handleSignOutToContinue = async () => {
    setSigningOut(true)
    setError('')
    try {
      await logout()
    } finally {
      setSigningOut(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token || !invite) {
      return
    }

    if (!formData.firstName || !formData.lastName || !formData.password) {
      setError('Please fill in all required fields')
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

    setSubmitting(true)

    try {
      const registeredUser = await registerClient({
        token,
        email: invite.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      })
      navigate(getHomePathForRole(registeredUser.role))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">Invite unavailable</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Link to="/login" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    const role = user.role.toUpperCase()
    const inviteEmail = invite.email.toLowerCase()
    const userEmail = user.email.toLowerCase()

    if (role === 'CLIENT') {
      if (
        invite.projectHasClient &&
        invite.linkedClientEmail?.toLowerCase() === inviteEmail &&
        userEmail === inviteEmail
      ) {
        return <Navigate to="/portal" replace />
      }

      if (userEmail !== inviteEmail) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Different account signed in</h2>
              <p className="text-sm text-gray-600">
                This invite is for <strong>{invite.email}</strong>, but you are signed in as{' '}
                <strong>{user.email}</strong>.
              </p>
              <button
                type="button"
                onClick={handleSignOutToContinue}
                disabled={signingOut}
                className="w-full py-2 px-4 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {signingOut ? 'Signing out...' : 'Sign out and continue'}
              </button>
              <Link to="/portal" className="inline-block text-sm text-indigo-600 hover:text-indigo-500">
                Go to my portal
              </Link>
            </div>
          </div>
        )
      }
    }

    if (role === 'VENDOR' || role === 'ADMIN') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Client invite link</h2>
            <p className="text-sm text-gray-600">
              You are signed in as a vendor. This link is for your client to create their portal
              login for <strong>{invite.projectTitle}</strong>.
            </p>
            <p className="text-xs text-gray-500">
              To test the client flow yourself, sign out first or open this link in a private
              window.
            </p>
            <button
              type="button"
              onClick={handleSignOutToContinue}
              disabled={signingOut}
              className="w-full py-2 px-4 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign out and preview client setup'}
            </button>
            <Link
              to={getHomePathForRole(user.role)}
              className="inline-block text-sm text-gray-600 hover:text-indigo-600"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      )
    }
  }

  if (invite.projectHasClient) {
    const isSameEmail =
      invite.linkedClientEmail?.toLowerCase() === invite.email.toLowerCase()
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center space-y-3">
          <h2 className="text-lg font-medium text-gray-900">Portal already set up</h2>
          <p className="text-sm text-gray-600">
            {isSameEmail
              ? 'This project already has an account for your email. Sign in to view your portal.'
              : 'This project already has a client linked. Only one client per project in MVP — ask your vendor for help.'}
          </p>
          <Link to="/login" className="inline-block text-indigo-600 hover:text-indigo-500 font-medium">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Set up your portal login</h2>
          <p className="mt-2 text-sm text-gray-600">
            {invite.vendorBusinessName} invited you to <strong>{invite.projectTitle}</strong>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            You do not have an account yet — choose a password below. This is a one-time setup.
          </p>
        </div>

        <form className="mt-8 space-y-4 bg-white shadow rounded-lg p-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={invite.email}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone (optional)
            </label>
            <input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Create account & view project'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default AcceptInvite
