import { useEffect, useState } from 'react'
import { api } from '../../mock/api'

const weightLabels = {
  return_frequency: 'Return frequency',
  cod_refusal: 'COD refusal',
  device_reuse: 'Device reuse',
  address_mismatch: 'Address mismatch',
  seasonal_signal: 'Seasonal signal',
}

const thresholdLabels = {
  low_max: 'Low tier max',
  medium_max: 'Medium tier max',
  high_min: 'High tier min',
}

export default function MerchantFraudConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weights, setWeights] = useState({})
  const [thresholds, setThresholds] = useState({})
  const [reviewEnabled, setReviewEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getFraudConfig().then((data) => {
      setConfig(data)
      setWeights(data.weights)
      setThresholds(data.thresholds)
      setReviewEnabled(data.review_enabled)
      setLoading(false)
    })
  }, [])

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const updated = await api.updateFraudConfig({ weights, thresholds, review_enabled: reviewEnabled })
      setConfig(updated)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fraud rules & thresholds</h1>
          <p className="text-sm text-slate-500">Configure rule weights and review thresholds for the risk engine.</p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {config.rule_version}
        </span>
      </div>

      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Rule weights</h2>
          <p className="mt-1 text-sm text-slate-500">Weights should sum to approximately 1.0.</p>
          <div className="mt-5 space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm">
                  <label className="font-medium text-slate-700">{weightLabels[key] || key}</label>
                  <span className="font-semibold text-slate-900">{Number(value).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={value}
                  onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Risk thresholds</h2>
          <p className="mt-1 text-sm text-slate-500">Scores at or above the high threshold route to manual review.</p>
          <div className="mt-5 space-y-4">
            {Object.entries(thresholds).map(([key, value]) => (
              <div key={key}>
                <label className="text-sm font-medium text-slate-700">{thresholdLabels[key] || key}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => setThresholds({ ...thresholds, [key]: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ))}

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={reviewEnabled}
                onChange={(e) => setReviewEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enable manual review for high-risk cases
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save configuration'}
        </button>
        <p className="text-xs text-slate-400">Changes are logged to the audit trail.</p>
      </div>
    </div>
  )
}
