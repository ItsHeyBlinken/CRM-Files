import React, { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { fetchVendorOnboarding } from '../../services/onboardingService'

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const onOnboardingPage = location.pathname === '/dashboard/onboarding'

  if (needsOnboarding && !onOnboardingPage) {
    return <Navigate to="/dashboard/onboarding" replace />
  }

  if (!needsOnboarding && onOnboardingPage) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default VendorOnboardingGate
