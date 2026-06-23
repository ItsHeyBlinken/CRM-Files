import React from 'react'
import { Link } from 'react-router-dom'
import PlatformLogo from '../branding/PlatformLogo'

type MarketingAuthLayoutProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  footnote?: React.ReactNode
  maxWidth?: 'md' | 'lg'
  children: React.ReactNode
}

const maxWidthClass = {
  md: 'max-w-md',
  lg: 'max-w-lg',
} as const

const MarketingAuthLayout: React.FC<MarketingAuthLayoutProps> = ({
  title,
  subtitle,
  footnote,
  maxWidth = 'md',
  children,
}) => {
  return (
    <div className="min-h-screen marketing-page-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full marketing-orb-cyan blur-3xl" />
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full marketing-orb-blue blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full marketing-orb-purple blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b marketing-header-border marketing-header-bg backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <PlatformLogo heightClass="h-11" />
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="relative flex items-center justify-center px-4 py-12 sm:py-16">
        <div className={`w-full ${maxWidthClass[maxWidth]}`}>
          <div className="landing-glow-card marketing-surface rounded-3xl p-8 sm:p-10">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
              {subtitle && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{subtitle}</p>
              )}
              {footnote && (
                <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{footnote}</p>
              )}
            </div>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MarketingAuthLayout
