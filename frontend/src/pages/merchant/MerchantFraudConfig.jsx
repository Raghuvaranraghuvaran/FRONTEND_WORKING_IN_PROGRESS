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

const PRESET_TEMPLATES = {
  baseline: {
    name: 'PDF Baseline MVP (PDF §4)',
    desc: 'Standard weights as specified in the ReturnGuard Architecture PDF.',
    weights: {
      cod_refusal: 25,
      return_frequency: 20,
      multiple_variants: 15,
      high_value_cod: 10,
      seasonal_signal: 10,
      address_mismatch: 10,
      device_reuse: 22,
      escalation_bonus: 8,
    },
    thresholds: { low_max: 34, medium_max: 64, high_min: 65 },
  },
  wardrobing: {
    name: 'Fashion & Festive (Wardrobing Protection)',
    desc: 'Heavier penalties on multiple variants, return rate, and festive seasonal signals.',
    weights: {
      cod_refusal: 20,
      return_frequency: 30,
      multiple_variants: 25,
      high_value_cod: 10,
      seasonal_signal: 20,
      address_mismatch: 10,
      device_reuse: 20,
      escalation_bonus: 10,
    },
    thresholds: { low_max: 30, medium_max: 60, high_min: 61 },
  },
  electronics: {
    name: 'Electronics & High-Value COD Protection',
    desc: 'Strict controls on high-value COD orders, COD refusals, and address mismatches.',
    weights: {
      cod_refusal: 35,
      return_frequency: 15,
      multiple_variants: 10,
      high_value_cod: 25,
      seasonal_signal: 5,
      address_mismatch: 20,
      device_reuse: 25,
      escalation_bonus: 12,
    },
    thresholds: { low_max: 25, medium_max: 55, high_min: 56 },
  },
}

