import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const ClientPortal: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Your project portal</h1>
            <p className="text-sm text-gray-500">PortalHub client view</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Hello{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="mt-2 text-gray-600">
            This is your client portal. You will see your wedding project status,
            contracts, invoices, and deliverables here once those features are connected.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Signed in as <strong>{user?.email}</strong>
          </p>
        </div>
      </main>
    </div>
  )
}

export default ClientPortal
