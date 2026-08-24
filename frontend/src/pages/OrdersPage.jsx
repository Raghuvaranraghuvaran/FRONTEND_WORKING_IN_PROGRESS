import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../mock/api'
import { formatDate, formatDateTime, INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Your Activity</h1>
        <p className="text-sm text-slate-500">Track orders, initiate return requests, and monitor refunds.</p>
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
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏷️</span>
            <h3 className="text-sm font-bold text-purple-800">Available Coupons — Use on your next order!</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {coupons.slice(0, 4).map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center gap-2.5 rounded-xl border border-purple-200 bg-white px-3 py-2"
              >
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold tracking-wider"
                  style={{
                    fontFamily: 'monospace',
                    background: coupon.discount_type === 'percentage' ? '#ede9fe' : '#dcfce7',
                    color: coupon.discount_type === 'percentage' ? '#7c3aed' : '#16a34a',
                    border: `1px dashed ${coupon.discount_type === 'percentage' ? '#a78bfa' : '#86efac'}`,
                  }}
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
              const isDelivered =
                order.is_delivered ??
                ['delivered', 'product returned', 'refund processed', 'return approved', 'return rejected'].includes(
                  (order.delivery_status || order.status || '').trim().toLowerCase()
                )

              const existingReturn = returns.find(
                (r) => String(r.order_id) === String(order.id) || r.order_number === order.order_number
              )

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
                      </p>
                      {order.invoice && (
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
                    {/* Return button logic */}
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
                    ) : (
                      <span className="text-xs text-slate-400 font-medium py-1">
                        Return available once delivered
                      </span>
                    )}

                    {/* Track Order button (ONLY shown if NOT delivered) */}
                    {!isDelivered ? (
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
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        ✓ Delivered
                      </span>
                    )}
                  </div>

                  {/* Order-specific Tracking Timeline (Only for non-delivered tracking) */}
                  {!isDelivered && activeTrackingId === order.id && trackingOrderMap[order.id] && (
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
    </main>
  )
}
