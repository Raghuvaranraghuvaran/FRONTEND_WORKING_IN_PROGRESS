import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'

const ESCALATION_LABELS = [
  'Level 0: Normal',
  'Level 1: Warning / Verification',
  'Level 2: COD Restricted',
  'Level 3: Prepaid + Manual Review',
  'Level 4: Temporary Account Restriction',
  'Level 5: Merchant Final Review',
]

export default function MerchantFlaggedCases() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [customerReview, setCustomerReview] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'history' | 'behavior'

  const load = () => {
    setLoading(true)
    api.getMerchantReturns().then((data) => {
      setReturns(data)
      setLoading(false)
      // Auto-select first item if available
      if (data.length > 0 && !selected) {
        selectCase(data[0])
      }
    })
  }

  useEffect(load, [])

  const selectCase = async (record) => {
    setSelected(record)
    setMessage('')
    setError('')
    setLoadingReview(true)
    try {
      const reviewData = await api.getCustomerReview(record.user_id || record.customer_id || 'user_2')
      setCustomerReview(reviewData)
    } catch (err) {
      console.error('Failed to load customer review', err)
    } finally {
      setLoadingReview(false)
    }
  }

  const handleAction = async (actionType) => {
    if (!selected) return
    setActionLoading(true)
    setMessage('')
    setError('')

    try {
      const customerId = selected.user_id || selected.customer_id || 'user_2'
      await api.performMerchantAction({
        customerId,
        action: actionType,
        notes: notes || `Action ${actionType} performed by merchant.`,
      })

      // Also review return if approve/reject
      if (actionType === 'accept' || actionType === 'reject') {
        await api.reviewReturn({
          returnId: selected.id,
          action: actionType === 'accept' ? 'approve' : 'reject',
          notes,
        })
      }

      setMessage(`Action "${actionType.replace('_', ' ').toUpperCase()}" applied successfully to customer!`)
      setNotes('')
      // Reload review details
      const updated = await api.getCustomerReview(customerId)
      setCustomerReview(updated)
      load()
    } catch (err) {
      setError(err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveRestriction = async (restrictionId) => {
    setActionLoading(true)
    try {
      await api.removeCustomerRestriction(restrictionId)
      setMessage('Restriction removed successfully.')
      const customerId = selected.user_id || selected.customer_id || 'user_2'
      const updated = await api.getCustomerReview(customerId)
      setCustomerReview(updated)
    } catch (err) {
      setError(err.message || 'Failed to remove restriction')
    } finally {
      setActionLoading(false)
    }
  }

  const profile = customerReview?.profile
  const behavior = customerReview?.behavior
  const restrictions = customerReview?.restrictions || []
  const activeRestrictions = restrictions.filter((r) => r.status === 'active')
  const escalationHistory = customerReview?.escalation_history || []
  const scoring = customerReview?.scoring || []
  const decision = customerReview?.decision || {}

  const currentLevel = profile?.escalation_level ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ReturnGuard Case Review</h1>
          <p className="text-sm text-slate-500">
            Intelligent risk scoring, progressive escalation, and merchant authority review screen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Active Risk Engine: v0.4
          </span>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-600 font-bold hover:text-emerald-900">✕</button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 font-bold hover:text-rose-900">✕</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      ) : returns.length === 0 ? (
        <EmptyState title="No flagged cases" description="All returns and orders are operating normally within risk thresholds." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Left Column: Flagged Cases List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Flagged Queue ({returns.length})</h2>
              <span className="text-xs text-slate-400">Ordered by risk</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[750px] pr-1">
              {returns.map((record) => {
                const isSelected = selected?.id === record.id
                return (
                  <div
                    key={record.id}
                    onClick={() => selectCase(record)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{record.order_number}</span>
                          <StatusBadge status={record.status} />
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-700">{record.customer_name}</p>
                        <p className="text-xs text-slate-400">{formatDate(record.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <RiskBadge tier={record.risk_tier} />
                        <span className="mt-1 font-mono text-xs font-semibold text-slate-500">
                          {record.risk_score}/100
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                      <span className="capitalize">{record.reason?.replaceAll('_', ' ')}</span>
                      <span className="font-semibold text-indigo-600">Review &rarr;</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: PDF Section 10 Case Review Screen */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {loadingReview ? (
              <div className="flex h-96 flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-sm text-slate-500">Loading risk telemetry and customer behavior profile...</p>
              </div>
            ) : !selected ? (
              <div className="flex h-96 items-center justify-center text-sm text-slate-400">
                Select a case from the queue to start review.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Banner - Matches PDF Section 10 */}
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold tracking-wider text-indigo-300">
                          CUSTOMER REVIEW
                        </span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/80">
                          {profile?.customer_id || 'CUST-1024'}
                        </span>
                      </div>
                      <h2 className="mt-1 text-xl font-bold text-white">
                        {profile?.customer_name || selected.customer_name}
                      </h2>
                      <p className="text-xs text-slate-300">{profile?.customer_email || 'customer@example.com'}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Risk Score Dial */}
                      <div className="text-center rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <p className="text-xs text-indigo-200">Risk Score</p>
                        <p className="text-2xl font-black text-white">
                          {profile?.latest_score ?? selected.risk_score}
                          <span className="text-xs font-normal text-slate-300"> / 100</span>
                        </p>
                      </div>

                      {/* Escalation Level */}
                      <div className="text-center rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <p className="text-xs text-indigo-200">Escalation Level</p>
                        <p className="text-2xl font-black text-amber-400">
                          L{currentLevel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-slate-400">Risk Tier: </span>
                      <span className="font-bold text-rose-400">{profile?.risk_tier || selected.risk_tier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Active Restrictions: </span>
                      <span className="font-bold text-amber-300">{activeRestrictions.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Confirmed Violations: </span>
                      <span className="font-bold text-rose-300">{profile?.confirmed_violations ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Recommended Action: </span>
                      <span className="font-bold text-indigo-300 uppercase">{decision?.recommended_action || 'Review'}</span>
                    </div>
                  </div>
                </div>

                {/* Escalation Ladder Stepper */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Progressive Escalation Ladder (PDF §6)</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
                    {ESCALATION_LABELS.map((lbl, idx) => {
                      const isActive = idx === currentLevel
                      const isPast = idx < currentLevel
                      return (
                        <div
                          key={idx}
                          className={`rounded-lg p-2 text-center text-xs transition-all ${
                            isActive
                              ? 'border-2 border-amber-500 bg-amber-50 font-bold text-amber-900 shadow-sm'
                              : isPast
                              ? 'bg-rose-50 text-rose-700 line-through'
                              : 'bg-white text-slate-400 border border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-mono">STEP {idx}</div>
                          <div className="truncate text-[11px] mt-0.5">{lbl.split(':')[1]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 text-sm font-semibold">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`border-b-2 px-4 py-2.5 transition-colors ${
                      activeTab === 'overview'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Overview & Signals
                  </button>
                  <button
                    onClick={() => setActiveTab('behavior')}
                    className={`border-b-2 px-4 py-2.5 transition-colors ${
                      activeTab === 'behavior'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Customer Behavior Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`border-b-2 px-4 py-2.5 transition-colors ${
                      activeTab === 'history'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Restriction & Escalation Timeline ({escalationHistory.length + restrictions.length})
                  </button>
                </div>

                {/* TAB 1: OVERVIEW & SIGNALS */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {/* WHY FLAGGED (PDF Section 10) */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">WHY FLAGGED (Risk Signals Detected)</h3>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {(selected.signals?.length ? selected.signals : ['Repeated COD refusals', 'High return frequency', 'Multiple-variant ordering', 'Previous restrictions violated']).map(
                          (signal, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800"
                            >
                              <span className="text-rose-500 font-black">&bull;</span>
                              {signal}
                            </span>
                          )
                        )}
                      </div>
                      {selected.risk_context && (
                        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                          <span className="font-semibold text-slate-800">Context: </span>
                          {selected.risk_context}
                        </p>
                      )}
                    </div>

                    {/* CURRENT RESTRICTIONS */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">CURRENT ACTIVE RESTRICTIONS</h3>
                      {activeRestrictions.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                          No active restrictions currently in effect for this customer.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {activeRestrictions.map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs"
                            >
                              <div>
                                <span className="font-bold uppercase tracking-wider text-amber-900">
                                  {r.restriction_type?.replaceAll('_', ' ')}
                                </span>
                                <p className="text-amber-800 mt-0.5">{r.reason}</p>
                                <span className="text-[10px] text-amber-600">
                                  Applied {formatDate(r.start_date)} by {r.applied_by}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveRestriction(r.id)}
                                disabled={actionLoading}
                                className="rounded-lg bg-white border border-amber-300 px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RECENT ORDER DETAILS */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                      <div className="flex justify-between items-center mb-2 font-bold text-slate-900">
                        <span>Order #{selected.order_number} Details</span>
                        <span>Total: ₹{selected.total || 6499}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 sm:grid-cols-4">
                        <div>
                          <span className="text-slate-400">Payment: </span>
                          <span className="font-semibold text-slate-800">{selected.payment_method || 'COD'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Return Reason: </span>
                          <span className="font-semibold text-slate-800 capitalize">{selected.reason?.replaceAll('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Verification: </span>
                          <span className="font-semibold text-slate-800">{selected.verification_status || 'Pending'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Date: </span>
                          <span>{formatDate(selected.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BEHAVIOR PROFILE (PDF Section 2) */}
                {activeTab === 'behavior' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Customer Behavior Profile (PDF §2)</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-slate-900">{behavior?.total_orders ?? 10}</p>
                        <p className="text-xs text-slate-500">Total Orders</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-rose-600">{behavior?.total_returns ?? 6}</p>
                        <p className="text-xs text-slate-500">Returns ({((behavior?.return_rate ?? 0.6) * 100).toFixed(0)}%)</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-amber-600">{behavior?.total_cod_refusals ?? 2}</p>
                        <p className="text-xs text-slate-500">COD Refusals</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-emerald-600">{behavior?.successful_deliveries ?? 4}</p>
                        <p className="text-xs text-slate-500">Successful Deliveries</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-indigo-600">{behavior?.multiple_variant_orders ?? 6}</p>
                        <p className="text-xs text-slate-500">Multi-Variant Orders</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-purple-600">{behavior?.high_value_cod_count ?? 4}</p>
                        <p className="text-xs text-slate-500">High-Value COD</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-orange-600">{behavior?.address_mismatch_count ?? 2}</p>
                        <p className="text-xs text-slate-500">Address Inconsistencies</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xl font-bold text-slate-900">{profile?.device_reuse_flag ? 'YES' : 'NO'}</p>
                        <p className="text-xs text-slate-500">Device Reuse Flag</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TIMELINE (PDF Section 9) */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Restriction & Escalation History (PDF §9)</h3>
                    {escalationHistory.length === 0 && restrictions.length === 0 ? (
                      <p className="text-xs text-slate-500">No previous restrictions or escalation history.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">Date</th>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-left">Event / Trigger</th>
                              <th className="px-3 py-2 text-left">Action / Level</th>
                              <th className="px-3 py-2 text-left">Actor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {escalationHistory.map((h) => (
                              <tr key={h.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-500">{formatDate(h.created_at)}</td>
                                <td className="px-3 py-2 font-semibold text-indigo-600">Escalation</td>
                                <td className="px-3 py-2 text-slate-800">{h.trigger_event}</td>
                                <td className="px-3 py-2 font-bold text-amber-600">
                                  L{h.previous_level} &rarr; L{h.new_level}
                                </td>
                                <td className="px-3 py-2 text-slate-400">system</td>
                              </tr>
                            ))}
                            {restrictions.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-500">{formatDate(r.created_at)}</td>
                                <td className="px-3 py-2 font-semibold text-purple-600">Restriction</td>
                                <td className="px-3 py-2 text-slate-800">{r.reason}</td>
                                <td className="px-3 py-2 font-semibold capitalize text-slate-700">
                                  {r.restriction_type?.replaceAll('_', ' ')} ({r.status})
                                </td>
                                <td className="px-3 py-2 text-slate-400">{r.applied_by}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* MERCHANT ACTIONS (PDF Section 5 & 10) */}
                <div className="border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">MERCHANT DECISION & AUTHORITY (PDF §5 & §10)</h3>
                    <span className="text-[11px] text-slate-400">Merchant has final authority</span>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional decision note for audit trail..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <button
                      onClick={() => handleAction('accept')}
                      disabled={actionLoading}
                      className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                    >
                      ✓ ACCEPT ORDER
                    </button>
                    <button
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading}
                      className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
                    >
                      ✕ REJECT ORDER
                    </button>
                    <button
                      onClick={() => handleAction('verify')}
                      disabled={actionLoading}
                      className="rounded-xl bg-amber-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
                    >
                      ⚡ REQUEST VERIFY
                    </button>
                    <button
                      onClick={() => handleAction('restrict_cod')}
                      disabled={actionLoading}
                      className="rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                      🚫 RESTRICT COD
                    </button>
                    <button
                      onClick={() => handleAction('require_prepaid')}
                      disabled={actionLoading}
                      className="rounded-xl bg-purple-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
                    >
                      💳 REQUIRE PREPAID
                    </button>
                    <button
                      onClick={() => handleAction('restrict_high_value')}
                      disabled={actionLoading}
                      className="rounded-xl bg-sky-700 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-600 disabled:opacity-50"
                    >
                      🔒 CAP ORDER VALUE
                    </button>
                    <button
                      onClick={() => handleAction('increase_restriction')}
                      disabled={actionLoading}
                      className="rounded-xl bg-orange-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
                    >
                      ▲ ESCALATE LEVEL
                    </button>
                    <button
                      onClick={() => handleAction('suspend_account')}
                      disabled={actionLoading}
                      className="rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-rose-400 shadow-sm hover:bg-black disabled:opacity-50"
                    >
                      ⛔ SUSPEND ACCOUNT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
