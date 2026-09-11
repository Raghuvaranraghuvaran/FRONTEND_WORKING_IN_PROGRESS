import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import { 
  Sparkles,
  ShoppingBag,
  Shirt,
  Laptop,
  BarChart2,
  Sliders,
  Play,
  Users,
  BarChart3,
  RotateCcw,
  Target,
  CheckCircle2,
  Search,
  UserCheck,
  TrendingUp,
  Save,
  Lightbulb,
  CheckCircle,
  Ban,
  Package,
  Layers,
  Gem,
  Calendar,
  MapPin,
  Smartphone,
  AlertTriangle,
  ArrowRight,
  Shield
} from 'lucide-react'

const SIGNAL_CONFIGS = {
  cod_refusal: {
    label: 'Repeated COD Refusals (Max 25 pts)',
    icon: Ban,
    accentColor: 'accent-rose-500',
    colorHex: '#f43f5e',
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-100',
    defaultVal: 18,
    maxVal: 25,
  },
  return_frequency: {
    label: 'High Return Frequency (Max 20 pts)',
    icon: Package,
    accentColor: 'accent-amber-500',
    colorHex: '#f59e0b',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
    defaultVal: 32,
    maxVal: 40,
  },
  multiple_variants: {
    label: 'Multiple Variant Orders / Bracketing (Max 15 pts)',
    icon: Layers,
    accentColor: 'accent-purple-500',
    colorHex: '#a855f7',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-100',
    defaultVal: 15,
    maxVal: 25,
  },
  high_value_cod: {
    label: 'High-Value COD Orders (Max 10 pts)',
    icon: Gem,
    accentColor: 'accent-blue-500',
    colorHex: '#3b82f6',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
    defaultVal: 10,
    maxVal: 20,
  },
  seasonal_signal: {
    label: 'Seasonal / Festive Signals (Max 10 pts)',
    icon: Calendar,
    accentColor: 'accent-emerald-500',
    colorHex: '#10b981',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    defaultVal: 16,
    maxVal: 20,
  },
  address_mismatch: {
    label: 'Address Inconsistencies / Frequent Changes (Max 10 pts)',
    icon: MapPin,
    accentColor: 'accent-amber-400',
    colorHex: '#f59e0b',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-100',
    defaultVal: 12,
    maxVal: 20,
  },
  device_reuse: {
    label: 'Device Reuse / Multi-Account (Max 22 pts)',
    icon: Smartphone,
    accentColor: 'accent-teal-500',
    colorHex: '#14b8a6',
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-50',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-100',
    defaultVal: 22,
    maxVal: 30,
  },
  escalation_bonus: {
    label: 'Repeat Offender / Escalation Multiplier (Max 16 pts)',
    icon: AlertTriangle,
    accentColor: 'accent-pink-500',
    colorHex: '#ec4899',
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-50',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-100',
    defaultVal: 8,
    maxVal: 20,
  },
}

