import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchVendorProfile } from '../../services/vendorExtrasService'
import type { VendorProfile } from '../../types/vendorExtras'

interface VendorBrandingContextValue {
  profile: VendorProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const VendorBrandingContext = createContext<VendorBrandingContextValue>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function useVendorBranding(): VendorBrandingContextValue {
  return useContext(VendorBrandingContext)
}

export const VendorBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (user?.role !== 'VENDOR') {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const data = await fetchVendorProfile()
      setProfile(data)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const value = useMemo(
    () => ({
      profile,
      loading,
      refreshProfile,
    }),
    [profile, loading, refreshProfile]
  )

  return <VendorBrandingContext.Provider value={value}>{children}</VendorBrandingContext.Provider>
}
