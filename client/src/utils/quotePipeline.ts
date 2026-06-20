import type { Quote } from '../types/quote'

export type PipelineStepState = 'complete' | 'current' | 'upcoming' | 'skipped'

export interface PipelineStep {
  key: string
  label: string
  state: PipelineStepState
}

export function getQuotePipelineSteps(quote: Quote): PipelineStep[] {
  const hasContract = Boolean(quote.contract)
  const contractSigned = Boolean(quote.contract?.acknowledgedAt)
  const converted = quote.status === 'converted' || Boolean(quote.projectId)

  const steps: PipelineStep[] = [
    {
      key: 'sent',
      label: 'Quote sent',
      state:
        quote.status === 'draft'
          ? 'upcoming'
          : ['sent', 'accepted', 'converted'].includes(quote.status) ||
              quote.status === 'declined' ||
              quote.status === 'expired'
            ? 'complete'
            : 'current',
    },
    {
      key: 'accepted',
      label: 'Client accepted',
      state:
        quote.status === 'accepted' || converted
          ? 'complete'
          : quote.status === 'sent'
            ? 'current'
            : quote.status === 'declined' || quote.status === 'expired'
              ? 'skipped'
              : 'upcoming',
    },
  ]

  if (hasContract) {
    steps.push({
      key: 'contract',
      label: 'Contract signed',
      state: contractSigned ? 'complete' : quote.status === 'accepted' ? 'current' : 'upcoming',
    })
  }

  steps.push({
    key: 'converted',
    label: 'Project created',
    state: converted ? 'complete' : quote.status === 'accepted' ? 'current' : 'upcoming',
  })

  return steps
}
