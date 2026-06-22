import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import AppName from '../components/branding/AppName'
import { APP_TAGLINE } from '../constants/branding'
import { useAuth } from '../contexts/AuthContext'
import { getHomePathForRole } from '../utils/roleRedirect'

const VENDOR_FEATURES = [
  {
    title: 'Quotes that close',
    description:
      'Send polished proposals with line items and an optional contract PDF. Clients review and accept from a simple link — no account required yet.',
  },
  {
    title: 'Contracts without the chase',
    description:
      'Attach agreements to quotes or projects. Clients read and e-sign in the browser. You get a clear record of who signed and when.',
  },
  {
    title: 'Invoices & deposits',
    description:
      'Set up payment plans, send deposit invoices, and accept card or Venmo/Zelle-style payments. Less back-and-forth about money.',
  },
  {
    title: 'Calendar at a glance',
    description:
      'See booked events and tentative holds from quotes on one calendar. Know your availability before you double-book.',
  },
  {
    title: 'Branded client portal',
    description:
      'Your logo, colors, and tagline on a mobile-friendly portal. Clients see status and their next step — not a confusing CRM.',
  },
  {
    title: 'Built for solo vendors',
    description:
      'No enterprise setup marathon. Create a project, invite your client, and run the gig — without drowning in configuration.',
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

const Landing: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <AppName accentClassName="text-indigo-600" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-slate-50" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                For photographers, DJs, planners & event vendors
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                Run your gigs without the{' '}
                <span className="text-indigo-600">spreadsheet chaos</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                {APP_TAGLINE}. SmoothGig gives you quotes, contracts, invoices, and a branded
                client portal — so you spend less time in email and more time doing the work you
                love.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition"
                >
                  Create your vendor account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-300 rounded-xl transition"
                >
                  I already have an account
                </Link>
              </div>
              <p className="mt-6 text-sm text-gray-500">
                Free to start · No credit card · Set up in minutes
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                You didn&apos;t start your business to live in your inbox
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Scattered quotes in PDFs, contracts lost in email threads, clients asking
                &ldquo;what&apos;s next?&rdquo; — sound familiar? SmoothGig replaces the patchwork
                with one workflow built for how event vendors actually book and deliver gigs.
              </p>
            </div>
            <ul className="mt-12 grid sm:grid-cols-3 gap-8">
              <li className="rounded-2xl bg-slate-50 p-6 border border-gray-100">
                <p className="text-3xl font-bold text-indigo-600">One link</p>
                <p className="mt-2 text-sm text-gray-600">
                  Send clients a quote or portal link they can open on any phone — no app download.
                </p>
              </li>
              <li className="rounded-2xl bg-slate-50 p-6 border border-gray-100">
                <p className="text-3xl font-bold text-indigo-600">One hub</p>
                <p className="mt-2 text-sm text-gray-600">
                  Contract, invoices, and status in one branded place instead of five separate
                  emails.
                </p>
              </li>
              <li className="rounded-2xl bg-slate-50 p-6 border border-gray-100">
                <p className="text-3xl font-bold text-indigo-600">One next step</p>
                <p className="mt-2 text-sm text-gray-600">
                  Your clients always see what to do next — sign, pay deposit, or check status —
                  without calling you.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900">
              From first quote to paid deposit
            </h2>
            <p className="mt-3 text-center text-gray-600 max-w-xl mx-auto">
              A straight path that matches how you already sell — without the learning curve of
              bloated all-in-one tools.
            </p>
            <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((item) => (
                <li key={item.step} className="relative">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Everything you need to run the business side
            </h2>
            <p className="mt-3 text-gray-600 max-w-2xl">
              Powerful enough to replace the duct-tape stack. Simple enough that you&apos;ll actually
              use it between gigs.
            </p>
            <ul className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VENDOR_FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 bg-slate-50/50 p-6 hover:border-indigo-200 hover:shadow-sm transition"
                >
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-12 sm:px-12 sm:py-16 text-white">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Your clients get a portal they&apos;ll actually use
                </h2>
                <p className="mt-4 text-indigo-100 leading-relaxed">
                  Clunky vendor portals kill trust. SmoothGig gives your clients a clean,
                  mobile-first experience with your branding — status on Home, documents to sign,
                  and payments in one place. They&apos;ll stop texting &ldquo;did you get my
                  deposit?&rdquo; because the answer is right there.
                </p>
                <ul className="mt-8 space-y-3 text-sm text-indigo-50">
                  <li className="flex gap-2">
                    <span className="text-indigo-200 shrink-0">✓</span>
                    Branded header with your logo and tagline
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-200 shrink-0">✓</span>
                    Clear &ldquo;what&apos;s next&rdquo; on every visit
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-200 shrink-0">✓</span>
                    Sign contracts and pay invoices from their phone
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Ready to smooth out your next gig?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join event vendors who want less admin and happier clients. Create your account and
              send your first quote today.
            </p>
            <Link
              to="/register"
              className="mt-10 inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              Get started — it&apos;s free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-slate-50 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()}{' '}
            <AppName accentClassName="text-indigo-600" />
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/login" className="hover:text-indigo-600">
              Log in
            </Link>
            <Link to="/register" className="hover:text-indigo-600">
              Vendor sign up
            </Link>
          </div>
          <p className="text-xs text-gray-400 text-center sm:text-right max-w-xs">
            Client? Use the invite link from your vendor to create your account.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
