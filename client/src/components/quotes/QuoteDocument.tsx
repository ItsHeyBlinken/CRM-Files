import React from 'react'
import type { QuoteLineItem } from '../../types/quote'
import { formatQuoteMoney } from '../../utils/formatQuoteMoney'

export interface QuoteDocumentData {
  title: string
  vendorBusinessName?: string | null
  clientName: string | null
  clientEmail?: string | null
  eventDate: string | null
  location: string | null
  notes: string | null
  currency: string
  totalAmount: number
  lineItems: QuoteLineItem[]
  expiresAt?: string | null
  statusLabel?: string | null
}

interface QuoteDocumentProps {
  quote: QuoteDocumentData
}

export const QUOTE_PRINT_AREA_ID = 'quote-print-area'

const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote }) => {
  const printedOn = new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div id={QUOTE_PRINT_AREA_ID} className="quote-print-document bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        {quote.vendorBusinessName && (
          <p className="text-sm font-medium text-gray-600">{quote.vendorBusinessName}</p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{quote.title}</h1>
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          {quote.clientName && <p>Prepared for: {quote.clientName}</p>}
          {quote.clientEmail && <p>Email: {quote.clientEmail}</p>}
          {quote.eventDate && <p>Event date: {quote.eventDate}</p>}
          {quote.location && <p>Location: {quote.location}</p>}
          {quote.statusLabel && <p>Status: {quote.statusLabel}</p>}
          {quote.expiresAt && (
            <p>
              Valid until:{' '}
              {new Date(quote.expiresAt).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-6 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium text-right">Qty</th>
            <th className="px-4 py-3 font-medium text-right">Unit cost</th>
            <th className="px-6 py-3 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {quote.lineItems.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-3 text-gray-900">{item.description}</td>
              <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
              <td className="px-4 py-3 text-right text-gray-700">
                {formatQuoteMoney(item.unitPrice, quote.currency)}
              </td>
              <td className="px-6 py-3 text-right font-medium text-gray-900">
                {formatQuoteMoney(item.amount, quote.currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200">
            <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">
              Total
            </td>
            <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">
              {formatQuoteMoney(quote.totalAmount, quote.currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      {quote.notes && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700">
          <p className="font-medium text-gray-900 mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      <p className="print-only px-6 py-3 text-xs text-gray-500 border-t border-gray-100">
        Printed {printedOn} · Save as PDF using your browser&apos;s print dialog
      </p>
    </div>
  )
}

export default QuoteDocument
