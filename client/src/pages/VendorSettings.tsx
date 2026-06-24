import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import ClientPortalPreview from '../components/vendor/ClientPortalPreview'
import { VendorInlineLoader } from '../components/vendor/VendorDashboardShell'
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
  const { refreshProfile } = useVendorBranding()
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
      toast.success('Client portal branding saved')
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
    return <VendorInlineLoader />
  }

  return (
    <div>
      <VendorDashboardHeader
        active="settings"
        userEmail={user?.email}
        onLogout={() => logout()}
        maxWidthClass="max-w-3xl"
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Client portal branding</h2>
          <p className="text-sm text-slate-600 mt-1">
            Logo, colors, and business details shown to your clients in their project portal.
            Your vendor dashboard uses the SmoothGig platform theme.
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <StarterPlanBanner usage={planUsage} focus="both" />

        {planUsage?.plan === 'pro' && (
          <section className="vendor-card p-6 space-y-2">
            <h3 className="font-medium text-slate-900">SmoothGig Pro</h3>
            <p className="text-sm text-slate-600">
              Unlimited projects and quotes
              {planUsage.billing?.subscriptionStatus
                ? ` · Subscription ${planUsage.billing.subscriptionStatus}`
                : ''}
              .
            </p>
            <ProPlanManageLink usage={planUsage} />
          </section>
        )}

        <ClientPortalPreview
          businessName={form.businessName}
          tagline={form.tagline}
          logoUrl={form.logoUrl}
          primaryColor={form.primaryColor}
          secondaryColor={form.secondaryColor}
        />

        <form onSubmit={handleSave} className="space-y-6">
          <section className="vendor-card p-6 space-y-4">
            <h3 className="font-medium text-slate-900">Logo</h3>
            <p className="text-sm text-slate-600">Displayed in your client&apos;s portal header.</p>
            <div className="flex items-center gap-4">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover border border-slate-200" />
              ) : (
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-semibold"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  {form.businessName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <label className="vendor-btn-primary cursor-pointer">
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </section>

          <section className="vendor-card p-6 space-y-4">
            <h3 className="font-medium text-slate-900">Business details</h3>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Business name"
              className="auth-input"
            />
            <input
              value={form.tagline ?? ''}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Tagline (optional)"
              className="auth-input"
            />
            <input
              value={form.serviceType ?? ''}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              placeholder="Service type (optional)"
              className="auth-input"
            />
          </section>

          <section className="vendor-card p-6 space-y-4">
            <h3 className="font-medium text-slate-900">Client portal colors</h3>
            <p className="text-sm text-slate-600">
              Primary is used for links and buttons. Secondary blends into gradients on highlight cards.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-700 font-medium">Primary color</span>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-slate-300"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-700 font-medium">Secondary color</span>
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-slate-300"
                />
              </label>
            </div>
          </section>

          <section className="vendor-card p-6 space-y-4">
            <h3 className="font-medium text-slate-900">Contact (optional)</h3>
            <input
              type="email"
              value={form.businessEmail ?? ''}
              onChange={(e) => setForm({ ...form, businessEmail: e.target.value })}
              placeholder="Business email"
              className="auth-input"
            />
            <input
              value={form.businessPhone ?? ''}
              onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
              placeholder="Business phone"
              className="auth-input"
            />
            <input
              value={form.website ?? ''}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="Website"
              className="auth-input"
            />
          </section>

          <button type="submit" disabled={submitting} className="vendor-btn-primary">
            {submitting ? 'Saving...' : 'Save portal branding'}
          </button>
        </form>

        <section className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600 bg-white/50">
          <p className="font-medium text-slate-900">Transactional email (optional)</p>
          <p className="mt-2">
            Configure SMTP on the server to send quote, invite, and invoice emails automatically.
            Set <code className="text-xs bg-slate-100 px-1 rounded">SMTP_HOST</code> and{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">SMTP_FROM</code> in your server environment.
          </p>
        </section>
      </main>
    </div>
  )
}

export default VendorSettings
