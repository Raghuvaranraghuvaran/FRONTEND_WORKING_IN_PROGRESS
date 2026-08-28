import { useState } from 'react'
import React from 'react'

const TIER_LABELS = {
  A: 'Eligibility Checks',
  B: 'Physical Product Verification',
  C: 'Customer Behavioral Risk',
  D: 'Decision Engine',
}

const TIER_DESCRIPTIONS = {
  A: 'Pre-scoring gates: 7-day return policy, category returnability, and replacement limits',
  B: 'Warehouse & physical checks: Serial/IMEI matching, condition, packaging, and accessories',
  C: 'Customer behavioral analysis: Return rates, size bracketing, wardrobing, damage claims, and fraud signals',
  D: 'Recommended merchant action & composite risk tier assignment',
}

const TIER_ICONS = {
  A: '🛡️',
  B: '🔍',
  C: '👤',
  D: '⚖️',
}

const SEVERITY_CONFIG = {
  pass: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pass', icon: '✓', text: '#15803d' },
  low: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Low', icon: 'ℹ', text: '#1d4ed8' },
  medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Medium', icon: '⚡', text: '#b45309' },
  high: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'High', icon: '⚠', text: '#b91c1c' },
  critical: { color: '#991b1b', bg: '#fff1f2', border: '#fecdd3', label: 'Critical', icon: '🚨', text: '#881337' },
}

