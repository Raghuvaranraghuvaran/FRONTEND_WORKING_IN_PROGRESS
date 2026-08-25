import React from 'react'
import { motion } from 'framer-motion'
import RiskBadge from '../RiskBadge'

function GradientMarkerBar({ value = 0, min = 0, max = 30, isGap = false }) {
  // Normalize percentage for the vertical marker position (clamped 4% to 96%)
  const percentage = Math.min(96, Math.max(4, ((value - min) / (max - min)) * 100))

  return (
    <div className="relative flex-1 h-3.5 mx-3 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 overflow-hidden shadow-inner">
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
  const gap = agent.anomaly_gap !== undefined ? agent.anomaly_gap : Number((agent.return_rate - agent.expected_return_rate).toFixed(1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.992 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
    >
      {/* ── Card Header ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <img
              src={
                agent.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0D9488&color=fff`
              }
              alt={agent.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">{agent.name}</h2>
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
          <RiskBadge tier={isHigh ? 'High' : isMedium ? 'Medium' : 'Low'} />
        </div>

        {/* ── 3 Top KPI Boxes ──────────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center border-t-3 border-t-emerald-500 shadow-2xs">
            <p className="text-xl font-extrabold text-slate-900 font-mono-num">{agent.total_deliveries}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Deliveries</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center border-t-3 border-t-amber-500 shadow-2xs">
            <p className="text-xl font-extrabold text-slate-900 font-mono-num">{agent.total_returns_handled}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Returns</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center border-t-3 border-t-rose-500 shadow-2xs">
            <p className="text-xl font-extrabold text-slate-900 font-mono-num">{agent.flagged_return_count}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Flagged</p>
          </div>
        </div>

        {/* ── Rate Breakdown Section ────────────────────────────────────────── */}
        <div className="mt-5 space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Rate Breakdown</p>

          <div className="flex items-center justify-between text-xs">
            <span className="w-36 text-slate-500 font-medium">Actual return rate</span>
            <GradientMarkerBar value={agent.return_rate} min={0} max={30} />
            <span className="w-14 text-right font-bold text-slate-900 font-mono-num">{agent.return_rate}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="w-36 text-slate-500 font-medium">Expected baseline</span>
            <GradientMarkerBar value={agent.expected_return_rate} min={0} max={30} />
            <span className="w-14 text-right font-semibold text-slate-900 font-mono-num">{agent.expected_return_rate}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="w-36 text-slate-500 font-medium">Anomaly gap</span>
            <GradientMarkerBar value={gap + 15} min={0} max={30} isGap />
            <div className="w-14 text-right">
              <span
                className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-bold font-mono-num ${
                  gap > 3
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : gap > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Contextual Alert Box with Action Button ─────────────────────── */}
        <div
          className={`mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border p-3.5 text-xs ${
            agent.is_under_investigation
              ? 'border-blue-200 bg-blue-50/80 text-blue-900'
              : isHigh
              ? 'border-amber-200 bg-amber-50/90 text-amber-900'
              : 'border-amber-200 bg-amber-50/70 text-amber-800'
          }`}
        >
          <p className="font-medium leading-relaxed flex-1">
            {agent.is_under_investigation
              ? 'Investigation in progress. Reviewing return correlations and customer claims.'
              : isHigh
              ? 'Sustained deviation detected. Requires human sign-off.'
              : 'Within expected range, but flagged for continued monitoring.'}
          </p>

          <button
            type="button"
            onClick={() => (isHigh || agent.is_under_investigation ? onSignOff(agent) : onInvestigate(agent))}
            className="shrink-0 rounded-xl bg-white border border-amber-300 px-4 py-2 text-xs font-bold text-amber-950 shadow-2xs hover:bg-amber-100/60 transition cursor-pointer"
          >
            {agent.is_under_investigation ? 'Sign-off' : isHigh ? 'Review and Sign-off' : 'Investigate'}
          </button>
        </div>
      </div>

      {/* ── Bottom Details CTA Button ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onViewDetails(agent)}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer text-center"
      >
        View Details
      </button>
    </motion.div>
  )
}
