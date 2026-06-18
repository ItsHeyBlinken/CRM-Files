import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QuoteDocument from '../components/quotes/QuoteDocument'
import SaveQuotePdfButton from '../components/quotes/SaveQuotePdfButton'
import { acceptQuote, declineQuote, fetchPublicQuote } from '../services/quoteService'
import type { PublicQuote } from '../types/quote'

const statusMessage: Record<PublicQuote['status'], string> = {
  draft: 'This quote is not ready yet.',
  sent: '',
  accepted: 'You accepted this quote. Your vendor will follow up with next steps.',
  declined: 'You declined this quote.',
  expired: 'This quote has expired.',
  converted: 'This quote was accepted and your vendor has started your project.',
}

const statusLabel: Record<PublicQuote['status'], string> = {
  draft: 'Draft',
  sent: 'Awaiting your response',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  converted: 'Converted to project',
}

const AcceptQuote: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid quote link')
      setLoading(false)
      return
    }

    const loadQuote = async () => {
      try {
        const data = await fetchPublicQuote(token)
        setQuote(data)
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined
        setError(message || 'This quote link is invalid or expired')
      } finally {
        setLoading(false)
      }
    }

    loadQuote()
  }, [token])

  const handleDecision = async (decision: 'accept' | 'decline') => {
    if (!token) return
    setSubmitting(true)
    setError('')
    try {
      const updated =
        decision === 'accept' ? await acceptQuote(token) : await declineQuote(token)
      setQuote(updated)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">Quote unavailable</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const showActions = quote.canRespond

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            Choose <strong>Save as PDF</strong> in the print dialog to keep a copy for your records.
          </p>
          <SaveQuotePdfButton quoteTitle={quote.title} />
        </div>

        <QuoteDocument
          quote={{
            title: quote.title,
            vendorBusinessName: quote.vendorBusinessName,
            clientName: quote.clientName,
            weddingDate: quote.weddingDate,
            location: quote.location,
            notes: quote.notes,
            currency: quote.currency,
            totalAmount: quote.totalAmount,
            lineItems: quote.lineItems,
            expiresAt: quote.expiresAt,
            statusLabel: statusLabel[quote.status],
          }}
        />

        {error && (
          <div className="no-print rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {showActions ? (
          <div className="no-print space-y-3">
            <p className="text-center text-sm text-gray-600">
              Review the quote above, then let your vendor know your decision.
            </p>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('accept')}
              className="w-full py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Accept quote'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('decline')}
              className="w-full py-3 px-4 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : (
          <div className="no-print rounded-lg bg-indigo-50 border border-indigo-100 p-4 text-center text-sm text-indigo-900">
            {statusMessage[quote.status]}
          </div>
        )}

        <p className="no-print text-center text-xs text-gray-400">
          No account needed · Works on your phone
        </p>
      </div>
    </div>
  )
}

export default AcceptQuote
