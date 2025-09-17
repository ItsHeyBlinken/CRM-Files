import React, { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

interface LayoutProps {
  children?: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
              <a href="/" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Dashboard
              </a>
              <a href="/contacts" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Contacts
              </a>
              <a href="/leads" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Leads
              </a>
              <a href="/deals" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Deals
              </a>
              <a href="/tasks" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Tasks
              </a>
              <a href="/activities" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Activities
              </a>
              <a href="/reports" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Reports
              </a>
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
