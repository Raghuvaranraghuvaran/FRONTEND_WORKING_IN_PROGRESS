import { useEffect, useState } from 'react'
import { api } from '../../mock/api'

export default function MerchantAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState(null)

  const load = () => {
    setLoading(true)
    api.getAnalytics().then((result) => {
      setData(result)
      setLoading(false)
    })
  }

  useEffect(load, [])

  const applySuggestion = async (id) => {
    setApplyingId(id)
    await api.applySelfTuningSuggestion(id)
    load()
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Fraud trend analytics</h1>
      <p className="text-sm text-slate-500">Returns per week, top flagged customers, category return rates, and tuning suggestions.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Returns per week</h2>
          {(!data.weeklyTrend || data.weeklyTrend.length === 0) ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              No weekly return trend data recorded yet.
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-end gap-3" style={{ height: '220px' }}>
                {data.weeklyTrend.map((week) => {
                  const max = Math.max(1, ...data.weeklyTrend.map((w) => w.returns || 0))
                  return (
                    <div key={week.week} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex w-full items-end justify-center gap-1">
                        <div className="w-7 rounded-t-md bg-slate-200" style={{ height: `${((week.returns || 0) / max) * 170}px` }} title={`${week.returns} returns`} />
                        <div className="w-7 rounded-t-md bg-rose-400" style={{ height: `${((week.flagged || 0) / max) * 170}px` }} title={`${week.flagged} flagged`} />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{week.week}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex justify-center gap-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-slate-200" /> Returns</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-400" /> Flagged</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Top flagged customers</h2>
          {(!data.topFlaggedCustomers || data.topFlaggedCustomers.length === 0) ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
              No flagged customers for this store.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.topFlaggedCustomers.map((item, index) => (
                <div key={item.customer || index} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</span>
                    <span className="text-sm font-medium text-slate-900">{item.customer}</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-600">{item.flagged} flagged</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Category-wise return rates</h2>
        <div className="mt-4 space-y-3">
          {data.categoryReturnRates.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">{item.category}</span>
                <span className="font-semibold text-slate-900">{item.return_rate}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${item.return_rate}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Self-tuning threshold suggestions</h2>
        <p className="mt-1 text-sm text-slate-500">Recommendation-only. No changes apply automatically.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.selfTuningSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{suggestion.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{suggestion.reason}</p>
                </div>
                {suggestion.status === 'applied' ? (
                  <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Applied</span>
                ) : (
                  <button
                    onClick={() => applySuggestion(suggestion.id)}
                    disabled={applyingId === suggestion.id}
                    className="w-fit rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                  >
                    Apply
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Current: <span className="font-semibold text-slate-900">{suggestion.current_value}</span></span>
                <span>Suggested: <span className="font-semibold text-indigo-600">{suggestion.suggested_value}</span></span>
                <span>Confidence: <span className="font-semibold text-slate-900">{(suggestion.confidence * 100).toFixed(0)}%</span></span>
                <span>Sample: <span className="font-semibold text-slate-900">{suggestion.sample_size} outcomes</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
