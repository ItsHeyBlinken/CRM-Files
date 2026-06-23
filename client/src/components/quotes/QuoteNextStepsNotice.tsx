import React from 'react'

type QuoteNextStepsNoticeProps = {
  headline: string
  steps: readonly string[]
  tone?: 'amber' | 'indigo'
}

const toneClasses = {
  amber: {
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    headline: 'text-amber-900',
    step: 'text-amber-900',
  },
  indigo: {
    container: 'border-indigo-200 bg-indigo-50 text-indigo-950',
    headline: 'text-indigo-900',
    step: 'text-indigo-900',
  },
} as const

const QuoteNextStepsNotice: React.FC<QuoteNextStepsNoticeProps> = ({
  headline,
  steps,
  tone = 'amber',
}) => {
  const classes = toneClasses[tone]

  return (
    <div className={`rounded-lg border p-4 text-sm ${classes.container}`}>
      <p className={`font-medium ${classes.headline}`}>{headline}</p>
      <ol className="mt-3 list-decimal list-inside space-y-2">
        {steps.map((step) => (
          <li key={step} className={classes.step}>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

export default QuoteNextStepsNotice
