import { useEffect, useState } from 'react'
import { api } from '../mock/api'
import { formatDateTime } from '../lib/format'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    api.getNotifications().then(setNotifications)
  }, [])

  const unread = notifications.filter((n) => !n.read).length

  const markRead = async () => {
    const updated = await api.markNotificationsRead()
    setNotifications(updated)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Notifications
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markRead} className="text-xs font-semibold text-indigo-600">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`rounded-lg px-3 py-2.5 ${notification.read ? '' : 'bg-indigo-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">{notification.channel}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{notification.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(notification.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
