import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  acknowledgeContract,
  fetchContractPdfBlob,
  fetchContractSigningContext,
  type ContractSigningContext,
} from '../../services/contractService'

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

interface ContractSignPanelProps {
  contractId: number
  contractTitle: string
  accentColor: string
  onSigned: (contractTitle: string) => Promise<void>
}

const ContractSignPanel: React.FC<ContractSignPanelProps> = ({
  contractId,
  contractTitle,
  accentColor,
  onSigned,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const viewStartedAtRef = useRef<number | null>(null)
  const pdfUrlRef = useRef<string | null>(null)

  const [context, setContext] = useState<ContractSigningContext | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfReady, setPdfReady] = useState(false)
  const [viewSeconds, setViewSeconds] = useState(0)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [legalNameOverride, setLegalNameOverride] = useState('')
  const [useDifferentLegalName, setUseDifferentLegalName] = useState(false)
  const [confirmLegalName, setConfirmLegalName] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const minViewSeconds = context?.minViewSeconds ?? 15
  const reviewComplete = scrolledToEnd || viewSeconds >= minViewSeconds

  const effectiveLegalName = useDifferentLegalName
    ? legalNameOverride.trim()
    : (context?.accountLegalName ?? '').trim()

  const nameMismatch =
    useDifferentLegalName &&
    !!context &&
    effectiveLegalName.length > 0 &&
    normalizeName(effectiveLegalName) !== normalizeName(context.accountLegalName)

  const canSubmit =
    !!context &&
    pdfReady &&
    reviewComplete &&
    effectiveLegalName.length >= 2 &&
    consentAccepted &&
    (!nameMismatch || confirmLegalName)

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
      setPdfUrl(null)
      setViewSeconds(0)
      setScrolledToEnd(false)
      setConsentAccepted(false)
      setConfirmLegalName(false)
      setUseDifferentLegalName(false)
      setLegalNameOverride('')
      viewStartedAtRef.current = null

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }

      try {
        const [signingContext, blob] = await Promise.all([
          fetchContractSigningContext(contractId),
          fetchContractPdfBlob(contractId),
        ])

        if (cancelled) {
          return
        }

        setContext(signingContext)

        const url = URL.createObjectURL(blob)
        pdfUrlRef.current = url
        setPdfUrl(url)
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
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }
    }
  }, [contractId])

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
      await acknowledgeContract(contractId, {
        legalName: effectiveLegalName,
        pdfHash: context.pdfHash,
        viewDurationSeconds: viewSeconds,
        scrolledToEnd,
        consentAccepted: true,
        confirmLegalName: nameMismatch ? confirmLegalName : undefined,
      })
      await onSigned(contractTitle)
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
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
        Loading contract for review...
      </div>
    )
  }

  if (!context) {
    return (
      <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
        {error || 'Contract unavailable'}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Review contract</p>
        <p className="mt-1 text-xs text-gray-500">
          Read the full document below. Signing unlocks after you scroll to the end or review for{' '}
          {minViewSeconds} seconds.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <iframe
          ref={iframeRef}
          src={pdfUrl ?? undefined}
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
        <p className="block text-sm font-medium text-gray-900">Full legal name</p>
        {!useDifferentLegalName ? (
          <>
            <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
              {context.accountLegalName || 'Name on your account'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Taken from your portal account — no need to retype it.
            </p>
            {reviewComplete && (
              <button
                type="button"
                onClick={() => {
                  setUseDifferentLegalName(true)
                  setLegalNameOverride(context.accountLegalName)
                }}
                className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Use a different legal name
              </button>
            )}
          </>
        ) : (
          <>
            <input
              id={`legal-name-${contractId}`}
              type="text"
              value={legalNameOverride}
              onChange={(e) => {
                setLegalNameOverride(e.target.value)
                setConfirmLegalName(false)
              }}
              disabled={!reviewComplete}
              placeholder="Your full legal name"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={() => {
                setUseDifferentLegalName(false)
                setLegalNameOverride('')
                setConfirmLegalName(false)
              }}
              className="mt-2 text-xs font-medium text-gray-600 hover:text-indigo-600"
            >
              Use account name instead
            </button>
            {nameMismatch && (
              <label className="mt-3 flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={confirmLegalName}
                  onChange={(e) => setConfirmLegalName(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300"
                />
                <span>
                  I confirm that <strong>{effectiveLegalName}</strong> is my full legal name, even
                  though it differs from my portal account name ({context.accountLegalName}).
                </span>
              </label>
            )}
          </>
        )}
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

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full rounded-xl py-3 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {submitting ? 'Signing...' : 'Sign contract electronically'}
      </button>
    </div>
  )
}

export default ContractSignPanel
