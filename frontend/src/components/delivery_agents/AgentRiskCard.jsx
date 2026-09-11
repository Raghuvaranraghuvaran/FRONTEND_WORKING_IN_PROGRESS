import React from 'react'
import { motion } from 'framer-motion'
import { Truck, Package, Flag, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

// Realistic photo avatars matching the reference screenshot
const AVATAR_MAP = {
  'Imran Khan': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'Suresh Kumar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'Amitabh Das': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'Pooja Nair': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
}

function GradientMarkerBar({ value = 0, min = 0, max = 30, gradient = 'from-emerald-400 via-amber-400 to-rose-500' }) {
  // Clamp marker percentage between 3% and 97%
  const percentage = Math.min(97, Math.max(3, ((value - min) / (max - min)) * 100))

  return (
    <div className={`relative flex-1 h-3 mx-3 rounded-full bg-gradient-to-r ${gradient} overflow-hidden shadow-inner`}>
      <div
        className="absolute top-0 bottom-0 w-1 bg-slate-900 shadow-md rounded-full -translate-x-1/2 transition-all duration-300"
        style={{ left: `${percentage}%` }}
      />
    </div>
  )
}

export default function AgentRiskCard({ agent, onInvestigate, onSignOff, onViewDetails }) {
  const isHigh = agent.current_risk_level === 'HIGH' || agent.risk_flag === 'Review' || agent.risk_flag === 'High Risk'
  const isMedium = agent.current_risk_level === 'MEDIUM' || agent.risk_flag === 'Monitor'
  const isLow = !isHigh && !isMedium
  const gap = agent.anomaly_gap !== undefined ? agent.anomaly_gap : Number((agent.return_rate - agent.expected_return_rate).toFixed(1))

  const avatarUrl = agent.avatar_url || AVATAR_MAP[agent.name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=4F46E5&color=fff`

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.992 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow"
    >
      <div>
        {/* ── Card Header: Avatar, Name, Location & Risk Badge ──────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <img
              src={avatarUrl}
              alt={agent.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">{agent.name}</h3>
                {agent.is_under_investigation && (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    Investigating
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {agent.location_name || `${agent.route} - ${agent.pincode}`}
              </p>
            </div>
          </div>

          {/* Risk Badge matching reference pill styling */}
          {isHigh && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-2xs">
              <AlertTriangle className="h-3 w-3 fill-current" />
              High Risk
            </span>
          )}
          {isMedium && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
              <AlertCircle className="h-3 w-3 fill-current" />
              Medium Risk
            </span>
          )}
          {isLow && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-2xs">
              <CheckCircle2 className="h-3 w-3 fill-current" />
              Low Risk
            </span>
          )}
        </div>

        {/* ── 3 Top KPI Boxes: Deliveries, Returns, Flagged with Icons ──────── */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {/* Deliveries Box */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-2xs shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-none">{agent.total_deliveries}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Deliveries</p>
            </div>
          </div>

          {/* Returns Box */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-none">{agent.total_returns_handled}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Returns</p>
            </div>
          </div>

          {/* Flagged Box */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 text-white shadow-2xs shrink-0">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 leading-none">{agent.flagged_return_count}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">Flagged</p>
            </div>
          </div>
        </div>

        {/* ── Rate Breakdown Section ────────────────────────────────────────── */}
        <div className="mt-5 space-y-2.5">
          <p className="text-xs font-bold text-slate-900">Return Rate Analysis</p>

          <div className="flex items-center justify-between text-xs">
            <span className="w-32 text-slate-600 font-medium">Actual return rate</span>
            <GradientMarkerBar
              value={agent.return_rate}
              min={0}
              max={30}
              gradient="from-amber-400 via-orange-500 to-rose-600"
            />
            <span className="w-14 text-right font-bold text-slate-900 font-mono-num">{agent.return_rate}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="w-32 text-slate-600 font-medium">Expected baseline</span>
            <GradientMarkerBar
              value={agent.expected_return_rate}
              min={0}
              max={30}
              gradient="from-emerald-400 via-amber-300 to-orange-400"
            />
            <span className="w-14 text-right font-bold text-slate-900 font-mono-num">{agent.expected_return_rate}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="w-32 text-slate-600 font-medium">Anomaly gap</span>
            <GradientMarkerBar
              value={gap + 15}
              min={0}
              max={30}
              gradient="from-emerald-400 via-amber-300 via-orange-400 to-rose-600"
            />
            <span
              className={`w-14 text-right font-bold font-mono-num ${
                gap > 0 ? 'text-rose-500' : 'text-emerald-600'
              }`}
            >
              {gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* ── Contextual Alert Strip with Action Button ─────────────────────── */}
        <div className="mt-5">
          {isHigh && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-white shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 fill-current" />
                </div>
                <div>
                  <p className="font-bold text-rose-900">Sustained deviation detected.</p>
                  <p className="text-[11px] text-rose-700">Requires human sign-off.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSignOff(agent)}
                className="shrink-0 rounded-xl bg-white border border-rose-300 px-3.5 py-1.5 text-xs font-bold text-rose-900 shadow-2xs hover:bg-rose-100/50 transition cursor-pointer"
              >
                Review and Sign-off
              </button>
            </div>
          )}

          {isMedium && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                  <AlertCircle className="h-3.5 w-3.5 fill-current" />
                </div>
                <p className="font-semibold text-amber-900 leading-snug">
                  Within expected range, but flagged for continued monitoring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInvestigate(agent)}
                className="shrink-0 rounded-xl bg-white border border-amber-300 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/50 transition cursor-pointer"
              >
                Investigate
              </button>
            </div>
          )}

          {isLow && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
              </div>
              <div>
                <p className="font-bold text-emerald-900">Performance within normal range.</p>
                <p className="text-[11px] text-emerald-700">No immediate action required.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Details CTA Button ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onViewDetails(agent)}
        className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer text-center"
      >
        <span>View Details</span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
      </button>
    </motion.div>
  )
}

