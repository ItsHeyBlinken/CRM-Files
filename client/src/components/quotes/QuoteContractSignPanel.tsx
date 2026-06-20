import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  acknowledgeQuoteContract,
  fetchQuoteContractSigningContext,
  getPublicQuoteContractUrl,
  type QuoteContractSigningContext,
} from '../../services/quoteService'

interface QuoteContractSignPanelProps {
  token: string
  contractTitle: string
  onSigned: () => Promise<void>
}

const QuoteContractSignPanel: React.FC<QuoteContractSignPanelProps> = ({
  token,
  contractTitle,
  onSigned,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const viewStartedAtRef = useRef<number | null>(null)
  const pdfUrl = getPublicQuoteContractUrl(token)

  const [context, setContext] = useState<QuoteContractSigningContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfReady, setPdfReady] = useState(false)
  const [viewSeconds, setViewSeconds] = useState(0)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [legalName, setLegalName] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const minViewSeconds = context?.minViewSeconds ?? 15
  const reviewComplete = scrolledToEnd || viewSeconds >= minViewSeconds
  const effectiveLegalName = legalName.trim()

  const canSubmit =
    !!context &&
    context.canSign &&
    pdfReady &&
    reviewComplete &&
    effectiveLegalName.length >= 2 &&
    consentAccepted

  const attachScrollTracking = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument) {
      return undefined
    }

    const doc = iframe.contentDocument

    const checkScroll = () => {
      const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop
      const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight
      const clientHeight = doc.documentElement.clientHeight || doc.body.clientHeight
      if (scrollTop + clientHeight >= scrollHeight - 24) {
        setScrolledToEnd(true)
      }
    }

    doc.addEventListener('scroll', checkScroll)
    window.setTimeout(checkScroll, 300)

    return () => {
      doc.removeEventListener('scroll', checkScroll)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let detachScroll: (() => void) | undefined

    const load = async () => {
      setLoading(true)
      setError('')
      setPdfReady(false)
      setViewSeconds(0)
      setScrolledToEnd(false)
      setConsentAccepted(false)
      viewStartedAtRef.current = null

      try {
        const signingContext = await fetchQuoteContractSigningContext(token)

        if (cancelled) {
          return
        }

        setContext(signingContext)
        setLegalName(signingContext.suggestedLegalName)
      } catch (err: unknown) {
        if (cancelled) {
          return
        }
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : undefined
        setError(message || 'Could not load contract for signing')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
      detachScroll?.()
    }
  }, [token])

  useEffect(() => {
    if (!pdfReady || viewStartedAtRef.current == null) {
      return
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - (viewStartedAtRef.current ?? Date.now())) / 1000)
      setViewSeconds(elapsed)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [pdfReady])

  const handleIframeLoad = () => {
    setPdfReady(true)
    viewStartedAtRef.current = Date.now()
    attachScrollTracking()
  }

  const handleSubmit = async () => {
    if (!context || !canSubmit) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await acknowledgeQuoteContract(token, {
        legalName: effectiveLegalName,
        pdfHash: context.pdfHash,
        viewDurationSeconds: viewSeconds,
        scrolledToEnd,
        consentAccepted: true,
      })
      await onSigned()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(message || 'Could not sign contract')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        Loading contract for review...
      </div>
    )
  }

  if (!context || !context.canSign) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
        {error || 'Contract signing is not available yet'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Sign contract</p>
        <p className="mt-1 text-xs text-gray-500">
          Read the full document below. Signing unlocks after you scroll to the end or review for{' '}
          {minViewSeconds} seconds.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          title={contractTitle}
          onLoad={handleIframeLoad}
          className="h-80 w-full bg-white"
        />
      </div>

      {!reviewComplete && pdfReady && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {viewSeconds < minViewSeconds
            ? `Please keep reading (${Math.max(0, minViewSeconds - viewSeconds)}s remaining) or scroll to the end.`
            : 'Scroll to the end of the contract to continue.'}
        </p>
      )}

      {reviewComplete && (
        <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Review complete — you may sign below.
        </p>
      )}

      <div>
        <label htmlFor="quote-contract-legal-name" className="block text-sm font-medium text-gray-900">
          Full legal name
        </label>
        <input
          id="quote-contract-legal-name"
          type="text"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          disabled={!reviewComplete}
          placeholder="Your full legal name"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          disabled={!reviewComplete}
          className="mt-0.5 rounded border-gray-300"
        />
        <span>{context.consentText}</span>
      </label>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full rounded-lg py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 font-medium disabled:opacity-50"
      >
        {submitting ? 'Signing...' : 'Sign contract electronically'}
      </button>
    </div>
  )
}

export default QuoteContractSignPanel
