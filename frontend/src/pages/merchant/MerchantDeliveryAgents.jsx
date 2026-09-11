import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../mock/api'
import AgentRiskCard from '../../components/delivery_agents/AgentRiskCard'
import RecentAnomaliesRail from '../../components/delivery_agents/RecentAnomaliesRail'
import InvestigateModal from '../../components/delivery_agents/InvestigateModal'
import SignOffModal from '../../components/delivery_agents/SignOffModal'
import AgentDetailsDrawer from '../../components/delivery_agents/AgentDetailsDrawer'
import { 
  ShieldAlert, 
  Search, 
  ChevronDown, 
  RotateCcw, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Calendar,
  Building2
} from 'lucide-react'

export default function MerchantDeliveryAgents() {
  const [agents, setAgents] = useState([])
  const [recentAnomalies, setRecentAnomalies] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Filters & Controls
  const [sortOption, setSortOption] = useState('-risk')
  const [dateRange, setDateRange] = useState('30d')
  const [riskFilter, setRiskFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals & Drawers state
  const [investigateTarget, setInvestigateTarget] = useState(null)
  const [signOffTarget, setSignOffTarget] = useState(null)
  const [detailsAgentId, setDetailsAgentId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.getDeliveryAgentRiskOverview({
        ordering: sortOption,
        risk: riskFilter,
        range: dateRange,
      })

      if (res) {
        setAgents(Array.isArray(res.agents) ? res.agents : [])
        setRecentAnomalies(Array.isArray(res.recent_anomalies) ? res.recent_anomalies : [])
        setSummary(res.summary || null)
      }
    } catch (err) {
      console.error('Failed to load delivery agent risk data:', err)
      showToast('Failed to sync remote agent data, using cached telemetry.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [sortOption, riskFilter, dateRange])

  // Filter by local search query and city if present
  const filteredAgents = agents.filter((agent) => {
    if (cityFilter !== 'all') {
      const loc = `${agent.route || ''} ${agent.location_name || ''}`.toLowerCase()
      if (!loc.includes(cityFilter.toLowerCase())) return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      agent.name.toLowerCase().includes(q) ||
      (agent.route && agent.route.toLowerCase().includes(q)) ||
      (agent.pincode && agent.pincode.includes(q))
    )
  })

  // Handle Investigate submission
  const handleConfirmInvestigate = async ({ notes }) => {
    if (!investigateTarget) return
    try {
      setActionLoading(true)
      const res = await api.investigateDeliveryAgent(investigateTarget.id, { notes })
      
      // Update local state optimistically
      setAgents((prev) =>
        prev.map((a) =>
          a.id === investigateTarget.id ? { ...a, is_under_investigation: true } : a
        )
      )

      showToast(res.message || `Investigation opened for ${investigateTarget.name}.`)
      setInvestigateTarget(null)
      loadData()
    } catch (err) {
      console.error('Failed to start investigation:', err)
      showToast('Failed to submit investigation.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Sign-off submission
  const handleConfirmSignOff = async ({ notes, risk_level }) => {
    if (!signOffTarget) return
    try {
      setActionLoading(true)
      const res = await api.signOffDeliveryAgent(signOffTarget.id, { notes, risk_level })

      // Update local state optimistically
      setAgents((prev) =>
        prev.map((a) =>
          a.id === signOffTarget.id
            ? {
                ...a,
                is_under_investigation: false,
                current_risk_level: risk_level.toUpperCase(),
                risk_flag: risk_level.toUpperCase() === 'HIGH' ? 'Review' : risk_level.toUpperCase() === 'MEDIUM' ? 'Monitor' : 'Normal',
              }
            : a
        )
      )

      showToast(res.message || `Review sign-off saved for ${signOffTarget.name}.`)
      setSignOffTarget(null)
      loadData()
    } catch (err) {
      console.error('Failed to record sign-off:', err)
      showToast('Failed to record sign-off.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Toast Notification Banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold shadow-xl border ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header Banner with Scooter Rider Illustration ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-blue-50/70 border border-indigo-100/70 p-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Delivery-agent risk</h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Baseline-adjusted anomaly review. This is an investigation signal, not a confirmed-collusion finding.
            </p>
          </div>
        </div>

        {/* Right banner illustration & bullet points */}
        <div className="flex items-center gap-3.5 bg-white/85 backdrop-blur-xs rounded-2xl border border-indigo-100/80 px-4 py-2.5 shadow-2xs">
          {/* Scooter Courier SVG */}
          <div className="relative h-12 w-16 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 80" className="w-full h-full">
              <circle cx="25" cy="62" r="11" fill="#334155" />
              <circle cx="25" cy="62" r="5" fill="#94A3B8" />
              <circle cx="78" cy="62" r="11" fill="#334155" />
              <circle cx="78" cy="62" r="5" fill="#94A3B8" />
              <path d="M25 62 L48 62 L58 48 L76 62" stroke="#6366F1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M48 62 L54 36 L68 36" stroke="#4F46E5" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M66 33 L73 33" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="18" y="30" width="20" height="20" rx="4" fill="#818CF8" />
              <path d="M18 37 L38 37" stroke="#4338CA" strokeWidth="2" />
              <circle cx="55" cy="20" r="7.5" fill="#F59E0B" />
              <path d="M50 28 C50 22, 60 22, 60 28 L60 42 L48 42 Z" fill="#4338CA" />
            </svg>
          </div>

          <div className="space-y-1 text-[11px] font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 text-indigo-950">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>Identify risky delivery patterns.</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-950">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>Prevent return fraud.</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-950">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>Ensure trusted deliveries.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Title & Filter Toolbar matching Screenshot ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <h2 className="text-lg font-bold text-slate-900">Risk Overview</h2>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort by Risk Dropdown */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-indigo-500 focus:outline-hidden transition cursor-pointer"
            >
              <option value="-risk">Sort by Risk</option>
              <option value="-anomaly_gap">Highest Anomaly Gap</option>
              <option value="-deliveries">Total Deliveries</option>
              <option value="name">Agent Name (A-Z)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Date Range Selector with Calendar icon */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-indigo-500 focus:outline-hidden transition cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* City Filter with Building2 icon */}
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-indigo-500 focus:outline-hidden transition cursor-pointer"
            >
              <option value="all">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Chennai">Chennai</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* ── Main Layout Grid: 2-Column Cards + Right Rail ───────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200/80" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2-Column Agent Grid */}
          <div className="lg:col-span-2">
            {filteredAgents.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                <Truck className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="text-base font-bold text-slate-900">No Delivery Agents Matching Filter</p>
                <p className="text-xs text-slate-500 mt-1">Try selecting &quot;Ert All&quot; or resetting your search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setRiskFilter('all')
                    setSortOption('-risk')
                  }}
                  className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredAgents.map((agent) => (
                  <AgentRiskCard
                    key={agent.id}
                    agent={agent}
                    onInvestigate={(target) => setInvestigateTarget(target)}
                    onSignOff={(target) => setSignOffTarget(target)}
                    onViewDetails={(target) => setDetailsAgentId(target.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Rail: Recent Anomalies Feed */}
          <div className="lg:col-span-1">
            <RecentAnomaliesRail
              anomalies={recentAnomalies}
              summary={summary}
              onViewAll={() => setDetailsAgentId(agents[0]?.id)}
            />
          </div>
        </div>
      )}

      {/* ── Investigate Dialog ──────────────────────────────────────────────── */}
      <InvestigateModal
        agent={investigateTarget}
        isOpen={Boolean(investigateTarget)}
        onClose={() => setInvestigateTarget(null)}
        onConfirm={handleConfirmInvestigate}
        loading={actionLoading}
      />

      {/* ── Review & Sign-Off Dialog ────────────────────────────────────────── */}
      <SignOffModal
        agent={signOffTarget}
        isOpen={Boolean(signOffTarget)}
        onClose={() => setSignOffTarget(null)}
        onConfirm={handleConfirmSignOff}
        loading={actionLoading}
      />

      {/* ── Telemetry & Route History Slide-Over Drawer ───────────────────────── */}
      <AgentDetailsDrawer
        agentId={detailsAgentId}
        isOpen={Boolean(detailsAgentId)}
        onClose={() => setDetailsAgentId(null)}
        onInvestigate={(agent) => {
          setDetailsAgentId(null)
          setInvestigateTarget(agent)
        }}
        onSignOff={(agent) => {
          setDetailsAgentId(null)
          setSignOffTarget(agent)
        }}
      />
    </div>
  )
}
