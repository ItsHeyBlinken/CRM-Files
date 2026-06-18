import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const VendorDashboard: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">PortalHub</h1>
            <p className="text-sm text-gray-500">Vendor dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="mt-2 text-gray-600">
            Your vendor dashboard is ready. Project management, client invites, and
            branding settings will be built here next.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Signed in as <strong>{user?.role}</strong>
          </p>
        </div>
      </main>
    </div>
  )
}

export default VendorDashboard
