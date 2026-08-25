import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Flag, RefreshCw } from 'lucide-react'

export default function RecentAnomaliesRail({ anomalies = [], onViewAll }) {
  const [expanded, setExpanded] = useState(false)
  const displayItems = expanded ? anomalies : anomalies.slice(0, 4)

  const getDotColor = (event_type, msg = '') => {
    if (event_type === 'FLAGGED' || msg.toLowerCase().includes('flagged')) return 'bg-rose-500'
    if (event_type === 'ANOMALY_DETECTED') return 'bg-emerald-500'
    if (event_type === 'HUMAN_SIGN_OFF') return 'bg-blue-500'
    return 'bg-amber-500'
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Recent Anomalies</h3>
        <span className="text-[11px] font-semibold text-slate-400">Live feed</span>
      </div>

      <div className="mt-4 space-y-4">
        {displayItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recent anomalies detected.</p>
        ) : (
          displayItems.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${getDotColor(
                  item.event_type,
                  item.message
                )}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 leading-snug break-words">
                  {item.message || `${item.agent_name} signal updated`}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.time_ago || 'Recently'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {anomalies.length > 3 && (
        <button
          type="button"
          onClick={() => {
            if (onViewAll) {
              onViewAll()
            } else {
              setExpanded(!expanded)
            }
          }}
          className="mt-5 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer text-center"
        >
          {expanded ? 'Show less' : 'View more'}
        </button>
      )}
    </div>
  )
}
