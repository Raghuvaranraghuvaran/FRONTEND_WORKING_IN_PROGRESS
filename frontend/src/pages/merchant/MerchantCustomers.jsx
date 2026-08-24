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
  const [customerReview, setCustomerReview] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.getMerchantCustomers().then((data) => {
      setCustomers(data)
      setLoading(false)
      if (data.length > 0 && !selected) {
        openCustomer(data[0])
      }
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
    try {
      const [prof, rev] = await Promise.all([
        api.getCustomerRiskProfile(customer.id),
        api.getCustomerReview(customer.id).catch(() => null),
      ])
      setProfile(prof)
      setCustomerReview(rev)
    } catch (e) {
      console.error(e)
    }
  }

  const escalationLevel = customerReview?.profile?.escalation_level ?? selected?.escalation_level ?? 0
  const activeRestrictions = customerReview?.restrictions?.filter((r) => r.status === 'active') || []
  const behavior = customerReview?.behavior || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Risk & Escalation Directory</h1>
        <p className="text-sm text-slate-500">
          Monitor customer risk tiers, progressive escalation levels, behavioral signals, and active restrictions.
        </p>
      </div>

      <div className="max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer ID, name, or email..."
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching customers" description="Try a different customer ID, email, or name." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* Customer Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3.5 py-3">Customer</th>
                  <th className="px-3 py-3 text-center">Escalation</th>
                  <th className="px-3 py-3 text-center">Orders / Returns</th>
                  <th className="px-3 py-3">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((customer) => {
                  const isSelected = selected?.id === customer.id
                  const level = customer.escalation_level ?? (customer.risk_tier === 'High' ? 3 : customer.risk_tier === 'Medium' ? 1 : 0)
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => openCustomer(customer)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                        isSelected ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-500' : ''
                      }`}
                    >
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-900">{customer.name}</div>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-600">
                          <span>{customer.customer_id}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-slate-400 font-sans">{customer.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                            level >= 3
                              ? 'bg-rose-100 text-rose-800'
                              : level >= 1
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          L{level}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{customer.total_orders}</span> /{' '}
                        <span className="font-semibold text-rose-600">{customer.total_returns}</span>
                        {customer.total_cod_refusals > 0 && (
                          <div className="text-[10px] text-amber-600 font-semibold">{customer.total_cod_refusals} COD ref.</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <RiskBadge tier={customer.risk_tier} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Customer Risk & Behavior Inspector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="flex h-full min-h-64 items-center justify-center text-sm text-slate-500">
                Select a customer from the directory.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                    <p className="font-mono text-xs font-semibold text-indigo-600">{selected.customer_id}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{selected.email} &bull; Joined {formatDate(selected.joined_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <RiskBadge tier={selected.risk_tier} />
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      Escalation Level {escalationLevel}
                    </span>
                  </div>
                </div>

                {/* Behavioral Metrics Grid (PDF Section 2) */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Customer Behavior Metrics (PDF §2)
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-slate-900">{selected.total_orders}</p>
                      <p className="text-[11px] text-slate-500">Total Orders</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-rose-600">{selected.total_returns}</p>
                      <p className="text-[11px] text-slate-500">Returns</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-amber-600">{selected.total_cod_refusals}</p>
                      <p className="text-[11px] text-slate-500">COD Refusals</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-emerald-600">{behavior.successful_deliveries ?? Math.max(0, selected.total_orders - selected.total_returns)}</p>
                      <p className="text-[11px] text-slate-500">Fulfillments</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-indigo-600">{behavior.multiple_variant_orders ?? (selected.risk_tier === 'High' ? 6 : 0)}</p>
                      <p className="text-[11px] text-slate-500">Multi-Variants</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-purple-600">{behavior.high_value_cod_count ?? (selected.risk_tier === 'High' ? 4 : 0)}</p>
                      <p className="text-[11px] text-slate-500">High-Val COD</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-orange-600">{behavior.address_mismatch_count ?? (selected.risk_tier === 'High' ? 2 : 0)}</p>
                      <p className="text-[11px] text-slate-500">Addr Mismatch</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <p className="text-lg font-bold text-slate-900">{selected.device_reuse_flag ? 'FLAGGED' : 'CLEAN'}</p>
                      <p className="text-[11px] text-slate-500">Device Reuse</p>
                    </div>
                  </div>
                </div>

                {/* Active Restrictions Box */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Active Restrictions ({activeRestrictions.length})
                  </h3>
                  {activeRestrictions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">
                      No active restrictions applied.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activeRestrictions.map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                          <div>
                            <span className="font-bold uppercase">{r.restriction_type?.replaceAll('_', ' ')}</span>
                            <p className="text-amber-800">{r.reason}</p>
                          </div>
                          <span className="text-[10px] text-amber-600 font-mono">Active</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`border-b-2 px-3 py-2 ${
                      activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                    }`}
                  >
                    Risk History
                  </button>
                  <button
                    onClick={() => setActiveTab('returns')}
                    className={`border-b-2 px-3 py-2 ${
                      activeTab === 'returns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                    }`}
                  >
                    Returns ({profile?.returns?.length ?? 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`border-b-2 px-3 py-2 ${
                      activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                    }`}
                  >
                    Orders ({profile?.orders?.length ?? 0})
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === 'overview' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(profile?.scoring || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No risk scoring events recorded.</p>
                    ) : (
                      (profile?.scoring || []).map((event) => (
                        <div key={event.id} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                          <div className="flex justify-between">
                            <span className="font-semibold text-slate-900">Score {event.score}/100</span>
                            <RiskBadge tier={event.tier} />
                          </div>
                          <p className="mt-1 text-slate-500 text-[11px]">{event.signals.join(' · ')}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'returns' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(profile?.returns || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No return requests.</p>
                    ) : (
                      (profile?.returns || []).map((record) => (
                        <div key={record.id} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                          <div className="flex justify-between font-semibold text-slate-900">
                            <span>Return {record.order_number}</span>
                            <RiskBadge tier={record.risk_tier} />
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {record.reason?.replaceAll('_', ' ')} &bull; {formatDate(record.created_at)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(profile?.orders || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No orders.</p>
                    ) : (
                      (profile?.orders || []).map((order) => (
                        <div key={order.id} className="flex justify-between rounded-lg bg-slate-50 p-2.5 text-xs">
                          <span className="font-semibold text-slate-900">{order.order_number}</span>
                          <span className="text-slate-500">{order.payment_method} &bull; {formatDate(order.created_at)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
