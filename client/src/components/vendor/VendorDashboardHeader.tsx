import React from 'react'
import { Link } from 'react-router-dom'

export type VendorNavSection = 'projects' | 'quotes' | 'calendar' | 'payments'

const NAV_ITEMS: { key: VendorNavSection; label: string; to: string }[] = [
  { key: 'projects', label: 'Projects', to: '/dashboard' },
  { key: 'quotes', label: 'Quotes', to: '/dashboard/quotes' },
  { key: 'calendar', label: 'Calendar', to: '/dashboard/calendar' },
  { key: 'payments', label: 'Payments', to: '/dashboard/payments' },
]

interface VendorDashboardHeaderProps {
  active: VendorNavSection
  userEmail?: string | null
  onLogout: () => void
  title?: string
  maxWidthClass?: string
}

const VendorDashboardHeader: React.FC<VendorDashboardHeaderProps> = ({
  active,
  userEmail,
  onLogout,
  title = 'PortalHub',
  maxWidthClass = 'max-w-5xl',
}) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className={`${maxWidthClass} mx-auto px-4 py-4 flex items-center justify-between`}>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <nav className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV_ITEMS.map((item) =>
              item.key === active ? (
                <span key={item.key} className="text-indigo-600 font-medium">
                  {item.label}
                </span>
              ) : (
                <Link key={item.key} to={item.to} className="text-gray-500 hover:text-indigo-600">
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline">{userEmail}</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default VendorDashboardHeader