export default function MerchantFraudConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weights, setWeights] = useState({})
  const [thresholds, setThresholds] = useState({})
  const [reviewEnabled, setReviewEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('weights') // 'weights' | 'triggers' | 'simulator'
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Trigger Thresholds
  const [triggers, setTriggers] = useState({
    highValueCodLimit: 5000,
    multiVariantMin: 3,
    highReturnRatePct: 40,
    codRefusalCountMin: 2,
    requirePhotoProof: true,
    requireOtpLevel1: true,
    autoEscalateOnRefusal: true,
  })

  // Live Simulator state
  const [simState, setSimState] = useState({
    returnRate: 0.5,
    codRefusals: 2,
    variants: 3,
    isCod: true,
    orderTotal: 6500,
    isSeasonal: true,
    addressMismatch: 1,
    deviceReuse: true,
    escalationLevel: 2,
  })

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

  const applyPreset = (presetKey) => {
    const preset = PRESET_TEMPLATES[presetKey]
    if (preset) {
      setWeights({ ...preset.weights })
      setThresholds({ ...preset.thresholds })
    }
  }

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

  // Calculate live simulated score based on current weights
  const calculateSimScore = () => {
    let score = 10
    const signals = []

    if (simState.returnRate > 0.4) {
      score += weights.return_frequency || 20
      signals.push(`High return frequency (+${weights.return_frequency || 20})`)
    } else if (simState.returnRate > 0.2) {
      score += (weights.return_frequency || 20) * 0.6
      signals.push(`Elevated return frequency (+${Math.round((weights.return_frequency || 20) * 0.6)})`)
    }

    if (simState.codRefusals >= 2) {
      score += weights.cod_refusal || 25
      signals.push(`Repeated COD refusals (+${weights.cod_refusal || 25})`)
    } else if (simState.codRefusals === 1) {
      score += (weights.cod_refusal || 25) * 0.5
      signals.push(`COD refusal history (+${Math.round((weights.cod_refusal || 25) * 0.5)})`)
    }

    if (simState.variants >= 3) {
      score += weights.multiple_variants || 15
      signals.push(`Multiple variants (${simState.variants}) (+${weights.multiple_variants || 15})`)
    }

    if (simState.isCod && simState.orderTotal >= 5000) {
      score += weights.high_value_cod || 10
      signals.push(`High-value COD (₹${simState.orderTotal}) (+${weights.high_value_cod || 10})`)
    }

    if (simState.isSeasonal) {
      score += weights.seasonal_signal || 10
      signals.push(`Seasonal / Festive signal (+${weights.seasonal_signal || 10})`)
    }

    if (simState.addressMismatch >= 1) {
      score += weights.address_mismatch || 10
      signals.push(`Address mismatch (+${weights.address_mismatch || 10})`)
    }

    if (simState.deviceReuse) {
      score += weights.device_reuse || 22
      signals.push(`Device reuse (+${weights.device_reuse || 22})`)
    }

    if (simState.escalationLevel >= 2) {
      score += (weights.escalation_bonus || 8) * (simState.escalationLevel >= 3 ? 2 : 1)
      signals.push(`Escalation Level ${simState.escalationLevel} (+${(weights.escalation_bonus || 8) * (simState.escalationLevel >= 3 ? 2 : 1)})`)
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)))
    const tier = finalScore > (thresholds.medium_max || 64) ? 'High' : finalScore > (thresholds.low_max || 34) ? 'Medium' : 'Low'
    const action = tier === 'High' ? (simState.escalationLevel >= 3 ? 'Require Prepaid + Review' : 'Manual Review') : tier === 'Medium' ? 'Request OTP Verification' : 'Auto-Approve'

    return { score: finalScore, tier, action, signals }
  }

  const simResult = calculateSimScore()

  if (loading || !config) {
    return <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fraud Rules & Risk Engine Configuration</h1>
          <p className="text-sm text-slate-500">
            Configure weighted scoring signals (PDF §4), escalation triggers, preset templates, and test live with the Risk Simulator.
          </p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
          Rule Engine: {config.rule_version || 'rg-rules-v0.4'}
        </span>
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</div>}

      {/* Preset Profiles Bar */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900">1-Click Industry Presets (PDF §4 Tuning)</h2>
            <p className="text-xs text-indigo-700">Quickly apply recommended weights calibrated for different merchant business models.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {Object.entries(PRESET_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="text-left rounded-xl border border-indigo-200 bg-white p-3 shadow-xs hover:border-indigo-500 hover:shadow-sm transition-all"
            >
              <div className="font-bold text-xs text-slate-900">{template.name}</div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{template.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('weights')}
          className={`border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'weights' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Signal Weights & Risk Tiers
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'triggers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trigger Thresholds & Proof Rules (PDF §3 & §8)
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'simulator' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚡ Live Risk Simulator & Playground
        </button>
      </div>

      {/* TAB 1: WEIGHTS & THRESHOLDS */}
      {activeTab === 'weights' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Signal Weights */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Signal Scoring Weights (PDF §4)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Points added to base score (0–100 scale) when signal is triggered.</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                MVP Weights
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
                <div>
                  <label className="text-xs font-semibold text-slate-700">Low Tier Max (Auto-Approve Cutoff)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.low_max || 34}
                    onChange={(e) => setThresholds({ ...thresholds, low_max: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Medium Tier Max (Verification Cutoff)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.medium_max || 64}
                    onChange={(e) => setThresholds({ ...thresholds, medium_max: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">High Tier Min (Manual Review Queue)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.high_min || 65}
                    onChange={(e) => setThresholds({ ...thresholds, high_min: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

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
                    When checked, orders/returns exceeding risk thresholds are placed in the Flagged Queue for merchant decision.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Progressive Escalation Ladder (PDF §6)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated policy applied when repeat violations are confirmed.</p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                  <span className="font-semibold text-slate-800">Level 1 (1st Incident):</span>
                  <span className="text-slate-600 font-mono">Warning / OTP Verification</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-2.5 text-amber-900">
                  <span className="font-semibold">Level 2 (2nd Incident):</span>
                  <span className="font-mono">COD Restriction (Limit or Disable)</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-purple-50 p-2.5 text-purple-900">
                  <span className="font-semibold">Level 3 (3rd Incident):</span>
                  <span className="font-mono">Prepaid Only + Manual Review</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-rose-50 p-2.5 text-rose-900">
                  <span className="font-semibold">Level 4-5 (Repeat Abuse):</span>
                  <span className="font-mono">Temporary Account Suspension & Merchant Final Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRIGGER THRESHOLDS & PROOF RULES */}
      {activeTab === 'triggers' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Specific Signal Trigger Cutoffs (PDF §3)</h2>
            <p className="text-xs text-slate-500">Fine-tune exactly when an individual risk signal is triggered.</p>

            <div>
              <label className="text-xs font-semibold text-slate-700">High-Value COD Threshold (₹)</label>
              <input
                type="number"
                value={triggers.highValueCodLimit}
                onChange={(e) => setTriggers({ ...triggers, highValueCodLimit: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">COD orders at or above this value trigger high-value exposure signal.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Multiple-Variant Order Threshold (Items)</label>
              <input
                type="number"
                value={triggers.multiVariantMin}
                onChange={(e) => setTriggers({ ...triggers, multiVariantMin: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Orders with this many items/variants trigger over-ordering (bracketing) signal.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">High Return Rate Cutoff (%)</label>
              <input
                type="number"
                value={triggers.highReturnRatePct}
                onChange={(e) => setTriggers({ ...triggers, highReturnRatePct: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Lifetime return percentage considered high risk.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Repeated COD Refusals Trigger Count</label>
              <input
                type="number"
                value={triggers.codRefusalCountMin}
                onChange={(e) => setTriggers({ ...triggers, codRefusalCountMin: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">Number of COD refusals before maximum 25 pts penalty is applied.</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Return Claims & Proof Policies (PDF §3 & §8)</h2>
            <p className="text-xs text-slate-500">Automate physical evidence collection and delivery verification.</p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggers.requirePhotoProof}
                  onChange={(e) => setTriggers({ ...triggers, requirePhotoProof: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">Require Photo / Unboxing Proof for High-Risk Returns</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Shoppers in High risk tier must upload unboxing photo evidence before return pickup is scheduled.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggers.requireOtpLevel1}
                  onChange={(e) => setTriggers({ ...triggers, requireOtpLevel1: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">Require OTP Confirmation for Escalation Level 1+ Customers</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Requires two-factor phone verification before processing orders for customers with a warning or restriction.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggers.autoEscalateOnRefusal}
                  onChange={(e) => setTriggers({ ...triggers, autoEscalateOnRefusal: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">Auto-Escalate on Confirmed Refusal</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatically advance escalation level when courier confirms doorstep refusal.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE RISK SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Simulator Inputs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Scenario Builder</h2>
            <p className="text-xs text-slate-500">Simulate customer orders to test how your configured weights calculate risk.</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Shopper Return Rate</label>
                <select
                  value={simState.returnRate}
                  onChange={(e) => setSimState({ ...simState, returnRate: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value={0.1}>Low (&lt;15%)</option>
                  <option value={0.3}>Elevated (30%)</option>
                  <option value={0.5}>High (50%)</option>
                  <option value={0.8}>Very High (80%)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">COD Refusals Count</label>
                <select
                  value={simState.codRefusals}
                  onChange={(e) => setSimState({ ...simState, codRefusals: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value={0}>0 refusals</option>
                  <option value={1}>1 refusal</option>
                  <option value={2}>2 refusals (Repeated)</option>
                  <option value={4}>4+ refusals</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Order Items / Variants</label>
                <select
                  value={simState.variants}
                  onChange={(e) => setSimState({ ...simState, variants: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value={1}>1 item (Standard)</option>
                  <option value={2}>2 items</option>
                  <option value={3}>3 variants (Bracketing)</option>
                  <option value={5}>5+ items</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Order Total (₹)</label>
                <input
                  type="number"
                  value={simState.orderTotal}
                  onChange={(e) => setSimState({ ...simState, orderTotal: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Payment Method</label>
                <select
                  value={simState.isCod ? 'COD' : 'Prepaid'}
                  onChange={(e) => setSimState({ ...simState, isCod: e.target.value === 'COD' })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Prepaid">Prepaid / UPI</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Current Escalation Level</label>
                <select
                  value={simState.escalationLevel}
                  onChange={(e) => setSimState({ ...simState, escalationLevel: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none"
                >
                  <option value={0}>Level 0 (Normal)</option>
                  <option value={1}>Level 1 (Warning)</option>
                  <option value={2}>Level 2 (COD Restricted)</option>
                  <option value={3}>Level 3 (Prepaid Only)</option>
                  <option value={4}>Level 4 (Suspended)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simState.isSeasonal}
                  onChange={(e) => setSimState({ ...simState, isSeasonal: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Festive / Seasonal Category
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simState.addressMismatch > 0}
                  onChange={(e) => setSimState({ ...simState, addressMismatch: e.target.checked ? 1 : 0 })}
                  className="rounded text-indigo-600"
                />
                Address Inconsistency
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simState.deviceReuse}
                  onChange={(e) => setSimState({ ...simState, deviceReuse: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                Device Fingerprint Reuse
              </label>
            </div>
          </div>

          {/* Simulator Live Output */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-300">Live Engine Evaluation</span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    simResult.tier === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : simResult.tier === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {simResult.tier.toUpperCase()} RISK
                </span>
              </div>

              <div className="my-6 text-center">
                <p className="text-xs text-slate-400">Calculated Composite Score</p>
                <p className="text-5xl font-black text-white mt-1">
                  {simResult.score}
                  <span className="text-lg font-normal text-slate-400"> / 100</span>
                </p>
                <div className="mt-3 inline-block rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <p className="text-[11px] text-indigo-200">Recommended Decision (PDF §5):</p>
                  <p className="text-sm font-bold text-white uppercase">{simResult.action}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-white/10 pt-3">
                <p className="text-xs font-semibold text-slate-300">Triggered Signals Breakdown:</p>
                {simResult.signals.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No adverse signals triggered (Base score: 10).</p>
                ) : (
                  simResult.signals.map((sig, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <span>{sig}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-white/10 pt-3 mt-4">
              Real-time calculation computed using your active slider weights.
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Risk Configuration'}
        </button>
        <p className="text-xs text-slate-400">Updates are immediately applied to the composite scoring engine.</p>
      </div>
    </div>
  )
}
