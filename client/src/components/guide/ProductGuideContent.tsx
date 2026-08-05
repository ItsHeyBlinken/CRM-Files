import React from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../../constants/branding'
import {
  GUIDE_FEATURES,
  GUIDE_TIPS,
  GUIDE_WORKFLOW_STEPS,
} from '../../constants/vendorGuide'

export type ProductGuideMode = 'public' | 'vendor'

type ProductGuideContentProps = {
  mode: ProductGuideMode
  onFinishGuide?: () => void
}

const ProductGuideContent: React.FC<ProductGuideContentProps> = ({ mode, onFinishGuide }) => {
  const isPublic = mode === 'public'

  return (
    <div className="space-y-8">
      <section
        className={
          isPublic
            ? 'rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-6 sm:p-8 text-white'
            : 'vendor-hero-banner'
        }
      >
        <p className="text-sm font-medium text-white/80 uppercase tracking-wide">
          How {APP_NAME} works
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-2">Your workflow, start to finish</h1>
        <p className="mt-3 text-sm text-white/90 max-w-xl">{APP_TAGLINE}</p>
        <p className="mt-2 text-sm text-white/75">
          Built for event vendors — weddings, corporate, private parties, and more. No CRM jargon.
        </p>
      </section>

      <section
        className={
          isPublic
            ? 'landing-glow-card marketing-surface rounded-2xl p-6 space-y-6'
            : 'vendor-card p-6 space-y-6'
        }
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">The client flow</h2>
          <p className="text-sm text-slate-600 mt-1">
            Six steps from first message to delivery. You can jump in anywhere, but this is the
            happy path most vendors follow.
          </p>
        </div>

        <ol className="space-y-4">
          {GUIDE_WORKFLOW_STEPS.map((item) => (
            <li
              key={item.step}
              className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-sm font-semibold text-white">
                {item.step}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                {isPublic ? (
                  <Link
                    to="/register"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-block mt-2"
                  >
                    Sign up to try →
                  </Link>
                ) : (
                  <Link to={item.to} className="text-sm vendor-link inline-block mt-2">
                    {item.cta} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={
          isPublic
            ? 'landing-glow-card marketing-surface rounded-2xl p-6 space-y-4'
            : 'vendor-card p-6 space-y-4'
        }
      >
        <h2 className="text-lg font-semibold text-slate-900">Features at a glance</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {GUIDE_FEATURES.map((feature) =>
            isPublic ? (
              <div key={feature.title} className="rounded-xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{feature.title}</p>
                <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
              </div>
            ) : (
              <Link
                key={feature.title}
                to={feature.to}
                className="rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/30 transition"
              >
                <p className="font-medium text-slate-900">{feature.title}</p>
                <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
                <p className="text-xs vendor-link mt-2">{feature.label} →</p>
              </Link>
            )
          )}
        </div>
      </section>

      <section
        className={
          isPublic
            ? 'landing-glow-card marketing-surface rounded-2xl p-6 space-y-3'
            : 'vendor-card p-6 space-y-3'
        }
      >
        <h2 className="text-lg font-semibold text-slate-900">Quick tips</h2>
        <ul className="space-y-2">
          {GUIDE_TIPS.map((tip) => (
            <li key={tip} className="text-sm text-slate-600 flex gap-2">
              <span className="text-cyan-600 shrink-0">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className={
          isPublic
            ? 'landing-glow-card marketing-surface rounded-2xl p-6 space-y-4'
            : 'vendor-card p-6 space-y-4'
        }
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {isPublic ? 'Ready to get started?' : 'Ready to go?'}
        </h2>
        <p className="text-sm text-slate-600">
          {isPublic
            ? 'Create a free vendor account and send your first quote in minutes.'
            : 'Start with an inquiry or a quote — whichever matches where you are today.'}
        </p>
        <div className="flex flex-wrap gap-3">
          {isPublic ? (
            <>
              <Link to="/register" className="marketing-cta-solid px-6 py-2.5 rounded-lg text-sm">
                Create your account
              </Link>
              <Link to="/login" className="marketing-cta-outline px-6 py-2.5 rounded-lg text-sm">
                Log in
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard/inquiries" className="vendor-btn-primary">
                Add an inquiry
              </Link>
              <Link to="/dashboard/quotes" className="vendor-btn-outline">
                Create a quote
              </Link>
              <button type="button" onClick={onFinishGuide} className="vendor-btn-outline">
                Go to dashboard
              </button>
            </>
          )}
        </div>
        {!isPublic && (
          <p className="text-xs text-slate-500">
            You can reopen this guide anytime from Home →{' '}
            <Link to="/dashboard/guide" className="vendor-link">
              How it works
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  )
}

export default ProductGuideContent
