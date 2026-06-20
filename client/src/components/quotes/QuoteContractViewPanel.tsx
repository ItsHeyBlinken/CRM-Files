import React, { useEffect, useRef, useState } from 'react'
import { fetchQuoteContractPdfBlob } from '../../services/quoteService'

interface QuoteContractViewPanelProps {
  token: string
  contractTitle: string
}

const QuoteContractViewPanel: React.FC<QuoteContractViewPanelProps> = ({
  token,
  contractTitle,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pdfUrlRef = useRef<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }

      try {
        const blob = await fetchQuoteContractPdfBlob(token)
        if (cancelled) {
          return
        }
        const url = URL.createObjectURL(blob)
        pdfUrlRef.current = url
        setPdfUrl(url)
      } catch {
        if (!cancelled) {
          setError('Could not load contract for review')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }
    }
  }, [token])

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        Loading contract...
      </div>
    )
  }

  if (error || !pdfUrl) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
        {error || 'Contract unavailable'}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      <iframe
        ref={iframeRef}
        src={pdfUrl}
        title={contractTitle}
        className="h-80 w-full bg-white"
      />
    </div>
  )
}

export default QuoteContractViewPanel
