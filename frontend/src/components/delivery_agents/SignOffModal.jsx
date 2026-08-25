import React, { useState } from 'react'
import { CheckCircle2, ShieldCheck, X } from 'lucide-react'

export default function SignOffModal({ agent, isOpen, onClose, onConfirm, loading }) {
  const [notes, setNotes] = useState('')
  const [riskLevel, setRiskLevel] = useState('LOW')

  if (!isOpen || !agent) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ notes, risk_level: riskLevel })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Human Review & Sign-Off</h3>
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
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between font-semibold">
              <span>Actual Return Rate:</span>
              <span className="font-bold text-slate-900 font-mono-num">{agent.return_rate}%</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Expected Route Baseline:</span>
              <span className="font-mono-num">{agent.expected_return_rate}%</span>
            </div>
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Anomaly Gap:</span>
              <span className="font-mono-num font-bold">
                {agent.anomaly_gap > 0 ? `+${agent.anomaly_gap}%` : `${agent.anomaly_gap}%`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Adjusted Post-Review Risk Level
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
            >
              <option value="LOW">Low Risk (Resolved / Normal Operations)</option>
              <option value="MEDIUM">Medium Risk (Continued Route Monitoring)</option>
              <option value="HIGH">High Risk (Escalate to Logistics Partner)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Human Sign-off Remarks
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reviewed high return cluster in Mumbai West. Confirmed genuine rain damaged consignments. Reclassified to normal."
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
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Confirm & Sign-Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
