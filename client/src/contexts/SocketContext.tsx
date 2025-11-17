import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Get socket URL from environment or use same origin as API
    // Remove /api suffix if present, Socket.io connects to the root
    let socketURL = window.location.origin
    if (import.meta.env.VITE_API_URL) {
      socketURL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    }

    const token = localStorage.getItem('token')
    
    // Only connect if user is authenticated
    if (!token) {
      // Disconnect existing socket if token is removed
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    // Initialize socket connection
    const newSocket = io(socketURL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      // Only log errors that aren't authentication-related (expected when not logged in)
      if (error.message && !error.message.includes('Authentication error')) {
        console.error('Socket connection error:', error)
      }
      setConnected(false)
    })

    setSocket(newSocket)

    // Cleanup on unmount or when token changes
    return () => {
      if (newSocket.connected) {
        newSocket.close()
      }
    }
  }, []) // Only run once on mount - token changes will trigger re-render via AuthContext

  const value = {
    socket,
    connected
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
