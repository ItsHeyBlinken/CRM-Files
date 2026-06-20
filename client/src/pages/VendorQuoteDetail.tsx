import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import QuoteClientAgreementNotice from '../components/quotes/QuoteClientAgreementNotice'
import QuoteDocument from '../components/quotes/QuoteDocument'
import SaveQuotePdfButton from '../components/quotes/SaveQuotePdfButton'
import PipelineStepper from '../components/vendor/PipelineStepper'
import { convertQuoteToProject, fetchVendorQuote, openVendorQuoteContract, uploadQuoteContract } from '../services/quoteService'
import { sendQuoteEmail } from '../services/vendorExtrasService'
import type { Quote } from '../types/quote'
import { formatQuoteMoney } from '../utils/formatQuoteMoney'
import { getQuotePipelineSteps } from '../utils/quotePipeline'
import toast from 'react-hot-toast'

const statusLabel: Record<Quote['status'], string> = {
  draft: 'Draft',
  sent: 'Awaiting response',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  converted: 'Converted to project',
}

const VendorQuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const quoteId = Number(id)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [quotePath, setQuotePath] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [contractUploadTitle, setContractUploadTitle] = useState('Service agreement')
  const [contractUploadFile, setContractUploadFile] = useState<File | null>(null)

  const loadQuote = useCallback(async () => {
    if (!quoteId) return
    try {
      setError('')
      const data = await fetchVendorQuote(quoteId)
      setQuote(data.quote)
      setQuotePath(data.quotePath)
    } catch {
      setError('Failed to load quote')
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

  const getQuoteFullUrl = (path: string) => `${window.location.origin}${path}`

  const copyQuoteLink = () => {
    if (!quotePath) return
    navigator.clipboard.writeText(getQuoteFullUrl(quotePath))
  }

  const openQuoteEmailDraft = () => {
    if (!quote || !quotePath) return
    const fullUrl = getQuoteFullUrl(quotePath)
    const subject = encodeURIComponent(`Your quote — ${quote.title}`)
    const body = encodeURIComponent(
      `Hi${quote.clientName ? ` ${quote.clientName}` : ''},\n\n` +
        `Here's your quote from us. Open the link below to review and accept or decline — no account needed:\n\n` +
        `${fullUrl}\n\n` +
        (quote.contract
          ? `We've included our contract with this quote — you can review it from the same link before accepting.\n\n`
          : '') +
        `Total: ${formatQuoteMoney(quote.totalAmount, quote.currency)}\n\n` +
        `Let us know if you have any questions!\n`
    )
    window.location.href = `mailto:${quote.clientEmail}?subject=${subject}&body=${body}`
  }

  const handleSendQuoteEmail = async () => {
    if (!quoteId) return
    setSubmitting(true)
    try {
      const result = await sendQuoteEmail(quoteId)
      if (result.sent) {
        toast.success('Quote email sent')
      } else if (result.skippedReason === 'EMAIL_NOT_CONFIGURED') {
        toast.error('Email is not configured on the server — use “Open in email app” instead')
      } else {
        toast.error('Could not send quote email')
      }
    } catch {
      toast.error('Could not send quote email')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConvert = async () => {
    if (!quoteId) return
    setSubmitting(true)
    setError('')
    try {
      const result = await convertQuoteToProject(quoteId)
      navigate(`/dashboard/projects/${result.projectId}`)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(message || 'Failed to convert quote')
    } finally {
      setSubmitting(false)
    }
  }

  const canManageContract =
    quote?.status !== 'converted' && quote?.status !== 'declined' && !quote?.contract?.acknowledgedAt

  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quoteId || !contractUploadFile) return

    setSubmitting(true)
    setError('')
    try {
      const result = await uploadQuoteContract(quoteId, {
        contractTitle: contractUploadTitle.trim() || quote?.contract?.title || 'Service agreement',
        contractFile: contractUploadFile,
      })
      setQuote(result.quote)
      setQuotePath(result.quotePath)
      setContractUploadFile(null)
      toast.success('Contract uploaded')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(message || 'Failed to upload contract')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">Quote not found</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Link to="/dashboard/quotes" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
            Back to quotes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="no-print bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link to="/dashboard/quotes" className="text-sm text-indigo-600 hover:text-indigo-500">
              ← All quotes
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 mt-1">{quote.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <SaveQuotePdfButton quoteTitle={quote.title} />
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
          <div className="no-print rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <div className="no-print">
          <QuoteClientAgreementNotice variant="vendor" />
        </div>

        <div className="no-print">
          <PipelineStepper steps={getQuotePipelineSteps(quote)} title="Quote progress" />
        </div>

        <QuoteDocument
          quote={{
            title: quote.title,
            clientName: quote.clientName,
            clientEmail: quote.clientEmail,
            eventDate: quote.eventDate,
            location: quote.location,
            notes: quote.notes,
            currency: quote.currency,
            totalAmount: quote.totalAmount,
            lineItems: quote.lineItems,
            expiresAt: quote.expiresAt,
            statusLabel: statusLabel[quote.status],
          }}
        />

        {quote.contract && (
          <section className="no-print bg-white rounded-lg shadow p-6 space-y-3">
            <h2 className="font-medium text-gray-900">Attached contract</h2>
            <p className="text-sm text-gray-600">
              {quote.contract.title} · {quote.contract.fileName}
            </p>
            {!quote.contract.fileAvailable && (
              <p className="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2">
                The contract PDF is missing on the server (often after a redeploy). Re-upload the
                file below so your client can review it on the quote link.
              </p>
            )}
            {quote.contract.acknowledgedAt ? (
              <p className="text-sm text-green-800">
                Signed by {quote.contract.acknowledgementLegalName ?? 'client'} on{' '}
                {new Date(quote.contract.acknowledgedAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                . Client still needs to pay deposit to become a booked client.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                View-only for your client until they accept the quote, then signing unlocks on the
                quote link.
              </p>
            )}
            {quote.contract.fileAvailable && (
              <button
                type="button"
                onClick={() => openVendorQuoteContract(quote.id)}
                className="px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
              >
                View contract PDF
              </button>
            )}
          </section>
        )}

        {canManageContract && (
          <section className="no-print bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-medium text-gray-900">
              {quote.contract ? 'Re-upload contract PDF' : 'Attach contract PDF'}
            </h2>
            <p className="text-sm text-gray-600">
              {quote.contract
                ? 'Replace the contract file if it failed to upload or was lost after a server restart.'
                : 'Add a contract PDF for this quote so clients can review it on the quote link.'}
            </p>
            <form onSubmit={handleUploadContract} className="space-y-3 max-w-md">
              <div>
                <label htmlFor="quote-contract-reupload-title" className="block text-xs font-medium text-gray-700 mb-1">
                  Contract title
                </label>
                <input
                  id="quote-contract-reupload-title"
                  value={contractUploadTitle}
                  onChange={(e) => setContractUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="quote-contract-reupload-file" className="block text-xs font-medium text-gray-700 mb-1">
                  Contract PDF
                </label>
                <input
                  id="quote-contract-reupload-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => setContractUploadFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-700"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !contractUploadFile}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Uploading...' : quote.contract ? 'Replace contract' : 'Upload contract'}
              </button>
            </form>
          </section>
        )}

        {quote.status !== 'converted' && (
          <section className="no-print bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="font-medium text-gray-900">Client link</h2>
            <p className="text-sm text-gray-600">
              Send this link by email or text. Your client can review, save a PDF, and respond without an account.
            </p>
            <code className="block break-all text-xs bg-gray-50 p-3 rounded border text-gray-800">
              {getQuoteFullUrl(quotePath)}
            </code>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyQuoteLink}
                className="px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => void handleSendQuoteEmail()}
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Send email
              </button>
              <button
                type="button"
                onClick={openQuoteEmailDraft}
                className="px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
              >
                Open in email app
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Expires {new Date(quote.expiresAt).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </section>
        )}

        {quote.status === 'accepted' && !quote.projectId && (
          <section className="no-print bg-green-50 rounded-lg border border-green-200 p-6 space-y-3">
            <h2 className="font-medium text-green-900">Client accepted the quote — next steps</h2>
            <p className="text-sm text-green-800">
              Accepting the quote is only one part of the agreement. Convert to a project to collect
              contract signature and deposit, then send your client portal invite.
            </p>
            <button
              type="button"
              onClick={handleConvert}
              disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-green-700 rounded-md hover:bg-green-800 disabled:opacity-50"
            >
              {submitting ? 'Creating project...' : 'Convert to project'}
            </button>
          </section>
        )}

        {quote.status === 'converted' && quote.projectId && (
          <section className="no-print bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">
              This quote was converted to a project.{' '}
              <Link
                to={`/dashboard/projects/${quote.projectId}`}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Open project →
              </Link>
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

export default VendorQuoteDetail
