import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'

export default function MerchantFlaggedCases() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')

  const load = () => {
    api.getMerchantReturns().then((data) => {
      setReturns(data)
      setLoading(false)
    })
  }

  useEffect(load, [])

  const review = async (action) => {
    if (!selected) return
    await api.reviewReturn({ returnId: selected.id, action, notes })
    setMessage(`Return ${selected.order_number} ${action === 'approve' ? 'approved' : 'rejected'}.`)
    setSelected(null)
    setNotes('')
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Flagged cases</h1>
      <p className="text-sm text-slate-500">Manual review queue for returns that exceeded the risk threshold.</p>

      {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      {loading ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : returns.length === 0 ? (
        <div className="mt-6"><EmptyState title="No return requests" /></div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => {
                      setSelected(record)
                      setMessage('')
                    }}
                    className={`cursor-pointer hover:bg-slate-50 ${selected?.id === record.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{record.order_number}</td>
                    <td className="px-4 py-3 text-slate-600">{record.customer_name}</td>
                    <td className="px-4 py-3"><RiskBadge tier={record.risk_tier} /></td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            {!selected ? (
              <div className="flex h-full min-h-64 items-center justify-center text-sm text-slate-500">
                Select a case to review.
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Return {selected.order_number}</h2>
                    <p className="text-sm text-slate-500">{selected.customer_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(selected.created_at)}</p>
                  </div>
                  <RiskBadge tier={selected.risk_tier} />
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Risk score</span>
                    <span className="font-bold text-slate-900">{selected.risk_score}/100</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">Reason</span>
                    <span className="font-semibold text-slate-900">{selected.reason.replaceAll('_', ' ')}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">Verification</span>
                    <span className="font-semibold text-slate-900">{selected.verification_status}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">Risk context</p>
                  <p className="mt-1 text-sm text-slate-600">{selected.risk_context}</p>
                </div>

                {selected.signals && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.signals.map((signal) => (
                      <span key={signal} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {signal}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5">
                  <label className="text-sm font-semibold text-slate-900">Decision notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Optional note for the audit log"
                  />
                </div>

                {selected.status === 'manual_review' && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => review('approve')}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => review('reject')}
                      className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500"
                    >
                      Reject
                    </button>
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
