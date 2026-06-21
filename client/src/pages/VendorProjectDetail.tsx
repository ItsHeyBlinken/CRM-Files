import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { uploadProjectContract } from '../services/contractService'
import {
  createProjectInvoice,
  deleteProjectInvoice,
  markProjectInvoicePaid,
  sendProjectInvoice,
} from '../services/invoiceService'
import {
  createProjectInvite,
  fetchVendorProject,
  updateProjectPaymentSettings,
  updateVendorProject,
  type InviteResult,
} from '../services/projectService'
import { fetchVendorOnboarding } from '../services/onboardingService'
import PipelineStepper from '../components/vendor/PipelineStepper'
import type { Invoice, ProjectStatus, VendorProjectDetail } from '../types/portal'
import { getProjectPipelineSteps } from '../utils/projectPipeline'
import toast from 'react-hot-toast'
import {
  formatCurrency,
  getInvoiceDisplayLabel,
  getInvoiceStatusLabel,
} from '../utils/portalHelpers'
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

function shiftDays(date: string, daysBefore: number | null): string {
  if (!date || daysBefore == null) return ''
  const target = new Date(`${date}T12:00:00`)
  target.setDate(target.getDate() - daysBefore)
  return target.toISOString().slice(0, 10)
}

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

  const [invoiceTitle, setInvoiceTitle] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDueDate, setInvoiceDueDate] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [invoiceKind, setInvoiceKind] = useState<Invoice['invoiceKind']>('custom')
  const [isDateHoldingDeposit, setIsDateHoldingDeposit] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true)
  const [savingPaymentSetup, setSavingPaymentSetup] = useState(false)
  const [paymentSetupForm, setPaymentSetupForm] = useState({
    projectTotal: '',
    paymentPlanType: 'pay_in_full' as
      | 'pay_in_full'
      | 'deposit_and_balance'
      | 'split_payments',
    depositType: 'percentage' as 'fixed' | 'percentage',
    depositValue: '',
    secondPaymentDueDaysBeforeEvent: '',
    finalPaymentDueDaysBeforeEvent: '',
  })
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
      setPaymentSetupForm({
        projectTotal:
          data.paymentSettings.projectTotal != null ? String(data.paymentSettings.projectTotal) : '',
        paymentPlanType: data.paymentSettings.paymentPlanType,
        depositType: data.paymentSettings.depositType ?? 'percentage',
        depositValue:
          data.paymentSettings.depositValue != null ? String(data.paymentSettings.depositValue) : '',
        secondPaymentDueDaysBeforeEvent:
          data.paymentSettings.secondPaymentDueDaysBeforeEvent != null
            ? String(data.paymentSettings.secondPaymentDueDaysBeforeEvent)
            : '',
        finalPaymentDueDaysBeforeEvent:
          data.paymentSettings.finalPaymentDueDaysBeforeEvent != null
            ? String(data.paymentSettings.finalPaymentDueDaysBeforeEvent)
            : '',
      })
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
        invoiceKind,
        isDateHoldingDeposit,
      })
      setInvoiceTitle('')
      setInvoiceNumber('')
      setInvoiceAmount('')
      setInvoiceDueDate('')
      setInvoiceDescription('')
      setInvoiceKind('custom')
      setIsDateHoldingDeposit(false)
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to create invoice'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSavePaymentSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPaymentSetup(true)
    setError('')

    try {
      await updateProjectPaymentSettings(projectId, {
        projectTotal: paymentSetupForm.projectTotal ? Number(paymentSetupForm.projectTotal) : null,
        paymentPlanType: paymentSetupForm.paymentPlanType,
        depositType:
          paymentSetupForm.paymentPlanType === 'pay_in_full'
            ? null
            : paymentSetupForm.depositType,
        depositValue:
          paymentSetupForm.paymentPlanType === 'pay_in_full' || !paymentSetupForm.depositValue
            ? null
            : Number(paymentSetupForm.depositValue),
        secondPaymentDueDaysBeforeEvent: paymentSetupForm.secondPaymentDueDaysBeforeEvent
          ? Number(paymentSetupForm.secondPaymentDueDaysBeforeEvent)
          : null,
        finalPaymentDueDaysBeforeEvent: paymentSetupForm.finalPaymentDueDaysBeforeEvent
          ? Number(paymentSetupForm.finalPaymentDueDaysBeforeEvent)
          : null,
      })
      await loadDetail()
    } catch (err: unknown) {
      setError(getApiError(err, 'Failed to save payment setup'))
    } finally {
      setSavingPaymentSetup(false)
    }
  }

  const applyInvoicePreset = (kind: Invoice['invoiceKind']) => {
    if (!detail) return

    const { paymentSettings, paymentSummary, project, invoices } = detail
    const projectTotal = paymentSettings.projectTotal ?? 0
    const createdAmount = invoices
      .filter((invoice) => invoice.status !== 'cancelled')
      .reduce((sum, invoice) => sum + invoice.amount, 0)
    const remainingCreated = Math.max(0, Number((projectTotal - createdAmount).toFixed(2)))
    const depositAmount =
      paymentSettings.depositType === 'fixed'
        ? Number(paymentSettings.depositValue ?? 0)
        : paymentSettings.depositType === 'percentage' && paymentSettings.depositValue != null
          ? Number(((projectTotal * paymentSettings.depositValue) / 100).toFixed(2))
          : 0

    setInvoiceKind(kind)

    switch (kind) {
      case 'deposit':
        setInvoiceTitle('Deposit to hold your date')
        setInvoiceAmount(depositAmount > 0 ? String(depositAmount) : '')
        setInvoiceDescription('Deposit due to hold the event date.')
        setInvoiceDueDate('')
        setIsDateHoldingDeposit(true)
        break
      case 'payment':
        setInvoiceTitle('Payment')
        setInvoiceAmount(remainingCreated > 0 ? String(remainingCreated) : '')
        setInvoiceDescription('Scheduled payment toward your event balance.')
        setInvoiceDueDate(shiftDays(project.eventDate ?? '', paymentSettings.secondPaymentDueDaysBeforeEvent))
        setIsDateHoldingDeposit(false)
        break
      case 'final':
        setInvoiceTitle('Final payment')
        setInvoiceAmount(
          paymentSummary.amountOutstanding > 0 ? String(paymentSummary.amountOutstanding) : ''
        )
        setInvoiceDescription('Final balance due before the event.')
        setInvoiceDueDate(shiftDays(project.eventDate ?? '', paymentSettings.finalPaymentDueDaysBeforeEvent))
        setIsDateHoldingDeposit(false)
        break
      case 'custom':
        setInvoiceTitle(`${project.title} invoice`)
        setInvoiceAmount(remainingCreated > 0 ? String(remainingCreated) : '')
        setInvoiceDescription('')
        setInvoiceDueDate('')
        setIsDateHoldingDeposit(false)
        break
      default: {
        const exhaustiveCheck: never = kind
        return exhaustiveCheck
      }
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

  const { project, linkedClient, paymentSummary, contracts, milestones, invoices } =
    detail

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Projects
              </Link>
              <Link to="/dashboard/quotes" className="text-gray-500 hover:text-indigo-600">
                Quotes
              </Link>
              <Link to="/dashboard/calendar" className="text-gray-500 hover:text-indigo-600">
                Calendar
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

        <PipelineStepper steps={getProjectPipelineSteps(detail)} title="Project progress" />

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

        <section className="bg-white rounded-lg shadow p-6 space-y-4">
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
                {!contract.fileAvailable && (
                  <>
                    <p className="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2">
                      The contract PDF is missing on the server (often after a redeploy without a
                      persistent uploads volume). Re-upload the file below so your client can review
                      and sign it in their portal.
                    </p>
                    {!contract.acknowledgedAt && (
                      <form onSubmit={handleContractUpload} className="space-y-4">
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
                          {submitting ? 'Uploading...' : 'Re-upload PDF'}
                        </button>
                      </form>
                    )}
                  </>
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
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
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

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="font-medium text-gray-900 mb-4">Invoices</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create invoices for this project. Send them to your client when ready — they appear on
            the Payments tab in the client portal.{' '}
            <Link to="/dashboard/payments" className="text-indigo-600 hover:text-indigo-500">
              Set up payment methods
            </Link>
          </p>

          <form
            onSubmit={handleSavePaymentSetup}
            className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment setup</p>
                <p className="text-xs text-gray-600 mt-1">
                  Set the project total once, then use guided invoice presets for deposit, payment,
                  or final balance.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingPaymentSetup}
                className="px-3 py-2 text-xs text-white bg-indigo-600 rounded-md disabled:opacity-50"
              >
                {savingPaymentSetup ? 'Saving...' : 'Save payment setup'}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                <span className="text-gray-700">Project total (USD)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentSetupForm.projectTotal}
                  onChange={(e) =>
                    setPaymentSetupForm((current) => ({ ...current, projectTotal: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Payment structure</span>
                <select
                  value={paymentSetupForm.paymentPlanType}
                  onChange={(e) =>
                    setPaymentSetupForm((current) => ({
                      ...current,
                      paymentPlanType: e.target.value as
                        | 'pay_in_full'
                        | 'deposit_and_balance'
                        | 'split_payments',
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="pay_in_full">Pay in full</option>
                  <option value="deposit_and_balance">Deposit + final balance</option>
                  <option value="split_payments">Split payments</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Deposit type</span>
                <select
                  value={paymentSetupForm.depositType}
                  onChange={(e) =>
                    setPaymentSetupForm((current) => ({
                      ...current,
                      depositType: e.target.value as 'fixed' | 'percentage',
                    }))
                  }
                  disabled={paymentSetupForm.paymentPlanType === 'pay_in_full'}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">
                  Deposit value
                  {paymentSetupForm.depositType === 'percentage' ? ' (%)' : ' (USD)'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentSetupForm.depositValue}
                  onChange={(e) =>
                    setPaymentSetupForm((current) => ({ ...current, depositValue: e.target.value }))
                  }
                  disabled={paymentSetupForm.paymentPlanType === 'pay_in_full'}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">2nd payment days before event</span>
                <input
                  type="number"
                  min="0"
                  value={paymentSetupForm.secondPaymentDueDaysBeforeEvent}
                  onChange={(e) =>
                    setPaymentSetupForm((current) => ({
                      ...current,
                      secondPaymentDueDaysBeforeEvent: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700">Final payment days before event</span>
                <input
                  type="number"
                  min="0"
                  value={paymentSetupForm.finalPaymentDueDaysBeforeEvent}
                  onChange={(e) =>
                    setPaymentSetupForm((current) => ({
                      ...current,
                      finalPaymentDueDaysBeforeEvent: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-white border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">Deposit</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {paymentSummary.depositStatus.replace('_', ' ')}
                </p>
              </div>
              <div className="rounded-md bg-white border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">Amount paid</p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatCurrency(paymentSummary.amountPaid)}
                </p>
              </div>
              <div className="rounded-md bg-white border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">Amount remaining</p>
                <p className="mt-1 text-sm text-gray-900">
                  {formatCurrency(paymentSummary.amountOutstanding)}
                </p>
              </div>
            </div>
          </form>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-900">Create next invoice</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyInvoicePreset('deposit')}
                className="px-3 py-2 text-xs text-indigo-700 bg-indigo-50 rounded-md"
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => applyInvoicePreset('payment')}
                className="px-3 py-2 text-xs text-indigo-700 bg-indigo-50 rounded-md"
              >
                Payment
              </button>
              <button
                type="button"
                onClick={() => applyInvoicePreset('final')}
                className="px-3 py-2 text-xs text-indigo-700 bg-indigo-50 rounded-md"
              >
                Final payment
              </button>
              <button
                type="button"
                onClick={() => applyInvoicePreset('custom')}
                className="px-3 py-2 text-xs text-gray-700 bg-gray-100 rounded-md"
              >
                Custom
              </button>
            </div>
            {paymentSummary.nextSuggestedInvoiceKind && (
              <p className="mt-2 text-xs text-gray-600">
                Suggested next step: <strong>{paymentSummary.nextSuggestedInvoiceKind}</strong>
              </p>
            )}
          </div>

          {invoices.length > 0 && (
            <ul className="space-y-3 mb-6">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-sm border border-gray-100 rounded-md p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.title}</p>
                    <p className="text-xs text-indigo-700 mt-1">
                      {getInvoiceDisplayLabel(invoice)}
                    </p>
                    {invoice.invoiceNumber && (
                      <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                    )}
                    <p className="text-gray-600 mt-1">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due {formatUsDate(invoice.dueDate)}
                      </p>
                    )}
                    {invoice.clientPaymentClaimedAt && invoice.status !== 'paid' && (
                      <p className="text-xs text-amber-700 mt-1">
                        Client reported payment sent — confirm and mark paid
                      </p>
                    )}
                    {invoice.status === 'paid' && invoice.paidAt && (
                      <p className="text-xs text-green-700 mt-1">
                        Paid {formatUsDate(invoice.paidAt)}
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
                <span className="text-gray-700">Invoice type</span>
                <select
                  value={invoiceKind}
                  onChange={(e) => setInvoiceKind(e.target.value as Invoice['invoiceKind'])}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="custom">Custom</option>
                  <option value="deposit">Deposit</option>
                  <option value="payment">Payment</option>
                  <option value="final">Final payment</option>
                </select>
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
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isDateHoldingDeposit}
                onChange={(e) => setIsDateHoldingDeposit(e.target.checked)}
              />
              Mark this as the date-holding deposit
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
