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
  const [tab, setTab] = useState('orders')
  const [trackingOrderMap, setTrackingOrderMap] = useState({})
  const [activeTrackingId, setActiveTrackingId] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    Promise.all([api.getShopperOrders(), api.getShopperReturns(), api.getAvailableCoupons()])
      .then(([orderData, returnData, couponData]) => {
        setOrders(Array.isArray(orderData) ? orderData : [])
        setReturns(Array.isArray(returnData) ? returnData : [])
        setCoupons(Array.isArray(couponData) ? couponData : [])
        setLoading(false)
      })
      .catch(() => {
        setOrders([])
        setReturns([])
        setLoading(false)
      })
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
        <h1 className="text-2xl font-bold text-slate-900">Your activity</h1>
        <p className="text-sm text-slate-500">Track orders, request returns, and check return status.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('orders')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab('returns')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'returns' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
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
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your placed orders will appear here." />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isDelivered =
                order.delivery_status?.toLowerCase() === 'delivered' ||
                order.status?.toLowerCase() === 'delivered'
              const existingReturn = returns.find(
                (r) => r.order_id === order.id || r.order_number === order.order_number
              )

              return (
                <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-bold text-slate-900">{order.order_number}</h2>
                        <RiskBadge tier={order.risk_tier} />
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.delivery_status} />
                        {order.payment_status && <StatusBadge status={order.payment_status} />}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(order.created_at)} · {order.payment_method}
                      </p>
                      {order.invoice && (
                        <a
                          href={order.invoice.invoice_url}
                          className="mt-1 inline-block text-xs font-semibold text-indigo-600"
                        >
                          Invoice {order.invoice.invoice_number}
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">{INR.format(order.total)}</p>
                      <p className="text-xs text-slate-500">
                        {order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {/* Return button: ONLY shown after delivery is completed */}
                    {existingReturn ? (
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
                        Return {existingReturn.status === 'manual_review' ? 'Under Review' : existingReturn.status}
                      </span>
                    ) : isDelivered ? (
                      <Link
                        to={`/orders/${order.id}/return`}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                      >
                        Request return
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium py-1">
                        Return available once delivered
                      </span>
                    )}

                    {/* Track Order button */}
                    <button
                      onClick={() => toggleTrackOrder(order.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeTrackingId === order.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {activeTrackingId === order.id ? 'Hide tracking' : 'Track order'}
                    </button>
                  </div>

                  {/* Order-specific Tracking Timeline */}
                  {activeTrackingId === order.id && trackingOrderMap[order.id] && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 animate-fade-up">
                      <p className="text-xs font-semibold text-slate-900 mb-2">Live Shipping Progress</p>
                      <div className="space-y-2">
                        {trackingOrderMap[order.id].map((event, index) => (
                          <div key={index} className="flex items-center gap-2.5 text-xs">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                event.done ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span className="font-medium text-slate-700">{event.label}</span>
                            <span className="text-slate-400">
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
        <EmptyState title="No return requests" description="Your return requests will appear here." />
      ) : (
        <div className="space-y-3">
          {returns.map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">Return for {record.order_number}</h2>
                    <RiskBadge tier={record.risk_tier} />
                    <StatusBadge status={record.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(record.created_at)} · {record.reason.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-900">Status timeline</p>
                <div className="mt-2 space-y-2">
                  {(record.timeline || []).map((event, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="font-medium text-slate-700">{event.label}</span>
                      <span className="text-slate-400">{event.at ? formatDateTime(event.at) : 'Pending'}</span>
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
