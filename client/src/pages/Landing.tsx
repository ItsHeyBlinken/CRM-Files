import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import PlatformLogo from '../components/branding/PlatformLogo'
import { APP_TAGLINE } from '../constants/branding'
import { useAuth } from '../contexts/AuthContext'
import { getHomePathForRole } from '../utils/roleRedirect'

const VENDOR_FEATURES = [
  {
    title: 'Quotes that close',
    description:
      'Send polished proposals with line items and an optional contract PDF. Clients review and accept from a simple link — no account required yet.',
    icon: 'Q',
    accent: 'from-cyan-400 to-blue-600',
  },
  {
    title: 'Contracts without the chase',
    description:
      'Attach agreements to quotes or projects. Clients read and e-sign in the browser. You get a clear record of who signed and when.',
    icon: 'C',
    accent: 'from-blue-500 to-blue-700',
  },
  {
    title: 'Invoices & deposits',
    description:
      'Set up payment plans, send deposit invoices, and accept card or Venmo/Zelle-style payments. Less back-and-forth about money.',
    icon: '$',
    accent: 'from-blue-600 to-purple-600',
  },
  {
    title: 'Calendar at a glance',
    description:
      'See booked events and tentative holds from quotes on one calendar. Know your availability before you double-book.',
    icon: 'Cal',
    accent: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'Branded client portal',
    description:
      'Your logo, colors, and tagline on a mobile-friendly portal. Clients see status and their next step — not a confusing CRM.',
    icon: 'P',
    accent: 'from-purple-500 to-purple-700',
  },
  {
    title: 'Built for solo vendors',
    description:
      'No enterprise setup marathon. Create a project, invite your client, and run the gig — without drowning in configuration.',
    icon: '1',
    accent: 'from-cyan-400 to-purple-500',
  },
] as const

const PILLARS = [
  {
    label: 'One link',
    description: 'Send clients a quote or portal link they can open on any phone — no app download.',
    accent: 'border-cyan-200 bg-cyan-50/80',
    labelClass: 'text-cyan-700',
  },
  {
    label: 'One hub',
    description: 'Contract, invoices, and status in one branded place instead of five separate emails.',
    accent: 'border-blue-200 bg-blue-50/80',
    labelClass: 'text-blue-700',
  },
  {
    label: 'One next step',
    description:
      'Your clients always see what to do next — sign, pay deposit, or check status — without calling you.',
    accent: 'border-purple-200 bg-purple-50/80',
    labelClass: 'text-purple-700',
  },
] as const

const STEPS = [
  {
    step: '1',
    title: 'Send a quote',
    description: 'Build a proposal with line items and attach your contract if you use one.',
  },
  {
    step: '2',
    title: 'Client accepts & signs',
    description: 'They open your link on their phone, accept the quote, and sign electronically.',
  },
  {
    step: '3',
    title: 'Convert to a project',
    description: 'One click turns the booking into an active project with contract and details carried over.',
  },
  {
    step: '4',
    title: 'Run it from one place',
    description: 'Invoices, portal updates, and status — your client always knows what to do next.',
  },
] as const

const STARTER_INCLUDES = [
  '1 active project',
  '3 quotes per month',
  'Branded client portal',
  'Contracts & e-sign',
  'Invoices & P2P payments',
] as const

const PRO_INCLUDES = [
  'Unlimited active projects',
  'Unlimited quotes',
  'Everything in Starter',
  'Calendar & notifications',
  'Optional Stripe card pay',
] as const

