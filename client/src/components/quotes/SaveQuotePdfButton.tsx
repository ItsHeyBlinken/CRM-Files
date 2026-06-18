import React from 'react'
import { printQuoteDocument } from '../../utils/quotePrint'

interface SaveQuotePdfButtonProps {
  quoteTitle: string
  className?: string
}

const SaveQuotePdfButton: React.FC<SaveQuotePdfButtonProps> = ({
  quoteTitle,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={() => printQuoteDocument(quoteTitle)}
      className={
        className ||
        'px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
      }
    >
      Save as PDF
    </button>
  )
}

export default SaveQuotePdfButton