const PRESET_TEMPLATES = {
  baseline: {
    id: 'baseline',
    name: 'Standard Baseline (All 28 Checkpoints)',
    desc: 'Standard weights across 4 tier architecture as specified in ReturnGuard Risk Checkpoints.',
    recommended: true,
    icon: ShoppingBag,
    iconBg: 'bg-indigo-50 text-indigo-600',
    weights: {
      cod_refusal: 18,
      return_frequency: 32,
      multiple_variants: 15,
      high_value_cod: 10,
      seasonal_signal: 16,
      address_mismatch: 12,
      device_reuse: 22,
      escalation_bonus: 8,
    },
    thresholds: { low_max: 34, medium_max: 64, high_min: 65 },
  },
  wardrobing: {
    id: 'wardrobing',
    name: 'Fashion & Festive (Wardrobing Protection)',
    desc: 'Heavier penalties on multiple variants, return rate, wardrobing, and festive signals.',
    recommended: false,
    icon: Shirt,
    iconBg: 'bg-pink-50 text-pink-500',
    weights: {
      cod_refusal: 20,
      return_frequency: 35,
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
    id: 'electronics',
    name: 'Electronics & High-Value Physical Protection',
    desc: 'Strict controls on serial/IMEI mismatches, product swaps, missing accessories, and high value orders.',
    recommended: false,
    icon: Laptop,
    iconBg: 'bg-cyan-50 text-cyan-600',
    weights: {
      cod_refusal: 25,
      return_frequency: 20,
      multiple_variants: 10,
      high_value_cod: 25,
      seasonal_signal: 10,
      address_mismatch: 18,
      device_reuse: 25,
      escalation_bonus: 12,
    },
    thresholds: { low_max: 25, medium_max: 55, high_min: 56 },
  },
}

export default function MerchantFraudConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState('baseline')
  const [weights, setWeights] = useState({
    cod_refusal: 18,
    return_frequency: 32,
    multiple_variants: 15,
    high_value_cod: 10,
    seasonal_signal: 16,
    address_mismatch: 12,
    device_reuse: 22,
    escalation_bonus: 8,
  })
  const [thresholds, setThresholds] = useState({ low_max: 34, medium_max: 64, high_min: 65 })
  const [reviewEnabled, setReviewEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('weights') // 'weights' | 'triggers' | 'simulator' | 'rules'
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Trigger Thresholds (Tab 2)
  const [triggers, setTriggers] = useState({
    highValueCodLimit: 5000,
    multiVariantMin: 3,
    highReturnRatePct: 40,
    codRefusalCountMin: 2,
    requirePhotoProof: true,
    requireOtpLevel1: true,
    autoEscalateOnRefusal: true,
  })

  // Live Simulator state (Tab 3)
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

  // VIP Rules (Tab 4)
  const [rules, setRules] = useState([])
  const [newRule, setNewRule] = useState({ rule_type: 'blacklist', entry_type: 'email', value: '', reason: '' })
  const [addingRule, setAddingRule] = useState(false)

  useEffect(() => {
    api.getFraudConfig().then((data) => {
      if (data) {
        setConfig(data)
        const rawWeights = data.weights || {}
        const sanitized = {}
        Object.entries(rawWeights).forEach(([k, v]) => {
          const num = Number(v)
          if (!isNaN(num)) {
            sanitized[k] = num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num)
          }
        })
        setWeights((prev) => ({
          ...prev,
          ...sanitized,
        }))
        if (data.thresholds) {
          setThresholds(data.thresholds)
        }
        if (typeof data.review_enabled === 'boolean') {
          setReviewEnabled(data.review_enabled)
        }
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    api.getListRules().then((r) => setRules(Array.isArray(r) ? r : [])).catch(() => {})
  }, [])

  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey)
    const preset = PRESET_TEMPLATES[presetKey]
    if (preset) {
      setWeights({ ...preset.weights })
      setThresholds({ ...preset.thresholds })
    }
  }

  const resetWeights = () => {
    const defaultVals = {}
    Object.entries(SIGNAL_CONFIGS).forEach(([key, cfg]) => {
      defaultVals[key] = cfg.defaultVal
    })
    setWeights(defaultVals)
    setThresholds({ low_max: 34, medium_max: 64, high_min: 65 })
    setSelectedPreset('baseline')
  }

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      const updated = await api.updateFraudConfig({ weights, thresholds, review_enabled: reviewEnabled })
      if (updated) setConfig(updated)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  // Live Simulator Score Calculation
  const calculateSimScore = () => {
    let score = 10
    const signals = []

    if (simState.returnRate > 0.4) {
      score += weights.return_frequency || 32
      signals.push(`High return frequency (+${weights.return_frequency || 32})`)
    } else if (simState.returnRate > 0.2) {
      score += Math.round((weights.return_frequency || 32) * 0.6)
      signals.push(`Elevated return frequency (+${Math.round((weights.return_frequency || 32) * 0.6)})`)
    }

    if (simState.codRefusals >= 2) {
      score += weights.cod_refusal || 18
      signals.push(`Repeated COD refusals (${simState.codRefusals}) (+${weights.cod_refusal || 18})`)
    }

    if (simState.variants >= 3) {
      score += weights.multiple_variants || 15
      signals.push(`Over-ordering / Bracketing pattern (+${weights.multiple_variants || 15})`)
    }

    if (simState.isCod && simState.orderTotal > 5000) {
      score += weights.high_value_cod || 10
      signals.push(`High-value COD exposure (+${weights.high_value_cod || 10})`)
    }

    if (simState.isSeasonal) {
      score += weights.seasonal_signal || 16
      signals.push(`Festive seasonal return spike (+${weights.seasonal_signal || 16})`)
    }

    if (simState.addressMismatch > 0) {
      score += weights.address_mismatch || 12
      signals.push(`Address mismatch signal (+${weights.address_mismatch || 12})`)
    }

    if (simState.deviceReuse) {
      score += weights.device_reuse || 22
      signals.push(`Device fingerprint overlap (+${weights.device_reuse || 22})`)
    }

    if (simState.escalationLevel >= 2) {
      score += weights.escalation_bonus || 8
      signals.push(`Escalation level ${simState.escalationLevel} multiplier (+${weights.escalation_bonus || 8})`)
    }

    const cappedScore = Math.min(100, Math.max(0, Math.round(score)))
    let tier = 'Low'
    let action = 'Auto-Approve'

    if (cappedScore >= (thresholds.high_min || 65)) {
      tier = 'High'
      action = reviewEnabled ? 'Manual Review Queue (Refund Withheld)' : 'Auto-Hold'
    } else if (cappedScore > (thresholds.low_max || 34)) {
      tier = 'Medium'
      action = 'Doorstep Verification (OTP Required)'
    }

    return { score: cappedScore, tier, action, signals }
  }

  const simResult = calculateSimScore()

  const handleAddRule = async (e) => {
    e.preventDefault()
    if (!newRule.value.trim()) return
    setAddingRule(true)
    try {
      const created = await api.createListRule(newRule)
      setRules((prev) => [created, ...prev])
      setNewRule({ rule_type: 'blacklist', entry_type: 'email', value: '', reason: '' })
    } catch (err) {
      setError(err.message || 'Failed to add rule')
    } finally {
      setAddingRule(false)
    }
  }

  const handleToggleRule = async (id) => {
    try {
      const updated = await api.toggleListRule(id)
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: updated.is_active } : r)))
    } catch (err) {
      setError(err.message || 'Failed to toggle rule')
    }
  }

  const handleDeleteRule = async (id) => {
    try {
      await api.deleteListRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete rule')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-80 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fraud Rules & Risk Engine Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure weighted scoring signals, escalation triggers, preset templates, and test live with the Risk Simulator.
          </p>
        </div>

        {/* Top Right Rule Engine Badge & View Logs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-1.5 text-xs shadow-2xs">
            <Sliders className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-semibold text-indigo-950 font-mono">
              Rule Engine: {config?.rule_version || 'rg-rules-v0.4'}
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <Link
            to="/merchant/audit-log"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span>View Logs</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* ── 1-CLICK INDUSTRY PRESETS BAR ── */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-950">
            1-Click Industry Presets
          </h2>
        </div>
        <p className="text-xs text-indigo-800/80 mb-4">
          Quickly apply recommended weights calibrated for different merchant business models.
        </p>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {Object.entries(PRESET_TEMPLATES).map(([key, template]) => {
            const isSelected = selectedPreset === key
            const IconComp = template.icon
            return (
              <div
                key={key}
                onClick={() => applyPreset(key)}
                className={`relative flex items-start gap-3.5 rounded-2xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-white shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-indigo-100 bg-white/80 hover:border-indigo-300 hover:bg-white shadow-2xs'
                }`}
              >
                {/* Icon */}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${template.iconBg}`}>
                  <IconComp className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{template.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {template.desc}
                  </p>
                  {template.recommended && (
                    <span className="mt-2 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Radio Checkmark */}
                <div className="absolute right-4 top-4">
                  {isSelected ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── TABS NAVIGATION BAR ── */}
      <div className="flex border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('weights')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors cursor-pointer ${
            activeTab === 'weights'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Signal Weights & Risk Tiers</span>
        </button>

        <button
          onClick={() => setActiveTab('triggers')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors cursor-pointer ${
            activeTab === 'triggers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Trigger Thresholds & Proof Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Live Risk Simulator & Playground</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 transition-colors cursor-pointer ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>VIP Whitelist & Blacklist ({rules.length})</span>
        </button>
      </div>

      {/* ── TAB 1: SIGNAL WEIGHTS & RISK TIERS ── */}
      {activeTab === 'weights' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* LEFT CARD: Signal Scoring Weights (7 cols) */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            {/* Header with Reset Button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Signal Scoring Weights</h2>
                  <p className="text-[11px] text-slate-500">Points added to base score (0–100 scale) when signal is triggered.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetWeights}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Weights</span>
              </button>
            </div>

            {/* List of 8 Colored Sliders */}
            <div className="space-y-3.5">
              {Object.entries(SIGNAL_CONFIGS).map(([key, cfg]) => {
                const IconComponent = cfg.icon
                const currentVal = Math.round(Number(weights[key] !== undefined ? weights[key] : cfg.defaultVal))
                return (
                  <div
                    key={key}
                    className="flex flex-col rounded-2xl bg-slate-50/60 p-3.5 border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${cfg.iconBg} ${cfg.iconColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <label className="text-xs font-bold text-slate-800">{cfg.label}</label>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${cfg.badgeClass}`}>
                        {currentVal} pts
                      </span>
                    </div>

                    {(() => {
                      const maxV = cfg.maxVal || 40
                      const pct = Math.min(100, Math.max(0, Math.round((currentVal / maxV) * 100)))
                      return (
                        <div className="relative w-full flex items-center py-1.5 select-none">
                          {/* Background Track with Color Fill */}
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
                            <div
                              className="h-full rounded-full transition-all duration-75"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: cfg.colorHex,
                              }}
                            />
                          </div>

                          {/* Thumb Knob Indicator */}
                          <div
                            className="pointer-events-none absolute h-5 w-5 rounded-full bg-white shadow-md -translate-x-1/2 transition-all duration-75"
                            style={{
                              left: `${pct}%`,
                              border: `3.5px solid ${cfg.colorHex}`,
                            }}
                          />

                          {/* Interactive Range Input Overlaid */}
                          <input
                            type="range"
                            min="0"
                            max={maxV}
                            step="1"
                            value={currentVal}
                            onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            aria-label={cfg.label}
                          />
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Risk Tiers & Progressive Escalation Ladder (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* CARD 1: Risk Tiers & Decision Routing */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Risk Tiers & Decision Routing</h2>
                  <p className="text-[11px] text-slate-500">Define cutoffs for Low (Auto-Approve), Medium (Verify), High (Manual Review).</p>
                </div>
              </div>

              {/* 3 Tier Rows */}
              <div className="space-y-3.5">
                {/* Low Tier Row */}
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-800">Low Tier Max (Auto-Approve Cutoff)</label>
                    <p className="text-[11px] text-slate-400">Orders below or equal to this score are auto-approved.</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.low_max || 34}
                    onChange={(e) => setThresholds({ ...thresholds, low_max: Number(e.target.value) })}
                    className="w-16 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-left shrink-0 min-w-[125px]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800">Auto-Approve</div>
                      <div className="text-[9px] text-emerald-600">Fast & Frictionless</div>
                    </div>
                  </div>
                </div>

                {/* Medium Tier Row */}
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-800">Medium Tier Max (Verification Cutoff)</label>
                    <p className="text-[11px] text-slate-400">Orders above low tier and up to this score go for verification.</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.medium_max || 64}
                    onChange={(e) => setThresholds({ ...thresholds, medium_max: Number(e.target.value) })}
                    className="w-16 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-left shrink-0 min-w-[125px]">
                    <Search className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-amber-800">Verify</div>
                      <div className="text-[9px] text-amber-600">Ask for proof</div>
                    </div>
                  </div>
                </div>

                {/* High Tier Row */}
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-800">High Tier Min (Manual Review Queue)</label>
                    <p className="text-[11px] text-slate-400">Orders above this score go to manual review.</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.high_min || 65}
                    onChange={(e) => setThresholds({ ...thresholds, high_min: Number(e.target.value) })}
                    className="w-16 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center text-xs font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-left shrink-0 min-w-[125px]">
                    <UserCheck className="h-4 w-4 text-rose-600 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-rose-800">Manual Review</div>
                      <div className="text-[9px] text-rose-600">Human decision</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Styled Toggle Switch */}
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
                <button
                  type="button"
                  onClick={() => setReviewEnabled(!reviewEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    reviewEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      reviewEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="cursor-pointer" onClick={() => setReviewEnabled(!reviewEnabled)}>
                  <h4 className="text-xs font-bold text-slate-900">
                    Enable Merchant Authority Review Queue for High-Risk Cases
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When checked, orders/returns exceeding risk thresholds are placed in the Flagged Queue for merchant decision.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: Progressive Escalation Ladder */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Progressive Escalation Ladder</h2>
                  <p className="text-[11px] text-slate-500">Automated policy applied when repeat violations are confirmed.</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Level 1 */}
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Level 1 (1st Incident)</span>
                  </div>
                  <span className="font-semibold text-emerald-800">Warning / OTP Verification</span>
                </div>

                {/* Level 2 */}
                <div className="flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-100 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <CheckCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Level 2 (2nd Incident)</span>
                  </div>
                  <span className="font-semibold text-amber-800">COD Restriction (Limit or Disable)</span>
                </div>

                {/* Level 3 */}
                <div className="flex items-center justify-between rounded-xl bg-purple-50/70 border border-purple-100 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 font-bold text-purple-900">
                    <CheckCircle className="h-3.5 w-3.5 text-purple-600" />
                    <span>Level 3 (3rd Incident)</span>
                  </div>
                  <span className="font-semibold text-purple-800">Prepaid Only + Manual Review</span>
                </div>

                {/* Level 4-5 */}
                <div className="flex items-center justify-between rounded-xl bg-rose-50/70 border border-rose-100 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <CheckCircle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Level 4-5 (Repeat Abuse)</span>
                  </div>
                  <span className="font-semibold text-rose-800">Temporary Account Suspension & Merchant Final Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TRIGGER THRESHOLDS & PROOF RULES ── */}
      {activeTab === 'triggers' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Specific Signal Trigger Cutoffs</h2>
            <p className="text-xs text-slate-500">Fine-tune exactly when an individual risk signal is triggered.</p>

            <div>
              <label className="text-xs font-semibold text-slate-700">High-Value COD Threshold (₹)</label>
              <input
                type="number"
                value={triggers.highValueCodLimit}
                onChange={(e) => setTriggers({ ...triggers, highValueCodLimit: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400">COD orders at or above this value trigger high-value exposure signal.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Multiple-Variant Order Threshold (Items)</label>
              <input
                type="number"
                value={triggers.multiVariantMin}
                onChange={(e) => setTriggers({ ...triggers, multiVariantMin: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400">Orders with this many items/variants trigger over-ordering (bracketing) signal.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">High Return Rate Cutoff (%)</label>
              <input
                type="number"
                value={triggers.highReturnRatePct}
                onChange={(e) => setTriggers({ ...triggers, highReturnRatePct: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400">Lifetime return percentage considered high risk.</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Repeated COD Refusals Trigger Count</label>
              <input
                type="number"
                value={triggers.codRefusalCountMin}
                onChange={(e) => setTriggers({ ...triggers, codRefusalCountMin: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400">Number of COD refusals before maximum 25 pts penalty is applied.</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Return Claims & Proof Policies</h2>
            <p className="text-xs text-slate-500">Automate physical evidence collection and delivery verification.</p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 cursor-pointer">
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

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 cursor-pointer">
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

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggers.autoEscalateOnRefusal}
                  onChange={(e) => setTriggers({ ...triggers, autoEscalateOnRefusal: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">Auto-Escalate Tier on Confirmed Doorstep Refusal</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatically bump customer escalation tier by +1 when a delivery partner logs a repeated doorstep rejection.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LIVE RISK SIMULATOR & PLAYGROUND ── */}
      {activeTab === 'simulator' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Scenario Parameter Controls</h2>
            <p className="text-xs text-slate-500">Adjust synthetic customer behavior inputs to test your weight matrix live.</p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Customer Return Rate: {Math.round(simState.returnRate * 100)}%</span>
                  <span className="text-indigo-600 font-mono font-bold">
                    {simState.returnRate > 0.4 ? `+${weights.return_frequency || 32} pts` : '+0 pts'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={simState.returnRate}
                  onChange={(e) => setSimState({ ...simState, returnRate: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Past COD Refusals: {simState.codRefusals}</span>
                  <span className="text-indigo-600 font-mono font-bold">
                    {simState.codRefusals >= 2 ? `+${weights.cod_refusal || 18} pts` : '+0 pts'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={simState.codRefusals}
                  onChange={(e) => setSimState({ ...simState, codRefusals: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Variants Ordered: {simState.variants}</span>
                  <span className="text-indigo-600 font-mono font-bold">
                    {simState.variants >= 3 ? `+${weights.multiple_variants || 15} pts` : '+0 pts'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={simState.variants}
                  onChange={(e) => setSimState({ ...simState, variants: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">Order Total: ₹{simState.orderTotal}</span>
                  <span className="text-indigo-600 font-mono font-bold">
                    {simState.isCod && simState.orderTotal > 5000 ? `+${weights.high_value_cod || 10} pts` : '+0 pts'}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={simState.orderTotal}
                  onChange={(e) => setSimState({ ...simState, orderTotal: Number(e.target.value) })}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-slate-900 text-white p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Live Risk Calculation</h3>
            <div className="text-center py-6">
              <div className="text-5xl font-black">{simResult.score} / 100</div>
              <div className={`mt-3 inline-block rounded-full px-4 py-1 text-xs font-bold ${
                simResult.tier === 'High'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : simResult.tier === 'Medium'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {simResult.tier.toUpperCase()} RISK
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-4 text-xs space-y-1">
              <div className="text-[11px] text-slate-400">Recommended Decision:</div>
              <div className="font-bold text-white text-sm">{simResult.action}</div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-400 mb-2">Triggered Signals:</div>
              <div className="space-y-1.5 text-xs">
                {simResult.signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: VIP WHITELIST & BLACKLIST ── */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Add VIP Exemption or Blacklist Rule</h2>
            <p className="text-xs text-slate-500 mb-4">Protect trusted VIPs from automated blocks or ban known abusive entities.</p>

            <form onSubmit={handleAddRule} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <select
                value={newRule.rule_type}
                onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
              >
                <option value="whitelist">Whitelist (VIP Exemption)</option>
                <option value="blacklist">Blacklist (Immediate Block)</option>
              </select>

              <select
                value={newRule.entry_type}
                onChange={(e) => setNewRule({ ...newRule, entry_type: e.target.value })}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
              >
                <option value="email">Email Address</option>
                <option value="phone">Phone Number</option>
                <option value="pincode">Pincode / Postal Zone</option>
              </select>

              <input
                type="text"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                placeholder="e.g. vip@store.com or 560001"
                required
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />

              <button
                type="submit"
                disabled={addingRule}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                {addingRule ? 'Adding…' : '+ Add List Rule'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Active Exemption & Blacklist Rules</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {rules.length === 0 ? (
                <p className="text-slate-400 italic py-3">No active list rules configured.</p>
              ) : (
                rules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        r.rule_type === 'whitelist' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.rule_type.toUpperCase()}
                      </span>
                      <span className="font-mono text-slate-800 font-semibold">{r.value}</span>
                      <span className="text-slate-400">({r.entry_type})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(r.id)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold ${
                          r.is_active ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.is_active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(r.id)}
                        className="text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FIXED / STICKY BOTTOM ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Buttons & Live Status */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : saved ? 'Saved Successfully!' : 'Save Risk Configuration'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Test in Risk Simulator</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pl-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Updates are immediately applied to the composite scoring engine.</span>
            </div>
          </div>

          {/* Right Tip Box */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-200 px-3.5 py-1.5 text-xs text-amber-900">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              <strong>Tip:</strong> Start with a preset, fine-tune weights, and test with the simulator before saving.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
