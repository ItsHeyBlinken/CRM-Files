import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useVendorBranding } from './VendorBrandingProvider'
import {
  createQuotePackage,
  deleteQuotePackage,
  fetchQuotePackages,
  updateQuotePackage,
} from '../../services/quotePackageService'
import { getApiErrorMessage } from '../../utils/apiErrors'
import type { QuotePackage } from '../../types/quotePackage'
import {
  VENDOR_CATEGORY_LABELS,
  normalizeVendorCategory,
  templatesForCategory,
  type PackageStarterTemplate,
} from '../../constants/vendorCategories'

const emptyLine = () => ({ description: '', quantity: 1, unitPrice: 0 })

type FormMode = 'closed' | 'create' | 'edit'

/** Manage reusable quote packages — starters filtered by vendor category. */
const QuotePackagesSettings: React.FC = () => {
  const { profile } = useVendorBranding()
  const categoryId = normalizeVendorCategory(profile?.serviceType)

  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<FormMode>('closed')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [lineItems, setLineItems] = useState([emptyLine()])
  const [showOtherCategories, setShowOtherCategories] = useState(false)

  const starters = useMemo(
    () =>
      templatesForCategory(categoryId, {
        includeOtherCategories: showOtherCategories,
      }),
    [categoryId, showOtherCategories]
  )

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

  const resetForm = () => {
    setName('')
    setDescription('')
    setLineItems([emptyLine()])
    setEditingId(null)
    setMode('closed')
  }

  const openCreateBlank = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setLineItems([emptyLine()])
    setMode('create')
  }

  const openFromTemplate = (template: PackageStarterTemplate) => {
    setEditingId(null)
    setName(template.name)
    setDescription(template.description)
    setLineItems(
      template.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    )
    setMode('create')
  }

  const openEdit = (pkg: QuotePackage) => {
    setEditingId(pkg.id)
    setName(pkg.name)
    setDescription(pkg.description ?? '')
    setLineItems(
      pkg.lineItems.length > 0
        ? pkg.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        : [emptyLine()]
    )
    setMode('edit')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const cleaned = lineItems.filter((item) => item.description.trim())
    if (cleaned.length === 0) {
      toast.error('Add at least one line item')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'edit' && editingId != null) {
        await updateQuotePackage(editingId, {
          name: name.trim(),
          description: description.trim() || null,
          lineItems: cleaned,
        })
        toast.success('Package updated')
      } else {
        await createQuotePackage({
          name: name.trim(),
          description: description.trim() || null,
          lineItems: cleaned,
        })
        toast.success('Package saved')
      }
      resetForm()
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
      if (editingId === id) resetForm()
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-900">Quote packages</h3>
          <p className="text-sm text-slate-600 mt-1">
            Starters for <strong>{VENDOR_CATEGORY_LABELS[categoryId]}</strong> — edit names and
            prices, then save as your packages. Change category anytime under Business details.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateBlank}
          className="vendor-btn-outline text-sm shrink-0"
        >
          Blank package
        </button>
      </div>

      {mode === 'closed' && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-700 uppercase tracking-wide">
            Start from a template
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {starters.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => openFromTemplate(template)}
                  className="w-full text-left rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 hover:border-blue-300 hover:bg-blue-50/50 transition"
                >
                  <p className="text-sm font-medium text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {template.lineItems.length} lines · set your prices
                    {showOtherCategories && template.categoryId !== categoryId
                      ? ` · ${VENDOR_CATEGORY_LABELS[template.categoryId]}`
                      : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowOtherCategories((v) => !v)}
            className="text-xs vendor-link"
          >
            {showOtherCategories ? 'Show only my category' : 'Show other categories'}
          </button>
        </div>
      )}

      {mode !== 'closed' && (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-medium text-slate-900">
            {mode === 'edit' ? 'Edit package' : 'New package'}
          </h4>
          <p className="text-xs text-slate-500">
            Prices start at $0 on templates — enter what you charge before saving.
          </p>
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
                  next[index] = { ...next[index]!, description: e.target.value }
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
                  next[index] = {
                    ...next[index]!,
                    quantity: parseFloat(e.target.value) || 0,
                  }
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
                  next[index] = {
                    ...next[index]!,
                    unitPrice: parseFloat(e.target.value) || 0,
                  }
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
              {submitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Save package'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {packages.length === 0 ? (
        <p className="text-sm text-slate-500">
          No packages yet — pick a starter above or create a blank one.
        </p>
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
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(pkg)}
                  className="text-xs vendor-link"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(pkg.id)}
                  className="text-xs text-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default QuotePackagesSettings