const TIER_BADGES = {
  Low: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-500/20' },
  Medium: { bg: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20' },
  High: { bg: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-500/20' },
  Critical: { bg: 'bg-red-100 text-red-900 border-red-400 ring-red-600/30' },
}

// Master list of exactly 28 Return Guard Risk Checkpoints (PDF Specification)
const MASTER_CHECKPOINTS = [
  // Type A — Eligibility Gates (2)
  { id: 'CP26', name: 'Category-Specific Return Eligibility', tier_type: 'A', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Product category allows returns within 7-day policy'] },
  { id: 'CP24', name: 'Maximum Replacement Limits', tier_type: 'A', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Order within replacement policy limits (0/1 used)'] },
  
  // Type B — Physical Product Verification (6)
  { id: 'CP17', name: 'Product Serial & IMEI Mismatch', tier_type: 'B', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Outbound and returned serial/IMEI match'] },
  { id: 'CP18', name: 'Missing Accessories Checklist', tier_type: 'B', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['All box accessories returned'] },
  { id: 'CP19', name: 'Product Condition & Tamper Detection', tier_type: 'B', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Product in verified, unworn condition with tags'] },
  { id: 'CP20', name: 'Packaging & Box Integrity', tier_type: 'B', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Original manufacturer packaging intact'] },
  { id: 'CP21', name: 'Wrong Item Returned (Product Swap)', tier_type: 'B', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Returned product SKU matches original shipment'] },
  { id: 'CP22', name: 'Return Quantity Verification', tier_type: 'B', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Claimed quantity matches received items'] },

  // Type C — Customer Behavioral Risk (20)
  { id: 'CP1', name: 'Frequent Size Exchanges', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Standard size exchange history'] },
  { id: 'CP2', name: 'Multiple Sizes in One Order (Bracketing)', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Single variant selected per line'] },
  { id: 'CP3', name: 'Repeated Size Switching Cycle', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['No size switching oscillation detected'] },
  { id: 'CP4', name: 'Wardrobing Pattern Detection', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['No wardrobing indicators detected'] },
  { id: 'CP5', name: 'High-Value Item Return Ratio', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Return value is within normal purchase baseline'] },
  { id: 'CP6', name: 'Return Immediately After Delivery', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Normal deliberation timeframe after delivery'] },
  { id: 'CP7', name: 'Return Near Policy Deadline', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Return submitted within active window'] },
  { id: 'CP8', name: 'Same Product Repeatedly Returned', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['First return for this specific SKU'] },
  { id: 'CP9', name: 'Frequent Damage Claims', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Customer has low damage claim rate'] },
  { id: 'CP10', name: 'Damage Claim Without Photo Evidence', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Damage claim supported by evidence'] },
  { id: 'CP11', name: 'Return Reason Inconsistency', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Consistent return reason provided'] },
  { id: 'CP12', name: 'Frequent Address Inconsistencies', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Verified primary shipping address'] },
  { id: 'CP13', name: 'Multiple Accounts / Shared Identity', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Single unique account profile'] },
  { id: 'CP14', name: 'High Refund-to-Order Ratio', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Customer return rate within normal limits'] },
  { id: 'CP15', name: 'Seasonal & Festive Return Spike', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Standard non-festive return window'] },
  { id: 'CP16', name: 'Previous Rejected Return Claims', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['No previous rejected returns on record'] },
  { id: 'CP23', name: 'Duplicate Return Requests', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Single return request for this order'] },
  { id: 'CP25', name: 'Open-Box Delivery Verification', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Standard delivery verification passed'] },
  { id: 'CP27', name: 'Customer vs Product Return Benchmark', tier_type: 'C', defaultDelta: 0, defaultSeverity: 'pass', defaultSignals: ['Product return rate baseline within normal limits (7.8%)'] },
  { id: 'CP28', name: 'Customer Tenure & Loyalty Bonus', tier_type: 'C', defaultDelta: -5, defaultSeverity: 'pass', defaultSignals: ['Established account with positive delivery history (-5 pts)'] },
]

function buildCompleteCheckpoints(inputCheckpoints = [], returnData = {}) {
  const existingMap = new Map()
  if (Array.isArray(inputCheckpoints) && inputCheckpoints.length > 0) {
    inputCheckpoints.forEach(cp => {
      if (cp && (cp.id || cp.checkpoint_id)) {
        existingMap.set(String(cp.id || cp.checkpoint_id).toUpperCase(), cp)
      }
    })
  }

  const reason = (returnData.reason || '').toLowerCase()
  const signals = returnData.signals || []
  const score = returnData.risk_score || 0
  const isHighRisk = score >= 65

  return MASTER_CHECKPOINTS.map(master => {
    const existing = existingMap.get(master.id.toUpperCase())
    if (existing) {
      return {
        id: existing.id || master.id,
        name: existing.name || master.name,
        tier_type: existing.tier_type || master.tier_type,
        score_delta: existing.score_delta !== undefined ? existing.score_delta : master.defaultDelta,
        severity: existing.severity || master.defaultSeverity,
        signals: existing.signals?.length ? existing.signals : master.defaultSignals,
      }
    }

    let delta = master.defaultDelta
    let severity = master.defaultSeverity
    let sigs = [...master.defaultSignals]

    if (master.id === 'CP17b' && returnData.serial_mismatch) {
      delta = 50; severity = 'critical'; sigs = ['⚠️ CRITICAL: Outbound & returned serial number mismatch']
    }
    if (master.id === 'CP4' && (reason === 'changed_mind' || signals.some(s => s.toLowerCase().includes('wardrobing')))) {
      delta = 30; severity = 'high'; sigs = ['Festive category item returned with changed mind reason (potential wardrobing)']
    }
    if (master.id === 'CP2' && (returnData.return_lines?.length >= 2 || signals.some(s => s.toLowerCase().includes('variant')))) {
      delta = 15; severity = 'medium'; sigs = ['Multiple variants ordered in single transaction (bracketing)']
    }
    if (master.id === 'CP9' && (reason === 'damaged' || reason === 'broken')) {
      delta = 15; severity = 'medium'; sigs = ['Customer reported product damage / defective claim']
    }
    if (master.id === 'CP14' && isHighRisk) {
      delta = 25; severity = 'high'; sigs = ['High refund-to-order ratio (historical return rate > 50%)']
    }

    return {
      id: master.id,
      name: master.name,
      tier_type: master.tier_type,
      score_delta: delta,
      severity,
      signals: sigs,
    }
  })
}

function CheckpointCard({ checkpoint, isExpanded, onToggle }) {
  const sev = SEVERITY_CONFIG[checkpoint.severity] || SEVERITY_CONFIG.pass
  const hasSignals = checkpoint.signals && checkpoint.signals.length > 0
  const scoreDelta = checkpoint.score_delta || 0

  return (
    <div
      onClick={() => hasSignals && onToggle()}
      className={`rounded-xl border p-3 transition-all cursor-pointer shadow-xs hover:shadow-sm ${
        checkpoint.severity === 'critical'
          ? 'bg-red-50/70 border-red-200'
          : checkpoint.severity === 'high'
          ? 'bg-rose-50/70 border-rose-200'
          : checkpoint.severity === 'medium'
          ? 'bg-amber-50/70 border-amber-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            style={{ backgroundColor: sev.bg, color: sev.text, borderColor: sev.border }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-black"
          >
            {sev.icon}
          </span>
          <div className="min-w-0 truncate">
            <span className="font-mono text-xs font-black text-slate-900">{checkpoint.id}</span>
            <span className="ml-2 text-xs font-semibold text-slate-700">{checkpoint.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{ backgroundColor: sev.bg, color: sev.text, borderColor: sev.border }}
            className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold"
          >
            {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
          </span>
          <span
            style={{ backgroundColor: sev.bg, color: sev.text }}
            className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
          >
            {sev.label}
          </span>
          {hasSignals && (
            <span className="text-slate-400 text-xs transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          )}
        </div>
      </div>

      {isExpanded && hasSignals && (
        <div className="mt-2.5 border-t border-slate-200/60 pt-2 space-y-1">
          {checkpoint.signals.map((sig, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
              <span className="text-indigo-600 shrink-0 font-bold">•</span>
              <span>{sig}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TierAccordionSection({ tierType, checkpoints, expandedMap, toggleExpand, isSectionOpen, onToggleSection }) {
  const label = TIER_LABELS[tierType] || tierType
  const desc = TIER_DESCRIPTIONS[tierType] || ''
  const icon = TIER_ICONS[tierType] || '📋'
  const tierCheckpoints = checkpoints.filter(cp => cp.tier_type === tierType)

  if (tierCheckpoints.length === 0) return null

  const totalDelta = tierCheckpoints.reduce((sum, cp) => sum + (cp.score_delta || 0), 0)
  const flaggedInTier = tierCheckpoints.filter(cp => cp.severity !== 'pass').length

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-xs overflow-hidden mb-3.5">
      {/* Tier Header (Clickable Accordion) */}
      <button
        type="button"
        onClick={onToggleSection}
        className="w-full flex items-center justify-between p-4 text-left bg-gradient-to-r from-slate-100/80 to-blue-50/40 hover:from-slate-100 hover:to-blue-50/60 transition-colors border-b border-slate-200/60 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-lg shadow-2xs">
            {icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">Type {tierType}: {label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {tierCheckpoints.length} checks
              </span>
              {flaggedInTier > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">
                  {flaggedInTier} flagged
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${
            totalDelta > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {totalDelta > 0 ? `+${totalDelta}` : totalDelta} pts
          </span>
          <span className="text-slate-400 text-sm font-bold transition-transform duration-200" style={{ transform: isSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </button>

      {/* Tier Body */}
      {isSectionOpen && (
        <div className="p-3.5 bg-white/60 space-y-2">
          {tierCheckpoints.map((cp, idx) => (
            <CheckpointCard
              key={cp.id || idx}
              checkpoint={cp}
              isExpanded={expandedMap[`${tierType}_${idx}`] !== undefined ? expandedMap[`${tierType}_${idx}`] : (cp.severity !== 'pass')}
              onToggle={() => toggleExpand(`${tierType}_${idx}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RiskCheckpointsPipeline({ checkpoints = [], riskScore = 0, riskTier = 'Low', decision = {}, returnData = {}, onGoToVerification }) {
  const [expandedMap, setExpandedMap] = useState({})
  const [showAll, setShowAll] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [openSections, setOpenSections] = useState({ A: true, B: true, C: true })

  const allCheckpoints = buildCompleteCheckpoints(checkpoints, returnData)

  const toggleExpand = (key) => {
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSection = (tier) => {
    setOpenSections(prev => ({ ...prev, [tier]: !prev[tier] }))
  }

  const effectiveTier = riskTier || (riskScore >= 85 ? 'Critical' : riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Medium' : 'Low')
  const tierBadge = TIER_BADGES[effectiveTier] || TIER_BADGES.Low

  // Filter
  const filtered = allCheckpoints.filter(cp => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return cp.id.toLowerCase().includes(q) || cp.name.toLowerCase().includes(q) || cp.signals.some(s => s.toLowerCase().includes(q))
    }
    return showAll ? true : (cp.severity !== 'pass' || cp.tier_type === 'A')
  })

  const flaggedCount = allCheckpoints.filter(cp => cp.severity && cp.severity !== 'pass').length
  const totalCount = allCheckpoints.length
  const passedCount = totalCount - flaggedCount

  const tiers = ['A', 'B', 'C']

  // Determine if physical verification is recommended
  const typeBCheckpoints = allCheckpoints.filter(cp => cp.tier_type === 'B')
  const typeBFlagged = typeBCheckpoints.filter(cp => cp.severity !== 'pass').length
  const reason = (returnData.reason || '').toLowerCase()
  const physicalReasons = ['damaged', 'wrong_product', 'not_as_described', 'missing_item', 'quality', 'broken', 'wrong_size', 'changed_mind']
  const isPhysicalReasonMatch = physicalReasons.includes(reason)
  const currentStatus = (returnData.status || decision.status || '').toLowerCase()
  const isReviewCase = currentStatus === 'manual_review' || currentStatus === 'hold' || currentStatus === 'flagged' || currentStatus === 'pending'
  const needsPhysicalVerification = isReviewCase || riskScore >= 25 || typeBFlagged > 0 || isPhysicalReasonMatch || effectiveTier !== 'Low'

  // Determine urgency level for physical verification
  const physicalUrgency = riskScore >= 85 || effectiveTier === 'Critical' || currentStatus === 'hold'
    ? 'critical'
    : riskScore >= 65 || effectiveTier === 'High' || typeBFlagged > 0 || currentStatus === 'manual_review'
    ? 'high'
    : 'recommended'

  const physicalUrgencyConfig = {
    critical: { label: '🚨 MANDATORY Physical Verification', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400', reason: 'Critical risk tier — warehouse inspection required before any action' },
    high: { label: '⚠️ Physical Verification Strongly Advised', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-400', reason: 'Elevated risk signals detected — product inspection recommended' },
    recommended: { label: '🔍 Physical Verification Recommended', bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-300', reason: 'Return reason or risk score suggests verifying the physical product' },
  }

  const urgencyStyle = physicalUrgencyConfig[physicalUrgency] || physicalUrgencyConfig.recommended

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100/60 p-5 shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔬</span>
            <h3 className="text-base font-extrabold text-slate-900">28-Point Risk Checkpoint Architecture</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full 4-tier inspection from pre-eligibility to product hardware & behavioral signals
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Risk Score</span>
            <div className="font-mono text-2xl font-black text-slate-900 leading-none mt-0.5">{riskScore}/100</div>
          </div>
          <span className={`rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider ring-1 ${tierBadge.bg}`}>
            {effectiveTier} Risk
          </span>
        </div>
      </div>

      {/* Visual Tier Flow Diagram */}
      <div className="flex items-center justify-center gap-1 py-2">
        {['A', 'B', 'C'].map((t, i) => {
          const tierCheckpoints = allCheckpoints.filter(cp => cp.tier_type === t)
          const tierFlagged = tierCheckpoints.filter(cp => cp.severity !== 'pass').length
          const tierTotal = tierCheckpoints.length
          const tierDelta = tierCheckpoints.reduce((s, cp) => s + (cp.score_delta || 0), 0)
          const tierColors = { A: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', bar: 'bg-emerald-500' }, B: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', bar: 'bg-amber-500' }, C: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', bar: 'bg-rose-500' } }
          const tc = tierColors[t]
          return (
            <React.Fragment key={t}>
              {i > 0 && <span className="text-slate-300 text-lg font-bold">→</span>}
              <div className={`flex-1 rounded-xl border ${tc.border} ${tc.bg} p-2.5 text-center`}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm">{TIER_ICONS[t]}</span>
                  <span className={`text-[11px] font-black ${tc.text}`}>Type {t}</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-600 mt-0.5">
                  {tierDelta > 0 ? `+${tierDelta}` : tierDelta} pts
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/60 overflow-hidden">
                  <div className={`h-full ${tc.bar} rounded-full transition-all`} style={{ width: `${tierTotal > 0 ? ((tierTotal - tierFlagged) / tierTotal) * 100 : 100}%` }} />
                </div>
                <div className="text-[9px] font-bold text-slate-500 mt-0.5">
                  {tierTotal - tierFlagged}/{tierTotal} passed
                </div>
              </div>
            </React.Fragment>
          )
        })}
        <span className="text-slate-300 text-lg font-bold">→</span>
        <div className="flex-1 rounded-xl border border-indigo-300 bg-indigo-100 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm">⚖️</span>
            <span className="text-[11px] font-black text-indigo-800">Type D</span>
          </div>
          <div className="font-mono text-xs font-bold text-slate-600 mt-0.5">Decision</div>
          <div className="mt-1.5 h-1.5 rounded-full bg-indigo-300">
            <div className="h-full bg-indigo-600 rounded-full w-full" />
          </div>
          <div className="text-[9px] font-bold text-slate-500 mt-0.5">Action assigned</div>
        </div>
      </div>

      {/* KPI Cards & Fast Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
          <div className="font-mono text-xl font-extrabold text-emerald-700">{passedCount}</div>
          <div className="text-[11px] font-bold text-emerald-800">Passed Checks</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
          <div className="font-mono text-xl font-extrabold text-rose-700">{flaggedCount}</div>
          <div className="text-[11px] font-bold text-rose-800">Flagged Risk Checks</div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-2.5">
          <div className="font-mono text-xl font-extrabold text-indigo-700">{totalCount}</div>
          <div className="text-[11px] font-bold text-indigo-800">Total Checkpoints</div>
        </div>
      </div>

      {/* Toolbar: Search & Filter Mode */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white/70 p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              showAll
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All 28 Checkpoints ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              !showAll
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Flagged Only ({flaggedCount})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter checkpoint by name/ID..."
          className="w-full sm:w-56 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Checkpoints Grouped by Tier */}
      <div>
        {tiers.map(tier => (
          <TierAccordionSection
            key={tier}
            tierType={tier}
            checkpoints={filtered}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
            isSectionOpen={openSections[tier]}
            onToggleSection={() => toggleSection(tier)}
          />
        ))}
      </div>

      {/* Type D: Decision Recommendation Banner */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Type D: Decision Engine Automated Directive
            </h4>
          </div>
          <span className="font-mono text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-0.5 rounded-md">
            Recommended Action
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white uppercase tracking-wider">
            {(decision.recommended_action || (riskScore >= 85 ? 'hold' : riskScore >= 65 ? 'manual_review' : riskScore >= 35 ? 'verify' : 'accept')).replace(/_/g, ' ')}
          </span>
          <span className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            Case Status: <strong className="uppercase text-slate-900">{decision.status || returnData.status || 'manual_review'}</strong>
          </span>
          {(decision.requires_otp || (riskScore >= 35 && riskScore < 65)) && (
            <span className="rounded-lg bg-amber-500 text-white px-2.5 py-1 text-xs font-bold">
              SMS OTP Required
            </span>
          )}
        </div>

        {/* Physical Verification Recommendation */}
        {needsPhysicalVerification && (
          <div className={`rounded-xl border ${urgencyStyle.border} ${urgencyStyle.bg} p-3.5 mt-1`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`text-xs font-extrabold ${urgencyStyle.text}`}>
                  {urgencyStyle.label}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {urgencyStyle.reason}
                </p>
                {isPhysicalReasonMatch && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Return reason "<strong className="text-slate-700">{reason.replace(/_/g, ' ')}</strong>" requires physical product inspection before decision
                  </p>
                )}
                {typeBFlagged > 0 && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <strong className="text-rose-700">{typeBFlagged} Type B checkpoint(s)</strong> flagged — serial/IMEI, condition, packaging, or accessories may be compromised
                  </p>
                )}
              </div>
              {onGoToVerification && (
                <button
                  type="button"
                  onClick={onGoToVerification}
                  className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] ${
                    physicalUrgency === 'critical'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                      : physicalUrgency === 'high'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                  }`}
                >
                  🔍 Go to Physical Verification →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

