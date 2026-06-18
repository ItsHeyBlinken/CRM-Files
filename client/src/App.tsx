import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'

import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import HomeRedirect from './components/Auth/HomeRedirect'

import VendorDashboard from './pages/VendorDashboard'
import ClientPortal from './pages/ClientPortal'
import Login from './pages/Login'
import Register from './pages/Register'
import AcceptInvite from './pages/AcceptInvite'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminSettings from './pages/Admin/AdminSettings'
import NotFound from './pages/NotFound'

// Legacy CRM pages (to be removed)
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Deals from './pages/Deals'
import DealDetail from './pages/DealDetail'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/TaskDetail'
import Activities from './pages/Activities'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />

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

          {/* Legacy CRM routes — archived until removed */}
          <Route
            path="/legacy"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="deals" element={<Deals />} />
            <Route path="deals/:id" element={<DealDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="activities" element={<Activities />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
