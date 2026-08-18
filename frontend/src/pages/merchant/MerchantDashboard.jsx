import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'

export default function MerchantDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMerchantDashboard().then((result) => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard overview</h1>
      <p className="text-sm text-slate-500">Live view of orders and flagged returns for your store.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total orders', value: data.totalOrders, tone: 'bg-indigo-600 text-white' },
          { label: 'Flagged cases', value: data.flaggedCases, tone: 'bg-amber-500 text-white' },
          { label: 'Pending review', value: data.pendingReview, tone: 'bg-rose-500 text-white' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-6 ${stat.tone}`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm font-medium opacity-90">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent flagged cases</h2>
          <Link to="/merchant/flagged-cases" className="text-sm font-semibold text-indigo-600">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 pr-4">Risk</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentFlagged.map((record) => (
                <tr key={record.id} className="whitespace-nowrap">
                  <td className="py-3 pr-4 font-medium text-slate-900">{record.customer_name}</td>
                  <td className="py-3 pr-4 text-slate-600">{record.order_number}</td>
                  <td className="py-3 pr-4"><RiskBadge tier={record.risk_tier} /></td>
                  <td className="py-3 pr-4"><StatusBadge status={record.status} /></td>
                </tr>
              ))}
              {data.recentFlagged.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">No flagged cases right now.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
