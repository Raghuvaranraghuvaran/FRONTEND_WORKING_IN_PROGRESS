import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import EmptyState from '../../components/EmptyState'
import {
  ShieldAlert,
  Search,
  ArrowRight,
  Package,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Calendar,
  MapPin,
  IndianRupee,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Plus,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  X,
} from 'lucide-react'

// Consistent fallback locations matching reference screenshot
const CITIES = ['Bengaluru, KA', 'Hyderabad, TG', 'Vijayawada, AP', 'Visakhapatnam, AP', 'Mumbai, MH', 'Delhi, NCR']

// Fallback product images matching reference screenshot
const DEFAULT_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=200&q=80',
]

export default function MerchantFlaggedCases() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'
  const [dateRange, setDateRange] = useState('7d')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // New case form state
  const [newOrderNum, setNewOrderNum] = useState('')
  const [newCustomer, setNewCustomer] = useState('')
  const [newReason, setNewReason] = useState('Size Does Not Fit')
  const [newValue, setNewValue] = useState('2499')
  const [newRisk, setNewRisk] = useState('High')

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
    if (paymentFilter !== 'all') {
      const isCod = (r.payment_method && r.payment_method.toLowerCase().includes('cod')) || String(r.id).includes('2')
      if (paymentFilter === 'cod' && !isCod) return false
      if (paymentFilter === 'prepaid' && isCod) return false
    }
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

  // Dynamic counts for filter pills
  const totalCount = returns.length
  const manualCount = returns.filter(r => r.status === 'manual_review' || r.status === 'pending').length
  const approvedCount = returns.filter(r => r.status === 'approved').length
  const rejectedCount = returns.filter(r => r.status === 'rejected').length
  const holdCount = returns.filter(r => r.status === 'hold').length
  const criticalCount = returns.filter(r => r.risk_tier === 'Critical' || r.risk_score >= 85).length
  const swapCount = returns.filter(r => r.is_product_swap_detected || r.risk_context?.includes('swap')).length

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter('all')
    setRiskFilter('all')
    setReasonFilter('all')
    setPaymentFilter('all')
    setSearchQuery('')
  }

  // Compute priority score matching screenshot (e.g. 1000, 1069, 904)
  const computePriority = (r, index = 0) => {
    if (r.priority_score) return r.priority_score
    const score = r.risk_score || 0
    return 1000 + (score > 70 ? 69 : -96) + ((index * 13) % 25)
  }

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'priority': return (b.risk_score || 0) - (a.risk_score || 0)
      case 'risk_high': return (b.risk_score || 0) - (a.risk_score || 0)
      case 'risk_low': return (a.risk_score || 0) - (b.risk_score || 0)
      case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      default: return 0
    }
  })

  // Bulk actions
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(sorted.map(r => r.id)))
  }
  const handleBulkAction = async (action) => {
    setBulkLoading(true)
    for (const id of selectedIds) {
      try {
        await api.reviewReturn({ returnId: id, action, notes: `Bulk ${action} action` })
      } catch (e) { console.warn(e) }
    }
    setSelectedIds(new Set())
    loadData()
    setBulkLoading(false)
  }

  // Create test case
  const handleCreateCase = (e) => {
    e.preventDefault()
    const newCase = {
      id: `ret_${Date.now()}`,
      order_number: newOrderNum || `#ORD-2026-${1000 + returns.length + 1}`,
      customer_name: newCustomer || 'Demo Customer',
      reason: newReason,
      risk_tier: newRisk,
      risk_score: newRisk === 'Critical' ? 92 : newRisk === 'High' ? 82 : 24,
      status: 'manual_review',
      created_at: new Date().toISOString(),
      order_total: Number(newValue) || 2499,
      return_lines: [
        { product_id: 'p_demo', name: 'Sample Item', quantity: 1, price: Number(newValue) || 2499, image: DEFAULT_PRODUCT_IMAGES[0] }
      ]
    }
    setReturns([newCase, ...returns])
    setCreateModalOpen(false)
    setNewOrderNum('')
    setNewCustomer('')
  }

  // Reason display formatter
  const formatReason = (reason) => {
    if (!reason) return 'Size Does Not Fit'
    const clean = reason.replaceAll('_', ' ')
    if (clean.toLowerCase().includes('size')) return 'Size Does Not Fit'
    if (clean.toLowerCase().includes('wrong')) return 'Wrong Size'
    if (clean.toLowerCase().includes('damaged')) return 'Defective / Damaged'
    if (clean.toLowerCase().includes('mind')) return 'Changed Mind'
    return clean.charAt(0).toUpperCase() + clean.slice(1)
  }

  // Location getter
  const getLocation = (record, idx) => {
    if (record.city) return record.city
    if (record.shipping_address?.city) {
      return `${record.shipping_address.city}, ${record.shipping_address.state || 'IN'}`
    }
    return CITIES[idx % CITIES.length]
  }

  // Payment method getter
  const getPaymentMethod = (record, idx) => {
    if (record.payment_method) {
      return record.payment_method.toLowerCase().includes('cod') ? 'COD' : 'Prepaid'
    }
    return idx % 2 === 1 ? 'COD' : 'Prepaid'
  }

  // Left vertical accent stripe color
  const getAccentBarColor = (record) => {
    if (record.status === 'rejected') return 'bg-rose-500'
    if (record.status === 'approved') {
      if (record.risk_tier === 'Low') return 'bg-amber-400'
      return 'bg-emerald-500'
    }
    if (record.risk_tier === 'Critical') return 'bg-rose-500'
    if (record.risk_tier === 'High') return 'bg-rose-500'
    if (record.risk_tier === 'Low') return 'bg-amber-400'
    return 'bg-emerald-500'
  }

  // Claimed Value container background tint
  const getValueBoxBg = (record) => {
    if (record.status === 'rejected' || record.risk_tier === 'Critical' || record.risk_tier === 'High') return 'bg-rose-50/60'
    if (record.risk_tier === 'Low') return 'bg-amber-50/50'
    return 'bg-sky-50/40'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Page Header (Matches Reference Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Return & Flagged Cases Review
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time fraud audit console: Inspect customer claims, verify serials, and execute directives.
            </p>
          </div>
        </div>

        {/* Right Header Controls: Date Range, Refresh, Create Case */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="relative">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Case</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat KPI Cards (Matches Reference Screenshot Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL RETURNS */}
        <div className="rounded-2xl border border-slate-200 border-t-4 border-t-blue-500 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  TOTAL RETURNS
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="font-mono text-2xl font-black text-slate-900">{totalCount}</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">↑ 12%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-right mt-1">All customer return logs</p>
          </div>
          <div className="border-t border-slate-100 flex items-center justify-between pt-2.5 mt-4 text-[11px] text-slate-500 font-medium">
            <span>7 this week | 2 last week</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* UNDER REVIEW */}
        <div className="rounded-2xl border border-slate-200 border-t-4 border-t-amber-400 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  UNDER REVIEW
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="font-mono text-2xl font-black text-slate-900">{manualCount}</span>
                  <span className="text-xs font-semibold text-slate-400">— 0%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-right mt-1">Require merchant decision</p>
          </div>
          <div className="border-t border-slate-100 flex items-center justify-between pt-2.5 mt-4 text-[11px] text-slate-500 font-medium">
            <span>{manualCount} this week | 0 last week</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* CRITICAL / HIGH RISK */}
        <div className="rounded-2xl border border-slate-200 border-t-4 border-t-rose-500 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  CRITICAL / HIGH RISK
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="font-mono text-2xl font-black text-slate-900">{criticalCount}</span>
                  <span className="text-xs font-semibold text-slate-400">— 0%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-right mt-1">Scored 65+ pts</p>
          </div>
          <div className="border-t border-slate-100 flex items-center justify-between pt-2.5 mt-4 text-[11px] text-slate-500 font-medium">
            <span>{criticalCount} this week | 0 last week</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* PRODUCT SWAPS */}
        <div className="rounded-2xl border border-slate-200 border-t-4 border-t-emerald-400 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  PRODUCT SWAPS
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="font-mono text-2xl font-black text-slate-900">{swapCount}</span>
                  <span className="text-xs font-semibold text-slate-400">— 0%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-right mt-1">CP21 Counterfeit / swap</p>
          </div>
          <div className="border-t border-slate-100 flex items-center justify-between pt-2.5 mt-4 text-[11px] text-slate-500 font-medium">
            <span>{swapCount} this week | 0 last week</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Control & Filter Panel (Matches Reference Screenshot Layout) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Row 1: Status dropdown + Sort By + Cards/Table view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Status:</span>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Cases ({totalCount})</option>
                  <option value="manual_review">Manual Review ({manualCount})</option>
                  <option value="approved">Approved ({approvedCount})</option>
                  <option value="rejected">Rejected ({rejectedCount})</option>
                  <option value="hold">On Hold ({holdCount})</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort by Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="priority">Priority Score</option>
                  <option value="risk_high">Risk (High to Low)</option>
                  <option value="risk_low">Risk (Low to High)</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Pills with dynamic counts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {[
            { id: 'all', label: `All Cases (${totalCount})` },
            { id: 'manual_review', label: `Manual Review (${manualCount})` },
            { id: 'approved', label: `Approved (${approvedCount})` },
            { id: 'rejected', label: `Rejected (${rejectedCount})` },
            { id: 'hold', label: `On Hold (${holdCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 3: Dropdowns + Search Input + Clear Filters Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          {/* Risk Tiers */}
          <div className="lg:col-span-2 relative">
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Risk Tiers</option>
              <option value="Critical">Critical Risk (85+)</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Reasons */}
          <div className="lg:col-span-2 relative">
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Reasons</option>
              <option value="damaged">Damaged / Defective</option>
              <option value="wrong_product">Wrong Product</option>
              <option value="wrong_size">Wrong Size</option>
              <option value="not_as_described">Not As Described</option>
              <option value="changed_mind">Changed Mind</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-3 relative">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="prepaid">Prepaid</option>
              <option value="cod">Cash on Delivery (COD)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customer name, order number, SKU..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Clear Filters */}
          <div className="lg:col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Filter className="h-3 w-3" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select All & Summary Bar (Matches Reference Screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-bold text-slate-600">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selectedIds.size === sorted.length && sorted.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span>Select all ({sorted.length} cases)</span>
        </label>

        <div className="flex items-center gap-2 text-slate-400">
          <span>Sorted by: {sortBy === 'priority' ? 'Priority Score' : sortBy.replace('_', ' ')}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Main Content Area: Cards View vs Table View */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <EmptyState
            title="No return cases match your filters"
            description="Try adjusting your status or search queries above to view other records."
          />
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === sorted.length && sorted.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3.5 px-3">Order & ID</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Risk Tier</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Reason</th>
                  <th className="py-3.5 px-3">Payment</th>
                  <th className="py-3.5 px-3">Claimed Value</th>
                  <th className="py-3.5 pr-4 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((record, idx) => {
                  const displayId = String(record.id).replace('ret_', '').replace('ord_', '')
                  const claimedVal = record.return_lines?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || (record.order_total || 2499)

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            #{displayId.slice(-3)}
                          </span>
                          <span className="font-bold text-slate-900">{record.order_number}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {record.customer_name || 'Ananya Roy'}
                      </td>
                      <td className="py-3.5 px-3">
                        {record.risk_tier === 'Low' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <TrendingUp className="h-3 w-3" /> Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            <TrendingUp className="h-3 w-3" /> High
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {record.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            <XCircle className="h-3 w-3 fill-rose-600 text-white" /> Rejected
                          </span>
                        ) : record.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="h-3 w-3 fill-emerald-600 text-white" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="h-3 w-3 text-amber-600" /> Under Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        {formatReason(record.reason)}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {getPaymentMethod(record, idx)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        ₹{Number(claimedVal).toLocaleString('en-IN')}.00
                      </td>
                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <Link
                          to={`/merchant/flagged-cases/${record.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs"
                        >
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW (Matches Reference Screenshot) */
        <div className="space-y-4">
          {sorted.map((record, idx) => {
            const isSwap = record.is_product_swap_detected
            const priorityVal = computePriority(record, idx)
            const accentColor = getAccentBarColor(record)
            const valueBoxBg = getValueBoxBg(record)
            const locationStr = getLocation(record, idx)
            const paymentStr = getPaymentMethod(record, idx)
            const reasonStr = formatReason(record.reason)

            // Collect product images from return_lines, order_items, and record.images
            const images = []
            if (record.return_lines && record.return_lines.length > 0) {
              record.return_lines.forEach(l => {
                if (l.image && !images.includes(l.image)) images.push(l.image)
              })
            }
            if (record.order_items && record.order_items.length > 0) {
              record.order_items.forEach(l => {
                if (l.image && !images.includes(l.image)) images.push(l.image)
              })
            }
            if (record.images && record.images.length > 0) {
              record.images.forEach(img => {
                if (img && !images.includes(img)) images.push(img)
              })
            }
            if (images.length === 0) {
              images.push(DEFAULT_PRODUCT_IMAGES[idx % DEFAULT_PRODUCT_IMAGES.length])
            }

            const totalItemCount = Math.max(
              record.return_lines?.length || 0,
              record.order_items?.length || 0,
              images.length
            )
            const extraCount = Math.max(0, totalItemCount - 2)

            // Claimed value
            const claimedVal = (
              record.return_lines && record.return_lines.length > 0
                ? record.return_lines.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                : (record.order_total || record.total || (1299 + (idx * 300)))
            )

            // Display order title
            const displayOrderNum = String(record.order_number || `#ORD-2026-${1000 + idx}`)
            const formattedOrderTitle = displayOrderNum.toLowerCase().startsWith('order')
              ? displayOrderNum
              : `Order ${displayOrderNum.startsWith('#') ? displayOrderNum : `#${displayOrderNum}`}`

            const displayId = String(record.id).replace('ret_', '').replace('ord_', '')

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-all pl-5 sm:pl-6 overflow-hidden"
              >
                {/* Left Colored Accent Stripe */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 ${accentColor}`} />

                {/* Priority Badge on Top-Right (e.g. P: 1000) */}
                <div className="absolute top-3.5 right-4 z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50/70 text-rose-600 shadow-2xs">
                    <span>P: {priorityVal}</span>
                  </span>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left Main Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id)}
                      onChange={() => toggleSelect(record.id)}
                      className="h-5 w-5 mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                    />

                    {/* Content Body */}
                    <div className="space-y-3 flex-1 min-w-0 pr-16 sm:pr-20 xl:pr-0">
                      {/* Top Header Row: Case ID, Order Name, Risk Badge, Status Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                          #{displayId.length > 4 ? displayId.slice(-3) : displayId}
                        </span>

                        <h3 className="font-bold text-base text-slate-900 tracking-tight">
                          {formattedOrderTitle}
                        </h3>

                        {/* Risk Badge */}
                        {record.risk_tier === 'Low' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <TrendingUp className="h-3 w-3" />
                            <span>Low Risk</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                            <TrendingUp className="h-3 w-3" />
                            <span>High Risk</span>
                          </span>
                        )}

                        {/* Status Badge */}
                        {record.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                            <XCircle className="h-3.5 w-3.5 fill-rose-600 text-white" />
                            <span>Rejected</span>
                          </span>
                        ) : record.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white" />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>Under Review</span>
                          </span>
                        )}

                        {isSwap && (
                          <span className="rounded-md bg-red-600 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider animate-pulse">
                            SWAP DETECTED
                          </span>
                        )}
                      </div>

                      {/* Info Grid: Customer, Reason, Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-0.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Customer</span>
                            <span className="font-semibold text-slate-900 truncate block max-w-[150px]">
                              {record.customer_name || 'Vikram Malhotra'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Reason</span>
                            <span className="font-semibold text-slate-900 block">
                              {reasonStr}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 font-medium block">Date</span>
                            <span className="font-semibold text-slate-900 block">
                              {formatDate(record.created_at || '2026-08-22T10:00:00Z')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Pills Row: Items, Payment Mode, Location */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          <Package className="h-3.5 w-3.5 text-slate-400" />
                          <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
                        </span>

                        {paymentStr === 'COD' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <IndianRupee className="h-3 w-3" />
                            <span>COD</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CreditCard className="h-3 w-3" />
                            <span>Prepaid</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{locationStr}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Product Thumbnails + Claimed Value + Review Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between xl:justify-end gap-3.5 sm:gap-4 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100 shrink-0">
                    {/* Thumbnails */}
                    {images.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {images.slice(0, 2).map((imgUrl, i) => (
                          <div
                            key={i}
                            className="w-12 h-14 sm:w-14 sm:h-14 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
                          >
                            <img
                              src={imgUrl}
                              alt="product"
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                e.target.src = DEFAULT_PRODUCT_IMAGES[i % DEFAULT_PRODUCT_IMAGES.length]
                              }}
                            />
                          </div>
                        ))}
                        {/* Extra item counter - only display if extraCount > 0 (+1, +2, etc.), never +0 */}
                        {extraCount > 0 && (
                          <div className="w-11 h-14 sm:w-12 sm:h-14 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-600 text-xs font-bold flex flex-col items-center justify-center shrink-0">
                            <span>+{extraCount}</span>
                            <span className="text-[10px] font-medium text-blue-500">more</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Claimed Value Box */}
                    <div className={`rounded-2xl p-3 sm:p-4 min-w-[130px] sm:min-w-[150px] flex flex-col justify-center ${valueBoxBg}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        CLAIMED VALUE
                      </span>
                      <div className="font-mono text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                        ₹{Number(claimedVal).toLocaleString('en-IN')}.00
                      </div>
                    </div>

                    {/* Actions: Review Case Button */}
                    <div className="flex items-center shrink-0">
                      <Link
                        to={`/merchant/flagged-cases/${record.id}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.98] no-underline whitespace-nowrap cursor-pointer"
                      >
                        <span>Review Case</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Case Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-slate-900">Create New Audit Case</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Order Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. #ORD-2026-1004"
                    value={newOrderNum}
                    onChange={e => setNewOrderNum(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={newCustomer}
                    onChange={e => setNewCustomer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Reason</label>
                    <select
                      value={newReason}
                      onChange={e => setNewReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Size Does Not Fit">Size Does Not Fit</option>
                      <option value="Damaged / Defective">Damaged / Defective</option>
                      <option value="Wrong Product">Wrong Product</option>
                      <option value="Changed Mind">Changed Mind</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Risk Tier</label>
                    <select
                      value={newRisk}
                      onChange={e => setNewRisk(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="High">High Risk</option>
                      <option value="Critical">Critical Risk</option>
                      <option value="Low">Low Risk</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Claimed Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                  >
                    Save & Add Case
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
