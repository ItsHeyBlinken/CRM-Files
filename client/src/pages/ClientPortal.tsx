import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ContractSignPanel from '../components/portal/ContractSignPanel'
import { downloadDeliverableBlob } from '../services/deliverableService'
import {
  claimInvoicePaymentSent,
  startInvoiceCheckout,
} from '../services/portalPaymentService'
import { fetchClientPortal } from '../services/projectService'
import type { ClientPortalData, Invoice, PortalTab } from '../types/portal'
import {
  buildP2PPaymentUrl,
  getP2POpenLabel,
  type P2PPaymentMethod,
} from '../utils/p2pPaymentLinks'
import {
  formatCurrency,
  formatFileSize,
  formatEventDate,
  getInvoiceDisplayLabel,
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
  const [paidInvoiceTitle, setPaidInvoiceTitle] = useState<string | null>(null)
  const [reportedInvoiceTitle, setReportedInvoiceTitle] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState('')
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null)
  const [claimingInvoiceId, setClaimingInvoiceId] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filesError, setFilesError] = useState('')
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const previousInvoiceStatusRef = useRef<Map<number, string>>(new Map())

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

  // When vendor marks an invoice paid, redirect client to Home with success banner
  useEffect(() => {
    if (!data) {
      return
    }

    for (const invoice of data.invoices) {
      const previousStatus = previousInvoiceStatusRef.current.get(invoice.id)
      if (invoice.status === 'paid' && previousStatus && previousStatus !== 'paid') {
        setPaidInvoiceTitle(invoice.title)
        setReportedInvoiceTitle(null)
        setActiveTab('home')
      }
      previousInvoiceStatusRef.current.set(invoice.id, invoice.status)
    }
  }, [data])

  // Poll while on Payments tab waiting for vendor to confirm P2P payment
  useEffect(() => {
    if (activeTab !== 'payments' || !data) {
      return
    }

    const hasAwaitingConfirmation = data.invoices.some(
      (inv) =>
        (inv.status === 'sent' || inv.status === 'overdue') && inv.clientPaymentClaimedAt
    )
    const hasPayable = data.invoices.some(
      (inv) => inv.status === 'sent' || inv.status === 'overdue'
    )

    if (!hasPayable && !hasAwaitingConfirmation) {
      return
    }

    const interval = setInterval(() => {
      loadPortal()
    }, 8000)

    return () => clearInterval(interval)
  }, [activeTab, data, loadPortal])

  useEffect(() => {
    const payment = searchParams.get('payment')
    const tab = searchParams.get('tab')
    const invoiceId = searchParams.get('invoice')

    if (tab === 'payments') {
      setActiveTab('payments')
    }

    if (payment === 'success' && invoiceId && data) {
      const paid = data.invoices.find((inv) => String(inv.id) === invoiceId)
      setPaidInvoiceTitle(paid?.title ?? 'Invoice')
      setActiveTab('home')
      setSearchParams({})
      loadPortal()
    } else if (payment === 'cancelled') {
      setPaymentError('Payment was cancelled. You can try again anytime.')
      setActiveTab('payments')
      setSearchParams({})
    }
  }, [searchParams, setSearchParams, data, loadPortal])

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

  const handlePayWithCard = async (invoice: Invoice) => {
    setPaymentError('')
    setPayingInvoiceId(invoice.id)

    try {
      const url = await startInvoiceCheckout(invoice.id)
      window.location.href = url
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not start card payment'
      setPaymentError(message)
      setPayingInvoiceId(null)
    }
  }

  const handleClaimSent = async (invoice: Invoice) => {
    setPaymentError('')
    setClaimingInvoiceId(invoice.id)

    try {
      await claimInvoicePaymentSent(invoice.id)
      await loadPortal()
      setReportedInvoiceTitle(invoice.title)
      setPaidInvoiceTitle(null)
      setActiveTab('home')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not record payment'
      setPaymentError(message)
    } finally {
      setClaimingInvoiceId(null)
    }
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const accent = data?.primaryColor || '#2563eb'
  const nextAction = data ? getNextAction(data) : null

  const tabs: PortalTab[] = ['home', 'documents', 'payments', 'files']

  const renderHome = () => {
    if (!data) return null

    return (
      <div className="space-y-5">
        {reportedInvoiceTitle && (
          <section className="rounded-2xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
            <p className="font-medium text-amber-900">Payment reported</p>
            <p className="mt-2 text-sm text-amber-800">
              We let <strong>{data.vendorBusinessName}</strong> know you sent payment for{' '}
              <strong>{reportedInvoiceTitle}</strong>. They&apos;ll mark it paid once confirmed —
              you&apos;re all set for now.
            </p>
            <button
              type="button"
              onClick={() => setReportedInvoiceTitle(null)}
              className="mt-4 text-sm font-medium text-amber-800 underline hover:text-amber-900"
            >
              Got it
            </button>
          </section>
        )}

        {paidInvoiceTitle && (
          <section className="rounded-2xl bg-green-50 border border-green-200 p-5 shadow-sm">
            <p className="text-lg font-semibold text-green-900">Payment complete</p>
            <p className="mt-2 text-sm text-green-800">
              <strong>{paidInvoiceTitle}</strong> is paid. You&apos;re all set — you can sign out or
              close this page.
            </p>
            <button
              type="button"
              onClick={() => setPaidInvoiceTitle(null)}
              className="mt-4 text-sm font-medium text-green-800 underline hover:text-green-900"
            >
              Got it
            </button>
          </section>
        )}

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
            {formatEventDate(data.project.eventDate)}
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

    const options = data.paymentOptions
    const hasP2P = Boolean(
      options.venmoHandle ||
        options.zelleHandle ||
        options.cashappHandle ||
        options.paypalHandle
    )

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
        {paymentError && (
          <li className="list-none">
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{paymentError}</div>
          </li>
        )}
        {data.invoices.map((invoice) => {
          const isPayable = invoice.status === 'sent' || invoice.status === 'overdue'

          if (invoice.status === 'paid') {
            return (
              <li
                key={invoice.id}
                className="rounded-2xl bg-green-50 border-2 border-green-200 p-6 shadow-sm"
              >
                <div className="text-center space-y-2">
                  <span className="inline-block rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-900">
                    Paid
                  </span>
                  <p className="text-xl font-semibold text-green-900">
                    {getInvoiceDisplayLabel(invoice)}
                  </p>
                  {invoice.invoiceNumber && (
                    <p className="text-xs text-green-700">{invoice.invoiceNumber}</p>
                  )}
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                  {invoice.paidAt && (
                    <p className="text-sm text-green-800">
                      Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    Back to Home
                  </button>
                </div>
              </li>
            )
          }

          return (
            <li key={invoice.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{getInvoiceDisplayLabel(invoice)}</p>
                  {invoice.invoiceNumber && (
                    <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    invoice.status === 'overdue'
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

              {isPayable && (
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  {options.stripeEnabled && (
                    <button
                      type="button"
                      onClick={() => handlePayWithCard(invoice)}
                      disabled={payingInvoiceId === invoice.id}
                      className="w-full rounded-xl py-3.5 text-base font-semibold text-white disabled:opacity-50 shadow-sm"
                      style={{ backgroundColor: accent }}
                    >
                      {payingInvoiceId === invoice.id ? 'Opening checkout...' : 'Pay with card'}
                    </button>
                  )}

                  {hasP2P && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900">Pay another way</p>
                      {options.paymentInstructions && (
                        <p className="text-sm text-gray-600">{options.paymentInstructions}</p>
                      )}
                      <div className="space-y-2">
                        {options.venmoHandle && (
                          <P2PPaymentOption
                            label="Venmo"
                            method="venmo"
                            value={options.venmoHandle}
                            onCopy={copyText}
                            accent={accent}
                          />
                        )}
                        {options.zelleHandle && (
                          <P2PPaymentOption
                            label="Zelle"
                            method="zelle"
                            value={options.zelleHandle}
                            onCopy={copyText}
                            accent={accent}
                          />
                        )}
                        {options.cashappHandle && (
                          <P2PPaymentOption
                            label="Cash App"
                            method="cashapp"
                            value={options.cashappHandle}
                            onCopy={copyText}
                            accent={accent}
                          />
                        )}
                        {options.paypalHandle && (
                          <P2PPaymentOption
                            label="PayPal"
                            method="paypal"
                            value={options.paypalHandle}
                            onCopy={copyText}
                            accent={accent}
                          />
                        )}
                      </div>
                      {!invoice.clientPaymentClaimedAt ? (
                        <button
                          type="button"
                          onClick={() => handleClaimSent(invoice)}
                          disabled={claimingInvoiceId === invoice.id}
                          className="w-full rounded-xl py-3.5 text-base font-semibold text-white disabled:opacity-50 shadow-sm"
                          style={{ backgroundColor: accent }}
                        >
                          {claimingInvoiceId === invoice.id
                            ? 'Saving...'
                            : "I've sent payment — notify vendor"}
                        </button>
                      ) : (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                          <p className="text-sm font-semibold text-amber-900">
                            Payment reported — waiting for vendor
                          </p>
                          <p className="mt-1 text-xs text-amber-800">
                            We&apos;ll update this page when {data.vendorBusinessName} confirms
                            receipt.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!options.stripeEnabled && !hasP2P && (
                    <p className="text-sm text-gray-500">
                      Your vendor has not set up payment methods yet. Contact them for payment
                      instructions.
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
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
              {data.project.clientDisplayName || user?.firstName || 'Your portal'}
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
                  setPaidInvoiceTitle(null)
                  setReportedInvoiceTitle(null)
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

const P2PPaymentOption: React.FC<{
  label: string
  method: P2PPaymentMethod
  value: string
  onCopy: (text: string) => void
  accent: string
}> = ({ label, method, value, onCopy, accent }) => {
  const payUrl = buildP2PPaymentUrl(method, value)

  return (
    <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="mt-0.5 text-sm text-gray-600 break-all">{value}</p>
      <div className="mt-3 flex gap-2">
        {payUrl ? (
          <a
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {getP2POpenLabel(method)}
          </a>
        ) : (
          <div className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold text-gray-700 bg-white border border-gray-200">
            Copy to pay in your bank app
          </div>
        )}
        <button
          type="button"
          onClick={() => onCopy(value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
        >
          Copy
        </button>
      </div>
    </div>
  )
}

export default ClientPortal
