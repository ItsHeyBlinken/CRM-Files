/**
 * API Service
 * 
 * Centralized API client using Axios with request/response interceptors
 * for authentication, error handling, and token management.
 * 
 * Features:
 * - Base URL configuration
 * - JWT token management
 * - Request/response interceptors
 * - Error handling
 * - Automatic token refresh (future)
 * 
 * @author Event Planner CRM Team
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

// Get API URL from environment or use relative path
// Since frontend and backend are served from same domain in production, use relative /api
// VITE_API_URL is only needed if frontend is on different domain than backend
const apiBaseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
})

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('token')
    
    // Add token to Authorization header if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

