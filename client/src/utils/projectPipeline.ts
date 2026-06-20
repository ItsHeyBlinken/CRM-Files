import type { VendorProjectDetail } from '../types/portal'
import type { PipelineStep } from './quotePipeline'

export function getProjectPipelineSteps(detail: VendorProjectDetail): PipelineStep[] {
  const hasClient = Boolean(detail.linkedClient)
  const signedContract = detail.contracts.some((contract) => contract.acknowledgedAt)
  const depositPaid = detail.invoices.some(
    (invoice) =>
      invoice.status === 'paid' &&
      (invoice.invoiceKind === 'deposit' || invoice.isDateHoldingDeposit)
  )
  const anyPaidInvoice = detail.invoices.some((invoice) => invoice.status === 'paid')

  const bookedStatuses = ['booked', 'in_progress', 'delivered', 'complete']

  return [
    {
      key: 'client',
      label: 'Client on portal',
      state: hasClient ? 'complete' : detail.project.clientEmail ? 'current' : 'upcoming',
    },
    {
      key: 'contract',
      label: 'Contract signed',
      state: signedContract
        ? 'complete'
        : detail.contracts.length > 0
          ? 'current'
          : hasClient
            ? 'current'
            : 'upcoming',
    },
    {
      key: 'deposit',
      label: 'Deposit paid',
      state:
        depositPaid || anyPaidInvoice
          ? 'complete'
          : signedContract || hasClient
            ? 'current'
            : 'upcoming',
    },
    {
      key: 'booked',
      label: 'Event booked',
      state: bookedStatuses.includes(detail.project.status)
        ? 'complete'
        : depositPaid || anyPaidInvoice
          ? 'current'
          : 'upcoming',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      state:
        detail.project.status === 'delivered' || detail.project.status === 'complete'
          ? 'complete'
          : detail.project.status === 'in_progress'
            ? 'current'
            : 'upcoming',
    },
  ]
}
