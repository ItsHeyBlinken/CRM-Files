import React from 'react'
import VendorLogoAvatar from '../branding/VendorLogoAvatar'
import { vendorBrandGradientStyle } from '../../utils/portalBranding'

interface ClientPortalHeaderProps {
  vendorBusinessName: string
  vendorLogoUrl: string | null
  vendorTagline: string | null
  primaryColor: string
  secondaryColor: string
  clientLabel: string
  onSignOut: () => void
}

const ClientPortalHeader: React.FC<ClientPortalHeaderProps> = ({
  vendorBusinessName,
  vendorLogoUrl,
  vendorTagline,
  primaryColor,
  secondaryColor,
  clientLabel,
  onSignOut,
}) => (
  <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div className="h-1" style={vendorBrandGradientStyle(primaryColor, secondaryColor)} />
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <VendorLogoAvatar
            logoUrl={vendorLogoUrl}
            label={vendorBusinessName}
            accentColor={primaryColor}
            className="h-11 w-11 rounded-xl"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{vendorBusinessName}</h1>
            {vendorTagline && (
              <p className="text-xs text-gray-500 truncate">{vendorTagline}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-sm shrink-0 pt-0.5 hover:opacity-80"
          style={{ color: primaryColor }}
        >
          Sign out
        </button>
      </div>
      <p className="mt-3 text-base font-medium text-gray-900 truncate">{clientLabel}</p>
    </div>
  </header>
)

export default ClientPortalHeader
