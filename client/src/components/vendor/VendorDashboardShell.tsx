import React from 'react'

interface VendorDashboardShellProps {
  children: React.ReactNode
}

/** Platform marketing background for all vendor-facing routes. */
export const VendorDashboardShell: React.FC<VendorDashboardShellProps> = ({ children }) => (
  <div className="min-h-screen marketing-page-bg relative">
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full marketing-orb-cyan blur-3xl" />
      <div className="absolute top-20 right-0 h-96 w-96 rounded-full marketing-orb-blue blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full marketing-orb-purple blur-3xl" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
)

/** Full-page loader (onboarding gate, standalone routes). */
export const VendorPageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center marketing-page-bg">
    <div className="vendor-spinner" aria-label="Loading" />
  </div>
)

/** Centered loader inside the dashboard shell. */
export const VendorInlineLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="vendor-spinner" aria-label="Loading" />
  </div>
)

export default VendorDashboardShell
