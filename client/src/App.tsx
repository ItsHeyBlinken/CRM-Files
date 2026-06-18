import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'

import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import HomeRedirect from './components/Auth/HomeRedirect'

import VendorDashboard from './pages/VendorDashboard'
import VendorProjectDetail from './pages/VendorProjectDetail'
import VendorQuotes from './pages/VendorQuotes'
import VendorQuoteDetail from './pages/VendorQuoteDetail'
import ClientPortal from './pages/ClientPortal'
import Login from './pages/Login'
import Register from './pages/Register'
import AcceptInvite from './pages/AcceptInvite'
import AcceptQuote from './pages/AcceptQuote'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminSettings from './pages/Admin/AdminSettings'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/quote/:token" element={<AcceptQuote />} />

          <Route path="/" element={<HomeRedirect />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="VENDOR">
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/projects/:id"
            element={
              <ProtectedRoute requiredRole="VENDOR">
                <VendorProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/quotes"
            element={
              <ProtectedRoute requiredRole="VENDOR">
                <VendorQuotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/quotes/:id"
            element={
              <ProtectedRoute requiredRole="VENDOR">
                <VendorQuoteDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientPortal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
