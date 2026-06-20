import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uploadProjectContract } from '../services/contractService'
import { uploadProjectDeliverable } from '../services/deliverableService'
import {
  createProjectInvoice,
  deleteProjectInvoice,
  markProjectInvoicePaid,
  sendProjectInvoice,
} from '../services/invoiceService'
import {
  createProjectInvite,
  fetchVendorProject,
  updateVendorProject,
  type InviteResult,
} from '../services/projectService'
import { fetchVendorOnboarding } from '../services/onboardingService'
import type { ProjectStatus, VendorProjectDetail } from '../types/portal'
import { formatCurrency, formatFileSize, getInvoiceStatusLabel } from '../utils/portalHelpers'

function getApiError(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  return message || fallback
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'booked', label: 'Booked' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
]

const VendorProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const projectId = Number(id)

  const [detail, setDetail] = useState<VendorProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState<InviteResult | null>(null)

  const [contractTitle, setContractTitle] = useState('Photography Agreement')
  const [contractFile, setContractFile] = useState<File | null>(null)

  const [deliverableTitle, setDeliverableTitle] = useState('')
  const [deliverableDescription, setDeliverableDescription] = useState('')
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null)

  const [invoiceTitle, setInvoiceTitle] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDueDate, setInvoiceDueDate] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true)
  const [editingOverview, setEditingOverview] = useState(false)
  const [overviewForm, setOverviewForm] = useState({
    title: '',
    clientDisplayName: '',
    clientEmail: '',
    eventDate: '',
    location: '',
    description: '',
    internalNotes: '',
  })

  const loadDetail = useCallback(async () => {
    if (!projectId || Number.isNaN(projectId)) {
      setError('Invalid project')
      setLoading(false)
      return
    }

    try {
      setError('')
      const [data, onboarding] = await Promise.all([
        fetchVendorProject(projectId),
        fetchVendorOnboarding(),
      ])
      setDetail(data)
      setHasPaymentMethod(onboarding.status.hasPaymentMethod)
      setInviteEmail(data.linkedClient?.email ?? data.project.clientEmail ?? '')
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to load project'))
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleStatusChange = async (status: ProjectStatus) => {
    if (!detail) return

    setSubmitting(true)
    setError('')

    try {
      await updateVendorProject(projectId, { status })
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to update status'))
    } finally {
      setSubmitting(false)
    }
  }

  const startEditingOverview = () => {
    if (!detail) return
    const { project } = detail
    setOverviewForm({
      title: project.title,
      clientDisplayName: project.clientDisplayName ?? '',
      clientEmail: project.clientEmail ?? '',
      eventDate: project.eventDate ?? '',
      location: project.location ?? '',
      description: project.description ?? '',
      internalNotes: project.internalNotes ?? '',
    })
    setEditingOverview(true)
  }

  const handleOverviewSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail) return

    setSubmitting(true)
    setError('')

    try {
      await updateVendorProject(projectId, {
        title: overviewForm.title.trim(),
        clientDisplayName: overviewForm.clientDisplayName.trim() || null,
        clientEmail: overviewForm.clientEmail.trim() || null,
        eventDate: overviewForm.eventDate || null,
        location: overviewForm.location.trim() || null,
        description: overviewForm.description.trim() || null,
        internalNotes: overviewForm.internalNotes.trim() || null,
      })
      setEditingOverview(false)
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to update project overview'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const invite = await createProjectInvite(projectId, inviteEmail.trim())
      setInviteLink(invite)
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to create invite'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleContractUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractTitle.trim() || !contractFile) return

    setSubmitting(true)
    setError('')

    try {
      await uploadProjectContract(projectId, contractTitle.trim(), contractFile)
      setContractFile(null)
      setContractTitle('Photography Agreement')
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to upload contract'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeliverableUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deliverableTitle.trim() || !deliverableFile) return

    setSubmitting(true)
    setError('')

    try {
      await uploadProjectDeliverable(
        projectId,
        deliverableTitle.trim(),
        deliverableFile,
        deliverableDescription || undefined
      )
      setDeliverableTitle('')
      setDeliverableDescription('')
      setDeliverableFile(null)
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to upload deliverable'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceTitle.trim() || !invoiceAmount.trim()) return

    const amount = Number(invoiceAmount)
    if (Number.isNaN(amount) || amount < 0) {
      setError('Enter a valid amount')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await createProjectInvoice(projectId, {
        title: invoiceTitle.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        description: invoiceDescription.trim() || undefined,
        amount,
        dueDate: invoiceDueDate || undefined,
      })
      setInvoiceTitle('')
      setInvoiceNumber('')
      setInvoiceAmount('')
      setInvoiceDueDate('')
      setInvoiceDescription('')
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to create invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendInvoice = async (invoiceId: number) => {
    if (!hasPaymentMethod) {
      setError(
        'Set up how clients pay you before sending an invoice. Go to Payments in your dashboard.'
      )
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await sendProjectInvoice(projectId, invoiceId)
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to send invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkInvoicePaid = async (invoiceId: number) => {
    setSubmitting(true)
    setError('')
    try {
      await markProjectInvoicePaid(projectId, invoiceId)
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to mark invoice paid'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!window.confirm('Delete this invoice?')) return

    setSubmitting(true)
    setError('')
    try {
      await deleteProjectInvoice(projectId, invoiceId)
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to delete invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const getInviteFullUrl = (path: string) => `${window.location.origin}${path}`

  const copyInviteLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(getInviteFullUrl(inviteLink.invitePath))
  }

  const openInviteEmailDraft = () => {
    if (!inviteLink || !detail) return
    const fullUrl = getInviteFullUrl(inviteLink.invitePath)
    const subject = encodeURIComponent(`Your client portal — ${detail.project.title}`)
    const body = encodeURIComponent(
      `Hi,\n\n` +
        `I've set up your client portal. You don't have an account yet — this link will let you create one and view your project:\n\n` +
        `${fullUrl}\n\n` +
        `Open the link, choose a password, and you'll be taken straight to your portal.\n\n` +
        `After that, you can sign in anytime at ${window.location.origin}/login\n`
    )
    window.location.href = `mailto:${inviteLink.email}?subject=${subject}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">Project not found</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Link to="/dashboard" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Back to projects
          </Link>
        </div>
      </div>
    )
  }

  const { project, linkedClient, contracts, milestones, invoices, deliverables } = detail

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex gap-4 text-sm">
              <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Projects
              </Link>
              <Link to="/dashboard/quotes" className="text-gray-500 hover:text-indigo-600">
                Quotes
              </Link>
              <Link to="/dashboard/payments" className="text-gray-500 hover:text-indigo-600">
                Payments
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mt-1">{project.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium text-gray-900">Overview</h2>
                {!editingOverview && (
                  <button
                    type="button"
                    onClick={startEditingOverview}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Edit overview
                  </button>
                )}
              </div>

              {editingOverview ? (
                <form onSubmit={handleOverviewSave} className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="overview-title" className="block text-xs font-medium text-gray-700 mb-1">
                        Project title
                      </label>
                      <input
                        id="overview-title"
                        required
                        value={overviewForm.title}
                        onChange={(e) => setOverviewForm({ ...overviewForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="overview-client-name" className="block text-xs font-medium text-gray-700 mb-1">
                        Client name
                      </label>
                      <input
                        id="overview-client-name"
                        value={overviewForm.clientDisplayName}
                        onChange={(e) =>
                          setOverviewForm({ ...overviewForm, clientDisplayName: e.target.value })
                        }
                        placeholder="e.g. Alex & Jordan Miller"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="overview-client-email" className="block text-xs font-medium text-gray-700 mb-1">
                        Client email
                      </label>
                      <input
                        id="overview-client-email"
                        type="email"
                        value={overviewForm.clientEmail}
                        onChange={(e) =>
                          setOverviewForm({ ...overviewForm, clientEmail: e.target.value })
                        }
                        placeholder="For invites and records"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="overview-event-date" className="block text-xs font-medium text-gray-700 mb-1">
                        Event date
                      </label>
                      <input
                        id="overview-event-date"
                        type="date"
                        value={overviewForm.eventDate}
                        onChange={(e) => setOverviewForm({ ...overviewForm, eventDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="overview-location" className="block text-xs font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        id="overview-location"
                        value={overviewForm.location}
                        onChange={(e) => setOverviewForm({ ...overviewForm, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="overview-description" className="block text-xs font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        id="overview-description"
                        rows={3}
                        value={overviewForm.description}
                        onChange={(e) =>
                          setOverviewForm({ ...overviewForm, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="overview-internal-notes" className="block text-xs font-medium text-gray-700 mb-1">
                        Internal notes (vendor only)
                      </label>
                      <textarea
                        id="overview-internal-notes"
                        rows={2}
                        value={overviewForm.internalNotes}
                        onChange={(e) =>
                          setOverviewForm({ ...overviewForm, internalNotes: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save overview'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingOverview(false)}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Client:</span>{' '}
                    {project.clientDisplayName || 'Not set'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Email:</span>{' '}
                    {project.clientEmail || linkedClient?.email || 'Not set'}
                  </p>
                  {project.eventDate && (
                    <p>
                      <span className="font-medium text-gray-700">Event date:</span>{' '}
                      {new Date(`${project.eventDate}T12:00:00`).toLocaleDateString()}
                    </p>
                  )}
                  {project.location && (
                    <p>
                      <span className="font-medium text-gray-700">Location:</span> {project.location}
                    </p>
                  )}
                  {project.description && (
                    <p className="pt-1 whitespace-pre-wrap">{project.description}</p>
                  )}
                  {project.internalNotes && (
                    <p className="pt-2 text-xs text-gray-500">
                      <span className="font-medium">Internal notes:</span> {project.internalNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="shrink-0">
              <label htmlFor="project-status" className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                id="project-status"
                value={project.status}
                disabled={submitting}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm capitalize"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Client portal</h2>
          {linkedClient ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-900">
              <p className="font-medium">Client linked</p>
              <p className="mt-1">{linkedClient.email}</p>
              <p className="text-green-800 text-xs mt-1">
                Joined{' '}
                {new Date(linkedClient.linkedAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate an invite link so your client can create their login and access the portal.
              </p>
              <input
                type="email"
                required
                placeholder="Client email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              />
              {inviteLink && (
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-900 space-y-3">
                  <p className="font-medium">Invite ready</p>
                  <code className="block break-all text-xs bg-white p-2 rounded border text-gray-800">
                    {getInviteFullUrl(inviteLink.invitePath)}
                  </code>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={openInviteEmailDraft}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Open in email app
                    </button>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Generate invite link'}
              </button>
            </form>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Contract</h2>
          {contracts.length > 0 ? (
            contracts.map((contract) => (
              <div key={contract.id} className="rounded-md bg-gray-50 p-4 text-sm">
                <p className="font-medium text-gray-900">{contract.title}</p>
                <p className="text-gray-600">{contract.fileName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {contract.acknowledgedAt
                    ? contract.acknowledgementLegalName
                      ? `Signed electronically as ${contract.acknowledgementLegalName} on ${new Date(contract.acknowledgedAt).toLocaleDateString()}`
                      : `Signed ${new Date(contract.acknowledgedAt).toLocaleDateString()}`
                    : 'Waiting for client signature'}
                </p>
              </div>
            ))
          ) : (
            <form onSubmit={handleContractUpload} className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a PDF contract for your client to review and acknowledge in their portal.
              </p>
              <input
                required
                placeholder="Contract title (e.g. Photography Agreement)"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                required
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
                className="w-full max-w-md text-sm text-gray-600"
              />
              <button
                type="submit"
                disabled={submitting || !contractFile}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
              >
                {submitting ? 'Uploading...' : 'Upload PDF'}
              </button>
            </form>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Deliverables</h2>
          <p className="text-sm text-gray-600">
            Upload photos, galleries, or files for your client to download from their portal.
          </p>

          {deliverables.length > 0 && (
            <ul className="space-y-2">
              {deliverables.map((item) => (
                <li key={item.id} className="rounded-md bg-gray-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-gray-600">{item.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(item.fileSizeBytes)}
                    {item.clientVisible ? ' · Visible to client' : ' · Hidden from client'}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleDeliverableUpload} className="space-y-4 border-t border-gray-100 pt-4">
            <input
              required
              placeholder="Title (e.g. Engagement gallery)"
              value={deliverableTitle}
              onChange={(e) => setDeliverableTitle(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              placeholder="Description (optional)"
              value={deliverableDescription}
              onChange={(e) => setDeliverableDescription(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              required
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.zip,application/pdf,image/*,application/zip"
              onChange={(e) => setDeliverableFile(e.target.files?.[0] ?? null)}
              className="w-full max-w-md text-sm text-gray-600"
            />
            <p className="text-xs text-gray-500">PDF, JPG, PNG, GIF, WEBP, or ZIP — max 10MB</p>
            <button
              type="submit"
              disabled={submitting || !deliverableFile}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload deliverable'}
            </button>
          </form>
        </section>

        {milestones.length > 0 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-medium text-gray-900 mb-4">Timeline</h2>
            <ul className="space-y-3">
              {milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="flex items-start justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{milestone.title}</p>
                    {milestone.dueDate && (
                      <p className="text-gray-500 text-xs">
                        {new Date(`${milestone.dueDate}T12:00:00`).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="text-xs capitalize text-gray-500 shrink-0">
                    {milestone.status.replace('_', ' ')}
                    {!milestone.clientVisible && ' · hidden'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-medium text-gray-900 mb-4">Invoices</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create invoices for this project. Send them to your client when ready — they appear on
            the Payments tab in the client portal.{' '}
            <Link to="/dashboard/payments" className="text-indigo-600 hover:text-indigo-500">
              Set up payment methods
            </Link>
          </p>

          {invoices.length > 0 && (
            <ul className="space-y-3 mb-6">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-sm border border-gray-100 rounded-md p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.title}</p>
                    {invoice.invoiceNumber && (
                      <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                    )}
                    <p className="text-gray-600 mt-1">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due {new Date(`${invoice.dueDate}T12:00:00`).toLocaleDateString()}
                      </p>
                    )}
                    {invoice.clientPaymentClaimedAt && invoice.status !== 'paid' && (
                      <p className="text-xs text-amber-700 mt-1">
                        Client reported payment sent — confirm and mark paid
                      </p>
                    )}
                    {invoice.status === 'paid' && invoice.paidAt && (
                      <p className="text-xs text-green-700 mt-1">
                        Paid {new Date(invoice.paidAt).toLocaleDateString()}
                        {invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="text-xs font-medium text-gray-500">
                      {getInvoiceStatusLabel(invoice.status)}
                    </span>
                    {invoice.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="px-2 py-1 text-xs text-white bg-indigo-600 rounded disabled:opacity-50"
                        >
                          Send to client
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="px-2 py-1 text-xs text-red-700 bg-red-50 rounded disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleMarkInvoicePaid(invoice.id)}
                        className="px-2 py-1 text-xs text-green-800 bg-green-50 rounded disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreateInvoice} className="space-y-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-900">Add invoice</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-gray-700">Title</span>
                <input
                  required
                  placeholder="e.g. Retainer"
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Invoice # (optional)</span>
                <input
                  placeholder="e.g. INV-002"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Amount (USD)</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Due date (optional)</span>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-gray-700">Description (optional)</span>
              <textarea
                placeholder="e.g. 50% retainer due at booking"
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create draft invoice'}
            </button>
          </form>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md"
          >
            Back to all projects
          </button>
        </div>
      </main>
    </div>
  )
}

export default VendorProjectDetail
