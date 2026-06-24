import React, { useCallback, useEffect, useState } from 'react'
import { APP_NAME } from '../constants/branding'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import { VendorInlineLoader } from '../components/vendor/VendorDashboardShell'
import {
  fetchPaymentSettings,
  updatePaymentSettings,
  type VendorPaymentSettings as PaymentSettings,
} from '../services/paymentSettingsService'

const VendorPaymentSettingsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    stripePaymentLink: '',
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
      setForm({
        stripePaymentLink: data.settings.stripePaymentLink ?? '',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updatePaymentSettings({
        stripePaymentLink: form.stripePaymentLink.trim() || null,
        venmoHandle: form.venmoHandle.trim() || null,
        zelleHandle: form.zelleHandle.trim() || null,
        cashappHandle: form.cashappHandle.trim() || null,
        paypalHandle: form.paypalHandle.trim() || null,
        paymentInstructions: form.paymentInstructions.trim() || null,
      })
      setSettings(updated)
      setSuccess('Payment settings saved.')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save payment settings'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <VendorInlineLoader />
  }

  return (
    <div>
      <VendorDashboardHeader
        active="payments"
        maxWidthClass="max-w-3xl"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Payment settings</h2>
          <p className="text-sm text-slate-600 mt-1">
            How clients pay you through their portal.
          </p>
        </div>
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="vendor-card p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Stripe (optional)</h2>
            <p className="text-sm text-gray-600">
              If you already use Stripe, paste a Payment Link from your Stripe Dashboard. Clients
              open your link to pay by card — {APP_NAME} never touches your Stripe account or
              card processing.
            </p>
            <p className="text-sm text-gray-500">
              In Stripe: Products → Payment links → create a link (you can update the amount per
              invoice on your side). Mark invoices paid here after you confirm payment.
            </p>

            {settings?.stripePaymentLink ? (
              <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                Card payments are available to clients via your Stripe link.
              </div>
            ) : null}

            <label className="block text-sm">
              <span className="text-gray-700">Stripe Payment Link URL</span>
              <input
                value={form.stripePaymentLink}
                onChange={(e) => setForm((f) => ({ ...f, stripePaymentLink: e.target.value }))}
                placeholder="https://buy.stripe.com/..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
          </section>

          <section className="vendor-card p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Manual payment handles</h2>
            <p className="text-sm text-gray-600">
              Shown to clients on unpaid invoices as clickable links (Venmo, Cash App, PayPal) plus
              copy buttons. You mark invoices paid after confirming payment.
            </p>

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
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="vendor-btn-primary"
          >
            {submitting ? 'Saving...' : 'Save payment settings'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default VendorPaymentSettingsPage
