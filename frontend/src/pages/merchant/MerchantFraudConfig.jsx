import { useEffect, useState } from 'react'
import { api } from '../../mock/api'

const weightLabels = {
  cod_refusal: 'Repeated COD Refusals (Max 25 pts)',
  return_frequency: 'High Return Frequency (Max 20 pts)',
  multiple_variants: 'Multiple Variant Orders (Max 15 pts)',
  high_value_cod: 'High-Value COD Orders (Max 10 pts)',
  seasonal_signal: 'Seasonal / Wardrobing Signals (Max 10 pts)',
  address_mismatch: 'Address Inconsistencies (Max 10 pts)',
  device_reuse: 'Device Reuse / Multi-Account (Max 22 pts)',
  escalation_bonus: 'Repeat Offender / Escalation Multiplier (Max 16 pts)',
}

const thresholdLabels = {
  low_max: 'Low Tier Max Score (Auto-Approve Cutoff)',
  medium_max: 'Medium Tier Max Score (Verification Cutoff)',
  high_min: 'High Tier Min Score (Manual Review Route)',
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
      const defaultWeights = {
        cod_refusal: 25,
        return_frequency: 20,
        multiple_variants: 15,
        high_value_cod: 10,
        seasonal_signal: 10,
        address_mismatch: 10,
        device_reuse: 22,
        escalation_bonus: 8,
        ...(data.weights || {}),
      }
      setWeights(defaultWeights)
      setThresholds(data.thresholds || { low_max: 34, medium_max: 64, high_min: 65 })
      setReviewEnabled(data.review_enabled ?? true)
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fraud Rules & Risk Engine Configuration</h1>
          <p className="text-sm text-slate-500">
            Configure weighted scoring signals (PDF §4), escalation thresholds, and automated review policies.
          </p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
          Rule Engine: {config.rule_version || 'rg-rules-v0.4'}
        </span>
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signal Weights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Signal Scoring Weights (PDF §4)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Points added to base score (0–100 scale) when signal is triggered.</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              MVP Tuning
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                <div className="flex justify-between text-xs font-semibold">
                  <label className="text-slate-700">{weightLabels[key] || key}</label>
                  <span className="font-mono text-indigo-600 font-bold">+{Number(value)} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={value}
                  onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Risk Thresholds & Escalation Policies */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Risk Tiers & Decision Routing</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define cutoffs for Low (Auto-Approve), Medium (Verify), High (Manual Review).</p>

            <div className="mt-5 space-y-4">
              {Object.entries(thresholds).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-700">{thresholdLabels[key] || key}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setThresholds({ ...thresholds, [key]: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}

              <div className="rounded-xl bg-indigo-50/60 p-3.5 border border-indigo-100">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewEnabled}
                    onChange={(e) => setReviewEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Enable Merchant Authority Review Queue for High-Risk Cases
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  When checked, cases scoring &gt;{thresholds.medium_max || 64} are placed in the Flagged Queue for merchant decision.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Progressive Escalation Ladder (PDF §6)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated policy applied when repeat violations are confirmed.</p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                <span className="font-semibold text-slate-800">1st Incident:</span>
                <span className="text-slate-600 font-mono">Warning / OTP Verification</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 p-2.5 text-amber-900">
                <span className="font-semibold">2nd Incident:</span>
                <span className="font-mono">COD Restriction (Limit or Disable)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2.5 text-purple-900">
                <span className="font-semibold">3rd Incident:</span>
                <span className="font-mono">Prepaid Only + Manual Review</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 p-2.5 text-rose-900">
                <span className="font-semibold">4th Incident+:</span>
                <span className="font-mono">Temporary Account Suspension & Merchant Final Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Risk Configuration'}
        </button>
        <p className="text-xs text-slate-400">Updates are immediately applied to the composite scoring engine.</p>
      </div>
    </div>
  )
}
