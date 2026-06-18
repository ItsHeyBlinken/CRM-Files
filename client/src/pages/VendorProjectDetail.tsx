import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uploadProjectContract } from '../services/contractService'
import { uploadProjectDeliverable } from '../services/deliverableService'
import {
  createProjectInvite,
  fetchVendorProject,
  updateVendorProject,
  type InviteResult,
} from '../services/projectService'
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

  const loadDetail = useCallback(async () => {
    if (!projectId || Number.isNaN(projectId)) {
      setError('Invalid project')
      setLoading(false)
      return
    }

    try {
      setError('')
      const data = await fetchVendorProject(projectId)
      setDetail(data)
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

  const getInviteFullUrl = (path: string) => `${window.location.origin}${path}`

  const copyInviteLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(getInviteFullUrl(inviteLink.invitePath))
  }

  const openInviteEmailDraft = () => {
    if (!inviteLink || !detail) return
    const fullUrl = getInviteFullUrl(inviteLink.invitePath)
    const subject = encodeURIComponent(`Your wedding portal — ${detail.project.title}`)
    const body = encodeURIComponent(
      `Hi,\n\n` +
        `I've set up your client portal. You don't have an account yet — this link will let you create one and view your project:\n\n` +
        `${fullUrl}\n\n` +
        `Open the link, choose a password, and you'll be taken straight to your wedding portal.\n\n` +
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
            <div>
              <h2 className="font-medium text-gray-900">Overview</h2>
              <p className="mt-2 text-sm text-gray-600">
                {project.coupleDisplayName || 'No couple name set'}
              </p>
              {project.weddingDate && (
                <p className="text-sm text-gray-600">
                  Wedding date:{' '}
                  {new Date(`${project.weddingDate}T12:00:00`).toLocaleDateString()}
                </p>
              )}
              {project.location && (
                <p className="text-sm text-gray-600">Location: {project.location}</p>
              )}
              {project.description && (
                <p className="mt-2 text-sm text-gray-600">{project.description}</p>
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

        {invoices.length > 0 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-medium text-gray-900 mb-4">Invoices</h2>
            <ul className="space-y-3">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex items-start justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.title}</p>
                    {invoice.invoiceNumber && (
                      <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                    )}
                    <p className="text-gray-600 mt-1">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 shrink-0">
                    {getInvoiceStatusLabel(invoice.status)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
