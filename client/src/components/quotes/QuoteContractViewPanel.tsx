import React, { useState } from 'react'
import { getPublicQuoteContractUrl } from '../../services/quoteService'

interface QuoteContractViewPanelProps {
  token: string
  contractTitle: string
}

const QuoteContractViewPanel: React.FC<QuoteContractViewPanelProps> = ({
  token,
  contractTitle,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pdfUrl = getPublicQuoteContractUrl(token)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {loading && !error && (
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Loading contract...</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}
      <iframe
        src={pdfUrl}
        title={contractTitle}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError('Could not load contract for review')
        }}
        className={`h-80 w-full bg-white ${loading || error ? 'hidden' : ''}`}
      />
    </div>
  )
}

export default QuoteContractViewPanel