const Landing: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center marketing-page-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return (
    <div className="min-h-screen marketing-page-bg">
      <header className="sticky top-0 z-20 border-b marketing-header-border marketing-header-bg backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <PlatformLogo heightClass="h-11" />
          <nav className="flex items-center gap-2 sm:gap-4">
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 hidden sm:inline transition"
            >
              Pricing
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="marketing-cta-solid text-sm px-4 py-2 rounded-lg"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/70">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full marketing-orb-cyan blur-3xl" />
          <div className="absolute top-20 right-0 h-96 w-96 rounded-full marketing-orb-blue blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full marketing-orb-purple blur-3xl" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700 uppercase tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  For photographers, DJs, planners & event vendors
                </p>
                <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-slate-900 leading-[1.08]">
                  Run your gigs without the{' '}
                  <span className="landing-gradient-text">spreadsheet chaos</span>
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  {APP_TAGLINE}. Quotes, contracts, invoices, and a branded client portal — so you
                  spend less time in email and more time doing the work you love.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/register"
                    className="marketing-cta-solid px-8 py-3.5 text-base rounded-xl"
                  >
                    Create your vendor account
                  </Link>
                  <Link
                    to="/login"
                    className="marketing-cta-outline px-8 py-3.5 text-base rounded-xl"
                  >
                    I already have an account
                  </Link>
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  Free to start · No platform fees · No credit card
                </p>
              </div>

              <div className="relative hidden lg:block">
                <div className="landing-glow-card marketing-surface rounded-3xl p-6">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      SG
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Your branded portal</p>
                      <p className="text-xs text-slate-500">Capturing your day, beautifully.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-4 text-white">
                      <p className="text-xs font-medium opacity-80">What&apos;s next</p>
                      <p className="mt-1 font-semibold">Sign your contract</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-100 py-2 text-slate-600">Home</div>
                      <div className="rounded-lg bg-blue-50 py-2 text-blue-700 font-medium">Docs</div>
                      <div className="rounded-lg bg-slate-100 py-2 text-slate-600">Pay</div>
                    </div>
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                      <p className="text-xs text-cyan-800">Deposit invoice · $900 due</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain / pillars */}
        <section className="py-16 sm:py-20 marketing-section-muted border-b border-slate-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                You didn&apos;t start your business to live in your inbox
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Scattered quotes in PDFs, contracts lost in email threads, clients asking
                &ldquo;what&apos;s next?&rdquo; — SmoothGig replaces the patchwork with one workflow
                built for how event vendors actually book and deliver gigs.
              </p>
            </div>
            <ul className="mt-12 grid sm:grid-cols-3 gap-6">
              {PILLARS.map((pillar) => (
                <li
                  key={pillar.label}
                  className={`rounded-2xl border p-6 ${pillar.accent} backdrop-blur-sm`}
                >
                  <p className={`text-2xl font-bold ${pillar.labelClass}`}>{pillar.label}</p>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 sm:py-20 bg-stone-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
              From first quote to paid deposit
            </h2>
            <p className="mt-3 text-center text-slate-600 max-w-xl mx-auto">
              A straight path that matches how you already sell — without the learning curve of
              bloated all-in-one tools.
            </p>
            <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((item) => (
                <li
                  key={item.step}
                  className="rounded-2xl bg-white p-6 shadow-sm border border-stone-200/80 hover:shadow-md hover:border-cyan-200/80 transition"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 text-white text-sm font-bold shadow-md">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Everything you need to run the business side
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Powerful enough to replace the duct-tape stack. Simple enough that you&apos;ll actually
              use it between gigs.
            </p>
            <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VENDOR_FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="group rounded-2xl border border-stone-200 bg-stone-50 p-6 hover:-translate-y-0.5 hover:shadow-lg hover:border-transparent transition duration-200"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white text-xs font-bold shadow-md`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Client portal */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 px-8 py-12 sm:px-12 sm:py-16 text-white relative overflow-hidden shadow-lg shadow-blue-500/15">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />
              <div className="absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-purple-400/20 blur-2xl" />
              <div className="relative max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Your clients get a portal they&apos;ll actually use
                </h2>
                <p className="mt-4 text-cyan-50 leading-relaxed">
                  Clunky vendor portals kill trust. SmoothGig gives your clients a clean,
                  mobile-first experience with your branding — status on Home, documents to sign,
                  and payments in one place.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-blue-50">
                  <li className="flex gap-2">
                    <span className="text-cyan-300 shrink-0">✓</span>
                    Branded header with your logo and tagline
                  </li>
                  <li className="flex gap-2">
                    <span className="text-cyan-300 shrink-0">✓</span>
                    Clear &ldquo;what&apos;s next&rdquo; on every visit
                  </li>
                  <li className="flex gap-2">
                    <span className="text-purple-300 shrink-0">✓</span>
                    Sign contracts and pay invoices from their phone
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="py-16 sm:py-24 marketing-section-muted border-y border-slate-200/70 scroll-mt-20"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                Pricing
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                Simple plans. No platform fees.
              </h2>
              <p className="mt-3 text-slate-600">
                Start free. Upgrade when you&apos;re booking more gigs. We never take a cut of what
                your clients pay you.
              </p>
            </div>

            <ul className="mt-14 grid lg:grid-cols-3 gap-8 items-stretch">
              <li className="marketing-surface rounded-3xl p-8 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">$0</span>
                  <span className="text-slate-500">/ forever</span>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Run your first gig end-to-end — no credit card required.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-slate-600 flex-1">
                  {STARTER_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-cyan-600 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-8 block text-center marketing-cta-outline py-3 px-4 text-sm rounded-xl"
                >
                  Get started free
                </Link>
              </li>

              <li className="landing-glow-card rounded-3xl border-2 border-cyan-300 bg-gradient-to-b from-cyan-50 to-white p-8 flex flex-col relative scale-[1.02]">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-1 text-xs font-bold text-white whitespace-nowrap">
                  First 50 vendors · price locked
                </span>
                <h3 className="text-lg font-semibold text-slate-900">Founding Pro</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">$19</span>
                  <span className="text-slate-500">/ mo</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  or <strong className="text-blue-700">$199/yr</strong>
                </p>
                <p className="mt-2 text-sm text-purple-700 font-medium">
                  Your rate stays locked for as long as you subscribe.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-slate-600 flex-1">
                  {PRO_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-cyan-600 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-8 block text-center marketing-cta-solid py-3 px-4 text-sm"
                >
                  Claim founding rate
                </Link>
              </li>

              <li className="marketing-surface rounded-3xl p-8 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">$29</span>
                  <span className="text-slate-500">/ mo</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  or <strong className="text-slate-900">$299/yr</strong>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Standard pricing after founding spots are filled.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-slate-600 flex-1">
                  {PRO_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-cyan-600 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-8 block text-center marketing-cta-outline py-3 px-4 text-sm rounded-xl"
                >
                  Create account
                </Link>
              </li>
            </ul>

            <p className="mt-10 text-center text-xs sm:text-sm text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Clients never pay SmoothGig. We charge <strong className="text-slate-700">no platform fee</strong>{' '}
              on client payments. If you connect Stripe for card pay, you pay Stripe&apos;s standard
              processing rates only. Subscription billing coming soon; all features are free during
              early access.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to smooth out your next gig?
            </h2>
            <p className="mt-4 text-lg text-cyan-50">
              Join event vendors who want less admin and happier clients. Create your account and
              send your first quote today.
            </p>
            <Link
              to="/register"
              className="mt-10 inline-flex px-10 py-4 text-lg rounded-xl bg-white font-bold text-blue-700 shadow-lg hover:bg-slate-50 transition"
            >
              Get started — it&apos;s free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 marketing-page-bg py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <PlatformLogo heightClass="h-9" to={null} />
            <p className="text-xs text-slate-500">© {new Date().getFullYear()}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/login" className="hover:text-slate-900 transition">
              Log in
            </Link>
            <Link to="/register" className="hover:text-slate-900 transition">
              Vendor sign up
            </Link>
          </div>
          <p className="text-xs text-slate-500 text-center sm:text-right max-w-xs">
            Client? Use the invite link from your vendor to create your account.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
