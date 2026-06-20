import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { APP_NAME } from '../../constants/branding'
import { useAuth } from '../../contexts/AuthContext'
import { fetchVendorProfile } from '../../services/vendorExtrasService'
import type { VendorProfile } from '../../types/vendorExtras'

interface VendorBrandingContextValue {
  profile: VendorProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  accentColor: string
}

const defaultProfile: VendorProfile = {
  userId: 0,
  businessName: APP_NAME,
  serviceType: null,
  tagline: null,
  logoUrl: null,
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  website: null,
  businessPhone: null,
  businessEmail: null,
}

const VendorBrandingContext = createContext<VendorBrandingContextValue>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  accentColor: defaultProfile.primaryColor,
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

  const accentColor = profile?.primaryColor ?? defaultProfile.primaryColor

  useEffect(() => {
    document.documentElement.style.setProperty('--vendor-accent', accentColor)
    return () => {
      document.documentElement.style.removeProperty('--vendor-accent')
    }
  }, [accentColor])

  const value = useMemo(
    () => ({
      profile,
      loading,
      refreshProfile,
      accentColor,
    }),
    [profile, loading, refreshProfile, accentColor]
  )

  return <VendorBrandingContext.Provider value={value}>{children}</VendorBrandingContext.Provider>
}
