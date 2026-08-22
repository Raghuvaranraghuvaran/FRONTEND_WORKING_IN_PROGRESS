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
    if (filter === 'COD' || filter === 'Prepaid') return order.payment_method === filter
    if (filter === 'Flagged') return order.risk_tier === 'High' || order.status === 'Review'
    return true
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      <p className="text-sm text-slate-500">Review payment method, risk, and status for every order.</p>

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
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-slate-600">{order.customer_name}</td>
                    <td className="px-4 py-3 text-slate-600">{order.payment_method}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{INR.format(order.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3"><RiskBadge tier={order.risk_tier} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
