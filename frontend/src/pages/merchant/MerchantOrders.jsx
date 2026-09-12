import { useEffect, useState, useMemo } from 'react'
import { api } from '../../mock/api'
import {
  ShoppingBag,
  Package,
  Truck,
  Clock,
  RotateCcw,
  AlertTriangle,
  Calendar,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react'

// Tab configuration template
const TAB_KEYS = [
  { id: 'All', label: 'All' },
  { id: 'Delivered', label: 'Delivered' },
  { id: 'In Transit', label: 'In Transit' },
  { id: 'Return Requested', label: 'Return Requested' },
  { id: 'COD', label: 'COD' },
  { id: 'Prepaid', label: 'Prepaid' },
  { id: 'Flagged', label: 'Flagged' },
]

function formatOrderDate(dateStr) {
  if (!dateStr) return { date: '24 Aug 2026', time: '10:24 AM' }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { date: String(dateStr), time: '' }
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return { date, time }
}

export default function MerchantOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(11)
  const [dateFilter, setDateFilter] = useState('Last 30 Days')
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Doorstep refusal modal state
  const [refusalModalOrder, setRefusalModalOrder] = useState(null)
  const [refusalReason, setRefusalReason] = useState('Customer rejected package at doorstep')
  const [refusalType, setRefusalType] = useState('customer_rejected')
  const [refusalNotes, setRefusalNotes] = useState('')
  const [loggingRefusal, setLoggingRefusal] = useState(false)
  const [refusalSuccess, setRefusalSuccess] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    setError(null)
    api
      .getMerchantOrders()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load orders from server.')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleCopy = (orderNumber) => {
    navigator.clipboard?.writeText(orderNumber)
    setCopiedId(orderNumber)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleStatusUpdate = async (orderId, newDeliveryStatus) => {
    setUpdatingId(orderId)
    setSuccessMessage('')
    try {
      await api.updateOrderStatus({ orderId, deliveryStatus: newDeliveryStatus })
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.order_number === orderId
            ? {
                ...o,
                delivery_status: newDeliveryStatus,
                status: newDeliveryStatus === 'Delivered' ? 'Delivered' : o.status,
              }
            : o
        )
      )
      if (newDeliveryStatus === 'Delivered') {
        setSuccessMessage(`Order #${orderId} marked as Delivered! Confirmation email with Return button sent to customer.`)
      } else {
        setSuccessMessage(`Order #${orderId} status updated to ${newDeliveryStatus}.`)
      }
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to update order status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleLogRefusal = async (e) => {
    e.preventDefault()
    if (!refusalModalOrder) return
    setLoggingRefusal(true)
    try {
      await api.reportDoorstepRefusal({
        orderId: refusalModalOrder.id,
        reason: refusalReason,
        refusal_type: refusalType,
        notes: refusalNotes,
      })
      setRefusalSuccess(`✓ Doorstep refusal logged for ${refusalModalOrder.order_number}. Customer profile escalated.`)
      setRefusalModalOrder(null)
      fetchOrders()
      setTimeout(() => setRefusalSuccess(''), 5000)
    } catch (err) {
      alert(err.message || 'Failed to log doorstep refusal')
    } finally {
      setLoggingRefusal(false)
    }
  }

  // Filter orders based on active tab and optional search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab matching
      if (activeTab === 'Delivered') {
        if (order.delivery_status !== 'Delivered' && order.status !== 'Delivered') return false
      } else if (activeTab === 'In Transit') {
        const isInTransit = ['In Transit', 'Shipped', 'Out for Delivery', 'Processing'].includes(order.delivery_status || order.status)
        if (!isInTransit) return false
      } else if (activeTab === 'Return Requested') {
        const isRet =
          order.delivery_status === 'Return Requested' ||
          order.delivery_status === 'Return Processing' ||
          order.status === 'Return Requested'
        if (!isRet) return false
      } else if (activeTab === 'COD') {
        if ((order.payment_method || '').toUpperCase() !== 'COD') return false
      } else if (activeTab === 'Prepaid') {
        if ((order.payment_method || '').toUpperCase() === 'COD') return false
      } else if (activeTab === 'Flagged') {
        const isFlagged = (order.risk_tier || '').toLowerCase() === 'high' || order.status === 'Review' || order.is_flagged
        if (!isFlagged) return false
      }

      // Search query matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNumber = order.order_number?.toLowerCase().includes(q)
        const matchName = order.customer_name?.toLowerCase().includes(q)
        const matchEmail = order.customer_email?.toLowerCase().includes(q)
        const matchPayment = order.payment_method?.toLowerCase().includes(q)
        if (!matchNumber && !matchName && !matchEmail && !matchPayment) return false
      }

      return true
    })
  }, [orders, activeTab, searchQuery])

  // Reset page to 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  // Dynamic tabs calculation from real orders
  const tabs = useMemo(() => {
    const total = orders.length
    const delivered = orders.filter((o) => (o.delivery_status || o.status) === 'Delivered').length
    const inTransit = orders.filter((o) => ['In Transit', 'Shipped', 'Out for Delivery', 'Processing'].includes(o.delivery_status || o.status)).length
    const returnRequested = orders.filter((o) => {
      const s = (o.delivery_status || o.status || '').toLowerCase()
      return s.includes('return') || o.return_status
    }).length
    const cod = orders.filter((o) => (o.payment_method || o.payment_mode || '').toUpperCase() === 'COD').length
    const prepaid = orders.filter((o) => {
      const p = (o.payment_method || o.payment_mode || '').toUpperCase()
      return p !== 'COD' && p !== ''
    }).length
    const flagged = orders.filter((o) => o.is_flagged || o.fraud_score > 60 || (o.risk_tier || '').toLowerCase() === 'high' || o.status === 'Review').length

    return [
      { id: 'All', label: 'All', count: total },
      { id: 'Delivered', label: 'Delivered', count: delivered },
      { id: 'In Transit', label: 'In Transit', count: inTransit },
      { id: 'Return Requested', label: 'Return Requested', count: returnRequested },
      { id: 'COD', label: 'COD', count: cod },
      { id: 'Prepaid', label: 'Prepaid', count: prepaid },
      { id: 'Flagged', label: 'Flagged', count: flagged },
    ]
  }, [orders])

  // Pagination calculation
  const totalCountForTab = filteredOrders.length
  const totalPages = Math.max(1, Math.ceil(totalCountForTab / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCountForTab)

  // Current page records: cycle or slice from filtered orders
  const currentOrders = useMemo(() => {
    if (filteredOrders.length === 0) return []
    if (filteredOrders.length <= itemsPerPage) return filteredOrders
    const start = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(start, start + itemsPerPage)
  }, [filteredOrders, currentPage, itemsPerPage])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(currentOrders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Orders Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Track delivery lifecycles, update delivery status, and log doorstep refusal events.
            </p>
          </div>
        </div>
      </div>

      {/* ── Toast Messages ────────────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-800 animate-fade-in shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {refusalSuccess && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs sm:text-sm text-emerald-800 animate-fade-in shadow-2xs">
          <span>{refusalSuccess}</span>
          <button
            onClick={() => setRefusalSuccess('')}
            className="text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
          <span>{error}</span>
          <button
            onClick={fetchOrders}
            className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Top 6 Metric Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">1,248</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center text-[11px] font-semibold text-emerald-600">
            <span>↑ +12%</span>
            <span className="text-slate-400 font-normal ml-1">vs last month</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Delivered</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">892</p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 font-normal">71.5%</p>
        </div>

        {/* In Transit */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">In Transit</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">214</p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 font-normal">17.2%</p>
        </div>

        {/* Return Requested */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Return Requested</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">78</p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 font-normal">6.3%</p>
        </div>

        {/* COD Orders */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">COD Orders</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">56</p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 font-normal">4.5%</p>
        </div>

        {/* Flagged Orders */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Flagged Orders</p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">8</p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 font-normal">0.6%</p>
        </div>
      </div>

      {/* ── Filters Bar & Tabs ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none max-w-full sm:flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {tab.label} ({tab.count.toLocaleString()})
              </button>
            )
          })}
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          {/* Date Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>{dateFilter}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-30 animate-in fade-in zoom-in-95">
                {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDateFilter(d)
                      setShowDateDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg cursor-pointer ${
                      dateFilter === d ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => {
              const query = prompt('Filter orders by Customer Name or SKU:', searchQuery)
              if (query !== null) setSearchQuery(query)
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* ── Orders Table ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">Loading orders…</div>
        ) : currentOrders.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">No orders found matching this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/70">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={currentOrders.length > 0 && selectedIds.length === currentOrders.length}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Delivery Status</th>
                  <th className="px-4 py-3.5">Risk Tier</th>
                  <th className="px-4 py-3.5">
                    <div className="flex items-center gap-1 cursor-pointer text-indigo-600 hover:text-indigo-800">
                      <span>Date</span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOrders.map((order) => {
                  const isDelivered = order.delivery_status === 'Delivered'
                  const isUpdating = updatingId === order.id
                  const { date, time } = formatOrderDate(order.created_at)
                  const isSelected = selectedIds.includes(order.id)

                  // Payment badge style
                  let paymentClass = 'bg-[#e0f2fe] text-[#0369a1]'
                  if (order.payment_method === 'Credit Card') paymentClass = 'bg-[#ede9fe] text-[#6d28d9]'
                  else if (order.payment_method === 'UPI') paymentClass = 'bg-[#dcfce7] text-[#15803d]'
                  else if (order.payment_method === 'COD') paymentClass = 'bg-[#ffe4e6] text-[#e11d48]'

                  // Delivery status badge style
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                      <Truck className="h-3.5 w-3.5" />
                      In Transit
                    </span>
                  )
                  if (order.delivery_status === 'Delivered') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Delivered
                      </span>
                    )
                  } else if (
                    order.delivery_status === 'Return Processing' ||
                    order.delivery_status === 'Return Requested'
                  ) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Return Processing
                      </span>
                    )
                  } else if (order.delivery_status === 'Cancelled') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelled
                      </span>
                    )
                  }

                  // Risk tier badge
                  let riskBadge = (
                    <span className="inline-block rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Low
                    </span>
                  )
                  if (order.risk_tier === 'Medium') {
                    riskBadge = (
                      <span className="inline-block rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Medium
                      </span>
                    )
                  } else if (order.risk_tier === 'High') {
                    riskBadge = (
                      <span className="inline-block rounded-md border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        High
                      </span>
                    )
                  } else if (order.delivery_status === 'Cancelled') {
                    riskBadge = <span className="text-slate-400 font-bold">—</span>
                  }

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(order.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Order Number & Copy */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {order.order_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.order_number)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition"
                            title="Copy Order ID"
                          >
                            {copiedId === order.order_number ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 text-xs leading-tight">
                          {order.customer_name || 'Demo Shopper'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {order.customer_email || 'demo@shopper.com'}
                        </p>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${paymentClass}`}>
                          {order.payment_method}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">
                        ₹{Math.round(order.total || 0)}
                      </td>

                      {/* Delivery Status */}
                      <td className="px-4 py-3.5">{statusBadge}</td>

                      {/* Risk Tier */}
                      <td className="px-4 py-3.5">{riskBadge}</td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-700 text-xs leading-tight">{date}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{time}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Mark Delivered Button if not yet delivered */}
                          {!isDelivered && order.delivery_status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                              disabled={isUpdating}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{isUpdating ? '...' : 'Mark Delivered'}</span>
                            </button>
                          )}

                          {/* Status Selector Dropdown */}
                          <div className="relative">
                            <select
                              value={order.delivery_status || 'Processing'}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              disabled={isUpdating}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition shadow-2xs"
                            >
                              <option value="In Transit">In Transit</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Return Processing">Return Processing</option>
                              <option value="Processing">Processing</option>
                              <option value="Return Requested">Return Requested</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>

                          {/* Log Refusal Button for Delivered COD orders */}
                          {order.payment_method === 'COD' && order.delivery_status === 'Delivered' && (
                            <button
                              type="button"
                              onClick={() => setRefusalModalOrder(order)}
                              className="rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-semibold px-2.5 py-1.5 text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                              <span>Log Refusal</span>
                            </button>
                          )}

                          {/* More Options Button */}
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer Pagination ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
        <p>
          Showing <span className="font-semibold text-slate-700">{totalCountForTab > 0 ? startIndex + 1 : 0}–{endIndex}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalCountForTab.toLocaleString()}</span> orders
        </p>

        <div className="flex items-center gap-1 self-start sm:self-auto">
          {/* Previous Page */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition shadow-2xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Page numbers [1], 2, 3, 4, 5 */}
          {[1, 2, 3, 4, 5].slice(0, Math.min(5, totalPages)).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition shadow-2xs ${
                currentPage === pageNum
                  ? 'bg-blue-600 font-bold text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {/* Next Page */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer transition shadow-2xs"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Doorstep Refusal Modal ───────────────────────────────── */}
      {refusalModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" /> Log Doorstep COD Refusal
              </h3>
              <button
                type="button"
                onClick={() => setRefusalModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogRefusal} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="font-semibold text-slate-900">
                  Order: {refusalModalOrder.order_number} (₹{Math.round(refusalModalOrder.total || 0)})
                </p>
                <p className="text-slate-600 mt-0.5">Customer: {refusalModalOrder.customer_name}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Primary Refusal Reason
                </label>
                <select
                  value={refusalReason}
                  onChange={(e) => setRefusalReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Customer rejected package at doorstep">Customer rejected package at doorstep</option>
                  <option value="Customer unavailable / Phone switched off">Customer unavailable / Phone switched off</option>
                  <option value="Fake / Incomplete delivery address">Fake / Incomplete delivery address</option>
                  <option value="Customer refused cash payment (No Money)">Customer refused cash payment (No Money)</option>
                  <option value="Customer demanded opening package without payment">
                    Customer demanded opening package without payment
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Refusal Classification Code
                </label>
                <select
                  value={refusalType}
                  onChange={(e) => setRefusalType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="customer_rejected">Customer Rejected (Intentional)</option>
                  <option value="customer_unavailable">Customer Unavailable (Non-contactable)</option>
                  <option value="fake_address">Fake Address / Organized Fraud</option>
                  <option value="cod_cash_shortage">Payment Failure at Doorstep</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Delivery Agent Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={refusalNotes}
                  onChange={(e) => setRefusalNotes(e.target.value)}
                  placeholder="Optional delivery attempt remarks..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ Submitting this will mark the order as <strong>Refused</strong>, increment the customer's COD refusal count, and trigger <strong>Progressive Escalation</strong> on their profile.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefusalModalOrder(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingRefusal}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {loggingRefusal ? 'Logging…' : 'Log Refusal & Escalate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
