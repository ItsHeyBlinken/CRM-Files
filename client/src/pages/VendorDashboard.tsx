import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createProject, fetchVendorProjects } from '../services/projectService'
import { fetchVendorOnboarding, type VendorChecklist } from '../services/onboardingService'
import type { Project } from '../types/portal'

const VendorDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [checklist, setChecklist] = useState<VendorChecklist | null>(null)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    coupleDisplayName: '',
    weddingDate: '',
    location: '',
    clientEmail: '',
  })

  const loadProjects = useCallback(async () => {
    try {
      setError('')
      const [data, onboarding] = await Promise.all([
        fetchVendorProjects(),
        fetchVendorOnboarding(),
      ])
      setProjects(data)
      setChecklist(onboarding.checklist)
      setHasPaymentMethod(onboarding.status.hasPaymentMethod)
    } catch {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const project = await createProject({
        title: createForm.title.trim(),
        coupleDisplayName: createForm.coupleDisplayName || undefined,
        weddingDate: createForm.weddingDate || undefined,
        location: createForm.location || undefined,
        clientEmail: createForm.clientEmail || undefined,
        status: 'booked',
      })
      setCreateForm({
        title: '',
        coupleDisplayName: '',
        weddingDate: '',
        location: '',
        clientEmail: '',
      })
      setShowCreate(false)
      navigate(`/dashboard/projects/${project.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">PortalHub</h1>
            <nav className="mt-1 flex gap-4 text-sm">
              <span className="text-indigo-600 font-medium">Projects</span>
              <Link to="/dashboard/quotes" className="text-gray-500 hover:text-indigo-600">
                Quotes
              </Link>
              <Link to="/dashboard/payments" className="text-gray-500 hover:text-indigo-600">
                Payments
              </Link>
            </nav>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Welcome{user?.firstName ? `, ${user.firstName}` : ''}
            </h2>
            <p className="text-sm text-gray-600">
              Select a project to manage invites, contracts, and client portal setup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            New project
          </button>
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
                placeholder="Project title (e.g. Miller Wedding)"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md sm:col-span-2"
              />
              <input
                placeholder="Couple name (optional)"
                value={createForm.coupleDisplayName}
                onChange={(e) => setCreateForm({ ...createForm, coupleDisplayName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="date"
                value={createForm.weddingDate}
                onChange={(e) => setCreateForm({ ...createForm, weddingDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
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
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
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

        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Your projects</h3>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No projects yet. Create your first wedding project to get started.
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
                          {project.coupleDisplayName || 'No couple name yet'}
                          {project.weddingDate ? ` · ${project.weddingDate}` : ''}
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
