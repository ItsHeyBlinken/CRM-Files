import React from 'react'
import type { QuoteLineItem } from '../../types/quote'
import { formatQuoteMoney } from '../../utils/formatQuoteMoney'
import { formatUsDateKey } from '../../utils/calendarHelpers'

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

const cellPad = 'px-4 sm:px-6'
const headPad = 'px-3 sm:px-4'

const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote }) => {
  const printedOn = new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div id={QUOTE_PRINT_AREA_ID} className="quote-print-document bg-white rounded-lg shadow">
      <div className={`${cellPad} py-5 border-b border-gray-200`}>
        {quote.vendorBusinessName && (
          <p className="text-sm font-medium text-gray-600">{quote.vendorBusinessName}</p>
        )}
        <h1 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 break-words">{quote.title}</h1>
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          {quote.clientName && <p>Prepared for: {quote.clientName}</p>}
          {quote.clientEmail && <p className="break-all">Email: {quote.clientEmail}</p>}
          {quote.eventDate && <p>Event date: {formatUsDateKey(quote.eventDate)}</p>}
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

      {/* Mobile: stacked line items (hidden when printing) */}
      <div className="sm:hidden print:hidden divide-y divide-gray-100">
        {quote.lineItems.map((item) => (
          <div key={item.id} className={`${cellPad} py-4`}>
            <p className="font-medium text-gray-900 break-words">{item.description}</p>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Qty</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{item.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">Unit</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {formatQuoteMoney(item.unitPrice, quote.currency)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs uppercase tracking-wide text-gray-500">Amount</dt>
                <dd className="mt-0.5 font-semibold text-gray-900">
                  {formatQuoteMoney(item.amount, quote.currency)}
                </dd>
              </div>
            </dl>
          </div>
        ))}
        <div className={`${cellPad} py-4 flex items-center justify-between bg-gray-50`}>
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {formatQuoteMoney(quote.totalAmount, quote.currency)}
          </span>
        </div>
      </div>

      {/* Desktop + print: table layout */}
      <div className="hidden sm:block print:block overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className={`${cellPad} py-3 font-medium`}>Description</th>
              <th className={`${headPad} py-3 font-medium text-right whitespace-nowrap`}>Qty</th>
              <th className={`${headPad} py-3 font-medium text-right whitespace-nowrap`}>Unit cost</th>
              <th className={`${cellPad} py-3 font-medium text-right whitespace-nowrap`}>Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quote.lineItems.map((item) => (
              <tr key={item.id}>
                <td className={`${cellPad} py-3 text-gray-900 break-words`}>{item.description}</td>
                <td className={`${headPad} py-3 text-right text-gray-700 whitespace-nowrap`}>
                  {item.quantity}
                </td>
                <td className={`${headPad} py-3 text-right text-gray-700 whitespace-nowrap`}>
                  {formatQuoteMoney(item.unitPrice, quote.currency)}
                </td>
                <td className={`${cellPad} py-3 text-right font-medium text-gray-900 whitespace-nowrap`}>
                  {formatQuoteMoney(item.amount, quote.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className={`${cellPad} py-4 text-right font-semibold text-gray-900`}>
                Total
              </td>
              <td className={`${cellPad} py-4 text-right text-lg font-bold text-gray-900 whitespace-nowrap`}>
                {formatQuoteMoney(quote.totalAmount, quote.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {quote.notes && (
        <div className={`${cellPad} py-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-700`}>
          <p className="font-medium text-gray-900 mb-1">Notes</p>
          <p className="whitespace-pre-wrap break-words">{quote.notes}</p>
        </div>
      )}

      <p className={`print-only ${cellPad} py-3 text-xs text-gray-500 border-t border-gray-100`}>
        Printed {printedOn} · Save as PDF using your browser&apos;s print dialog
      </p>
    </div>
  )
}

export default QuoteDocument
