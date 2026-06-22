import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { createProject, fetchVendorProjects } from '../services/projectService'
import { fetchVendorDashboardSummary } from '../services/dashboardService'
import { fetchVendorOnboarding, type VendorChecklist } from '../services/onboardingService'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import StarterPlanBanner from '../components/vendor/StarterPlanBanner'
import { useVendorBranding } from '../components/vendor/VendorBrandingProvider'
import { fetchVendorPlanUsage } from '../services/planService'
import { getApiErrorMessage } from '../utils/apiErrors'
import { formatCalendarDate, formatUsDate } from '../utils/calendarHelpers'
import type { VendorDashboardSummary } from '../types/dashboard'
import type { VendorPlanUsage } from '../types/plan'
import type { Project } from '../types/portal'

const VendorDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accentColor } = useVendorBranding()
  const [projects, setProjects] = useState<Project[]>([])
  const [summary, setSummary] = useState<VendorDashboardSummary | null>(null)
  const [checklist, setChecklist] = useState<VendorChecklist | null>(null)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [planUsage, setPlanUsage] = useState<VendorPlanUsage | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    clientDisplayName: '',
    eventDate: '',
    location: '',
    clientEmail: '',
  })

  const loadProjects = useCallback(async () => {
    try {
      setError('')
      const [data, onboarding, dashboardSummary, usage] = await Promise.all([
        fetchVendorProjects(),
        fetchVendorOnboarding(),
        fetchVendorDashboardSummary(),
        fetchVendorPlanUsage(),
      ])
      setProjects(data)
      setSummary(dashboardSummary)
      setChecklist(onboarding.checklist)
      setHasPaymentMethod(onboarding.status.hasPaymentMethod)
      setPlanUsage(usage)
    } catch {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    const billing = searchParams.get('billing')
    if (billing === 'success') {
      toast.success('Welcome to Pro! Your limits are now unlimited.')
      void loadProjects()
      searchParams.delete('billing')
      setSearchParams(searchParams, { replace: true })
    } else if (billing === 'cancelled') {
      toast('Checkout cancelled — you can upgrade anytime from the dashboard.')
      searchParams.delete('billing')
      setSearchParams(searchParams, { replace: true })
    }
  }, [loadProjects, searchParams, setSearchParams])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const project = await createProject({
        title: createForm.title.trim(),
        clientDisplayName: createForm.clientDisplayName || undefined,
        eventDate: createForm.eventDate || undefined,
        location: createForm.location || undefined,
        clientEmail: createForm.clientEmail || undefined,
        status: 'booked',
      })
      setCreateForm({
        title: '',
        clientDisplayName: '',
        eventDate: '',
        location: '',
        clientEmail: '',
      })
      setShowCreate(false)
      navigate(`/dashboard/projects/${project.id}`)
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create project'))
    } finally {
      setSubmitting(false)
    }
  }

  const atProjectLimit = planUsage?.limits.activeProjects.atLimit === true

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorDashboardHeader
        active="projects"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <StarterPlanBanner usage={planUsage} focus="both" />

        <section
          className="rounded-2xl p-6 text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <h2 className="text-2xl font-semibold">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="mt-2 text-sm text-white/90">
            Here&apos;s what needs your attention today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/dashboard/quotes"
              className="rounded-md bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
            >
              New quote
            </Link>
            <Link
              to="/dashboard/calendar"
              className="rounded-md bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
            >
              View calendar
            </Link>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              disabled={atProjectLimit}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              New project
            </button>
          </div>
        </section>

        {summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Quotes awaiting response" value={summary.stats.quotesAwaitingResponse} />
              <StatCard label="Ready to convert" value={summary.stats.quotesReadyToConvert} />
              <StatCard label="Upcoming events" value={summary.stats.upcomingEvents} />
              <StatCard label="Payments to confirm" value={summary.stats.paymentClaimsPending} />
            </div>

            {summary.attention.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">Needs attention</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {summary.attention.map((item) => (
                    <li key={item.id}>
                      <Link to={item.linkPath} className="block px-6 py-4 hover:bg-gray-50 transition">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.subtitle}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.upcomingEvents.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Coming up</h3>
                  <Link to="/dashboard/calendar" className="text-sm text-indigo-600 hover:text-indigo-500">
                    Full calendar
                  </Link>
                </div>
                <ul className="divide-y divide-gray-100">
                  {summary.upcomingEvents.map((event) => (
                    <li key={event.id}>
                      <Link to={event.linkPath} className="block px-6 py-4 hover:bg-gray-50 transition">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatCalendarDate(event.eventDate)}
                          {event.kind === 'quote_tentative' ? ' · Tentative quote' : ' · Booked'}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Projects</h2>
            <p className="text-sm text-gray-600">
              Manage invites, contracts, invoices, and client portal setup.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {checklist && (!checklist.hasProject || !hasPaymentMethod || !checklist.hasLinkedClient) && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-medium text-gray-900">Get started</h2>
            <ul className="mt-4 space-y-3">
              <ChecklistItem
                done={hasPaymentMethod}
                label="Set up how clients pay you"
                actionLabel="Payments"
                to="/dashboard/payments"
              />
              <ChecklistItem
                done={checklist.hasProject}
                label="Create your first project"
                actionLabel="New project"
                onClick={() => setShowCreate(true)}
              />
              <ChecklistItem
                done={checklist.hasLinkedClient}
                label="Invite a client to their portal"
                hint="Open a project and send an invite link"
              />
              <ChecklistItem
                done={checklist.hasSentInvoice}
                label="Send an invoice"
                hint="Add an invoice on a project and send it to your client"
              />
            </ul>
          </section>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Create project</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Project title (e.g. Miller Anniversary Gala)"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md sm:col-span-2"
              />
              <input
                placeholder="Client name (optional)"
                value={createForm.clientDisplayName}
                onChange={(e) => setCreateForm({ ...createForm, clientDisplayName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <div>
                <label htmlFor="create-event-date" className="block text-xs font-medium text-gray-700 mb-1">
                  Event date (optional)
                </label>
                <input
                  id="create-event-date"
                  type="date"
                  value={createForm.eventDate}
                  onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <input
                placeholder="Location (optional)"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md sm:col-span-2"
              />
              <input
                type="email"
                placeholder="Client email (optional — can invite later)"
                value={createForm.clientEmail}
                onChange={(e) => setCreateForm({ ...createForm, clientEmail: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md sm:col-span-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm text-white rounded-md disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {submitting ? 'Saving...' : 'Create project'}
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

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Your projects</h3>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No projects yet. Create your first event project to get started.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/dashboard/projects/${project.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{project.title}</p>
                        <p className="text-sm text-gray-500">
                          {project.clientDisplayName || 'No client name yet'}
                          {project.eventDate ? ` · ${formatUsDate(project.eventDate)}` : ''}
                        </p>
                      </div>
                      <span className="text-xs capitalize text-indigo-600 font-medium self-start sm:self-center">
                        View project →
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 capitalize mt-1">
                      {project.status.replace('_', ' ')}
                    </p>
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

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{label}</p>
  </div>
)

const ChecklistItem: React.FC<{
  done: boolean
  label: string
  hint?: string
  actionLabel?: string
  to?: string
  onClick?: () => void
}> = ({ done, label, hint, actionLabel, to, onClick }) => (
  <li className="flex items-start justify-between gap-3 text-sm">
    <div className="flex gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {done ? '✓' : '○'}
      </span>
      <div>
        <p className={done ? 'text-gray-500 line-through' : 'text-gray-900'}>{label}</p>
        {hint && !done && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </div>
    {!done && actionLabel && to && (
      <Link to={to} className="text-indigo-600 font-medium shrink-0">
        {actionLabel}
      </Link>
    )}
    {!done && actionLabel && onClick && (
      <button type="button" onClick={onClick} className="text-indigo-600 font-medium shrink-0">
        {actionLabel}
      </button>
    )}
  </li>
)

export default VendorDashboard
