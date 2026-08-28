import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { formatDateTime } from '../lib/format'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Package,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Trash2,
  MailOpen,
  Info,
} from 'lucide-react'

export default function NotificationsPage() {
  const { shopper } = useApp()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread' | 'returns' | 'orders'

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await api.getNotifications(shopper?.id)
      setNotifications(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [shopper])

  const handleMarkAllRead = async () => {
    try {
      const updated = await api.markNotificationsRead(shopper?.id)
      setNotifications(updated || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkSingleRead = async (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    if (filter === 'returns') return n.type?.includes('return') || n.title?.toLowerCase().includes('return')
    if (filter === 'orders') return n.type?.includes('order') || n.title?.toLowerCase().includes('order')
    return true
  })

  const getNotifIcon = (notif) => {
    const type = notif.type || ''
    const title = (notif.title || '').toLowerCase()

    if (type.includes('approved') || title.includes('approved')) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    }
    if (type.includes('rejected') || title.includes('rejected') || title.includes('restricted')) {
      return <ShieldAlert className="h-5 w-5 text-rose-600" />
    }
    if (type.includes('hold') || title.includes('hold') || title.includes('review') || title.includes('verification')) {
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    }
    if (type.includes('order') || title.includes('order')) {
      return <Package className="h-5 w-5 text-indigo-600" />
    }
    if (type.includes('return') || title.includes('return')) {
      return <RotateCcw className="h-5 w-5 text-purple-600" />
    }
    return <Info className="h-5 w-5 text-blue-600" />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-2xs">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Notifications & Updates
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500 text-white px-2.5 py-0.5 text-xs font-black">
                    {unreadCount} New
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live notifications regarding your orders, returns, verification status, and alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-colors shadow-2xs cursor-pointer"
            >
              <MailOpen className="h-3.5 w-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadNotifications}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Notifications', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'returns', label: 'Returns & Verification' },
          { id: 'orders', label: 'Orders & Deliveries' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filter === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-2xl">
            📭
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Notifications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up! Updates regarding your return requests, approvals, and order tracking will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((item) => {
              const isUnread = !item.read

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleMarkSingleRead(item.id)}
                  className={`group relative rounded-2xl border p-4 transition-all shadow-2xs hover:shadow-md cursor-pointer ${
                    isUnread
                      ? 'bg-gradient-to-r from-indigo-50/60 via-white to-white border-indigo-200 ring-1 ring-indigo-400/20'
                      : 'bg-white border-slate-200/80 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                      {getNotifIcon(item)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          {item.title}
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                          )}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-400 font-mono whitespace-nowrap">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {item.body}
                      </p>

                      {/* Action Links */}
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Channel: {item.channel || 'in_app'}
                        </span>

                        <div className="flex items-center gap-2">
                          {(item.title?.toLowerCase().includes('return') || item.body?.toLowerCase().includes('return')) && (
                            <Link
                              to="/orders"
                              className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                            >
                              <span>View My Orders & Returns</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
