import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import { useVendorBranding } from '../components/vendor/VendorBrandingProvider'
import {
  fetchVendorProfile,
  updateVendorProfile,
  uploadVendorLogo,
} from '../services/vendorExtrasService'
import { fetchVendorPlanUsage } from '../services/planService'
import StarterPlanBanner, { ProPlanManageLink } from '../components/vendor/StarterPlanBanner'
import type { VendorPlanUsage } from '../types/plan'
import type { VendorProfile } from '../types/vendorExtras'

const VendorSettings: React.FC = () => {
  const { user, logout } = useAuth()
  const { refreshProfile, accentColor } = useVendorBranding()
  const [form, setForm] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [planUsage, setPlanUsage] = useState<VendorPlanUsage | null>(null)

  const loadProfile = useCallback(async () => {
    try {
      setError('')
      const [profile, usage] = await Promise.all([fetchVendorProfile(), fetchVendorPlanUsage()])
      setForm(profile)
      setPlanUsage(usage)
    } catch {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return

    setSubmitting(true)
    setError('')

    try {
      const updated = await updateVendorProfile({
        businessName: form.businessName,
        tagline: form.tagline,
        serviceType: form.serviceType,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        website: form.website,
        businessPhone: form.businessPhone,
        businessEmail: form.businessEmail,
      })
      setForm(updated)
      await refreshProfile()
      toast.success('Brand settings saved')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(message || 'Failed to save settings')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSubmitting(true)
    setError('')

    try {
      const updated = await uploadVendorLogo(file)
      setForm(updated)
      await refreshProfile()
      toast.success('Logo updated')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(message || 'Failed to upload logo')
    } finally {
      setSubmitting(false)
      event.target.value = ''
    }
  }

  if (loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorDashboardHeader
        active="settings"
        userEmail={user?.email}
        onLogout={() => logout()}
        maxWidthClass="max-w-3xl"
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Brand & portal settings</h2>
          <p className="text-sm text-gray-600">
            This is what clients see in their portal — and how your dashboard is styled.
          </p>
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <StarterPlanBanner usage={planUsage} focus="both" />

        {planUsage?.plan === 'pro' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-2">
            <h3 className="font-medium text-gray-900">SmoothGig Pro</h3>
            <p className="text-sm text-gray-600">
              Unlimited projects and quotes
              {planUsage.billing?.subscriptionStatus
                ? ` · Subscription ${planUsage.billing.subscriptionStatus}`
                : ''}
              .
            </p>
            <ProPlanManageLink usage={planUsage} />
          </section>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Logo</h3>
            <div className="flex items-center gap-4">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover border" />
              ) : (
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-semibold"
                  style={{ backgroundColor: accentColor }}
                >
                  {form.businessName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: accentColor }}
              >
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Business details</h3>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Business name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              value={form.tagline ?? ''}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Tagline (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              value={form.serviceType ?? ''}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              placeholder="Service type (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Brand colors</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-gray-700">Primary color</span>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="mt-1 h-10 w-full cursor-pointer rounded border border-gray-300"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Secondary color</span>
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  className="mt-1 h-10 w-full cursor-pointer rounded border border-gray-300"
                />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Contact (optional)</h3>
            <input
              type="email"
              value={form.businessEmail ?? ''}
              onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
              placeholder="Business email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              value={form.businessPhone ?? ''}
              onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
              placeholder="Business phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              value={form.website ?? ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="Website"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {submitting ? 'Saving...' : 'Save settings'}
          </button>
        </form>

        <section className="rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Transactional email (optional)</p>
          <p className="mt-2">
            Configure SMTP on the server to send quote, invite, and invoice emails automatically.
            Set <code className="text-xs bg-gray-100 px-1 rounded">SMTP_HOST</code> and{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">SMTP_FROM</code> in your server environment.
          </p>
        </section>
      </main>
    </div>
  )
}

export default VendorSettings
