import { useState } from 'react'
import React from 'react'
import { useApp } from '../context/AppContext'
import ProductSwapAlertCard from './ProductSwapAlertCard'

const CONDITION_OPTIONS = [
  { value: 'unused', label: 'Unused — Tags/seals intact', icon: '✅', hint: '0 pts' },
  { value: 'used', label: 'Used — Signs of wear', icon: '👟', hint: '+10 pts' },
  { value: 'damaged', label: 'Damaged — Physical damage', icon: '💔', hint: '+5 pts' },
  { value: 'soiled', label: 'Soiled — Stains/odor', icon: '🧼', hint: '+15 pts' },
  { value: 'tampered', label: 'Tampered — Seal/warranty broken', icon: '🔓', hint: '+20 pts' },
  { value: 'tag_removed', label: 'Return Tag Removed', icon: '🏷️', hint: '+12 pts' },
  { value: 'unknown', label: 'Not Yet Inspected', icon: '❓', hint: '0 pts' },
]

const PACKAGING_OPTIONS = [
  { value: 'original_intact', label: 'Original — Intact', icon: '📦', hint: '0 pts' },
  { value: 'original_damaged', label: 'Original — Damaged', icon: '📦', hint: '+5 pts' },
  { value: 'different_box', label: 'Different / Wrong Box', icon: '❌', hint: '+20 pts' },
  { value: 'no_packaging', label: 'No Packaging', icon: '🚫', hint: '+15 pts' },
  { value: 'not_inspected', label: 'Not Yet Inspected', icon: '❓', hint: '0 pts' },
]

