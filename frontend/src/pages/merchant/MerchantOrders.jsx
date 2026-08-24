import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDate, INR } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'

const filters = ['All', 'COD', 'Prepaid', 'Flagged']

export default function MerchantOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

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

  const filtered = orders.filter((order) => {
    if (filter === 'All') return true
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Review payment method, risk score, doorstep refusal logs, and status for every order.</p>
        </div>
      </div>

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
            className={`rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer ${filter === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading store orders…</div>
        ) : error ? (
          <div className="p-8 text-center text-slate-500">Unable to load orders at this time.</div>
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No orders match this filter" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order.order_number}
                      {order.is_cod_refused && (
                        <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          Refused
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.customer_name}</td>
                    <td className="px-4 py-3 text-slate-600">{order.payment_method}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{INR.format(order.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3"><RiskBadge tier={order.risk_tier} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {order.payment_method === 'COD' && !order.is_cod_refused && (
                        <button
                          type="button"
                          onClick={() => setRefusalModalOrder(order)}
                          className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                          Log Refusal
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

