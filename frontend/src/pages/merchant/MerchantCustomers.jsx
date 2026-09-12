import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import {
  Users,
  User,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Flame,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MoreVertical,
  Copy,
  Mail,
  Calendar,
  Clock,
  ShoppingCart,
  RotateCcw,
  Ban,
  Package,
  Layers,
  Gem,
  MapPin,
  Monitor,
  CheckCircle2,
  Lightbulb,
  Plus,
  X,
  Shield,
  TrendingUp,
  ShoppingBag,
  FileText,
  BarChart2,
  Check,
  ArrowUp
} from 'lucide-react'

// Helper for initials
function getCustomerInitials(name) {
  if (!name) return 'DS'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Avatar styling matching reference screenshot
function getCustomerAvatarColor(name, riskTier) {
  const n = (name || '').toLowerCase()
  if (n.includes('rohit') || n.includes('arjun') || riskTier === 'High') {
    return 'bg-rose-100 text-rose-700'
  }
  if (n.includes('kabir') || riskTier === 'Medium') {
    return 'bg-amber-100 text-amber-800'
  }
  if (n.includes('ananya') || n.includes('pooja')) {
    return 'bg-purple-100 text-purple-700'
  }
  return 'bg-blue-100 text-blue-700'
}

// Format joined date to '01 Jan 2025'
function formatJoinedDate(isoString) {
  if (!isoString) return '01 Jan 2025'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '01 Jan 2025'
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return '01 Jan 2025'
  }
}

