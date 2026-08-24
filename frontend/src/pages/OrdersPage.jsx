import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../mock/api'
import { formatDate, formatDateTime, INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { AlertCircle, CheckCircle2, KeyRound, ShieldAlert, X } from 'lucide-react'

const CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Found a better price',
  'No longer needed',
  'Wrong product ordered',
  'Delivery taking too long',
  'Other',
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('orders')
  const [trackingOrderMap, setTrackingOrderMap] = useState({})
  const [activeTrackingId, setActiveTrackingId] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [copiedCode, setCopiedCode] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [cancelStep, setCancelStep] = useState(1) // 1: Confirmation & Reason, 2: OTP Verification
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

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const result = await api.downloadInvoice(invoiceId)
      if (!result.downloaded && result.download_url) {
        window.open(result.download_url, '_blank')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice. Please try again.')
    }
  }

  const loadData = () => {
    setLoading(true)
    setError(null)
    
    const ordersPromise = Promise.all([api.getShopperOrders(), api.getShopperReturns()])
    const couponsPromise = api.getAvailableCoupons().catch(() => [])
    
    Promise.all([ordersPromise, couponsPromise])
      .then(([[orderData, returnData], couponData]) => {
        setOrders(Array.isArray(orderData) ? orderData : [])
        setReturns(Array.isArray(returnData) ? returnData : [])
        setCoupons(Array.isArray(couponData) ? couponData : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading orders:', err)
        setError(err.message || 'Failed to load orders. Please try again.')
        setOrders([])
        setReturns([])
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let interval
    if (cancellingOrder && cancelStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [cancellingOrder, cancelStep, otpTimer])

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const toggleTrackOrder = async (orderId) => {
    if (activeTrackingId === orderId) {
      setActiveTrackingId(null)
      return
    }
    if (!trackingOrderMap[orderId]) {
      const events = await api.trackOrder(orderId)
      setTrackingOrderMap((prev) => ({ ...prev, [orderId]: events }))
    }
    setActiveTrackingId(orderId)
  }

  // --- Cancellation Flow Handlers ---
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
        orderId: cancellingOrder.id,
        reason: cancelReason,
      })
      setCancelChallengeId(res.challenge_id)
      setCancelEmail(res.email || 'your registered contact')
      setOtpTimer(res.expires_in || 300)
      setCancelStep(2)
    } catch (err) {
      setCancelError(err.message || 'Failed to request cancellation OTP. Please try again.')
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
      const res = await api.verifyOrderCancellation({
        orderId: cancellingOrder.id,
        code: cancelOtp.trim(),
        challengeId: cancelChallengeId,
        reason: cancelReason,
        notes: cancelNotes,
      })

      // Update state locally
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancellingOrder.id
            ? {
                ...o,
                status: 'Cancelled',
                delivery_status: 'Cancelled',
                cancelled_at: new Date().toISOString(),
                cancellation_reason: cancelReason,
              }
            : o
        )
      )

      showToast('✓ Order cancelled successfully.')
      handleCloseCancelModal()
      loadData()
    } catch (err) {
      setCancelError(err.message || 'Failed to verify cancellation OTP. Please try again.')
    } finally {
      setCancelSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Your Activity</h1>
        <p className="text-sm text-slate-500">Track orders, cancel active orders, initiate returns, and monitor refunds.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('orders')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${tab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab('returns')}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${tab === 'returns' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
        >
          Returns ({returns.length})
        </button>
      </div>

      {/* Available Coupons Banner */}
      {coupons.length > 0 && (
        <div className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🏷️</span>
            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Available Coupons</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {coupons.map((coupon) => (
              <div
                key={coupon.id || coupon.code}
                className="flex items-center gap-2 rounded-xl bg-white border border-purple-200 px-3 py-1.5 shadow-xs"
              >
                <span
                  title={coupon.description || ''}
                  className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded cursor-help"
                >
                  {coupon.code}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}% off`
                    : `₹${coupon.discount_value} off`}
                </span>
                <button
                  onClick={() => copyCode(coupon.code)}
                  className="rounded-md border border-purple-300 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  {copiedCode === coupon.code ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-800 mb-1">Error loading orders</p>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your placed orders will appear here." />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusLower = (order.delivery_status || order.status || '').trim().toLowerCase()
              const isDelivered =
                order.is_delivered ??
                ['delivered', 'product returned', 'refund processed', 'return approved', 'return rejected'].includes(statusLower)

              const isCancelled = statusLower === 'cancelled'

              const existingReturn = returns.find(
                (r) => String(r.order_id) === String(order.id) || r.order_number === order.order_number
              )

              // Track Order is visible only for active non-delivered orders without returns
              const canTrack = !isDelivered && !isCancelled && !existingReturn

              // Cancellation is permitted ONLY before shipment starts
              const disallowedFromCancel = [
                'in transit', 'shipped', 'in shipment', 'out for delivery',
                'delivered', 'cancelled', 'return requested', 'return approved',
                'return rejected', 'product returned', 'refund processed', 'refused'
              ]
              const canCancel =
                !isDelivered &&
                !isCancelled &&
                !existingReturn &&
                (order.is_cancellable ?? !disallowedFromCancel.includes(statusLower))

              // Check 7 day return window
              let isWindowExpired = false
              if (order.delivered_at) {
                const diffDays = (Date.now() - new Date(order.delivered_at).getTime()) / (1000 * 60 * 60 * 24)
                if (diffDays > 7) isWindowExpired = true
              }

              return (
                <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-base font-bold text-slate-900">{order.order_number}</h2>
                        <RiskBadge tier={order.risk_tier} />
                        <StatusBadge status={order.delivery_status || order.status} />
                        {order.payment_status && <StatusBadge status={order.payment_status} />}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Placed: {formatDate(order.created_at)} · Payment: {order.payment_method}
                        {order.delivered_at && ` · Delivered: ${formatDate(order.delivered_at)}`}
                        {order.cancelled_at && ` · Cancelled: ${formatDate(order.cancelled_at)}`}
                      </p>
                      {order.cancellation_reason && (
                        <p className="mt-1 text-xs text-rose-600 font-medium">
                          Cancellation Reason: <span className="font-semibold">{order.cancellation_reason}</span>
                        </p>
                      )}
                      {order.invoice && !isCancelled && (
                        <button
                          onClick={() => handleDownloadInvoice(order.invoice.id)}
                          className="mt-1.5 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                        >
                          📄 Invoice {order.invoice.invoice_number}
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">{INR.format(order.total)}</p>
                      {order.coupon_code && (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200 mt-0.5">
                            🏷️ {order.coupon_code} (−{INR.format(order.discount || 0)})
                          </span>
                        </div>
                      )}
                      {(Number(order.reward_points_earned) > 0 || Math.floor(Number(order.total) / 100) * 10 > 0) && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                            ⭐ +{order.reward_points_earned || Math.floor(Number(order.total) / 100) * 10} pts earned
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                    {/* Return Status / Action */}
                    {existingReturn ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                        <span>↩ Return:</span>
                        <span className="capitalize">{existingReturn.status?.replace('_', ' ')}</span>
                      </span>
                    ) : isDelivered ? (
                      isWindowExpired ? (
                        <span className="text-xs text-slate-400 font-medium py-1">
                          Return window expired (7 days)
                        </span>
                      ) : (
                        <Link
                          to={`/orders/${order.id}/return`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                        >
                          <span>↩ Return Order</span>
                        </Link>
                      )
                    ) : isCancelled ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
                        ✕ Order Cancelled
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium py-1">
                        Return available once delivered
                      </span>
                    )}

                    {/* Track Order button (Visible for active pre-delivered orders) */}
                    {canTrack && (
                      <button
                        onClick={() => toggleTrackOrder(order.id)}
                        className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          activeTrackingId === order.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {activeTrackingId === order.id ? 'Hide Tracking' : 'Track Order'}
                      </button>
                    )}

                    {/* Cancel Order button (ONLY shown when order is eligible before shipment) */}
                    {canCancel && (
                      <button
                        onClick={() => handleOpenCancelModal(order)}
                        className="rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    {/* Delivered badge if finished */}
                    {!existingReturn && isDelivered && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        ✓ Delivered
                      </span>
                    )}
                  </div>

                  {/* Order-specific Tracking Timeline */}
                  {canTrack && activeTrackingId === order.id && trackingOrderMap[order.id] && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-900 mb-2.5">Live Delivery Timeline</p>
                      <div className="space-y-2.5">
                        {trackingOrderMap[order.id].map((event, index) => (
                          <div key={index} className="flex items-center gap-2.5 text-xs">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                event.done ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span className="font-semibold text-slate-700">{event.label}</span>
                            <span className="text-slate-400 ml-auto">
                              {event.at ? formatDateTime(event.at) : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : returns.length === 0 ? (
        <EmptyState title="No return requests" description="Your submitted return requests will appear here." />
      ) : (
        <div className="space-y-4">
          {returns.map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-indigo-600">#{record.id}</span>
                    <h2 className="text-base font-bold text-slate-900">Return for {record.order_number}</h2>
                    <RiskBadge tier={record.risk_tier} />
                    <StatusBadge status={record.status} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Requested on {formatDate(record.created_at)} · Reason: <strong className="text-slate-700">{record.reason?.replaceAll('_', ' ')}</strong>
                  </p>
                  {record.refund_method && (
                    <p className="mt-1 text-xs text-slate-500">
                      Refund Mode: <span className="font-semibold text-slate-700 capitalize">{record.refund_method?.replaceAll('_', ' ')}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Images preview if present */}
              {record.images && record.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {record.images.map((img, i) => (
                    <img key={i} src={img} alt="Return proof" className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-900 mb-2">Return Status & Pickup Progress</p>
                <div className="space-y-2">
                  {(record.timeline || []).map((event, index) => (
                    <div key={index} className="flex items-center gap-2.5 text-xs">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="font-medium text-slate-700">{event.label}</span>
                      <span className="text-slate-400 ml-auto">{event.at ? formatDateTime(event.at) : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Dual-Verification Order Cancellation Modal ────────────────────── */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {cancelStep === 1 ? 'Cancel Order?' : 'Verify Cancellation'}
                  </h3>
                  <p className="text-xs text-slate-500">Order #{cancellingOrder.order_number}</p>
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

            {/* STEP 1: Confirmation & Reason Selection */}
            {cancelStep === 1 && (
              <form onSubmit={handleRequestCancelOTP} className="mt-4 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to cancel this order? Please select a cancellation reason before proceeding to verification.
                </p>

                {/* Items and Summary Preview */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Order Total:</span>
                    <span className="font-bold text-slate-900">{INR.format(cancellingOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Payment Method:</span>
                    <span className="font-medium text-slate-800">{cancellingOrder.payment_method}</span>
                  </div>
                  <div className="border-t border-slate-200/80 pt-2 text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-700">Items to cancel:</p>
                    {(cancellingOrder.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[280px]">{item.name} × {item.quantity}</span>
                        <span className="font-semibold">{INR.format(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancellation Reason Selector */}
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

                {/* Additional Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                    placeholder="Provide any additional feedback..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Step 1 Actions */}
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

            {/* STEP 2: OTP Verification */}
            {cancelStep === 2 && (
              <form onSubmit={handleVerifyCancelOTP} className="mt-4 space-y-4">
                <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-indigo-600" /> Security Verification Required
                  </p>
                  <p className="text-slate-600">
                    We sent a 6-digit verification code to <strong>{cancelEmail}</strong>. Please enter the code to authorize cancellation of Order #{cancellingOrder.order_number}.
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
                        <>Expires in <strong className="text-slate-800">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</strong></>
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

                {/* Step 2 Actions */}
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
