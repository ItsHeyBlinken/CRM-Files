import React, { useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import {
  AuthContext,
  AuthUser,
  ClientRegisterInput,
} from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

const persistSession = (token: string, user: AuthUser) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (!token) {
        setUser(null)
        return
      }

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch (e) {
          console.error('Error parsing saved user:', e)
        }
      }

      const response = await api.get('/auth/me')

      if (response.data) {
        setUser(response.data)
        localStorage.setItem('user', JSON.stringify(response.data))
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<AuthUser> => {
    try {
      const response = await api.post('/auth/login', { email, password })

      if (response.data.token && response.data.user) {
        persistSession(response.data.token, response.data.user)
        setUser(response.data.user)
        return response.data.user
      }

      throw new Error('Invalid response from server')
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } }
      if (err.response?.status === 429) {
        throw new Error('Too many requests. Please wait a few minutes, then try again.')
      }
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.'
      throw new Error(errorMessage)
    }
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
    company?: string,
    jobTitle?: string
  ): Promise<AuthUser> => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        phone,
        company,
        jobTitle,
      })

      if (response.data.token && response.data.user) {
        persistSession(response.data.token, response.data.user)
        setUser(response.data.user)
        return response.data.user
      }

      throw new Error('Invalid response from server')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
      throw new Error(errorMessage)
    }
  }

  const registerClient = async (input: ClientRegisterInput): Promise<AuthUser> => {
    try {
      const response = await api.post('/auth/register/client', input)

      if (response.data.token && response.data.user) {
        persistSession(response.data.token, response.data.user)
        setUser(response.data.user)
        return response.data.user
      }

      throw new Error('Invalid response from server')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.'
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const value = {
    user,
    login,
    register,
    registerClient,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