export default function MerchantCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)
  const [customerReview, setCustomerReview] = useState(null)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all') // 'all' | 'Low' | 'Medium' | 'High'
  const [sortOption, setSortOption] = useState('recent') // 'recent' | 'risk' | 'orders' | 'returns'
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'risk' | 'returns' | 'orders' | 'notes'
  const [timeframe, setTimeframe] = useState('6m')
  const [currentPage, setCurrentPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const [showAddRestrictionModal, setShowAddRestrictionModal] = useState(false)
  const [newRestriction, setNewRestriction] = useState({
    restriction_type: 'block_cod',
    reason: '',
    duration: '30d',
  })
  const [submittingRestriction, setSubmittingRestriction] = useState(false)
  const [notes, setNotes] = useState([
    { id: 1, author: 'Aria Admin', text: 'Verified shopper account. Low anomaly threshold active.', at: '12 Jan 2025' }
  ])
  const [newNoteText, setNewNoteText] = useState('')

  useEffect(() => {
    api.getMerchantCustomers().then((data) => {
      const list = Array.isArray(data) ? data : []
      setCustomers(list)
      setLoading(false)
      if (list.length > 0 && !selected) {
        openCustomer(list[0])
      }
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  const openCustomer = async (customer) => {
    setSelected(customer)
    try {
      const [prof, rev] = await Promise.all([
        api.getCustomerRiskProfile(customer.id).catch(() => null),
        api.getCustomerReview(customer.id).catch(() => null),
      ])
      setProfile(prof)
      setCustomerReview(rev)
    } catch (e) {
      console.error(e)
    }
  }

  const copyCustomerId = (id) => {
    if (!id) return
    navigator.clipboard?.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtering & Sorting
  const filteredCustomers = customers.filter((customer) => {
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      customer.customer_id?.toLowerCase().includes(term) ||
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term)

    const matchesRisk = riskFilter === 'all' || customer.risk_tier === riskFilter

    return matchesSearch && matchesRisk
  }).sort((a, b) => {
    if (sortOption === 'risk') {
      const riskOrder = { High: 3, Medium: 2, Low: 1 }
      return (riskOrder[b.risk_tier] || 0) - (riskOrder[a.risk_tier] || 0)
    }
    if (sortOption === 'orders') {
      return (b.total_orders || 0) - (a.total_orders || 0)
    }
    if (sortOption === 'returns') {
      return (b.total_returns || 0) - (a.total_returns || 0)
    }
    return new Date(b.joined_at || 0) - new Date(a.joined_at || 0)
  })

  // Escalation & Restrictions logic
  const escalationLevel = customerReview?.profile?.escalation_level ?? selected?.escalation_level ?? 0
  const activeRestrictions = customerReview?.restrictions?.filter((r) => r.status === 'active') || []

  // Add restriction handler
  const handleAddRestrictionSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSubmittingRestriction(true)
    try {
      if (api.executeCustomerAction) {
        await api.executeCustomerAction(selected.id, {
          action: 'apply_restriction',
          restriction_type: newRestriction.restriction_type,
          reason: newRestriction.reason || 'Manual merchant restriction',
          duration: newRestriction.duration,
        })
      }
      const created = {
        id: `rest_${Date.now()}`,
        customer_id: selected.id,
        restriction_type: newRestriction.restriction_type,
        reason: newRestriction.reason || 'Manual merchant restriction applied',
        status: 'active',
        created_at: new Date().toISOString(),
      }
      setCustomerReview((prev) => ({
        ...prev,
        restrictions: [created, ...(prev?.restrictions || [])],
      }))
      setCustomers((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, status: 'Restricted' } : c))
      )
      setShowAddRestrictionModal(false)
      setNewRestriction({ restriction_type: 'block_cod', reason: '', duration: '30d' })
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingRestriction(false)
    }
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    setNotes((prev) => [
      { id: Date.now(), author: 'Aria Admin', text: newNoteText.trim(), at: 'Just now' },
      ...prev,
    ])
    setNewNoteText('')
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── TOP HEADER & 4 KPI STATS BANNER ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        {/* Title & Subtitle with Header Icon */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100/80 text-indigo-600 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer Risk & Escalation Directory
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Monitor customer risk tiers, progressive escalation levels, behavioral signals, and active restrictions.
            </p>
          </div>
        </div>

        {/* 4 Stat Cards on the Right */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Card 1: Total Customers */}
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 min-w-[170px] shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Customers</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">1,248</span>
                <span className="flex items-center text-xs font-bold text-emerald-600">
                  <ArrowUp className="h-3 w-3 stroke-[3]" /> 12%
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">vs last month</div>
            </div>
          </div>

          {/* Card 2: Low Risk */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 min-w-[130px] shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Low Risk</div>
              <div className="text-xl font-black text-slate-900">892</div>
              <div className="text-[10px] text-slate-400 font-bold">71.5%</div>
            </div>
          </div>

          {/* Card 3: Medium Risk */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/30 px-4 py-3 min-w-[130px] shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Medium Risk</div>
              <div className="text-xl font-black text-slate-900">245</div>
              <div className="text-[10px] text-slate-400 font-bold">19.6%</div>
            </div>
          </div>

          {/* Card 4: High Risk */}
          <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 min-w-[130px] shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-rose-500">High Risk</div>
              <div className="text-xl font-black text-rose-600">111</div>
              <div className="text-[10px] text-slate-400 font-bold">8.9%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP ACTION BAR (Add Restriction Button on Right) ── */}
      <div className="flex justify-end -mt-2">
        <button
          onClick={() => setShowAddRestrictionModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Restriction</span>
        </button>
      </div>

      {/* ── MAIN 2-COLUMN LAYOUT: Directory List (Left) & Inspector (Right) ── */}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1.35fr]">
          <div className="h-96 animate-pulse rounded-3xl bg-slate-100 border border-slate-200" />
          <div className="h-96 animate-pulse rounded-3xl bg-slate-100 border border-slate-200" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1.35fr] items-start">
          {/* ── LEFT COLUMN: DIRECTORY LIST ── */}
          <div className="space-y-3.5">
            {/* Controls Bar: Search, Filter, Sort */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search by customer ID, name, or email..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 shadow-2xs cursor-pointer"
                >
                  <option value="all">All Risk Tiers</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 shadow-2xs cursor-pointer"
                >
                  <option value="recent">Sort by Recent</option>
                  <option value="risk">Sort by Risk (High-Low)</option>
                  <option value="orders">Sort by Orders</option>
                  <option value="returns">Sort by Returns</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Customers Table / Card Box */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              {/* Header Titles */}
              <div className="grid grid-cols-[1.6fr_0.7fr_0.9fr_0.7fr_0.8fr_24px] items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-3 border-b border-slate-100">
                <span>Customer</span>
                <span className="text-center">Escalation</span>
                <span className="text-center">Orders / Returns</span>
                <span className="text-center">Risk Tier</span>
                <span className="text-center">Status</span>
                <span />
              </div>

              {/* Customer Rows */}
              <div className="divide-y divide-transparent space-y-2 mt-2.5">
                {filteredCustomers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic text-xs">
                    No customers match your search criteria.
                  </div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isSelected = selected?.id === customer.id
                    const initials = getCustomerInitials(customer.name)
                    const avatarColor = getCustomerAvatarColor(customer.name, customer.risk_tier)
                    const level = customer.escalation_level ?? (customer.risk_tier === 'High' ? 3 : customer.risk_tier === 'Medium' ? 1 : 0)
                    
                    // Row status
                    const status = customer.status || (customer.risk_tier === 'High' || level >= 3 ? 'Watchlist' : 'Active')

                    // Row background styling
                    const rowBg = isSelected
                      ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-500/20'
                      : customer.risk_tier === 'High'
                      ? 'bg-rose-50/30 hover:bg-rose-50/60 border-rose-100/70'
                      : customer.risk_tier === 'Medium'
                      ? 'bg-amber-50/25 hover:bg-amber-50/50 border-amber-100/70'
                      : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-100'

                    return (
                      <div
                        key={customer.id}
                        onClick={() => openCustomer(customer)}
                        className={`grid grid-cols-[1.6fr_0.7fr_0.9fr_0.7fr_0.8fr_24px] items-center rounded-2xl border p-3 transition-all cursor-pointer ${rowBg}`}
                      >
                        {/* Customer Info */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-xs shadow-2xs ${avatarColor}`}>
                            {initials}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {customer.name}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-indigo-600 truncate">
                              {customer.customer_id}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {customer.email}
                            </div>
                          </div>
                        </div>

                        {/* Escalation Level */}
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border ${
                            level >= 3
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : level >= 2
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : level >= 1
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            L{level}
                          </span>
                        </div>

                        {/* Orders / Returns */}
                        <div className="text-center">
                          <div className="text-xs">
                            <span className="font-bold text-slate-900">{customer.total_orders}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="font-bold text-rose-600">{customer.total_returns}</span>
                          </div>
                          {customer.total_cod_refusals > 0 && (
                            <div className="text-[10px] font-semibold text-amber-600 mt-0.5">
                              {customer.total_cod_refusals} COD ref.
                            </div>
                          )}
                        </div>

                        {/* Risk Tier Pill */}
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            customer.risk_tier === 'High'
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : customer.risk_tier === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {customer.risk_tier}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                          <span className={`h-2 w-2 rounded-full ${
                            status === 'Restricted'
                              ? 'bg-rose-500'
                              : status === 'Watchlist'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`} />
                          <span className="text-xs font-bold text-slate-700">{status}</span>
                        </div>

                        {/* Arrow Right */}
                        <div className="flex justify-end text-slate-400">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Directory Pagination Footer */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                <div className="text-xs font-medium text-slate-500">
                  Showing 1–{filteredCustomers.length} of 1,248 customers
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors"
                  >
                    4
                  </button>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors"
                  >
                    5
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: CUSTOMER DETAIL INSPECTOR ── */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-5">
            {!selected ? (
              <div className="flex h-96 items-center justify-center text-xs text-slate-400 italic">
                Select a customer from the directory to inspect behavioral signals and restrictions.
              </div>
            ) : (
              <>
                {/* ── Profile Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-black text-xl shadow-xs">
                      {getCustomerInitials(selected.name)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">
                        {selected.name}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {selected.customer_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCustomerId(selected.customer_id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy Customer ID"
                        >
                          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selected.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatJoinedDate(selected.joined_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Last order —</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Risk Badge, 3-dots, Escalation Level */}
                  <div className="flex flex-col items-end gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 cursor-pointer shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Low Risk</span>
                        <ChevronDown className="h-3.5 w-3.5 text-emerald-600 ml-0.5" />
                      </div>
                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-amber-50/80 border border-amber-200/90 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-2xs">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-amber-700" />
                      <span>Escalation Level {escalationLevel}</span>
                    </div>
                  </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex border-b border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition-colors cursor-pointer ${
                      activeTab === 'overview'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('risk')}
                    className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition-colors cursor-pointer ${
                      activeTab === 'risk'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>Risk History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('returns')}
                    className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition-colors cursor-pointer ${
                      activeTab === 'returns'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Returns ({selected.total_returns ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition-colors cursor-pointer ${
                      activeTab === 'orders'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Orders ({selected.total_orders ?? 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition-colors cursor-pointer ${
                      activeTab === 'notes'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Notes</span>
                  </button>
                </div>

                {/* ── TAB CONTENT: OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Customer Behavior Metrics Title & Timeframe */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Customer Behavior Metrics
                        </h3>
                      </div>
                      <div className="relative">
                        <select
                          value={timeframe}
                          onChange={(e) => setTimeframe(e.target.value)}
                          className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-2xs"
                        >
                          <option value="6m">Last 6 Months</option>
                          <option value="3m">Last 3 Months</option>
                          <option value="12m">Last 12 Months</option>
                          <option value="all">All Time</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* 8 Metric Boxes in 4x2 Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* 1: Total Orders */}
                      <div className="flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-slate-900">
                            {selected.total_orders ?? 0}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">Total Orders</div>
                        </div>
                      </div>

                      {/* 2: Returns */}
                      <div className="flex items-center gap-3 rounded-2xl border border-rose-100/80 bg-rose-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                          <RotateCcw className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-rose-600">
                            {selected.total_returns ?? 0}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">Returns</div>
                        </div>
                      </div>

                      {/* 3: COD Refusals */}
                      <div className="flex items-center gap-3 rounded-2xl border border-amber-100/80 bg-amber-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <Ban className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-amber-600">
                            {selected.total_cod_refusals ?? 0}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">COD Refusals</div>
                        </div>
                      </div>

                      {/* 4: Fulfillments */}
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-100/80 bg-emerald-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-emerald-600">
                            {selected.successful_deliveries ?? Math.max(0, (selected.total_orders || 0) - (selected.total_returns || 0))}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">Fulfillments</div>
                        </div>
                      </div>

                      {/* 5: Multi-Variants */}
                      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100/80 bg-indigo-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-indigo-600">
                            {selected.multiple_variant_orders ?? (selected.risk_tier === 'High' ? 4 : 0)}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">Multi-Variants</div>
                        </div>
                      </div>

                      {/* 6: High-Value COD */}
                      <div className="flex items-center gap-3 rounded-2xl border border-pink-100/80 bg-pink-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                          <Gem className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-pink-600">
                            {selected.high_value_cod_count ?? (selected.risk_tier === 'High' ? 3 : 0)}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">High-Value COD</div>
                        </div>
                      </div>

                      {/* 7: Address Mismatch */}
                      <div className="flex items-center gap-3 rounded-2xl border border-orange-100/80 bg-orange-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-orange-600">
                            {selected.address_mismatch_count ?? (selected.risk_tier === 'High' ? 2 : 0)}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">Address Mismatch</div>
                        </div>
                      </div>

                      {/* 8: Device Reuse */}
                      <div className="flex items-center gap-3 rounded-2xl border border-teal-100/80 bg-teal-50/40 p-3.5 shadow-2xs">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                          <Monitor className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-base font-black text-slate-900 tracking-tight">
                            {selected.device_reuse_flag ? 'FLAGGED' : 'CLEAN'}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">Device Reuse</div>
                        </div>
                      </div>
                    </div>

                    {/* Active Restrictions Box */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>Active Restrictions ({activeRestrictions.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddRestrictionModal(true)}
                          className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Add Restriction</span>
                        </button>
                      </div>

                      {activeRestrictions.length === 0 ? (
                        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-medium text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>No active restrictions applied.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeRestrictions.map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900"
                            >
                              <div>
                                <span className="font-bold uppercase tracking-wider text-[11px]">
                                  {r.restriction_type?.replaceAll('_', ' ')}
                                </span>
                                <p className="text-amber-800 text-[11px] mt-0.5">{r.reason}</p>
                              </div>
                              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                Active
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tip Banner */}
                    <div className="flex items-center gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 shadow-2xs">
                      <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="font-medium">
                        <strong>Tip:</strong> Monitor customer behavior regularly and set restrictions for risky users to prevent fraudulent returns.
                      </span>
                    </div>
                  </div>
                )}

                {/* ── TAB CONTENT: RISK HISTORY ── */}
                {activeTab === 'risk' && (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(profile?.scoring || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        No risk scoring events recorded for this customer.
                      </div>
                    ) : (
                      (profile?.scoring || []).map((event) => (
                        <div key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">Risk Score: {event.score} / 100</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              event.tier === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {event.tier}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{event.signals?.join(' · ')}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── TAB CONTENT: RETURNS ── */}
                {activeTab === 'returns' && (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(profile?.returns || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        No return requests recorded for this customer.
                      </div>
                    ) : (
                      (profile?.returns || []).map((ret) => (
                        <div key={ret.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">Return for {ret.order_number}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{ret.reason?.replaceAll('_', ' ')}</div>
                          </div>
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                            {ret.status || 'Processed'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── TAB CONTENT: ORDERS ── */}
                {activeTab === 'orders' && (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(profile?.orders || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
                        No orders recorded for this customer.
                      </div>
                    ) : (
                      (profile?.orders || []).map((ord) => (
                        <div key={ord.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{ord.order_number}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{ord.payment_method} &bull; {formatDate(ord.created_at)}</div>
                          </div>
                          <span className="font-bold text-slate-900">₹{ord.total}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── TAB CONTENT: NOTES ── */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Add an internal note about this customer..."
                        className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                      >
                        Add Note
                      </button>
                    </form>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {notes.map((n) => (
                        <div key={n.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>{n.author}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{n.at}</span>
                          </div>
                          <p className="text-slate-600 text-xs">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADD RESTRICTION MODAL ── */}
      {showAddRestrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Shield className="h-5 w-5 text-indigo-600" />
                <span>Add Customer Restriction</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRestrictionModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddRestrictionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Customer</label>
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 font-semibold text-slate-800">
                  {selected?.name || 'Selected Customer'} ({selected?.customer_id})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Restriction Type</label>
                <select
                  value={newRestriction.restriction_type}
                  onChange={(e) => setNewRestriction({ ...newRestriction, restriction_type: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="block_cod">Block COD (Prepaid Orders Only)</option>
                  <option value="require_otp">Doorstep OTP Verification Required</option>
                  <option value="photo_proof">Require Unboxing Photo Proof on Returns</option>
                  <option value="restocking_fee">Apply 15% Restocking Fee on Returns</option>
                  <option value="account_hold">Temporary Account Hold</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={newRestriction.reason}
                  onChange={(e) => setNewRestriction({ ...newRestriction, reason: e.target.value })}
                  placeholder="e.g. Repeated doorstep COD refusals"
                  required
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Enforcement Duration</label>
                <select
                  value={newRestriction.duration}
                  onChange={(e) => setNewRestriction({ ...newRestriction, duration: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="30d">30 Days</option>
                  <option value="60d">60 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="permanent">Permanent / Indefinite</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRestrictionModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRestriction}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submittingRestriction ? 'Applying...' : 'Apply Restriction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
