import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { formatDateTime } from '../lib/format'
import { Bell, ArrowRight } from 'lucide-react'

export default function NotificationBell() {
  const { shopper } = useApp()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  const loadNotifs = async () => {
    try {
      const data = await api.getNotifications(shopper?.id)
      setNotifications(data || [])
    } catch {
      // fallback
    }
  }

  useEffect(() => {
    loadNotifs()
  }, [shopper])

  const unread = notifications.filter((n) => !n.read).length

  const markRead = async () => {
    const updated = await api.markNotificationsRead(shopper?.id)
    setNotifications(updated || [])
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
        title="View Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-84 rounded-2xl border border-slate-200 bg-white shadow-2xl p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Notifications {unread > 0 && `(${unread} new)`}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markRead}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">No notifications yet.</p>
            ) : (
              notifications.slice(0, 6).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 transition-colors ${
                    notification.read ? 'hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 truncate pr-2">{notification.title}</p>
                    <span className="text-[9px] font-bold uppercase text-slate-400 font-mono">
                      {notification.channel || 'in_app'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-600 leading-snug">{notification.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(notification.created_at)}</p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1"
            >
              <span>View All Notifications Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
