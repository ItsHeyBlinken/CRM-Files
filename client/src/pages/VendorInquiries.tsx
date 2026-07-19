import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import { VendorInlineLoader } from '../components/vendor/VendorDashboardShell'
import {
  createInquiry,
  createQuoteFromInquiry,
  fetchVendorInquiries,
  updateInquiry,
} from '../services/inquiryService'
import { fetchQuotePackages } from '../services/quotePackageService'
import { getApiErrorMessage } from '../utils/apiErrors'
import { formatUsDate } from '../utils/calendarHelpers'
import type { Inquiry, InquiryListFilter, InquiryStatus } from '../types/inquiry'
import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUSES,
  inquiryMatchesFilter,
} from '../types/inquiry'
import type { QuotePackage } from '../types/quotePackage'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  serviceType: '',
  eventDate: '',
  budget: '',
  notes: '',
}

const FILTER_TABS: Array<{ key: InquiryListFilter; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'booked', label: 'Booked' },
  { key: 'lost', label: 'Lost' },
  { key: 'all', label: 'All' },
]

const VendorInquiries: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creatingQuoteId, setCreatingQuoteId] = useState<number | null>(null)
  const [listFilter, setListFilter] = useState<InquiryListFilter>('active')

  const load = useCallback(async () => {
    try {
      setError('')
      const [data, pkgs] = await Promise.all([fetchVendorInquiries(), fetchQuotePackages()])
      setInquiries(data)
      setPackages(pkgs)
    } catch {
      setError('Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredInquiries = useMemo(
    () => inquiries.filter((inquiry) => inquiryMatchesFilter(inquiry.status, listFilter)),
    [inquiries, listFilter]
  )

  const filterCounts = useMemo(() => {
    const counts: Record<InquiryListFilter, number> = {
      active: 0,
      booked: 0,
      lost: 0,
      all: inquiries.length,
    }
    for (const inquiry of inquiries) {
      if (inquiryMatchesFilter(inquiry.status, 'active')) counts.active += 1
      if (inquiry.status === 'booked') counts.booked += 1
      if (inquiry.status === 'lost') counts.lost += 1
    }
    return counts
  }, [inquiries])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return

    setSubmitting(true)
    setError('')
    try {
      const budget =
        form.budget.trim() === '' ? null : Number.parseFloat(form.budget)
      if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
        setError('Budget must be a valid number')
        return
      }
      await createInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        serviceType: form.serviceType.trim() || null,
        eventDate: form.eventDate || null,
        budget,
        notes: form.notes.trim() || null,
      })
      setForm(emptyForm)
      setShowCreate(false)
      setListFilter('active')
      toast.success('Inquiry saved')
      await load()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create inquiry'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (inquiry: Inquiry, status: InquiryStatus) => {
    try {
      const updated = await updateInquiry(inquiry.id, { status })
      setInquiries((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      if (status === 'lost') {
        toast.success('Marked as lost — linked open quotes closed')
      } else if (status === 'booked') {
        toast.success('Moved to Booked')
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update status'))
    }
  }

  const handleCreateQuote = async (inquiry: Inquiry, packageId?: number) => {
    setCreatingQuoteId(inquiry.id)
    try {
      const result = await createQuoteFromInquiry(inquiry.id, {
        ...(packageId ? { packageId } : {}),
      })
      toast.success('Quote created — set your prices, then send the link')
      navigate(`/dashboard/quotes/${result.quote.id}`)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to create quote'))
    } finally {
      setCreatingQuoteId(null)
    }
  }

  if (loading) {
    return <VendorInlineLoader />
  }

  const emptyMessage = (() => {
    switch (listFilter) {
      case 'active':
        return 'No active inquiries. New ones appear here until booked or marked lost.'
      case 'booked':
        return 'No booked inquiries yet.'
      case 'lost':
        return 'No lost or declined inquiries.'
      case 'all':
        return 'No inquiries yet. Add someone who reached out about your services.'
      default: {
        const _exhaustive: never = listFilter
        return _exhaustive
      }
    }
  })()

  return (
    <div>
      <VendorDashboardHeader
        active="inquiries"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Inquiries</h2>
            <p className="text-sm text-slate-600">
              People asking about your services — track them until they&apos;re booked. Same contact
              can inquire again later (new row each time).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="vendor-btn-primary"
          >
            New inquiry
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} className="vendor-card p-6 space-y-4">
            <h3 className="font-medium text-slate-900">New inquiry</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="auth-input"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="auth-input"
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="auth-input"
              />
              <input
                placeholder="Service type (e.g. Wedding Photography)"
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="auth-input"
              />
              <div>
                <label htmlFor="inquiry-event-date" className="block text-xs font-medium text-slate-700 mb-1">
                  Event date (optional)
                </label>
                <input
                  id="inquiry-event-date"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="auth-input"
                />
              </div>
              <input
                placeholder="Budget (optional)"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="auth-input"
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="auth-input sm:col-span-2"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="vendor-btn-primary">
                {submitting ? 'Saving...' : 'Save inquiry'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="vendor-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 space-y-3">
            <h3 className="font-medium text-slate-900">Your inquiries</h3>
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setListFilter(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    listFilter === tab.key
                      ? 'border-blue-300 bg-blue-50 text-blue-800 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 text-slate-400">({filterCounts[tab.key]})</span>
                </button>
              ))}
            </div>
          </div>

          {filteredInquiries.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{emptyMessage}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredInquiries.map((inquiry) => (
                <li key={inquiry.id} className="px-6 py-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{inquiry.name}</p>
                      <p className="text-sm text-slate-600">
                        {inquiry.serviceType || 'Service TBD'}
                        {inquiry.eventDate ? ` · ${formatUsDate(inquiry.eventDate)}` : ''}
                        {inquiry.budget != null
                          ? ` · Budget: $${inquiry.budget.toLocaleString()}`
                          : ''}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {inquiry.email}
                        {inquiry.phone ? ` · ${inquiry.phone}` : ''}
                      </p>
                      {inquiry.notes && (
                        <p className="text-sm text-slate-500 mt-2">{inquiry.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-2">
                      <select
                        value={inquiry.status}
                        onChange={(e) =>
                          void handleStatusChange(inquiry, e.target.value as InquiryStatus)
                        }
                        className="text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white"
                      >
                        {INQUIRY_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {INQUIRY_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      {inquiry.status !== 'lost' && inquiry.status !== 'booked' && (
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(inquiry, 'lost')}
                          className="text-sm text-slate-600 hover:text-red-700 underline-offset-2 hover:underline text-right"
                        >
                          Mark as lost
                        </button>
                      )}
                      {inquiry.status === 'lost' && (
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(inquiry, 'contacted')}
                          className="text-sm vendor-link text-right"
                        >
                          Restore to Active
                        </button>
                      )}
                      {inquiry.quoteId ? (
                        <Link
                          to={`/dashboard/quotes/${inquiry.quoteId}`}
                          className="text-sm vendor-link text-right"
                        >
                          View quote →
                        </Link>
                      ) : inquiry.status !== 'lost' && inquiry.status !== 'booked' ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={creatingQuoteId === inquiry.id}
                            onClick={() => void handleCreateQuote(inquiry)}
                            className="vendor-btn-primary text-sm"
                          >
                            {creatingQuoteId === inquiry.id ? 'Creating...' : 'Create quote'}
                          </button>
                          {packages.length > 0 && (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const packageId = Number(e.target.value)
                                if (packageId) {
                                  void handleCreateQuote(inquiry, packageId)
                                }
                                e.target.value = ''
                              }}
                              className="text-xs rounded-xl border border-slate-300 px-2 py-1.5 bg-white"
                            >
                              <option value="">Create from package…</option>
                              {packages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                  {pkg.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INQUIRY_STATUSES.map((status) => (
                      <span
                        key={status}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          inquiry.status === status
                            ? status === 'lost'
                              ? 'border-slate-300 bg-slate-100 text-slate-700 font-medium'
                              : status === 'booked'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-medium'
                                : 'border-blue-300 bg-blue-50 text-blue-800 font-medium'
                            : 'border-slate-200 text-slate-400'
                        }`}
                      >
                        {INQUIRY_STATUS_LABELS[status]}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-slate-500">
          Tip: save reusable packages under{' '}
          <Link to="/dashboard/settings" className="vendor-link">
            Settings
          </Link>{' '}
          to fill quote line items in one click. Marking lost keeps the record for history — you can
          add a new inquiry anytime with the same email.
        </p>
      </main>
    </div>
  )
}

export default VendorInquiries
