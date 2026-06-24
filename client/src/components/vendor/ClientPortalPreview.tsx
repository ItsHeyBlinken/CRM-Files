import React from 'react'
import VendorLogoAvatar from '../branding/VendorLogoAvatar'
import { vendorBrandGradientStyle } from '../../utils/portalBranding'

interface ClientPortalPreviewProps {
  businessName: string
  tagline: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
}

/** Live preview of how the client portal will look with current brand settings. */
const ClientPortalPreview: React.FC<ClientPortalPreviewProps> = ({
  businessName,
  tagline,
  logoUrl,
  primaryColor,
  secondaryColor,
}) => (
  <div className="rounded-2xl border border-dashed border-slate-300 overflow-hidden bg-slate-50/80">
    <p className="px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-200/80 bg-white/60">
      Client portal preview
    </p>
    <div className="bg-white">
      <div className="h-1" style={vendorBrandGradientStyle(primaryColor, secondaryColor)} />
      <div className="px-4 py-3 flex items-center gap-3">
        <VendorLogoAvatar
          logoUrl={logoUrl}
          label={businessName}
          accentColor={primaryColor}
          className="h-10 w-10 rounded-xl"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{businessName}</p>
          {tagline && <p className="text-xs text-slate-500 truncate">{tagline}</p>}
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div
          className="rounded-xl p-3 text-white text-sm"
          style={vendorBrandGradientStyle(primaryColor, secondaryColor)}
        >
          <p className="text-xs opacity-90">What&apos;s next</p>
          <p className="font-semibold">Sign your contract</p>
        </div>
        <p className="text-xs text-slate-500">
          Primary = buttons &amp; links · Secondary = gradients &amp; accents
        </p>
      </div>
    </div>
  </div>
)

export default ClientPortalPreview
