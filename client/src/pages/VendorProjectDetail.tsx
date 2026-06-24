import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uploadProjectContract } from '../services/contractService'
import {
  createProjectInvite,
  fetchVendorProject,
  updateVendorProject,
  type InviteResult,
} from '../services/projectService'
import { fetchVendorOnboarding } from '../services/onboardingService'
import PipelineStepper from '../components/vendor/PipelineStepper'
import ProjectInvoiceSection from '../components/vendor/ProjectInvoiceSection'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import { VendorInlineLoader } from '../components/vendor/VendorDashboardShell'
import type { ProjectStatus, VendorProjectDetail } from '../types/portal'
import { getProjectPipelineSteps } from '../utils/projectPipeline'
import toast from 'react-hot-toast'
import { formatUsDate } from '../utils/calendarHelpers'

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
  const [sendInviteByEmail, setSendInviteByEmail] = useState(true)
  const [inviteLink, setInviteLink] = useState<InviteResult | null>(null)

  const [contractTitle, setContractTitle] = useState('Photography Agreement')
  const [contractFile, setContractFile] = useState<File | null>(null)

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
      if (data.contracts[0]?.title) {
        setContractTitle(data.contracts[0].title)
      }
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
      const result = await createProjectInvite(projectId, inviteEmail.trim(), {
        sendEmail: sendInviteByEmail,
      })
      setInviteLink(result.invite)
      if (result.email?.sent) {
        toast.success('Invite email sent')
      } else if (sendInviteByEmail && result.email?.skippedReason === 'EMAIL_NOT_CONFIGURED') {
        toast.error('Email not configured — copy the invite link instead')
      }
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
    return <VendorInlineLoader />
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full vendor-card p-6 text-center">
          <h2 className="text-lg font-medium text-slate-900">Project not found</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link to="/dashboard" className="mt-4 inline-block vendor-link">
            Back to projects
          </Link>
        </div>
      </div>
    )
  }

  const { project, linkedClient, contracts, milestones } = detail

  const isContractFileMissing = (
    contract: (typeof contracts)[number]
  ): boolean => contract.fileAvailable !== true

  return (
    <div>
      <VendorDashboardHeader
        active="projects"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link to="/dashboard" className="text-sm vendor-link">
            ← All projects
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">{project.title}</h1>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <PipelineStepper steps={getProjectPipelineSteps(detail)} title="Project progress" />

        <section className="vendor-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium text-gray-900">Overview</h2>
                {!editingOverview && (
                  <button
                    type="button"
                    onClick={startEditingOverview}
                    className="text-sm vendor-link font-medium"
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
                      className="vendor-btn-primary"
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
                      {formatUsDate(project.eventDate)}
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

        <section className="vendor-card p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Client portal</h2>
          {linkedClient ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-900">
              <p className="font-medium">Client linked</p>
              <p className="mt-1">{linkedClient.email}</p>
              <p className="text-green-800 text-xs mt-1">
                Joined {formatUsDate(linkedClient.linkedAt)}
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sendInviteByEmail}
                  onChange={(e) => setSendInviteByEmail(e.target.checked)}
                />
                Send invite by email (when SMTP is configured)
              </label>
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
                      className="vendor-link font-medium"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={openInviteEmailDraft}
                      className="vendor-link font-medium"
                    >
                      Open in email app
                    </button>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="vendor-btn-primary"
              >
                {submitting ? 'Creating...' : 'Generate invite link'}
              </button>
            </form>
          )}
        </section>

        <section className="vendor-card p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Contract</h2>
          {contracts.length > 0 ? (
            contracts.map((contract) => (
              <div key={contract.id} className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4 text-sm">
                  <p className="font-medium text-gray-900">{contract.title}</p>
                  <p className="text-gray-600">{contract.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contract.acknowledgedAt
                      ? contract.acknowledgementLegalName
                        ? `Signed electronically as ${contract.acknowledgementLegalName} on ${formatUsDate(contract.acknowledgedAt)}`
                        : `Signed ${formatUsDate(contract.acknowledgedAt)}`
                      : 'Waiting for client signature'}
                  </p>
                </div>
                {isContractFileMissing(contract) && (
                  <p className="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2">
                    The contract PDF is missing on the server (often after a redeploy). Upload the
                    file below so your client can review and sign it in their portal.
                  </p>
                )}
                {!contract.acknowledgedAt ? (
                  <form onSubmit={handleContractUpload} className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {isContractFileMissing(contract)
                        ? 'Choose the contract PDF to restore it for your client.'
                        : 'Replace the contract PDF before your client signs, if needed.'}
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
                      className="vendor-btn-primary"
                    >
                      {submitting
                        ? 'Uploading...'
                        : isContractFileMissing(contract)
                          ? 'Re-upload PDF'
                          : 'Replace PDF'}
                    </button>
                  </form>
                ) : (
                  isContractFileMissing(contract) && (
                    <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                      This contract was signed, but the PDF file is missing on the server. Keep a
                      copy from your records; clients may not be able to view it until you add a
                      new agreement on a future project.
                    </p>
                  )
                )}
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
                className="vendor-btn-primary"
              >
                {submitting ? 'Uploading...' : 'Upload PDF'}
              </button>
            </form>
          )}
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
                        {formatUsDate(milestone.dueDate)}
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

                <ProjectInvoiceSection
          projectId={projectId}
          detail={detail}
          hasPaymentMethod={hasPaymentMethod}
          onUpdated={loadDetail}
        />

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
