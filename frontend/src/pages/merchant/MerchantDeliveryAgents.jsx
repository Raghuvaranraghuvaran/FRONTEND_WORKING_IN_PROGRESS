import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import RiskBadge from '../../components/RiskBadge'

function riskBadgeFor(flag) {
  if (flag === 'Review') return 'High'
  if (flag === 'Monitor') return 'Medium'
  return 'Low'
}

export default function MerchantDeliveryAgents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDeliveryAgents().then((data) => {
      setAgents(data)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Delivery-agent risk</h1>
      <p className="text-sm text-slate-500">
        Baseline-adjusted anomaly review. This is an investigation signal, not a confirmed-collusion finding.
      </p>

      {loading ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {agents.map((agent) => {
            const gap = agent.return_rate - agent.expected_return_rate
            return (
              <div key={agent.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{agent.name}</h2>
                    <p className="text-sm text-slate-500">{agent.route} · {agent.pincode}</p>
                  </div>
                  <RiskBadge tier={riskBadgeFor(agent.risk_flag)} />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{agent.total_deliveries}</p>
                    <p className="text-xs text-slate-500">Deliveries</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{agent.total_returns_handled}</p>
                    <p className="text-xs text-slate-500">Returns</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-900">{agent.flagged_return_count}</p>
                    <p className="text-xs text-slate-500">Flagged</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Actual return rate</span>
                    <span className="font-bold text-slate-900">{agent.return_rate}%</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">Expected route baseline</span>
                    <span className="font-semibold text-slate-900">{agent.expected_return_rate}%</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">Anomaly gap</span>
                    <span className={`font-semibold ${gap > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>{gap > 0 ? '+' : ''}{gap.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {agent.risk_flag === 'Review'
                    ? 'Sustained deviation detected. Requires human sign-off before any operational action.'
                    : 'Within expected range, but flagged for continued monitoring.'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
