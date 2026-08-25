import React, { useState } from 'react'
import { AlertCircle, ShieldAlert, X } from 'lucide-react'

export default function InvestigateModal({ agent, isOpen, onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState('')

  if (!isOpen || !agent) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ notes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Start Investigation</h3>
              <p className="text-xs text-slate-500">{agent.name} · {agent.route}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
            Opening an investigation logs an active review signal for route <strong>{agent.route}</strong> and flags subsequent return claims handled by this courier for enhanced OTP and photographic inspection.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Investigation Reason / Note
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Return rate deviation above baseline in Central sector. Contacting route supervisor..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-inner"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Starting…' : 'Start Investigation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
