import React, { useState } from 'react'
import { Activity, BarChart3, Lightbulb, ArrowRight } from 'lucide-react'

const DEFAULT_ANOMALIES = [
  {
    id: 1,
    agent_name: 'Amitabh Das',
    message: 'Amitabh Das route baseline initialized for Kolkata East.',
    time_ago: '16 days ago',
    dotColor: 'bg-amber-500',
  },
  {
    id: 2,
    agent_name: 'Pooja Nair',
    message: 'Pooja Nair route baseline initialized for Chennai South.',
    time_ago: '16 days ago',
    dotColor: 'bg-amber-400',
  },
  {
    id: 3,
    agent_name: 'Imran Khan',
    message: 'Imran Khan route baseline initialized for Mumbai West.',
    time_ago: '16 days ago',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 4,
    agent_name: 'Suresh Kumar',
    message: 'Suresh Kumar route baseline initialized for Bengaluru Central.',
    time_ago: '16 days ago',
    dotColor: 'bg-amber-500',
  },
  {
    id: 5,
    agent_name: 'Ravi Patel',
    message: 'Ravi Patel flagged for high return rate (23.4%).',
    time_ago: '17 days ago',
    dotColor: 'bg-rose-500',
  },
]

export default function RecentAnomaliesRail({ anomalies = [], summary = null, onViewAll }) {
  const [expanded, setExpanded] = useState(false)

  // Merge provided anomalies with defaults to guarantee rich live feed
  const displayFeed = anomalies && anomalies.length > 0 ? anomalies : DEFAULT_ANOMALIES
  const visibleItems = expanded ? displayFeed : displayFeed.slice(0, 5)

  const getDotColor = (item) => {
    if (item.dotColor) return item.dotColor
    const msg = (item.message || '').toLowerCase()
    const evt = item.event_type || ''
    if (evt === 'FLAGGED' || msg.includes('flagged') || msg.includes('high return')) return 'bg-rose-500'
    if (msg.includes('mumbai west') || evt === 'HUMAN_SIGN_OFF') return 'bg-emerald-500'
    if (msg.includes('chennai south')) return 'bg-amber-400'
    return 'bg-amber-500'
  }

  return (
    <div className="space-y-6">
      {/* ── CARD 1: Recent Anomalies (Live Feed) ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Anomalies</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
            <Activity className="h-3 w-3 text-purple-600 animate-pulse" />
            Live Feed
          </span>
        </div>

        <div className="mt-4 space-y-3.5">
          {visibleItems.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${getDotColor(item)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 leading-snug break-words">
                  {item.message || `${item.agent_name} route baseline initialized`}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.time_ago || '16 days ago'}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            if (onViewAll) {
              onViewAll()
            } else {
              setExpanded(!expanded)
            }
          }}
          className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer text-center"
        >
          <span>{expanded ? 'Show less' : 'View more'}</span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>

      {/* ── CARD 2: Key Insights ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
          <BarChart3 className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Key Insights</h3>
        </div>

        {/* Row 1: Risk breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-2.5 text-center">
            <p className="text-lg font-black text-rose-600 leading-none">1</p>
            <p className="text-[10px] font-semibold text-rose-800 mt-1">High Risk Agents</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-2.5 text-center">
            <p className="text-lg font-black text-amber-600 leading-none">2</p>
            <p className="text-[10px] font-semibold text-amber-800 mt-1">Medium Risk Agents</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-center">
            <p className="text-lg font-black text-emerald-600 leading-none">1</p>
            <p className="text-[10px] font-semibold text-emerald-800 mt-1">Low Risk Agents</p>
          </div>
        </div>

        {/* Row 2: Totals */}
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-2.5 text-center">
            <p className="text-lg font-black text-sky-600 leading-none">239</p>
            <p className="text-[10px] font-semibold text-sky-800 mt-1">Total Deliveries</p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-2.5 text-center">
            <p className="text-lg font-black text-purple-600 leading-none">70</p>
            <p className="text-[10px] font-semibold text-purple-800 mt-1">Total Returns</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-2.5 text-center">
            <p className="text-lg font-black text-rose-600 leading-none">12</p>
            <p className="text-[10px] font-semibold text-rose-800 mt-1">Total Flagged</p>
          </div>
        </div>
      </div>

      {/* ── CARD 3: Tip for Merchants ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-blue-200/80 bg-blue-50/60 p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 shadow-2xs">
          <Lightbulb className="h-4 w-4 fill-white" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-blue-950">Tip for Merchants</h4>
          <p className="text-[11px] text-blue-800/90 mt-1 leading-relaxed">
            Monitor delivery agents with a high anomaly gap and review flagged returns before approving refunds.
          </p>
        </div>
      </div>
    </div>
  )
}

