import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import QuoteClientAgreementNotice from '../components/quotes/QuoteClientAgreementNotice'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import StarterPlanBanner from '../components/vendor/StarterPlanBanner'
import VendorEventDatePicker from '../components/vendor/VendorEventDatePicker'
import { createQuote, fetchVendorQuotes } from '../services/quoteService'
import { fetchVendorPlanUsage } from '../services/planService'
import { getApiErrorMessage } from '../utils/apiErrors'
import { formatUsDate } from '../utils/calendarHelpers'
import type { VendorPlanUsage } from '../types/plan'
import type { Quote, QuoteLineItemInput } from '../types/quote'

const emptyLineItem = (): QuoteLineItemInput => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
})

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

const statusLabel: Record<Quote['status'], string> = {
  draft: 'Draft',
  sent: 'Awaiting response',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  converted: 'Converted',
}

const VendorQuotes: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [planUsage, setPlanUsage] = useState<VendorPlanUsage | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    clientEmail: '',
    clientName: '',
    eventDate: '',
    location: '',
    notes: '',
    attachContract: false,
    contractTitle: 'Service agreement',
    contractFile: null as File | null,
    lineItems: [emptyLineItem()],
  })

  const loadQuotes = useCallback(async () => {
    try {
      setError('')
      const [data, usage] = await Promise.all([fetchVendorQuotes(), fetchVendorPlanUsage()])
      setQuotes(data)
      setPlanUsage(usage)
    } catch {
      setError('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  const updateLineItem = (index: number, field: keyof QuoteLineItemInput, value: string | number) => {
    setCreateForm((prev) => {
      const lineItems = [...prev.lineItems]
      lineItems[index] = { ...lineItems[index], [field]: value }
      return { ...prev, lineItems }
    })
  }

  const addLineItem = () => {
    setCreateForm((prev) => ({ ...prev, lineItems: [...prev.lineItems, emptyLineItem()] }))
  }

  const removeLineItem = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim() || !createForm.clientEmail.trim()) return
    if (createForm.attachContract && !createForm.contractFile) {
      setError('Choose a PDF contract file, or turn off contract attachment')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await createQuote({
        title: createForm.title.trim(),
        clientEmail: createForm.clientEmail.trim(),
        clientName: createForm.clientName || undefined,
        eventDate: createForm.eventDate || undefined,
        location: createForm.location || undefined,
        notes: createForm.notes || undefined,
        lineItems: createForm.lineItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        attachContract: createForm.attachContract,
        contractTitle: createForm.contractTitle.trim() || 'Service agreement',
        contractFile: createForm.contractFile ?? undefined,
      })
      navigate(`/dashboard/quotes/${result.quote.id}`)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create quote'))
    } finally {
      setSubmitting(false)
    }
  }

  const atQuoteLimit = planUsage?.limits.quotesThisMonth.atLimit === true

  return (
    <div>
      <VendorDashboardHeader
        active="quotes"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <StarterPlanBanner usage={planUsage} focus="quotes" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Quotes</h2>
            <p className="text-sm text-gray-600">
              Send a link your client can open on their phone — no login required to accept or decline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            disabled={atQuoteLimit}
            className="vendor-btn-primary disabled:cursor-not-allowed"
          >
            New quote
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <QuoteClientAgreementNotice variant="vendor" />

        {showCreate && (
          <form onSubmit={handleCreate} className="vendor-card p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Create quote</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Quote title (e.g. Miller Gala — Photography)"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md sm:col-span-2"
              />
              <input
                type="email"
                required
                placeholder="Client email"
                value={createForm.clientEmail}
                onChange={(e) => setCreateForm({ ...createForm, clientEmail: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                placeholder="Client name (optional)"
                value={createForm.clientName}
                onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="sm:col-span-2">
                <VendorEventDatePicker
                  id="quote-event-date"
                  value={createForm.eventDate}
                  onChange={(eventDate) => setCreateForm({ ...createForm, eventDate })}
                />
              </div>
              <input
                placeholder="Location (optional)"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Notes for your client (optional)"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                rows={3}
                className="px-3 py-2 border border-gray-300 rounded-md sm:col-span-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Line items</h4>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-sm vendor-link"
                >
                  + Add item
                </button>
              </div>
              {createForm.lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-2 sm:grid-cols-12 items-end border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="sm:col-span-6">
                    <label
                      htmlFor={`line-item-desc-${index}`}
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <input
                      id={`line-item-desc-${index}`}
                      required
                      placeholder="e.g. 8-hour event coverage"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`line-item-qty-${index}`}
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Quantity
                    </label>
                    <input
                      id={`line-item-qty-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`line-item-cost-${index}`}
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Unit cost
                    </label>
                    <input
                      id={`line-item-cost-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  {createForm.lineItems.length > 1 && (
                    <div className="sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-sm text-red-600 hover:text-red-500 pb-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.attachContract}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      attachContract: e.target.checked,
                      contractFile: e.target.checked ? createForm.contractFile : null,
                    })
                  }
                  className="mt-1 vendor-checkbox"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Attach contract with this quote (optional)
                  </span>
                  <span className="block text-sm text-gray-600 mt-1">
                    Standard practice: send the quote and contract together so clients can review
                    both before accepting.
                  </span>
                </span>
              </label>

              {createForm.attachContract && (
                <div className="grid gap-3 sm:grid-cols-2 pl-7">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="quote-contract-title"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Contract title
                    </label>
                    <input
                      id="quote-contract-title"
                      required
                      value={createForm.contractTitle}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, contractTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="quote-contract-file"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Contract PDF
                    </label>
                    <input
                      id="quote-contract-file"
                      type="file"
                      accept="application/pdf,.pdf"
                      required
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          contractFile: e.target.files?.[0] ?? null,
                        })
                      }
                      className="w-full text-sm text-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="vendor-btn-primary"
              >
                {submitting ? 'Creating...' : 'Create & get link'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="vendor-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Your quotes</h3>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading quotes...</p>
          ) : quotes.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No quotes yet. Create one to send a link your client can accept on their phone.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    to={`/dashboard/quotes/${quote.id}`}
                    className="block px-6 py-4 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{quote.title}</p>
                        <p className="text-sm text-gray-500">
                          {quote.clientName || quote.clientEmail}
                          {quote.eventDate ? ` · ${formatUsDate(quote.eventDate)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatMoney(quote.totalAmount, quote.currency)}
                        </p>
                        <p className="text-xs vendor-link">View quote →</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{statusLabel[quote.status]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default VendorQuotes
