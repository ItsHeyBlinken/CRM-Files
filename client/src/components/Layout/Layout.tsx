import React, { ReactNode } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface LayoutProps {
  children?: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/settings', label: 'Settings' },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">PortalHub</h1>
            <p className="text-sm text-gray-500 mt-1">Admin</p>
          </div>
          <nav className="mt-6 flex-1">
            <div className="px-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="p-6 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Admin'}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="flex-1">
          <main className="p-6">{children || <Outlet />}</main>
        </div>
      </div>
    </div>
  )
}

export default Layout
