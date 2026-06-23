import React from 'react'
import { Link } from 'react-router-dom'
import AppName from '../branding/AppName'
import VendorLogoAvatar from '../branding/VendorLogoAvatar'
import { APP_NAME } from '../../constants/branding'
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
  title?: string
  maxWidthClass?: string
}

const VendorDashboardHeader: React.FC<VendorDashboardHeaderProps> = ({
  active,
  userEmail,
  onLogout,
  title,
  maxWidthClass = 'max-w-5xl',
}) => {
  const { profile, accentColor } = useVendorBranding()
  const businessTitle = title ?? profile?.businessName
  const showPlatformWordmark = !businessTitle
  const displayTitle = businessTitle ?? APP_NAME

  return (
    <header className="bg-white border-b border-gray-200">
      <div className={`${maxWidthClass} mx-auto px-4 py-4 flex items-center justify-between gap-4`}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <VendorLogoAvatar
              logoUrl={profile?.logoUrl ?? null}
              label={displayTitle}
              accentColor={accentColor}
            />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {showPlatformWordmark ? (
                  <AppName accentColor={accentColor} />
                ) : (
                  displayTitle
                )}
              </h1>
              {profile?.tagline && (
                <p className="text-xs text-gray-500 truncate">{profile.tagline}</p>
              )}
            </div>
          </div>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV_ITEMS.map((item) =>
              item.key === active ? (
                <span key={item.key} className="font-medium" style={{ color: accentColor }}>
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
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <VendorNotificationBell />
          <span className="text-sm text-gray-600 hidden md:inline">{userEmail}</span>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm hover:opacity-80"
            style={{ color: accentColor }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

export default VendorDashboardHeader
