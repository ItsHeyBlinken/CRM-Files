import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ContractSignPanel from '../components/portal/ContractSignPanel'
import { downloadDeliverableBlob } from '../services/deliverableService'
import { fetchClientPortal } from '../services/projectService'
import type { ClientPortalData, PortalTab } from '../types/portal'
import {
  formatCurrency,
  formatFileSize,
  formatWeddingDate,
  getInvoiceStatusLabel,
  getNextAction,
  getStatusLabel,
  portalTabLabel,
} from '../utils/portalHelpers'

const ClientPortal: React.FC = () => {
  const { user, logout } = useAuth()
  const [data, setData] = useState<ClientPortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<PortalTab>('home')
  const [signedContractTitle, setSignedContractTitle] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [filesError, setFilesError] = useState('')

  const loadPortal = useCallback(async () => {
    try {
      setError('')
      const portalData = await fetchClientPortal()
      setData(portalData)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to load your project'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPortal()
  }, [loadPortal])

  const handleContractSigned = async (contractTitle: string) => {
    await loadPortal()
    setSignedContractTitle(contractTitle)
    setActiveTab('home')
  }

  const handleDownload = async (deliverableId: number) => {
    setFilesError('')
    setDownloadingId(deliverableId)

    try {
      const { blob, fileName } = await downloadDeliverableBlob(deliverableId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not download file'
      setFilesError(message)
    } finally {
      setDownloadingId(null)
    }
  }

  const accent = data?.primaryColor || '#2563eb'
  const nextAction = data ? getNextAction(data) : null

  const tabs: PortalTab[] = ['home', 'documents', 'payments', 'files']

  const renderHome = () => {
    if (!data) return null

    return (
      <div className="space-y-5">
        {signedContractTitle && (
          <section className="rounded-2xl bg-green-50 border border-green-200 p-5 shadow-sm">
            <p className="font-medium text-green-900">Contract signed</p>
            <p className="mt-2 text-sm text-green-800">
              <strong>{signedContractTitle}</strong> is complete. You&apos;re all set for now — you
              can sign out or close this page. Come back anytime; your next step will appear on
              Home when your vendor adds an invoice or files.
            </p>
            <button
              type="button"
              onClick={() => setSignedContractTitle(null)}
              className="mt-4 text-sm font-medium text-green-800 underline hover:text-green-900"
            >
              Got it
            </button>
          </section>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium" style={{ color: accent }}>
            {data.vendorBusinessName}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900">{data.project.title}</h2>
          <p className="mt-2 text-gray-600">{getStatusLabel(data.project.status)}</p>
          <p className="mt-3 text-sm text-gray-500">
            {formatWeddingDate(data.project.weddingDate)}
          </p>
          {data.project.location && (
            <p className="text-sm text-gray-500">{data.project.location}</p>
          )}
        </section>

        {nextAction ? (
          <button
            type="button"
            onClick={() => setActiveTab(nextAction.tab)}
            className="w-full rounded-2xl p-5 text-left text-white shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: accent }}
          >
            <p className="text-sm font-medium opacity-90">What's next</p>
            <p className="mt-1 text-lg font-semibold">{nextAction.label}</p>
            <p className="mt-1 text-sm opacity-90">{nextAction.description}</p>
          </button>
        ) : (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-medium text-gray-900">You&apos;re all caught up</p>
            <p className="mt-1 text-sm text-gray-600">
              Nothing needs your attention right now. You can sign out or close this page — your
              portal will be here when you return.
            </p>
          </section>
        )}

        {data.milestones.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-medium text-gray-900">Timeline</h3>
            <ul className="mt-4 space-y-4">
              {data.milestones.map((milestone) => (
                <li key={milestone.id} className="flex gap-3">
                  <div
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      milestone.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                    {milestone.dueDate && (
                      <p className="text-xs text-gray-500">
                        {new Date(`${milestone.dueDate}T12:00:00`).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  }

  const renderDocuments = () => {
    if (!data) return null

    if (data.contracts.length === 0) {
      return (
        <EmptySection
          title="No documents yet"
          description={`${data.vendorBusinessName} will add your contract here when it's ready.`}
        />
      )
    }

    return (
      <ul className="space-y-3">
        {data.contracts.map((contract) => (
          <li key={contract.id}>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-medium text-gray-900">{contract.title}</p>
              <p className="mt-1 text-sm text-gray-600">
                {contract.acknowledgedAt
                  ? 'Signed — thank you!'
                  : 'Please review and sign this contract electronically'}
              </p>
              {!contract.acknowledgedAt ? (
                <ContractSignPanel
                  contractId={contract.id}
                  contractTitle={contract.title}
                  accentColor={accent}
                  onSigned={handleContractSigned}
                />
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-gray-500">
                    Signed on {new Date(contract.acknowledgedAt).toLocaleDateString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="text-sm font-medium"
                    style={{ color: accent }}
                  >
                    Back to Home
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const renderPayments = () => {
    if (!data) return null

    if (data.invoices.length === 0) {
      return (
        <EmptySection
          title="No invoices yet"
          description="When your vendor sends an invoice, it will show up here with the amount and due date."
        />
      )
    }

    return (
      <ul className="space-y-3">
        {data.invoices.map((invoice) => (
          <li key={invoice.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{invoice.title}</p>
                {invoice.invoiceNumber && (
                  <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                )}
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                {getInvoiceStatusLabel(invoice.status)}
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-gray-900">
              {formatCurrency(invoice.amount, invoice.currency)}
            </p>
            {invoice.dueDate && (
              <p className="mt-1 text-sm text-gray-500">
                Due {new Date(`${invoice.dueDate}T12:00:00`).toLocaleDateString()}
              </p>
            )}
            {invoice.description && (
              <p className="mt-2 text-sm text-gray-600">{invoice.description}</p>
            )}
          </li>
        ))}
      </ul>
    )
  }

  const renderFiles = () => {
    if (!data) return null

    if (data.deliverables.length === 0) {
      return (
        <EmptySection
          title="No files yet"
          description="Photos, galleries, and deliverables from your vendor will appear here."
        />
      )
    }

    return (
      <ul className="space-y-3">
        {filesError && (
          <li className="list-none">
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{filesError}</div>
          </li>
        )}
        {data.deliverables.map((file) => (
          <li key={file.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-medium text-gray-900">{file.title}</p>
            <p className="mt-1 text-sm text-gray-500">{file.fileName}</p>
            {file.fileSizeBytes != null && (
              <p className="text-xs text-gray-400">{formatFileSize(file.fileSizeBytes)}</p>
            )}
            <button
              type="button"
              onClick={() => handleDownload(file.id)}
              disabled={downloadingId === file.id}
              className="mt-3 text-sm font-medium disabled:opacity-50"
              style={{ color: accent }}
            >
              {downloadingId === file.id ? 'Downloading...' : 'Download'}
            </button>
          </li>
        ))}
      </ul>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome()
      case 'documents':
        return renderDocuments()
      case 'payments':
        return renderPayments()
      case 'files':
        return renderFiles()
      default: {
        const _exhaustive: never = activeTab
        return _exhaustive
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 shadow-sm text-center">
          <h2 className="text-lg font-medium text-gray-900">Portal unavailable</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-4 text-sm text-indigo-600"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: accent }}>
              {data.vendorBusinessName}
            </p>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {data.project.coupleDisplayName || user?.firstName || 'Your portal'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="text-sm text-gray-500 shrink-0 ml-3"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">{renderTabContent()}</main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                if (tab !== 'home') {
                  setSignedContractTitle(null)
                }
              }}
              className={`flex-1 py-3 text-xs font-medium transition ${
                activeTab === tab ? 'text-gray-900' : 'text-gray-400'
              }`}
              style={activeTab === tab ? { color: accent } : undefined}
            >
              {portalTabLabel(tab)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

const EmptySection: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <section className="rounded-2xl bg-white p-6 shadow-sm text-center">
    <p className="font-medium text-gray-900">{title}</p>
    <p className="mt-2 text-sm text-gray-600">{description}</p>
  </section>
)

export default ClientPortal
