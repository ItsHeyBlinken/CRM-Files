import React from 'react'
import type { PipelineStep } from '../../utils/quotePipeline'

interface PipelineStepperProps {
  steps: PipelineStep[]
  title?: string
}

const PipelineStepper: React.FC<PipelineStepperProps> = ({ steps, title = 'Progress' }) => {
  return (
    <section className="vendor-card p-5">
      <h2 className="text-sm font-medium text-slate-900">{title}</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => {
          const isComplete = step.state === 'complete'
          const isCurrent = step.state === 'current'
          const isSkipped = step.state === 'skipped'

          return (
            <li
              key={step.key}
              className={`rounded-xl border px-4 py-3 ${
                isCurrent
                  ? 'border-blue-300 bg-blue-50/80'
                  : isComplete
                    ? 'border-green-200 bg-green-50'
                    : isSkipped
                      ? 'border-slate-200 bg-slate-50 opacity-70'
                      : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isComplete
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-500 capitalize">{step.state.replace('_', ' ')}</p>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default PipelineStepper
