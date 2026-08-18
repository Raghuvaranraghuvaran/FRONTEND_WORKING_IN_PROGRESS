import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import EmptyState from '../../components/EmptyState'

export default function MerchantCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getMerchantCustomers().then((data) => {
      setCustomers(data)
      setLoading(false)
    })
  }, [])

  const filtered = customers.filter((customer) => {
    const term = search.toLowerCase().trim()
    if (!term) return true
    return (
      customer.customer_id?.toLowerCase().includes(term) ||
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term)
    )
  })

  const openCustomer = async (customer) => {
    setSelected(customer)
    const result = await api.getCustomerRiskProfile(customer.id)
    setProfile(result)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
      <p className="text-sm text-slate-500">View customer risk profiles and behavioral signals.</p>

      <div className="mt-5 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer ID, name, or email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : filtered.length === 0 ? (
        <div className="mt-6"><EmptyState title="No matching customers" description="Try a different customer ID or name." /></div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Returns</th>
                  <th className="px-4 py-3">COD refusals</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openCustomer(customer)}
                    className={`cursor-pointer hover:bg-slate-50 ${selected?.id === customer.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">{customer.customer_id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{customer.name}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.total_orders}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.total_returns}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.total_cod_refusals}</td>
                    <td className="px-4 py-3"><RiskBadge tier={customer.risk_tier} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            {!selected ? (
              <div className="flex h-full min-h-64 items-center justify-center text-sm text-slate-500">
                Select a customer to see their risk profile.
              </div>
            ) : profile ? (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{profile.customer.name}</h2>
                    <p className="font-mono text-xs font-semibold text-indigo-600">{profile.customer.customer_id}</p>
                    <p className="text-sm text-slate-500">{profile.customer.email}</p>
                    <p className="text-xs text-slate-400">Member since {formatDate(profile.customer.joined_at)}</p>
                  </div>
                  <RiskBadge tier={profile.customer.risk_tier} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{profile.customer.total_orders}</p>
                    <p className="text-xs text-slate-500">Orders</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{profile.customer.total_returns}</p>
                    <p className="text-xs text-slate-500">Returns</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{profile.customer.total_cod_refusals}</p>
                    <p className="text-xs text-slate-500">COD refusals</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-900">Risk & verification history</p>
                  <div className="mt-2 space-y-2">
                    {profile.scoring.length === 0 ? (
                      <p className="text-sm text-slate-500">No risk-scoring events recorded.</p>
                    ) : (
                      profile.scoring.map((event) => (
                        <div key={event.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-900">Score {event.score}</span>
                            <RiskBadge tier={event.tier} />
                          </div>
                          <p className="mt-1 text-slate-500">{event.signals.join(' · ')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-900">Return history</p>
                  <div className="mt-2 space-y-2">
                    {profile.returns.length === 0 ? (
                      <p className="text-sm text-slate-500">No returns.</p>
                    ) : (
                      profile.returns.map((record) => (
                        <div key={record.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">Return {record.order_number}</span>
                            <RiskBadge tier={record.risk_tier} />
                          </div>
                          <p className="mt-1 text-slate-500">{record.reason.replaceAll('_', ' ')} · {formatDate(record.created_at)}</p>
                          {(record.timeline || []).length > 0 && (
                            <div className="mt-2 border-t border-slate-200 pt-2">
                              {(record.timeline || []).map((event, index) => (
                                <div key={index} className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                  <span>{event.label}</span>
                                  <span>{event.at ? formatDate(event.at) : 'Pending'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-900">Order history</p>
                  <div className="mt-2 space-y-2">
                    {profile.orders.length === 0 ? (
                      <p className="text-sm text-slate-500">No orders.</p>
                    ) : (
                      profile.orders.map((order) => (
                        <div key={order.id} className="flex justify-between rounded-lg bg-slate-50 p-3 text-xs">
                          <span className="font-semibold text-slate-900">{order.order_number}</span>
                          <span className="text-slate-500">{order.payment_method} · {formatDate(order.created_at)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center text-sm text-slate-500">Loading…</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
