import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../mock/api'
import RiskBadge from '../RiskBadge'
import { 
  X, 
  Truck, 
  RotateCcw, 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Activity,
  UserCheck
} from 'lucide-react'

export default function AgentDetailsDrawer({ agentId, isOpen, onClose, onInvestigate, onSignOff }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && agentId) {
      setLoading(true)
      api
        .getDeliveryAgentDetails(agentId)
        .then((res) => {
          setDetails(res)
        })
        .catch((err) => {
          console.error('Failed to load agent details:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, agentId])

  if (!isOpen) return null

  const agent = details?.agent

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Delivery Agent Telemetry</h2>
              <p className="text-xs text-slate-500">Route & Return Deviation Profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !agent ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="h-40 rounded-2xl bg-slate-100" />
            <div className="h-48 rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* ── Agent Identity Card ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      agent.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0D9488&color=fff`
                    }
                    alt={agent.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{agent.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {agent.location_name || `${agent.route} - ${agent.pincode}`}
                    </p>
                  </div>
                </div>
                <RiskBadge tier={agent.current_risk_level === 'HIGH' ? 'High' : agent.current_risk_level === 'MEDIUM' ? 'Medium' : 'Low'} />
              </div>

              {/* 3 Metric Grid */}
              <div className="mt-4 grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200/80">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900 font-mono-num">{agent.total_deliveries}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Deliveries</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <p className="text-lg font-bold text-slate-900 font-mono-num">{agent.total_returns_handled}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Returns Handled</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-rose-600 font-mono-num">{agent.flagged_return_count}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Flagged Claims</p>
                </div>
              </div>
            </div>

            {/* ── 7-Day Route Telemetry Chart ──────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">7-Day Route Return Telemetry</h4>
                  <p className="text-xs text-slate-500">Actual return rate vs. route baseline</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-900">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Actual
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-300" /> Baseline ({agent.expected_return_rate}%)
                  </span>
                </div>
              </div>

              {/* Bar comparison visualizer */}
              <div className="grid grid-cols-7 gap-2 pt-6 items-end h-36 border-b border-slate-100 pb-2">
                {(details?.telemetry || []).map((point, i) => {
                  const maxVal = 25
                  const actualH = Math.min(100, (point.actual_rate / maxVal) * 100)
                  const baseH = Math.min(100, (point.baseline_rate / maxVal) * 100)

                  return (
                    <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-700 font-mono-num">{point.actual_rate}%</span>
                      <div className="w-full flex items-end justify-center gap-1 h-24">
                        <div
                          style={{ height: `${actualH}%` }}
                          className="w-2.5 rounded-t bg-rose-500 transition-all duration-300"
                        />
                        <div
                          style={{ height: `${baseH}%` }}
                          className="w-2.5 rounded-t bg-slate-300 transition-all duration-300"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{point.day}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Recent Shipment & Return Claims Handled ──────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Recent Consignments on Route</h4>
              <div className="space-y-2.5">
                {(details?.recent_shipments || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{item.order_number}</span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            item.type === 'Return' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Customer: <strong>{item.customer}</strong> · {item.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-700">{item.status}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Activity & Audit History ─────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Investigation & Sign-off History</h4>
              {(details?.activity_logs || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No history logs recorded.</p>
              ) : (
                <div className="space-y-3">
                  {details.activity_logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 text-xs">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{log.message}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Quick Actions Footer ─────────────────────────────────────── */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onInvestigate(agent)
                }}
                className="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs cursor-pointer text-center"
              >
                Start Investigation
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onSignOff(agent)
                }}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer text-center"
              >
                Review & Sign-Off
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
