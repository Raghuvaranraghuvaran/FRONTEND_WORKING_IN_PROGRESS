import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDate, INR } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { CheckCircle2, Truck, AlertCircle, Clock } from 'lucide-react'

const filters = ['All', 'Delivered', 'In Transit', 'Return Requested', 'COD', 'Prepaid', 'Flagged']

export default function MerchantOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

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

  const handleStatusUpdate = async (orderId, newDeliveryStatus) => {
    setUpdatingId(orderId)
    setSuccessMessage('')
    try {
      await api.updateOrderStatus({ orderId, deliveryStatus: newDeliveryStatus })
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.order_number === orderId
            ? { ...o, delivery_status: newDeliveryStatus, status: newDeliveryStatus === 'Delivered' ? 'Delivered' : o.status }
            : o
        )
      )
      if (newDeliveryStatus === 'Delivered') {
        setSuccessMessage(`Order #${orderId} marked as Delivered! Confirmation email with Return button sent to customer.`)
      } else {
        setSuccessMessage(`Order #${orderId} status updated to ${newDeliveryStatus}.`)
      }
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      alert(err.message || 'Failed to update order status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = orders.filter((order) => {
    if (filter === 'All') return true
    if (filter === 'Delivered') return order.delivery_status === 'Delivered' || order.status === 'Delivered'
    if (filter === 'In Transit') return order.delivery_status === 'In Transit'
    if (filter === 'Return Requested') return order.delivery_status === 'Return Requested' || order.status === 'Return Requested'
    if (filter === 'COD') return order.payment_method === 'COD'
    if (filter === 'Prepaid') return order.payment_method !== 'COD'
    if (filter === 'Flagged') return order.risk_tier === 'High' || order.status === 'Review'
    return true
  })

  const [refusalModalOrder, setRefusalModalOrder] = useState(null)
  const [refusalReason, setRefusalReason] = useState('Customer rejected package at doorstep')
  const [refusalType, setRefusalType] = useState('customer_rejected')
  const [refusalNotes, setRefusalNotes] = useState('')
  const [loggingRefusal, setLoggingRefusal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

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
      setSuccessMsg(`✓ Doorstep refusal logged for ${refusalModalOrder.order_number}. Customer profile updated & escalated.`)
      setRefusalModalOrder(null)
      fetchOrders()
    } catch (err) {
      setError(err.message || 'Failed to log doorstep refusal')
    } finally {
      setLoggingRefusal(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Orders Management</h1>
          <p className="text-sm text-slate-500">Track delivery lifecycles, update delivery status, and log doorstep refusal events.</p>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between shadow-xs">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold hover:text-emerald-900 cursor-pointer ml-3">✕</button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <span>Error loading orders: {error}</span>
          <button
            onClick={fetchOrders}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              filter === item ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading store orders…</div>
        ) : error ? (
          <div className="p-12 text-center text-slate-500">Unable to load orders at this time.</div>
        ) : filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="No orders match this filter" description="Try selecting a different filter above." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Delivery Status</th>
                  <th className="px-4 py-3.5">Risk Tier</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const isDelivered = order.delivery_status === 'Delivered'
                  const isUpdating = updatingId === order.id

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-xs text-slate-900">
                        {order.order_number}
                        {order.is_cod_refused && (
                          <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            Refused
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{order.customer_name}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{order.payment_method}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{INR.format(order.total)}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.delivery_status || order.status} />
                      </td>
                      <td className="px-4 py-3.5"><RiskBadge tier={order.risk_tier} /></td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isDelivered && order.delivery_status !== 'Return Requested' ? (
                            <button
                              onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                              disabled={isUpdating}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                              title="Mark order as Delivered (sends delivery email with Return button to customer)"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isUpdating ? '...' : 'Mark Delivered'}</span>
                            </button>
                          ) : null}

                          <select
                            value={order.delivery_status || 'Processing'}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            disabled={isUpdating}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="Processing">Processing</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Return Requested">Return Requested</option>
                            <option value="Return Approved">Return Approved</option>
                            <option value="Product Returned">Product Returned</option>
                            <option value="Refund Processed">Refund Processed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          {order.payment_method === 'COD' && !order.is_cod_refused && (
                            <button
                              type="button"
                              onClick={() => setRefusalModalOrder(order)}
                              className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                            >
                              Log Refusal
                            </button>
                          )}
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

      {/* Log Doorstep Refusal Modal (Feature 5) */}
      {refusalModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🚫</span> Log Doorstep COD Refusal
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
                  Order: {refusalModalOrder.order_number} ({INR.format(refusalModalOrder.total)})
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
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Customer rejected package at doorstep">Customer rejected package at doorstep</option>
                  <option value="Customer unavailable / Phone switched off">Customer unavailable / Phone switched off</option>
                  <option value="Fake / Incomplete delivery address">Fake / Incomplete delivery address</option>
                  <option value="Customer refused cash payment (No Money)">Customer refused cash payment (No Money)</option>
                  <option value="Customer demanded opening package without payment">Customer demanded opening package without payment</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Refusal Classification Code
                </label>
                <select
                  value={refusalType}
                  onChange={(e) => setRefusalType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="customer_rejected">Customer Rejected (Intentional)</option>
                  <option value="customer_unavailable">Customer Unavailable (Non-contactable)</option>
                  <option value="fake_address">Fake Address / Organized Fraud</option>
                  <option value="cod_cash_shortage">Payment Failure at Doorstep</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Delivery Agent Notes / Evidence
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

