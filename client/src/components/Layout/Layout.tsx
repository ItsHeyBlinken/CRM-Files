import React, { ReactNode } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children?: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/contacts', label: 'Contacts' },
    { path: '/leads', label: 'Leads' },
    { path: '/deals', label: 'Deals' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/activities', label: 'Activities' },
    { path: '/reports', label: 'Reports' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">CRM Dashboard</h1>
          </div>
          <nav className="mt-6">
            <div className="px-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <main className="p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
