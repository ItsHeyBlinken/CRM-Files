import React from 'react'
import {
  CLIENT_AGREEMENT_FOOTNOTE,
  CLIENT_AGREEMENT_HEADLINE,
  CLIENT_AGREEMENT_REQUIREMENTS,
} from '../../constants/clientAgreement'

interface QuoteClientAgreementNoticeProps {
  variant?: 'vendor' | 'client'
}

const QuoteClientAgreementNotice: React.FC<QuoteClientAgreementNoticeProps> = ({
  variant = 'vendor',
}) => {
  const isVendor = variant === 'vendor'

  return (
    <div
      className={
        isVendor
          ? 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950'
          : 'rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700'
      }
    >
      <p className="font-medium text-gray-900">{CLIENT_AGREEMENT_HEADLINE}</p>
      <ol className="mt-2 list-decimal list-inside space-y-1">
        {CLIENT_AGREEMENT_REQUIREMENTS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <p className="mt-2 text-gray-600">{CLIENT_AGREEMENT_FOOTNOTE}</p>
      {isVendor && (
        <p className="mt-2 text-amber-900">
          Industry practice: send the quote and contract together so clients can review both before
          accepting. Use the optional contract attachment when creating a quote.
        </p>
      )}
    </div>
  )
}

export default QuoteClientAgreementNotice
