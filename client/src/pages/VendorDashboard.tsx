import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  createProject,
  createProjectInvite,
  fetchVendorProjects,
  type InviteResult,
} from '../services/projectService'
import type { Project } from '../types/portal'

const VendorDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [inviteProjectId, setInviteProjectId] = useState<number | null>(null)
  const [inviteLink, setInviteLink] = useState<InviteResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: '',
    coupleDisplayName: '',
    weddingDate: '',
    location: '',
    clientEmail: '',
  })

  const [inviteEmail, setInviteEmail] = useState('')

  const loadProjects = useCallback(async () => {
    try {
      setError('')
      const data = await fetchVendorProjects()
      setProjects(data)
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
      await createProject({
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
      await loadProjects()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteProjectId || !inviteEmail.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const invite = await createProjectInvite(inviteProjectId, inviteEmail.trim())
      setInviteLink(invite)
      setInviteEmail('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setSubmitting(false)
    }
  }

  const copyInviteLink = () => {
    if (!inviteLink) return
    const fullUrl = getInviteFullUrl(inviteLink.invitePath)
    navigator.clipboard.writeText(fullUrl)
  }

  const getInviteFullUrl = (path: string) => `${window.location.origin}${path}`

  const openInviteEmailDraft = () => {
    if (!inviteLink) return
    const project = projects.find((p) => p.id === inviteProjectId)
    const fullUrl = getInviteFullUrl(inviteLink.invitePath)
    const subject = encodeURIComponent(
      `Your wedding portal${project ? ` — ${project.title}` : ''}`
    )
    const body = encodeURIComponent(
      `Hi,\n\n` +
        `I've set up your client portal. You don't have an account yet — this link will let you create one and view your project:\n\n` +
        `${fullUrl}\n\n` +
        `Open the link, choose a password, and you'll be taken straight to your wedding portal.\n\n` +
        `After that, you can sign in anytime at ${window.location.origin}/login\n`
    )
    window.location.href = `mailto:${inviteLink.email}?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">PortalHub</h1>
            <p className="text-sm text-gray-500">Vendor dashboard</p>
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
            <p className="text-sm text-gray-600">Manage your wedding projects and client invites.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreate(true)
              setInviteProjectId(null)
              setInviteLink(null)
            }}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            New project
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
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

        {inviteProjectId && (
          <form onSubmit={handleInvite} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Invite client to portal</h3>
              <p className="mt-1 text-sm text-gray-600">
                Your client does not need an account yet. Enter their email, generate a link, and
                send it to them. They will create their login when they open the link.
              </p>
            </div>
            <input
              type="email"
              required
              placeholder="Client email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {inviteLink && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-900 space-y-3">
                <p className="font-medium">Invite ready — send this to your client</p>
                <p className="text-green-800">
                  They will open the link, set a password, and land in their portal. No separate
                  sign-up page needed.
                </p>
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
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Generate invite link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInviteProjectId(null)
                  setInviteLink(null)
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md"
              >
                Done
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
                <li key={project.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{project.title}</p>
                    <p className="text-sm text-gray-500">
                      {project.coupleDisplayName || 'No couple name yet'}
                      {project.weddingDate ? ` · ${project.weddingDate}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{project.status.replace('_', ' ')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteProjectId(project.id)
                      setInviteLink(null)
                      setInviteEmail(project.clientEmail || '')
                      setShowCreate(false)
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-500 self-start sm:self-center"
                  >
                    Invite client
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default VendorDashboard
