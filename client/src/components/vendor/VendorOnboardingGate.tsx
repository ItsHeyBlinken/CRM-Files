import React, { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { fetchVendorOnboarding } from '../../services/onboardingService'
import { VendorBrandingProvider } from './VendorBrandingProvider'
import VendorDashboardShell, { VendorPageLoader } from './VendorDashboardShell'

const VendorOnboardingGate: React.FC = () => {
  const location = useLocation()
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchVendorOnboarding()
      setNeedsOnboarding(data.status.needsOnboarding)
    } catch {
      setNeedsOnboarding(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus, location.pathname])

  if (needsOnboarding === null) {
    return <VendorPageLoader />
  }

  const onOnboardingPage = location.pathname === '/dashboard/onboarding'

  if (needsOnboarding && !onOnboardingPage) {
    return <Navigate to="/dashboard/onboarding" replace />
  }

  if (!needsOnboarding && onOnboardingPage) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <VendorBrandingProvider>
      <VendorDashboardShell>
        <Outlet />
      </VendorDashboardShell>
    </VendorBrandingProvider>
  )
}

export default VendorOnboardingGate
