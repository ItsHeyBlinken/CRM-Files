import React from 'react'
import { Link } from 'react-router-dom'
import PlatformLogo from '../components/branding/PlatformLogo'
import ProductGuideContent from '../components/guide/ProductGuideContent'
import { useAuth } from '../contexts/AuthContext'
import { getHomePathForRole } from '../utils/roleRedirect'

const HowItWorks: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const dashboardPath = user ? getHomePathForRole(user.role) : '/dashboard'

  return (
    <div className="min-h-screen marketing-page-bg">
      <header className="sticky top-0 z-20 border-b marketing-header-border marketing-header-bg backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <PlatformLogo heightClass="h-11" />
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition hidden sm:inline"
            >
              Home
            </Link>
            {isAuthenticated && user ? (
              <Link
                to={dashboardPath}
                className="marketing-cta-solid text-sm px-4 py-2 rounded-lg"
              >
                Open dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <ProductGuideContent mode="public" />
      </main>

      <footer className="border-t border-slate-200 marketing-page-bg py-10 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <PlatformLogo heightClass="h-9" to={null} />
            <p className="text-xs text-slate-500">© {new Date().getFullYear()}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/" className="hover:text-slate-900 transition">
              Home
            </Link>
            <Link to="/login" className="hover:text-slate-900 transition">
              Log in
            </Link>
            <Link to="/register" className="hover:text-slate-900 transition">
              Vendor sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HowItWorks
