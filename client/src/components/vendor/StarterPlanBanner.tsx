import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { openBillingPortal, startProCheckout } from '../../services/planService'
import { getApiErrorMessage } from '../../utils/apiErrors'
import type { VendorPlanUsage } from '../../types/plan'

type StarterPlanBannerProps = {
  usage: VendorPlanUsage | null
  focus?: 'quotes' | 'projects' | 'both'
}

function formatLimit(used: number, limit: number): string {
  return `${used}/${limit}`
}

const StarterPlanBanner: React.FC<StarterPlanBannerProps> = ({
  usage,
  focus = 'both',
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!usage || usage.plan === 'pro') {
    return null
  }

  const { activeProjects, quotesThisMonth } = usage.limits
  const showProjects = focus === 'projects' || focus === 'both'
  const showQuotes = focus === 'quotes' || focus === 'both'
  const atAnyLimit = activeProjects.atLimit || quotesThisMonth.atLimit
  const billingConfigured = usage.billing?.configured === true

  const handleUpgrade = async () => {
    if (!billingConfigured) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const url = await startProCheckout()
      window.location.href = url
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not start checkout'))
      setLoading(false)
    }
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        atAnyLimit
          ? 'border-amber-300/60 bg-amber-50 text-amber-950'
          : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-medium">Starter plan</p>
          <p className="mt-1 text-sm opacity-90">
            {showQuotes && (
              <>
                {formatLimit(quotesThisMonth.used, quotesThisMonth.limit)} quotes in{' '}
                {quotesThisMonth.periodLabel}
              </>
            )}
            {showQuotes && showProjects && ' · '}
            {showProjects && (
              <>
                {formatLimit(activeProjects.used, activeProjects.limit)} active project
                {activeProjects.limit === 1 ? '' : 's'}
              </>
            )}
          </p>
          {atAnyLimit && (
            <p className="mt-2 text-sm">
              You&apos;ve hit a Starter limit. Upgrade to Pro for unlimited projects and quotes.
            </p>
          )}
          {usage.billing?.checkoutTier === 'founding_pro' &&
            usage.billing.foundingPro?.remaining != null && (
              <p className="mt-2 text-sm">
                Founding Pro pricing — {usage.billing.foundingPro.remaining} of{' '}
                {usage.billing.foundingPro.cap} spots left at the locked rate.
              </p>
            )}
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>
        {billingConfigured ? (
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading
              ? 'Redirecting…'
              : usage.billing?.checkoutTier === 'founding_pro'
                ? 'Upgrade to Founding Pro'
                : 'Upgrade to Pro'}
          </button>
        ) : (
          <Link
            to="/#pricing"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            View Pro pricing
          </Link>
        )}
      </div>
    </div>
  )
}

export default StarterPlanBanner

export const ProPlanManageLink: React.FC<{
  usage: VendorPlanUsage | null
}> = ({ usage }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!usage?.billing?.canManage) {
    return null
  }

  const handleManage = async () => {
    setLoading(true)
    setError('')
    try {
      const url = await openBillingPortal()
      window.location.href = url
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not open billing portal'))
      setLoading(false)
    }
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => void handleManage()}
        disabled={loading}
        className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-60"
      >
        {loading ? 'Opening…' : 'Manage Pro subscription'}
      </button>
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  )
}