export default function ProductVerificationPanel({ returnData, onVerificationComplete }) {
  const { api, liveMode } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    returned_serial_number: '',
    returned_imei_number: '',
    product_condition: 'unknown',
    packaging_condition: 'not_inspected',
    accessories_returned: [],
    quantity_received: returnData?.quantity_claimed || 1,
    is_product_swap_detected: false,
    swap_details: '',
    verification_notes: '',
    verification_images: [],
  })

  // Get expected accessories from the return data
  const expectedAccessories = returnData?.accessories_expected || ['Charger', 'USB Cable', 'Manual', 'Warranty Card']
  const originalSerial = returnData?.order_item?.serial_number || returnData?.shopper_serial_number || ''
  const originalImei = returnData?.order_item?.imei_number || ''

  const handleAccessoryToggle = (accessory) => {
    setForm(prev => {
      const list = [...prev.accessories_returned]
      const idx = list.findIndex(a => a.toLowerCase() === accessory.toLowerCase())
      if (idx >= 0) {
        list.splice(idx, 1)
      } else {
        list.push(accessory)
      }
      return { ...prev, accessories_returned: list }
    })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      let res
      if (liveMode) {
        res = await api.verifyReturnProduct(returnData.id, form)
      } else {
        res = computeMockVerification(form, returnData)
      }
      setResult(res)
      setSubmitted(true)
      onVerificationComplete?.(res || {})
    } catch (err) {
      console.error('Verification failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const computeMockVerification = (formData, returnInfo) => {
    let typeBScore = 0
    const signals = []

    // Serial mismatch check
    if (originalSerial && formData.returned_serial_number) {
      if (originalSerial.toUpperCase() !== formData.returned_serial_number.toUpperCase()) {
        typeBScore += 50
        signals.push(`⚠️ CRITICAL: Serial mismatch — shipped '${originalSerial}', returned '${formData.returned_serial_number}'`)
      } else {
        signals.push(`✅ Serial number matches outbound record`)
      }
    }

    // IMEI mismatch check
    if (originalImei && formData.returned_imei_number) {
      if (originalImei !== formData.returned_imei_number) {
        typeBScore += 50
        signals.push(`⚠️ CRITICAL: IMEI mismatch — shipped '${originalImei}', returned '${formData.returned_imei_number}'`)
      } else {
        signals.push(`✅ IMEI matches outbound record`)
      }
    }

    // Product swap
    if (formData.is_product_swap_detected) {
      typeBScore += 50
      signals.push(`⚠️ CRITICAL: Product swap — ${formData.swap_details || 'Different product returned'}`)
    }

    // Condition scoring
    const conditionScores = { unused: 0, used: 10, damaged: 5, soiled: 15, tampered: 20, tag_removed: 12 }
    const condScore = conditionScores[formData.product_condition] || 0
    if (condScore > 0) {
      typeBScore += condScore
      signals.push(`Product condition: ${formData.product_condition.replace(/_/g, ' ')} (+${condScore} pts)`)
    } else if (formData.product_condition === 'unused') {
      signals.push(`✅ Product condition: Unused with tags/seals intact`)
    }

    // Packaging scoring
    const packScores = { original_intact: 0, original_damaged: 5, different_box: 20, no_packaging: 15 }
    const packScore = packScores[formData.packaging_condition] || 0
    if (packScore > 0) {
      typeBScore += packScore
      signals.push(`Packaging: ${formData.packaging_condition.replace(/_/g, ' ')} (+${packScore} pts)`)
    } else if (formData.packaging_condition === 'original_intact') {
      signals.push(`✅ Original packaging intact`)
    }

    // Missing accessories
    const returnedLower = (formData.accessories_returned || []).map(a => a.toLowerCase())
    const missing = expectedAccessories.filter(a => !returnedLower.includes(a.toLowerCase()))
    if (missing.length > 0) {
      const accScore = missing.length > expectedAccessories.length / 2 ? 15 : 8
      typeBScore += accScore
      signals.push(`Missing accessories: ${missing.join(', ')} (+${accScore} pts)`)
    } else {
      signals.push(`✅ All accessories returned`)
    }

    // Quantity mismatch
    const claimed = returnInfo?.quantity_claimed || 1
    if (formData.quantity_received < claimed) {
      typeBScore += 20
      signals.push(`Quantity mismatch — claimed ${claimed}, received ${formData.quantity_received} (+20 pts)`)
    } else {
      signals.push(`✅ Quantity verified: ${formData.quantity_received} of ${claimed}`)
    }

    const origScore = returnInfo?.risk_score || 0
    const newScore = Math.min(100, origScore + typeBScore)
    const newTier = newScore >= 85 ? 'Critical' : newScore > 64 ? 'High' : newScore > 34 ? 'Medium' : 'Low'

    return {
      verification_status: typeBScore >= 40 ? 'Failed' : typeBScore > 0 ? 'Flagged' : 'Passed',
      risk_score: newScore,
      risk_tier: newTier,
      original_score: origScore,
      serial_mismatch: originalSerial && formData.returned_serial_number && originalSerial.toUpperCase() !== formData.returned_serial_number.toUpperCase(),
      imei_mismatch: originalImei && formData.returned_imei_number && originalImei !== formData.returned_imei_number,
      accessories_missing: missing,
      is_product_swap_detected: formData.is_product_swap_detected,
      product_condition: formData.product_condition,
      packaging_condition: formData.packaging_condition,
      type_b_signals: signals,
      type_b_score: typeBScore,
    }
  }

  // ── SUBMITTED RESULT VIEW ──
  if (submitted && result) {
    const tierStyles = {
      Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Medium: 'bg-amber-50 text-amber-800 border-amber-200',
      High: 'bg-rose-50 text-rose-700 border-rose-200',
      Critical: 'bg-red-100 text-red-900 border-red-300',
    }
    const statusIcon = result.verification_status === 'Passed' ? '✅' : result.verification_status === 'Failed' ? '🚨' : '⚠️'
    const statusColor = result.verification_status === 'Passed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                       : result.verification_status === 'Failed' ? 'text-red-700 bg-red-50 border-red-200'
                       : 'text-amber-700 bg-amber-50 border-amber-200'

    return (
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100/60 p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{statusIcon}</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Physical Verification {result.verification_status}
              </h3>
              <p className="text-xs text-slate-500">Warehouse inspection complete</p>
            </div>
          </div>
          <span className={`rounded-xl border px-3 py-1 text-xs font-black uppercase ${statusColor}`}>
            {result.verification_status}
          </span>
        </div>

        {/* Score Comparison Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <div className="font-mono text-xl font-extrabold text-slate-600">{result.original_score || 0}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Before Inspection</div>
          </div>
          <div className={`rounded-xl border p-3 text-center ${tierStyles[result.risk_tier] || tierStyles.Low}`}>
            <div className="font-mono text-xl font-extrabold">{result.risk_score}</div>
            <div className="text-[10px] font-bold uppercase">After Inspection</div>
          </div>
          <div className={`rounded-xl border p-3 text-center ${
            result.type_b_score > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'
          }`}>
            <div className={`font-mono text-xl font-extrabold ${result.type_b_score > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              +{result.type_b_score}
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Type B Delta</div>
          </div>
        </div>

        {/* Risk Tier Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">New Risk Tier:</span>
          <span className={`rounded-lg border px-3 py-1 text-xs font-black uppercase ${tierStyles[result.risk_tier] || tierStyles.Low}`}>
            {result.risk_tier}
          </span>
        </div>

        {/* Signals */}
        {result.type_b_signals?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
            <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Verification Signals</div>
            {result.type_b_signals.map((sig, idx) => (
              <div key={idx} className={`flex items-start gap-2 text-xs font-medium ${
                sig.includes('CRITICAL') ? 'text-red-700 font-bold' : sig.startsWith('✅') ? 'text-emerald-700' : 'text-slate-600'
              }`}>
                <span className="shrink-0">•</span>
                <span>{sig}</span>
              </div>
            ))}
          </div>
        )}

        {/* Missing Accessories Detail */}
        {result.accessories_missing?.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
            <div className="text-xs font-bold text-rose-700 mb-1.5">⚠ Missing Accessories</div>
            {result.accessories_missing.map((acc, idx) => (
              <div key={idx} className="text-xs text-rose-600 py-0.5">❌ {acc}</div>
            ))}
          </div>
        )}

        {/* Reset Button */}
        <button
          type="button"
          onClick={() => { setSubmitted(false); setResult(null) }}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          ↩ Re-Inspect Product
        </button>
      </div>
    )
  }

  // ── INSPECTION FORM VIEW ──
  const inspectionSteps = [
    { id: 'serial', label: 'Serial/IMEI', icon: '🔢', done: !!(form.returned_serial_number || form.returned_imei_number) },
    { id: 'condition', label: 'Condition', icon: '📦', done: form.product_condition !== 'unknown' },
    { id: 'packaging', label: 'Packaging', icon: '📦', done: form.packaging_condition !== 'not_inspected' },
    { id: 'accessories', label: 'Accessories', icon: '🔌', done: form.accessories_returned.length > 0 },
    { id: 'quantity', label: 'Quantity', icon: '📊', done: true },
    { id: 'swap', label: 'Swap Check', icon: '🚨', done: true },
  ]
  const completedSteps = inspectionSteps.filter(s => s.done).length

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100/60 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <h3 className="text-base font-extrabold text-slate-900">Physical Product Verification</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect the physically returned item and record findings below. This triggers Type B re-scoring.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400">Progress</span>
            <div className="font-mono text-lg font-black text-indigo-700">{completedSteps}/{inspectionSteps.length}</div>
          </div>
        </div>
        {/* Step Progress Bar */}
        <div className="flex items-center gap-1 mt-3">
          {inspectionSteps.map((step, i) => (
            <React.Fragment key={step.id}>
              {i > 0 && <div className={`flex-1 h-0.5 ${step.done ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
                step.done ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
              }`}>
                <span>{step.done ? '✓' : step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Original Product Identifiers */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5">
        <div className="text-xs font-bold text-indigo-700 mb-2">📋 Original Product Identifiers (from outbound shipment)</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Outbound Serial</span>
            <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
              {originalSerial || '—  (No serial recorded)'}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Outbound IMEI</span>
            <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
              {originalImei || '— (No IMEI recorded)'}
            </div>
          </div>
        </div>
      </div>

      {/* Serial / IMEI Inputs */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700">CP17: Returned Hardware Identifiers</label>
          {(!originalSerial && !originalImei) && (
            <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              Optional — Non-serialized item (e.g. clothing/apparel)
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Returned Serial Number</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder={originalSerial ? "Enter serial from returned item" : "Leave blank if non-serialized (e.g. clothes)"}
              value={form.returned_serial_number}
              onChange={e => setForm(p => ({ ...p, returned_serial_number: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Returned IMEI Number</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder={originalImei ? "Enter IMEI from returned device" : "Leave blank if no IMEI"}
              value={form.returned_imei_number}
              onChange={e => setForm(p => ({ ...p, returned_imei_number: e.target.value }))}
            />
          </div>
        </div>
        {(!originalSerial && !originalImei) && (
          <p className="text-[11px] text-slate-400 mt-1">
            💡 For fashion & non-electronic items with no serial, <strong>leave both fields blank</strong>. No penalty will be applied.
          </p>
        )}
      </div>

      {/* Product Condition */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block">CP19: Product Condition Inspection</label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITION_OPTIONS.map(opt => {
            const isSelected = form.product_condition === opt.value
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setForm(p => ({ ...p, product_condition: opt.value }))}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="flex-1">{opt.label}</span>
                <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{opt.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Packaging Condition */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block">CP20: Packaging & Box Integrity</label>
        <div className="grid grid-cols-2 gap-2">
          {PACKAGING_OPTIONS.map(opt => {
            const isSelected = form.packaging_condition === opt.value
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setForm(p => ({ ...p, packaging_condition: opt.value }))}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="flex-1">{opt.label}</span>
                <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{opt.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Accessories Checklist */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block">
          CP18: Accessories Returned ({form.accessories_returned.length}/{expectedAccessories.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {expectedAccessories.map((acc, idx) => {
            const checked = form.accessories_returned.some(a => a.toLowerCase() === acc.toLowerCase())
            return (
              <button
                type="button"
                key={idx}
                onClick={() => handleAccessoryToggle(acc)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  checked
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-rose-300 bg-rose-50 text-rose-700'
                }`}
              >
                <span>{checked ? '✅' : '❌'}</span>
                <span>{acc}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">Click each accessory to toggle present ✅ / missing ❌</p>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-1.5 block">CP22: Quantity Verification</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Claimed by Customer</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 font-mono"
              value={returnData?.quantity_claimed || 1}
              disabled
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Actually Received</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              value={form.quantity_received}
              onChange={e => setForm(p => ({ ...p, quantity_received: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </div>

      {/* Product Swap Detection (The WOW Feature) */}
      <div className={`rounded-xl border p-4 transition-all ${
        form.is_product_swap_detected
          ? 'border-red-400 bg-red-50/70 shadow-sm'
          : 'border-slate-200 bg-slate-50/50'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-black text-slate-900">CP21: Product Swap Detection (Wrong Item Returned)</label>
            <p className="text-[11px] text-slate-500">Flag counterfeit substitution or cheap replica returns</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, is_product_swap_detected: !p.is_product_swap_detected }))}
            className={`rounded-lg border px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
              form.is_product_swap_detected
                ? 'border-red-500 bg-red-600 text-white shadow-sm animate-pulse'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {form.is_product_swap_detected ? '🚨 YES — Swap Detected' : 'No Swap Detected'}
          </button>
        </div>

        {form.is_product_swap_detected && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none"
              placeholder="Describe the swap (e.g. 'Purchased Nike Shoe ₹8,000 [SKU: NK123] ➔ Returned Cheap Replica ₹2,000 [SKU: NK987]')"
              value={form.swap_details}
              onChange={e => setForm(p => ({ ...p, swap_details: e.target.value }))}
            />

            {/* Live Visual WOW Card Preview */}
            <ProductSwapAlertCard
              purchased={returnData?.swap_purchased || {
                name: returnData?.return_lines?.[0]?.name || 'Nike Air Max 270',
                price: returnData?.return_lines?.[0]?.price || 8000,
                sku: returnData?.return_lines?.[0]?.sku || 'NK-AM270-BLK-9',
                color: returnData?.return_lines?.[0]?.color || 'Black',
                size: returnData?.return_lines?.[0]?.size || '9',
                image: returnData?.return_lines?.[0]?.image || returnData?.images?.[0],
                serial: originalSerial || 'SN-NK-892401',
              }}
              returned={returnData?.swap_returned || {
                name: 'Generic Runner / Counterfeit Replica',
                price: 2000,
                sku: 'NK-REPLICA-987',
                color: 'Faded Black',
                size: '8.5',
                image: returnData?.images?.[1] || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80',
                serial: 'TAG-REMOVED-FAKE',
              }}
              riskScore={95}
              isSimulated={true}
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Verification Notes</label>
        <textarea
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-y"
          style={{ minHeight: 72 }}
          placeholder="Any additional observations from physical inspection..."
          value={form.verification_notes}
          onChange={e => setForm(p => ({ ...p, verification_notes: e.target.value }))}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all cursor-pointer shadow-md ${
          submitting
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg active:scale-[0.99]'
        }`}
      >
        {submitting ? '⏳ Submitting Verification...' : '🔍 Submit Product Verification & Re-Score'}
      </button>
    </div>
  )
}
