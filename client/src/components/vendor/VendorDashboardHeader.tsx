import React from 'react'
import { Link } from 'react-router-dom'
import PlatformLogo from '../branding/PlatformLogo'
import { useVendorBranding } from './VendorBrandingProvider'
import VendorNotificationBell from './VendorNotificationBell'

export type VendorNavSection =
  | 'projects'
  | 'quotes'
  | 'calendar'
  | 'payments'
  | 'settings'

const NAV_ITEMS: { key: VendorNavSection; label: string; to: string }[] = [
  { key: 'projects', label: 'Home', to: '/dashboard' },
  { key: 'quotes', label: 'Quotes', to: '/dashboard/quotes' },
  { key: 'calendar', label: 'Calendar', to: '/dashboard/calendar' },
  { key: 'payments', label: 'Payments', to: '/dashboard/payments' },
  { key: 'settings', label: 'Settings', to: '/dashboard/settings' },
]

interface VendorDashboardHeaderProps {
  active: VendorNavSection
  userEmail?: string | null
  onLogout: () => void
  maxWidthClass?: string
}

const VendorDashboardHeader: React.FC<VendorDashboardHeaderProps> = ({
  active,
  userEmail,
  onLogout,
  maxWidthClass = 'max-w-5xl',
}) => {
  const { profile } = useVendorBranding()
  const businessName = profile?.businessName?.trim()

  return (
    <header className="vendor-header">
      <div className={`${maxWidthClass} mx-auto px-4 py-4 flex items-center justify-between gap-4`}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <PlatformLogo heightClass="h-10" to="/dashboard" />
            {businessName && (
              <div className="min-w-0 hidden sm:block border-l border-slate-200 pl-3">
                <p className="text-sm font-semibold text-slate-900 truncate">{businessName}</p>
                <p className="text-xs text-slate-500">Vendor dashboard</p>
              </div>
            )}
          </div>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV_ITEMS.map((item) =>
              item.key === active ? (
                <span key={item.key} className="vendor-nav-active">
                  {item.label}
                </span>
              ) : (
                <Link key={item.key} to={item.to} className="vendor-nav-link">
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <VendorNotificationBell />
          <span className="text-sm text-slate-600 hidden md:inline">{userEmail}</span>
          <button type="button" onClick={onLogout} className="text-sm vendor-link">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default VendorDashboardHeader
