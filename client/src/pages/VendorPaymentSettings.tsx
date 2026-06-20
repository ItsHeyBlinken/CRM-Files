import React, { useCallback, useEffect, useState } from 'react'
import { APP_NAME } from '../constants/branding'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import {
  fetchPaymentSettings,
  refreshStripeConnectStatus,
  startStripeConnect,
  updatePaymentSettings,
  type VendorPaymentSettings as PaymentSettings,
} from '../services/paymentSettingsService'

const VendorPaymentSettingsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    venmoHandle: '',
    zelleHandle: '',
    cashappHandle: '',
    paypalHandle: '',
    paymentInstructions: '',
  })

  const loadSettings = useCallback(async () => {
    try {
      setError('')
      const data = await fetchPaymentSettings()
      setSettings(data.settings)
      setStripeConfigured(data.stripeConfigured)
      setForm({
        venmoHandle: data.settings.venmoHandle ?? '',
        zelleHandle: data.settings.zelleHandle ?? '',
        cashappHandle: data.settings.cashappHandle ?? '',
        paypalHandle: data.settings.paypalHandle ?? '',
        paymentInstructions: data.settings.paymentInstructions ?? '',
      })
    } catch {
      setError('Failed to load payment settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const stripeParam = searchParams.get('stripe')
    if (stripeParam !== 'return' && stripeParam !== 'refresh') {
      return
    }

    const refresh = async () => {
      setSubmitting(true)
      try {
        const data = await refreshStripeConnectStatus()
        setSettings(data.settings)
        setSuccess(
          data.settings.stripeChargesEnabled
            ? 'Card payments are active — clients can pay invoices in the portal.'
            : 'Stripe setup saved. Finish any remaining steps in Stripe to accept card payments.'
        )
      } catch {
        setError('Could not refresh Stripe status')
      } finally {
        setSubmitting(false)
        setSearchParams({})
      }
    }

    refresh()
  }, [searchParams, setSearchParams])

  const handleSaveP2P = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updatePaymentSettings({
        venmoHandle: form.venmoHandle.trim() || null,
        zelleHandle: form.zelleHandle.trim() || null,
        cashappHandle: form.cashappHandle.trim() || null,
        paypalHandle: form.paypalHandle.trim() || null,
        paymentInstructions: form.paymentInstructions.trim() || null,
      })
      setSettings(updated)
      setSuccess('Payment handles saved.')
    } catch {
      setError('Failed to save payment settings')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStripeConnect = async () => {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const url = await startStripeConnect()
      window.location.href = url
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to start Stripe setup'
      setError(message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorDashboardHeader
        active="payments"
        title="Payment settings"
        maxWidthClass="max-w-3xl"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
        )}

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Accept card payments (Stripe Connect)</h2>
          <p className="text-sm text-gray-600">
            Connect Stripe so clients can pay invoices with a card in their portal. Funds go to your
            Stripe account — {APP_NAME} does not take a platform fee at launch.
          </p>

          {settings?.stripeChargesEnabled ? (
            <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              Card payments are active for your account.
            </div>
          ) : settings?.stripeOnboardingComplete ? (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Stripe setup is in progress. Complete any remaining steps to accept cards.
            </div>
          ) : null}

          {!stripeConfigured ? (
            <p className="text-sm text-gray-500">
              Card payments require STRIPE_SECRET_KEY on the server. P2P handles below still work
              without Stripe.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleStripeConnect}
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
            >
              {settings?.stripeAccountId ? 'Continue Stripe setup' : 'Connect with Stripe'}
            </button>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-medium text-gray-900">Manual payment handles</h2>
          <p className="mt-1 text-sm text-gray-600">
            Shown to clients on unpaid invoices as clickable links (Venmo, Cash App, PayPal) plus
            copy buttons. You mark invoices paid after confirming payment.
          </p>

          <form onSubmit={handleSaveP2P} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="text-gray-700">Venmo @handle</span>
              <input
                value={form.venmoHandle}
                onChange={(e) => setForm((f) => ({ ...f, venmoHandle: e.target.value }))}
                placeholder="@your-venmo"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Zelle (email or phone)</span>
              <input
                value={form.zelleHandle}
                onChange={(e) => setForm((f) => ({ ...f, zelleHandle: e.target.value }))}
                placeholder="you@email.com"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Cash App $cashtag</span>
              <input
                value={form.cashappHandle}
                onChange={(e) => setForm((f) => ({ ...f, cashappHandle: e.target.value }))}
                placeholder="$YourCashtag"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">PayPal.me link or handle (display only)</span>
              <input
                value={form.paypalHandle}
                onChange={(e) => setForm((f) => ({ ...f, paypalHandle: e.target.value }))}
                placeholder="paypal.me/you"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-700">Payment instructions (optional)</span>
              <textarea
                value={form.paymentInstructions}
                onChange={(e) => setForm((f) => ({ ...f, paymentInstructions: e.target.value }))}
                rows={3}
                placeholder="Include your name on Zelle, memo line, etc."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save handles'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default VendorPaymentSettingsPage
