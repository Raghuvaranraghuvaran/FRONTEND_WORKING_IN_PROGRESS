import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../mock/api'
import { formatDate, formatDateTime, INR } from '../lib/format'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  HelpCircle,
  Info,
  KeyRound,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react'

const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Found a better price',
  'No longer needed',
  'Wrong product ordered',
  'Delivery taking too long',
  'Other',
]

// Fallback product image catalog
const PRODUCT_IMAGE_MAP = {
  headset: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
  backpack: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
  bottle: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80',
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
  shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
  sneaker: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
  speaker: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&q=80',
  powerbank: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
  saree: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
  lehenga: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
  trouser: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80',
  lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
  cushion: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=400&q=80',
  basket: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=400&q=80',
  dinner: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=400&q=80',
  dress: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80',
}

function resolveItemImage(item) {
  if (item.imageUrl) return item.imageUrl
  if (item.image) return item.image
  const nameLower = (item.title || item.name || '').toLowerCase()
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (nameLower.includes(key)) return url
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
}

function formatPrice(val) {
  const num = Number(val) || 0
  if (num < 100) {
    return `$${num.toFixed(2)}`
  }
  return INR.format(num)
}

/**
 * Normalizes raw backend/mock order data into the standard TypeScript interface:
 * interface Order {
 *   id: string;
 *   placedAt: string;
 *   totalAmount: number;
 *   status: 'In Transit' | 'Delivered' | 'Return Processing' | 'Cancelled';
 *   items: OrderItem[];
 *   returnEligibility?: { isEligible: boolean; daysRemaining?: number };
 *   returnTracking?: { currentStep: number; steps: string[] };
 * }
 */
function mapToOrderSchema(raw, returnsList = []) {
  const orderNum = raw.order_number || (raw.id ? (String(raw.id).startsWith('#') ? raw.id : `#${raw.id}`) : '#RG-100234')
  const rawStatus = (raw.delivery_status || raw.status || '').trim()
  const statusLower = rawStatus.toLowerCase()

  // Match existing return record
  const existingReturn = returnsList.find(
    (r) => String(r.order_id) === String(raw.id) || r.order_number === orderNum
  )

  let normalizedStatus = 'In Transit'
  if (statusLower === 'cancelled') {
    normalizedStatus = 'Cancelled'
  } else if (existingReturn || statusLower.includes('return') || raw.returnTracking) {
    normalizedStatus = 'Return Processing'
  } else if (['delivered', 'completed', 'product returned', 'refund processed'].includes(statusLower) || raw.is_delivered) {
    normalizedStatus = 'Delivered'
  } else {
    normalizedStatus = 'In Transit'
  }

  const items = (raw.items || []).map((item, idx) => ({
    id: String(item.id || item.product_id || `item_${idx}`),
    title: item.title || item.name || 'Product Item',
    variant:
      item.variant ||
      (item.quantity > 1 ? `Quantity ${item.quantity}` : (item.quantity === 1 ? 'Qty: 1' : 'Original')),
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
    imageUrl: resolveItemImage(item),
  }))

  // Return Eligibility computation (7 days window)
  let isEligible = normalizedStatus === 'Delivered'
  let daysRemaining = 7
  if (raw.delivered_at) {
    const diffDays = (Date.now() - new Date(raw.delivered_at).getTime()) / (1000 * 60 * 60 * 24)
    daysRemaining = Math.max(0, Math.ceil(7 - diffDays))
    if (daysRemaining <= 0) {
      isEligible = false
    }
  }

  // Return Tracking step calculation
  let returnTracking = raw.returnTracking
  if (!returnTracking && (normalizedStatus === 'Return Processing' || existingReturn)) {
    const retStatus = existingReturn?.status || 'manual_review'
    let currentStep = 1
    if (['approved', 'pickup_completed', 'doorstep_verified'].includes(retStatus)) currentStep = 2
    if (['refund_processed', 'completed'].includes(retStatus)) currentStep = 3
    returnTracking = {
      currentStep,
      steps: ['Item Picked Up', 'Under Inspection', 'Refund Issued'],
    }
  }

  return {
    id: orderNum,
    rawId: raw.id,
    rawOrder: raw,
    placedAt: raw.created_at || raw.placedAt || new Date().toISOString(),
    totalAmount: Number(raw.total || raw.total_amount || 0),
    status: normalizedStatus,
    items,
    returnEligibility: {
      isEligible,
      daysRemaining,
    },
    returnTracking,
    invoice: raw.invoice,
    paymentMethod: raw.payment_method || 'Prepaid',
    trackingEvents: raw.tracking_events || [],
    deliveryAddress: raw.delivery_address || '14, Lake View Street, Chennai, TN',
    cancellationReason: raw.cancellation_reason,
  }
}

