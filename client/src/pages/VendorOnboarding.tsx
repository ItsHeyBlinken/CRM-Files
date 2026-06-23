import React, { useCallback, useEffect, useState } from 'react'
import AppName from '../components/branding/AppName'
import { useNavigate } from 'react-router-dom'
import { completeVendorOnboarding, fetchVendorOnboarding } from '../services/onboardingService'

type OnboardingStep = 'business' | 'payments' | 'stripe'

const STEPS: OnboardingStep[] = ['business', 'payments', 'stripe']

const VendorOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<OnboardingStep>('business')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [businessName, setBusinessName] = useState('')
  const [form, setForm] = useState({
    stripePaymentLink: '',
    venmoHandle: '',
    zelleHandle: '',
    cashappHandle: '',
    paypalHandle: '',
    paymentInstructions: '',
  })

  const stepIndex = STEPS.indexOf(step)

  const loadInitial = useCallback(async () => {
    try {
      const data = await fetchVendorOnboarding()
      if (data.status.businessName) {
        setBusinessName(data.status.businessName)
      }
      if (data.status.settings.stripePaymentLink) {
        setForm((f) => ({
          ...f,
          stripePaymentLink: data.status.settings.stripePaymentLink ?? '',
        }))
      }
    } catch {
      /* optional preload */
    }
  }, [])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const hasAnyP2P = Boolean(
    form.venmoHandle.trim() ||
      form.zelleHandle.trim() ||
      form.cashappHandle.trim() ||
      form.paypalHandle.trim()
  )

  const hasStripeLink = Boolean(form.stripePaymentLink.trim())

  const finishOnboarding = async (skipPaymentSetup: boolean) => {
    setSubmitting(true)
    setError('')

    try {
      await completeVendorOnboarding({
        businessName: businessName.trim(),
        stripePaymentLink: form.stripePaymentLink.trim() || null,
        venmoHandle: form.venmoHandle.trim() || null,
        zelleHandle: form.zelleHandle.trim() || null,
        cashappHandle: form.cashappHandle.trim() || null,
        paypalHandle: form.paypalHandle.trim() || null,
        paymentInstructions: form.paymentInstructions.trim() || null,
        skipPaymentSetup,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save setup'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-6">
          <p className="text-sm font-medium text-indigo-600">
            Welcome to <AppName accentClassName="text-indigo-600" />
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Set up your business</h1>
          <p className="text-sm text-gray-600 mt-2">
            Step {stepIndex + 1} of {STEPS.length} — takes about 2 minutes
          </p>
          <div className="mt-4 flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= stepIndex ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {step === 'business' && (
          <section className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Your business name</h2>
            <p className="text-sm text-gray-600">
              Clients see this on their portal — use your studio or brand name.
            </p>
            <label className="block text-sm">
              <span className="text-gray-700">Business name</span>
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sam Photography"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <button
              type="button"
              disabled={!businessName.trim()}
              onClick={() => setStep('payments')}
              className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 rounded-md disabled:opacity-50"
            >
              Continue
            </button>
          </section>
        )}

        {step === 'payments' && (
          <section className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-medium text-gray-900">How clients pay you</h2>
            <p className="text-sm text-gray-600">
              Add at least one method so clients can pay invoices in their portal. You can always
              change these later.
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
              <span className="text-gray-700">PayPal.me link or handle</span>
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
                rows={2}
                placeholder="e.g. Include your name on Zelle"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>

            <div className="flex flex-col gap-2 pt-2">
              {(hasAnyP2P || hasStripeLink) && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => finishOnboarding(false)}
                  className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 rounded-md disabled:opacity-50"
                >
                  Finish with these payment methods
                </button>
              )}
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep('stripe')}
                className="w-full py-3 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md disabled:opacity-50"
              >
                Also accept card payments (Stripe)
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => finishOnboarding(true)}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Set up payments later
              </button>
              <button
                type="button"
                onClick={() => setStep('business')}
                className="w-full py-2 text-sm text-indigo-600"
              >
                Back
              </button>
            </div>
          </section>
        )}

        {step === 'stripe' && (
          <section className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Accept card payments (optional)</h2>
            <p className="text-sm text-gray-600">
              Paste a Payment Link from your Stripe Dashboard. Clients open your link to pay — we
              never access your Stripe account. Skip this if you only use Venmo, Zelle, etc.
            </p>

            <label className="block text-sm">
              <span className="text-gray-700">Stripe Payment Link URL</span>
              <input
                value={form.stripePaymentLink}
                onChange={(e) => setForm((f) => ({ ...f, stripePaymentLink: e.target.value }))}
                placeholder="https://buy.stripe.com/..."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={submitting}
                onClick={() => finishOnboarding(false)}
                className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 rounded-md disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Finish setup'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => finishOnboarding(false)}
                className="w-full py-2 text-sm text-gray-600"
              >
                Skip card payments for now
              </button>
              <button
                type="button"
                onClick={() => setStep('payments')}
                className="w-full py-2 text-sm text-indigo-600"
              >
                Back
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default VendorOnboarding
