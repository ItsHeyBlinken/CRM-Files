import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  createQuotePackage,
  deleteQuotePackage,
  fetchQuotePackages,
} from '../../services/quotePackageService'
import { getApiErrorMessage } from '../../utils/apiErrors'
import type { QuotePackage } from '../../types/quotePackage'

const emptyLine = () => ({ description: '', quantity: 1, unitPrice: 0 })

/** Manage reusable quote packages (Phase 4 templates). */
const QuotePackagesSettings: React.FC = () => {
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [lineItems, setLineItems] = useState([emptyLine()])

  const load = useCallback(async () => {
    try {
      const data = await fetchQuotePackages()
      setPackages(data)
    } catch {
      toast.error('Failed to load quote packages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await createQuotePackage({
        name: name.trim(),
        description: description.trim() || null,
        lineItems: lineItems.filter((item) => item.description.trim()),
      })
      setName('')
      setDescription('')
      setLineItems([emptyLine()])
      setShowCreate(false)
      toast.success('Package saved')
      await load()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to save package'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteQuotePackage(id)
      toast.success('Package deleted')
      await load()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to delete package'))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading packages...</p>
  }

  return (
    <section className="vendor-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-900">Quote packages</h3>
          <p className="text-sm text-slate-600 mt-1">
            Reusable line-item sets (e.g. Wedding Collection) for one-click quotes from Inquiries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="vendor-btn-outline text-sm shrink-0"
        >
          New package
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 border-t border-slate-100 pt-4">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Package name"
            className="auth-input"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="auth-input"
          />
          {lineItems.map((item, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-12">
              <input
                required
                value={item.description}
                onChange={(e) => {
                  const next = [...lineItems]
                  next[index] = { ...next[index], description: e.target.value }
                  setLineItems(next)
                }}
                placeholder="Line item"
                className="auth-input sm:col-span-6"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={item.quantity}
                onChange={(e) => {
                  const next = [...lineItems]
                  next[index] = { ...next[index], quantity: parseFloat(e.target.value) || 0 }
                  setLineItems(next)
                }}
                className="auth-input sm:col-span-2"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={item.unitPrice}
                onChange={(e) => {
                  const next = [...lineItems]
                  next[index] = { ...next[index], unitPrice: parseFloat(e.target.value) || 0 }
                  setLineItems(next)
                }}
                className="auth-input sm:col-span-3"
              />
              {lineItems.length > 1 && (
                <button
                  type="button"
                  className="text-xs text-red-600 sm:col-span-1"
                  onClick={() => setLineItems(lineItems.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="text-sm vendor-link"
            onClick={() => setLineItems([...lineItems, emptyLine()])}
          >
            + Add line
          </button>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="vendor-btn-primary">
              {submitting ? 'Saving...' : 'Save package'}
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

      {packages.length === 0 ? (
        <p className="text-sm text-slate-500">No packages yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {packages.map((pkg) => (
            <li key={pkg.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{pkg.name}</p>
                {pkg.description && (
                  <p className="text-xs text-slate-500">{pkg.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {pkg.lineItems.length} line item{pkg.lineItems.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(pkg.id)}
                className="text-xs text-red-600 shrink-0"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default QuotePackagesSettings