export default function OrdersPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Primary State
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(location.pathname.includes('/returns') ? 'returns' : 'orders')

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Modals & Drawers
  const [trackingModalOrder, setTrackingModalOrder] = useState(null)
  const [detailsModalOrder, setDetailsModalOrder] = useState(null)
  const [supportModalOrder, setSupportModalOrder] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)
  const [coupons, setCoupons] = useState([])

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [cancelStep, setCancelStep] = useState(1) // 1: Reason, 2: OTP
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0])
  const [cancelNotes, setCancelNotes] = useState('')
  const [cancelOtp, setCancelOtp] = useState('')
  const [cancelChallengeId, setCancelChallengeId] = useState(null)
  const [cancelEmail, setCancelEmail] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [otpTimer, setOtpTimer] = useState(300)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch Orders and Returns from API
  const fetchOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [orderRes, returnRes, couponRes] = await Promise.all([
        api.getShopperOrders({
          status: statusFilter,
          search: searchQuery,
        }),
        api.getShopperReturns().catch(() => []),
        api.getAvailableCoupons().catch(() => []),
      ])

      const rawOrders = Array.isArray(orderRes) ? orderRes : orderRes?.results || []
      const rawReturns = Array.isArray(returnRes) ? returnRes : returnRes?.results || []

      const mappedOrders = rawOrders.map((o) => mapToOrderSchema(o, rawReturns))
      setOrders(mappedOrders)
      setReturns(rawReturns)
      setCoupons(Array.isArray(couponRes) ? couponRes : [])
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError(err.message || 'Failed to fetch orders from server.')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (location.pathname.includes('/returns') || location.pathname.includes('/track-return')) {
      setTab('returns')
    } else {
      setTab('orders')
    }
  }, [location.pathname])

  const handleTabChange = (newTab) => {
    setTab(newTab)
    navigate(newTab === 'returns' ? '/returns' : '/orders', { replace: true })
  }

  // Reset page when search or tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, dateFilter, tab])

  // Timer for OTP Cancellation
  useEffect(() => {
    let interval
    if (cancellingOrder && cancelStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [cancellingOrder, cancelStep, otpTimer])

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const idMatch = order.id.toLowerCase().includes(q)
        const itemMatch = order.items.some((it) => it.title.toLowerCase().includes(q))
        if (!idMatch && !itemMatch) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (order.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      // Date Range filter
      if (dateFilter !== 'all') {
        const orderTime = new Date(order.placedAt).getTime()
        const now = Date.now()
        if (dateFilter === '30days') {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
          if (orderTime < thirtyDaysAgo) return false
        } else if (dateFilter === '6months') {
          const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000
          if (orderTime < sixMonthsAgo) return false
        } else if (dateFilter === '2026') {
          const orderYear = new Date(order.placedAt).getFullYear()
          if (orderYear !== 2026) return false
        }
      }

      return true
    })
  }, [orders, searchQuery, statusFilter, dateFilter])

  // Pagination Slice
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1
  const paginatedOrders = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredOrders.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredOrders, currentPage, itemsPerPage])

  const startIndex = filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, filteredOrders.length)

  // Invoice Download Handler
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      await api.downloadInvoice(invoiceId)
      showToast('✓ Invoice downloaded successfully.')
    } catch (err) {
      console.error('Invoice download error:', err)
      showToast('⚠️ Unable to download invoice directly. Re-trying in browser tab...')
    }
  }

  // Cancellation Flow Handlers
  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order)
    setCancelStep(1)
    setCancelReason(CANCELLATION_REASONS[0])
    setCancelNotes('')
    setCancelOtp('')
    setCancelError(null)
    setCancelChallengeId(null)
    setOtpTimer(300)
  }

  const handleCloseCancelModal = () => {
    setCancellingOrder(null)
    setCancelStep(1)
    setCancelError(null)
    setCancelSubmitting(false)
  }

  const handleRequestCancelOTP = async (e) => {
    if (e) e.preventDefault()
    if (!cancellingOrder) return

    setCancelSubmitting(true)
    setCancelError(null)

    try {
      const res = await api.requestOrderCancellationOTP({
        orderId: cancellingOrder.rawId || cancellingOrder.id,
        reason: cancelReason,
      })
      setCancelChallengeId(res.challenge_id)
      setCancelEmail(res.email || 'your registered email')
      setOtpTimer(res.expires_in || 300)
      setCancelStep(2)
    } catch (err) {
      setCancelError(err.message || 'Failed to send cancellation OTP.')
    } finally {
      setCancelSubmitting(false)
    }
  }

  const handleVerifyCancelOTP = async (e) => {
    e.preventDefault()
    if (!cancellingOrder || !cancelOtp.trim()) {
      setCancelError('Please enter the 6-digit verification code.')
      return
    }

    setCancelSubmitting(true)
    setCancelError(null)

    try {
      await api.verifyOrderCancellation({
        orderId: cancellingOrder.rawId || cancellingOrder.id,
        code: cancelOtp.trim(),
        challengeId: cancelChallengeId,
        reason: cancelReason,
        notes: cancelNotes,
      })

      showToast('✓ Order cancelled successfully.')
      handleCloseCancelModal()
      fetchOrders()
    } catch (err) {
      setCancelError(err.message || 'Failed to verify OTP.')
    } finally {
      setCancelSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Your Activity</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track orders, cancel active orders, initiate returns, and monitor refunds.
        </p>
      </div>

      {/* ── Activity Tabs (Orders vs Returns) ──────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleTabChange('orders')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
            tab === 'orders'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => handleTabChange('returns')}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
            tab === 'returns'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
          }`}
        >
          Returns ({returns.length})
        </button>
      </div>

      {/* ── Search and Filter Toolbar ───────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:border-indigo-500 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">Status ▾</option>
              <option value="all">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Return Processing">Return Processing</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:border-indigo-500 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="all">Date Range ▾</option>
              <option value="all">All Time</option>
              <option value="30days">Last 30 days</option>
              <option value="6months">Last 6 months</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Coupons Strip (if available) ────────────────────────────────────── */}
      {coupons.length > 0 && (
        <div className="mb-6 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-purple-50 p-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🏷️</span>
              <p className="text-xs font-bold text-purple-950 uppercase tracking-wider">Active Exclusive Discounts</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id || coupon.code}
                  className="flex items-center gap-2 rounded-xl bg-white border border-purple-200 px-3 py-1 text-xs shadow-2xs"
                >
                  <span className="font-mono font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">
                    {coupon.code}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}% OFF`
                      : `₹${coupon.discount_value} OFF`}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coupon.code)
                      setCopiedCode(coupon.code)
                      setTimeout(() => setCopiedCode(null), 1500)
                    }}
                    className="rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode === coupon.code ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      {error ? (
        /* Error State with Functional Retry Button */
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-xs animate-in fade-in">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900 mb-1">Error Loading Orders</h3>
          <p className="text-xs text-rose-700 mb-5 max-w-md mx-auto">
            {error}. We could not communicate with the backend server. You can retry the request or browse offline catalog.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchOrders}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer"
            >
              Retry Connection
            </button>
            <Link
              to="/shop"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        /* Pulse Skeleton Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded-md bg-slate-200" />
                <div className="h-4 w-16 rounded-md bg-slate-200" />
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200" />
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                  <div className="h-3.5 w-12 rounded bg-slate-200" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                  <div className="h-3.5 w-12 rounded bg-slate-200" />
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-9 w-full rounded-xl bg-slate-200" />
                <div className="h-9 w-full rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'orders' ? (
        filteredOrders.length === 0 ? (
          /* Empty State Component */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Orders Found</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'No orders match your selected search or filter criteria. Try resetting the filters.'
                : 'You have not placed any orders yet. Discover our latest catalog with return guarantee.'}
            </p>
            {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setDateFilter('all')
                }}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm"
              >
                Browse Products →
              </Link>
            )}
          </div>
        ) : (
          /* ── 3-Column Card Grid Matching ReturnGuard Design ───────────────── */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {paginatedOrders.map((order) => {
                const isTransit = order.status === 'In Transit'
                const isDelivered = order.status === 'Delivered'
                const isReturnProc = order.status === 'Return Processing'
                const isCancelled = order.status === 'Cancelled'

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Top: Order ID & Status */}
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">Order {order.id}</h2>

                      {/* Status indicator line */}
                      <div className="mt-2 mb-4">
                        {isTransit && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                              <Truck className="h-4 w-4 text-amber-500" />
                              <span>In Transit</span>
                            </div>
                            {/* Mini Horizontal Progress Bar */}
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full w-2/3 rounded-full bg-amber-400 animate-pulse" />
                            </div>
                          </div>
                        )}

                        {isDelivered && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                            <span>Delivered</span>
                          </div>
                        )}

                        {isReturnProc && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                            <RotateCcw className="h-4 w-4 text-amber-600" />
                            <span>Return Processing</span>
                          </div>
                        )}

                        {isCancelled && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                            <X className="h-4 w-4 text-rose-500" />
                            <span>Cancelled</span>
                          </div>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="divide-y divide-slate-100 border-t border-b border-slate-100 py-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2.5 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="h-full w-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src =
                                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-[11px] text-slate-500 truncate">{item.variant}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-900 shrink-0">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Return Tracking Vertical Steps (for Return Processing card) */}
                      {isReturnProc && order.returnTracking && (
                        <div className="mt-4 pt-1 space-y-2.5">
                          {order.returnTracking.steps.map((stepName, sIdx) => {
                            const stepNum = sIdx + 1
                            const isDone = stepNum <= (order.returnTracking.currentStep || 1)
                            const isCurrent = stepNum === order.returnTracking.currentStep

                            return (
                              <div key={sIdx} className="flex items-start gap-2.5 relative">
                                {sIdx < order.returnTracking.steps.length - 1 && (
                                  <div
                                    className={`absolute left-2.25 top-5 bottom-0 w-0.5 -mb-2 ${
                                      stepNum < (order.returnTracking.currentStep || 1)
                                        ? 'bg-indigo-600'
                                        : 'bg-slate-200'
                                    }`}
                                  />
                                )}
                                <div
                                  className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5 z-10 ${
                                    isDone
                                      ? 'bg-indigo-600 text-white'
                                      : 'border-2 border-slate-300 bg-white text-transparent'
                                  }`}
                                >
                                  {isDone ? <Check className="h-2.5 w-2.5" /> : null}
                                </div>
                                <div>
                                  <p
                                    className={`text-xs font-bold ${
                                      isCurrent ? 'text-indigo-900' : isDone ? 'text-slate-900' : 'text-slate-600'
                                    }`}
                                  >
                                    {stepName}
                                  </p>
                                  <p className="text-[11px] text-slate-400">{stepName}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions and Footer Notice */}
                    <div className="mt-4 pt-2 space-y-2">
                      {isTransit && (
                        <>
                          <button
                            onClick={() => setTrackingModalOrder(order)}
                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            Track Package
                          </button>
                          <button
                            onClick={() => setDetailsModalOrder(order)}
                            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Order Details
                          </button>
                          <button
                            onClick={() => setSupportModalOrder(order)}
                            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Contact Support
                          </button>
                          <div className="pt-2 flex items-start gap-1.5 text-[11px] text-slate-500 leading-tight">
                            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>Return-eligibility indicator to cancel the wireless reliability.</span>
                          </div>
                        </>
                      )}

                      {isDelivered && (
                        <>
                          {order.returnEligibility?.isEligible ? (
                            <Link
                              to={`/orders/${order.rawId || order.id.replace('#', '')}/return`}
                              className="block w-full text-center rounded-xl border border-indigo-600 bg-white hover:bg-indigo-50/60 text-indigo-600 py-2 text-xs font-bold transition-colors"
                            >
                              Initiate Return
                            </Link>
                          ) : (
                            <span className="block w-full text-center rounded-xl bg-slate-100 text-slate-400 py-2 text-xs font-semibold">
                              Return Window Expired
                            </span>
                          )}
                          <button
                            onClick={() => showToast('✓ Items added to cart! Proceed to checkout.')}
                            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Buy Again
                          </button>
                          <button
                            onClick={() => setDetailsModalOrder(order)}
                            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Track Status
                          </button>
                        </>
                      )}

                      {isReturnProc && (
                        <div className="pt-2">
                          <button
                            onClick={() => setDetailsModalOrder(order)}
                            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            View Return Breakdown
                          </button>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="pt-2 space-y-2">
                          <button
                            onClick={() => setDetailsModalOrder(order)}
                            className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Order Summary
                          </button>
                          {order.cancellationReason && (
                            <p className="text-[11px] text-rose-600 font-medium text-center">
                              Reason: {order.cancellationReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Bottom Pagination Bar ───────────────────────────────────────── */}
            <div className="mt-8 flex items-center justify-end gap-3 text-xs font-medium text-slate-600">
              <span>
                {startIndex}-{endIndex} of {filteredOrders.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                  aria-label="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ── Returns Tab Content ────────────────────────────────────────────── */
        returns.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
              <RotateCcw className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Active Return Requests</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              You haven&apos;t initiated any return requests. Returns for eligible delivered orders can be requested directly from the Orders tab.
            </p>
            <button
              onClick={() => setTab('orders')}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer"
            >
              View Delivered Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((ret) => (
              <div key={ret.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-600">#{ret.id}</span>
                      <h2 className="text-base font-bold text-slate-900">Return for {ret.order_number}</h2>
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 capitalize">
                        {ret.status?.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Requested on {formatDate(ret.created_at)} · Reason:{' '}
                      <strong className="text-slate-700 capitalize">{ret.reason?.replaceAll('_', ' ')}</strong>
                    </p>
                    {ret.refund_method && (
                      <p className="mt-1 text-xs text-slate-500">
                        Refund Mode: <span className="font-semibold text-slate-700 capitalize">{ret.refund_method}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 mb-2">Return & Pickup Timeline</p>
                  <div className="space-y-2">
                    {(ret.timeline || [
                      { label: 'Return Requested', at: ret.created_at },
                      { label: 'Pickup Courier Dispatched', at: null },
                      { label: 'Warehouse Inspection', at: null },
                      { label: 'Refund Processed', at: null },
                    ]).map((event, index) => (
                      <div key={index} className="flex items-center gap-2.5 text-xs">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-700">{event.label}</span>
                        <span className="text-slate-400 ml-auto">
                          {event.at ? formatDateTime(event.at) : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Live Tracking Modal ─────────────────────────────────────────────── */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Package Tracking</h3>
                  <p className="text-xs text-slate-500">Order {trackingModalOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-bold text-indigo-700">{trackingModalOrder.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Total</p>
                  <p className="font-bold text-slate-900">{formatPrice(trackingModalOrder.totalAmount)}</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Checkpoint Timeline</p>
                {(trackingModalOrder.trackingEvents.length > 0
                  ? trackingModalOrder.trackingEvents
                  : [
                      { label: 'Order Confirmed', at: trackingModalOrder.placedAt, done: true },
                      { label: 'Package Dispatched from Hub', at: trackingModalOrder.placedAt, done: true },
                      { label: 'In Transit to Destination Facility', at: new Date().toISOString(), done: true },
                      { label: 'Out for Delivery', at: null, done: false },
                      { label: 'Delivered', at: null, done: false },
                    ]
                ).map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${
                        ev.done ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'
                      }`}
                    />
                    <div className="flex-1">
                      <p className={`font-semibold ${ev.done ? 'text-slate-900' : 'text-slate-400'}`}>
                        {ev.label}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {ev.at ? formatDateTime(ev.at) : 'Estimated soon'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Details Modal ─────────────────────────────────────────────── */}
      {detailsModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Order Details</h3>
                <p className="text-xs text-slate-500">Order {detailsModalOrder.id}</p>
              </div>
              <button
                onClick={() => setDetailsModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Placed date and status summary */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div>
                  <span className="text-slate-500">Placed on:</span>
                  <p className="font-semibold text-slate-900">{formatDate(detailsModalOrder.placedAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Payment:</span>
                  <p className="font-semibold text-slate-900">{detailsModalOrder.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-slate-500">Delivery Status:</span>
                  <p className="font-semibold text-slate-900">{detailsModalOrder.status}</p>
                </div>
                <div>
                  <span className="text-slate-500">Delivery Address:</span>
                  <p className="font-semibold text-slate-900 truncate">{detailsModalOrder.deliveryAddress}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <p className="font-bold text-slate-900 mb-2">Purchased Items</p>
                <div className="space-y-2 divide-y divide-slate-100 border border-slate-100 rounded-xl p-3 bg-white">
                  {detailsModalOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pt-2 first:pt-0">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-[11px] text-slate-500">{item.variant}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl bg-slate-50 p-3.5 space-y-1.5 border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(detailsModalOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard Shipping:</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Total Amount:</span>
                  <span>{formatPrice(detailsModalOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              {detailsModalOrder.invoice ? (
                <button
                  onClick={() => handleDownloadInvoice(detailsModalOrder.invoice.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Download Official Invoice
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Official GST Invoice generated</span>
              )}
              <button
                onClick={() => setDetailsModalOrder(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Support Modal ────────────────────────────────────────────── */}
      {supportModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Contact ReturnGuard Support</h3>
                  <p className="text-xs text-slate-500">Ref: Order {supportModalOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSupportModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>Need assistance with this order or have delivery instructions for the courier partner?</p>
              <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 space-y-1 text-indigo-950">
                <p className="font-bold">Live Support Channels</p>
                <p className="text-slate-600">✉️ Email: support@returnguard.in</p>
                <p className="text-slate-600">📞 Priority Helpline: 1800-419-7827 (Mon-Sat, 9AM-8PM)</p>
              </div>
              <textarea
                rows={3}
                placeholder="Describe your inquiry or address correction..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSupportModalOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('✓ Support ticket dispatched. Our agent will respond shortly.')
                  setSupportModalOrder(null)
                }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dual-Verification Order Cancellation Modal ────────────────────── */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {cancelStep === 1 ? 'Cancel Order?' : 'Verify Cancellation'}
                  </h3>
                  <p className="text-xs text-slate-500">Order {cancellingOrder.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCancelModal}
                disabled={cancelSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {cancelError && (
              <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{cancelError}</span>
              </div>
            )}

            {cancelStep === 1 && (
              <form onSubmit={handleRequestCancelOTP} className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to cancel this order? Please select a cancellation reason before proceeding to verification.
                </p>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Order Total:</span>
                    <span className="font-bold text-slate-900">{formatPrice(cancellingOrder.totalAmount)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cancellation Reason *
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {CANCELLATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseCancelModal}
                    disabled={cancelSubmitting}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    disabled={cancelSubmitting}
                    className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {cancelSubmitting ? 'Sending OTP…' : 'Continue Cancellation →'}
                  </button>
                </div>
              </form>
            )}

            {cancelStep === 2 && (
              <form onSubmit={handleVerifyCancelOTP} className="mt-4 space-y-4">
                <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-indigo-600" /> Security Verification Required
                  </p>
                  <p className="text-slate-600">
                    We sent a 6-digit verification code to <strong>{cancelEmail}</strong>. Please enter the code to authorize cancellation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={cancelOtp}
                    onChange={(e) => setCancelOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full text-center text-xl font-bold font-mono tracking-widest rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-rose-500 focus:outline-none shadow-xs"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {otpTimer > 0 ? (
                        <>
                          Expires in{' '}
                          <strong className="text-slate-800">
                            {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                          </strong>
                        </>
                      ) : (
                        <span className="text-rose-600 font-semibold">Code expired</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleRequestCancelOTP}
                      disabled={cancelSubmitting}
                      className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCancelStep(1)}
                    disabled={cancelSubmitting}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ← Back to Reason
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseCancelModal}
                      disabled={cancelSubmitting}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={cancelSubmitting || cancelOtp.length < 6}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {cancelSubmitting ? 'Verifying…' : 'Verify & Cancel Order'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
