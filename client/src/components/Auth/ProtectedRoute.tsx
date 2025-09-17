import React, { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // For development/testing purposes, allow access without authentication
  // Remove this in production
  if (!isAuthenticated) {
    // Set a mock user for development
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    }
    
    // You can uncomment the line below to require authentication
    // return <Navigate to="/login" replace />
    
    // For now, allow access with mock user
    return <>{children}</>
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
