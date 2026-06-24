import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useSocket } from '../../contexts/SocketContext'
import {
  fetchVendorNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/vendorExtrasService'
import type { VendorNotification } from '../../types/vendorExtras'
import { formatUsDateTime } from '../../utils/calendarHelpers'

const VendorNotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<VendorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchVendorNotifications()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      /* optional */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!socket) {
      return
    }

    const handleNotification = (payload: {
      notification: VendorNotification
      unreadCount: number
    }) => {
      setNotifications((prev) => [payload.notification, ...prev].slice(0, 20))
      setUnreadCount(payload.unreadCount)
      toast(payload.notification.title, { icon: '🔔' })
    }

    socket.on('vendor:notification', handleNotification)
    return () => {
      socket.off('vendor:notification', handleNotification)
    }
  }, [socket])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleOpenNotification = async (notification: VendorNotification) => {
    if (!notification.readAt) {
      const result = await markNotificationRead(notification.id)
      setUnreadCount(result.unreadCount)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )
      )
    }

    setOpen(false)
    if (notification.linkPath) {
      navigate(notification.linkPath)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setUnreadCount(0)
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-xs vendor-link"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-sm text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">You&apos;re all caught up.</p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id} className="border-b border-gray-50 last:border-0">
                    <button
                      type="button"
                      onClick={() => void handleOpenNotification(notification)}
                      className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${
                        notification.readAt ? 'opacity-70' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      {notification.body && (
                        <p className="mt-1 text-xs text-gray-600">{notification.body}</p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatUsDateTime(notification.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-gray-100 px-4 py-2">
            <Link to="/dashboard" className="text-xs vendor-link">
              View dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorNotificationBell
