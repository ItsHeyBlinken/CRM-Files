import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import VendorDashboardHeader from '../components/vendor/VendorDashboardHeader'
import ProductGuideContent from '../components/guide/ProductGuideContent'
import { VENDOR_GUIDE_STORAGE_KEY } from '../constants/vendorGuide'

const VendorGuide: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const finishGuide = () => {
    try {
      localStorage.setItem(VENDOR_GUIDE_STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    navigate('/dashboard')
  }

  return (
    <div>
      <VendorDashboardHeader
        active="projects"
        userEmail={user?.email}
        onLogout={() => logout()}
      />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <ProductGuideContent mode="vendor" onFinishGuide={finishGuide} />
      </main>
    </div>
  )
}

export default VendorGuide
