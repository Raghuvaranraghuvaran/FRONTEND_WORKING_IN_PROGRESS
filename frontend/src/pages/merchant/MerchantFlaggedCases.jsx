import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Camera,
  AlertTriangle,
  Package,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react'

export default function MerchantFlaggedCases() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getMerchantReturns()
      setReturns(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter logic
  const filtered = returns.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (riskFilter !== 'all' && r.risk_tier !== riskFilter) return false
    if (reasonFilter !== 'all' && r.reason !== reasonFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchId = String(r.id).toLowerCase().includes(q)
      const matchOrder = String(r.order_number || '').toLowerCase().includes(q)
      const matchCustomer = String(r.customer_name || '').toLowerCase().includes(q)
      const matchReason = String(r.reason || '').toLowerCase().includes(q)
      return matchId || matchOrder || matchCustomer || matchReason
    }
    return true
  })

  // Quick stats
  const totalCount = returns.length
  const criticalCount = returns.filter(r => r.risk_tier === 'Critical' || r.risk_score >= 85).length
  const swapCount = returns.filter(r => r.is_product_swap_detected || r.risk_context?.includes('swap')).length
  const pendingCount = returns.filter(r => r.status === 'manual_review' || r.status === 'pending' || r.status === 'hold').length

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Return & Flagged Cases Review
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time fraud audit console: Inspect customer claims, verify serials, and execute directives.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Cases</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Returns</span>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <div className="font-mono text-2xl font-black text-slate-900 mt-2">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">All customer return logs</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase">Under Review</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="font-mono text-2xl font-black text-amber-900 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-amber-700 mt-0.5">Require merchant decision</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase">Critical / High Risk</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="font-mono text-2xl font-black text-rose-900 mt-2">{criticalCount}</div>
          <p className="text-[11px] text-rose-700 mt-0.5">Scored $\ge 65$ pts</p>
        </div>

        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase">Product Swaps</span>
            <span className="text-base">🚨</span>
          </div>
          <div className="font-mono text-2xl font-black text-red-900 mt-2">{swapCount}</div>
          <p className="text-[11px] text-red-700 mt-0.5">CP21 Counterfeit / swap</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'manual_review', label: 'Manual Review' },
            { id: 'hold', label: 'Hold' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Risk Tiers</option>
            <option value="Critical">Critical Risk</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>

          <select
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Reasons</option>
            <option value="damaged">Damaged / Defective</option>
            <option value="wrong_product">Wrong Product</option>
            <option value="wrong_size">Wrong Size</option>
            <option value="not_as_described">Not As Described</option>
            <option value="changed_mind">Changed Mind</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customer, order..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Return Cases List / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <EmptyState
            title="No return cases match your filters"
            description="Try adjusting your status or search queries above to view other records."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => {
            const isSwap = record.is_product_swap_detected
            const photoCount = record.images?.length || 0

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 transition-all shadow-xs hover:shadow-md bg-white ${
                  isSwap
                    ? 'border-red-300 hover:border-red-500 ring-1 ring-red-400/30'
                    : 'border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                        #{record.id}
                      </span>
                      <span className="font-bold text-base text-slate-900">Order {record.order_number}</span>
                      <RiskBadge tier={record.risk_tier} />
                      <StatusBadge status={record.status} />
                      {isSwap && (
                        <span className="rounded-md bg-red-600 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          🚨 SWAP DETECTED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Customer:</span>{' '}
                        <strong className="text-slate-900">{record.customer_name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Reason:</span>{' '}
                        <strong className="text-slate-900 capitalize">{record.reason?.replaceAll('_', ' ')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Date:</span>{' '}
                        <strong className="text-slate-700">{formatDate(record.created_at)}</strong>
                      </div>
                    </div>

                    {record.note && (
                      <p className="text-xs text-slate-500 italic truncate max-w-2xl">
                        "{record.note}"
                      </p>
                    )}
                  </div>

                  {/* Right Actions & Value */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Claimed Value</span>
                      <div className="font-mono text-base font-black text-slate-900">
                        ₹{(
                          (record.return_lines && record.return_lines.length > 0)
                            ? record.return_lines.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                            : (record.order_total || record.total || 2499)
                        ).toLocaleString('en-IN')}
                      </div>
                      {photoCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mt-0.5">
                          <Camera className="h-3 w-3" /> {photoCount} Photos
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/merchant/flagged-cases/${record.id}`}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-2.5 text-xs font-black shadow-md transition-all active:scale-[0.98] no-underline"
                    >
                      <span>Review Case</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
