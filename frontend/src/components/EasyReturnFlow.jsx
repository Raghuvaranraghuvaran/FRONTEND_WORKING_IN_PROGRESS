import { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Coins,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react'
import { api } from '../mock/api'
import { INR } from '../lib/format'

const REASONS = [
  { id: 'wrong_size', label: 'Wrong size / Fit issue', icon: '📏', triggersSmartExchange: true },
  { id: 'damaged', label: 'Damaged or defective product', icon: '⚠️' },
  { id: 'quality', label: 'Quality not as expected', icon: '🔍' },
  { id: 'changed_mind', label: 'Changed mind / No longer needed', icon: '💭' },
  { id: 'not_as_described', label: 'Item does not match website description', icon: '📝' },
]

const PICKUP_SLOTS = [
  { id: 'tomorrow_morning', label: 'Tomorrow · 10:00 AM – 1:00 PM' },
  { id: 'tomorrow_afternoon', label: 'Tomorrow · 2:00 PM – 5:00 PM' },
  { id: 'day_after_morning', label: 'Day after tomorrow · 10:00 AM – 1:00 PM' },
]

export default function EasyReturnFlow({ order, item, isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Reason, 2: Resolution (Exchange vs Refund), 3: Pickup, 4: Confirmed
  const [reason, setReason] = useState('wrong_size')
  const [resolutionType, setResolutionType] = useState('EXCHANGE') // EXCHANGE, REFUND, STORE_CREDIT
  const [selectedExchangeVariant, setSelectedExchangeVariant] = useState(null)
  const [refundMethod, setRefundMethod] = useState('original')
  const [pickupSlot, setPickupSlot] = useState('Tomorrow · 10:00 AM – 1:00 PM')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [eligibility, setEligibility] = useState(null)
  const [submittedReturn, setSubmittedReturn] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && item) {
      setStep(1)
      setReason('wrong_size')
      setResolutionType('EXCHANGE')
      api
        .checkReturnEligibility({ orderItemId: item.id })
        .then((res) => {
          setEligibility(res)
          if (res?.exchange_options?.length > 0) {
            setSelectedExchangeVariant(res.exchange_options[0])
          }
        })
        .catch(() => {})
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

  const handleNextFromReason = () => {
    if (reason === 'wrong_size') {
      setResolutionType('EXCHANGE')
      setStep(2)
    } else {
      setResolutionType('REFUND')
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.createShopperReturn({
        orderId: order?.id || order?.order_number,
        orderItemId: item.id,
        type: resolutionType,
        reason: REASONS.find((r) => r.id === reason)?.label || reason,
        notes,
        exchangeVariantId: resolutionType === 'EXCHANGE' ? selectedExchangeVariant?.id : null,
        refundMethod: resolutionType === 'STORE_CREDIT' ? 'store_credit' : refundMethod,
        pickupSlot,
      })
      setSubmittedReturn(res)
      setStep(4)
      if (onSuccess) onSuccess(res)
    } catch (err) {
      setError(err.message || 'Failed to process return.')
    } finally {
      setLoading(false)
    }
  }

  const itemPrice = Number(item.price || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Return & Smart Exchange Wizard
            </span>
            <span className="text-xs text-slate-400 font-medium">Step {step} of 4</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Item Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <img
            src={item.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=150&q=80'}
            alt={item.name}
            className="h-12 w-12 rounded-xl object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
            <p className="text-[11px] text-slate-500">
              {INR.format(item.price)} · Qty {item.quantity || 1}
            </p>
          </div>
        </div>

        {/* ── STEP 1: Select Reason ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Why are you returning this item?</h3>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`w-full flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                    reason === r.id
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-sm font-semibold text-slate-900">{r.label}</span>
                  </div>
                  {r.triggersSmartExchange && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      ⚡ Instant Exchange Eligible
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextFromReason}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Smart Exchange First / Resolution Choice ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-900">Choose your resolution</h3>

            {/* Smart Exchange Hero Card */}
            {reason === 'wrong_size' && (
              <div
                onClick={() => setResolutionType('EXCHANGE')}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition ${
                  resolutionType === 'EXCHANGE'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
                      <RefreshCw className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        Smart Exchange (Recommended)
                        <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                          Fastest
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Zero fee · New size reserved immediately & shipped upon doorstep handover
                      </p>
                    </div>
                  </div>
                </div>

                {/* Available alternative sizes */}
                <div className="mt-4 border-t border-indigo-100 pt-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                    Select Replacement Size:
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eligibility?.exchange_options?.length ? (
                      eligibility.exchange_options.map((opt) => (
                        <button
                          key={opt.id || opt.size}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedExchangeVariant(opt)
                            setResolutionType('EXCHANGE')
                          }}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            selectedExchangeVariant?.id === opt.id
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          Size {opt.size} ({opt.color || 'Standard'}) · {opt.stock} left
                        </button>
                      ))
                    ) : (
                      ['S', 'L', 'XL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedExchangeVariant({ size: sz })
                            setResolutionType('EXCHANGE')
                          }}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            selectedExchangeVariant?.size === sz
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          Size {sz}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Store Credit Option with 5% Bonus */}
            <div
              onClick={() => setResolutionType('STORE_CREDIT')}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                resolutionType === 'STORE_CREDIT'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                  <Coins className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">Instant Store Credit + 5% Bonus</p>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      +₹{Math.round(itemPrice * 0.05)} Bonus Points
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Credited instantly to your wallet upon pickup</p>
                </div>
              </div>
            </div>

            {/* Standard Refund */}
            <div
              onClick={() => setResolutionType('REFUND')}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                resolutionType === 'REFUND'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900">Original Payment Method ({INR.format(itemPrice)})</p>
                  <p className="text-[11px] text-slate-500">Refunded to original bank account within 3-5 days</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
              >
                Next: Pickup Slot →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Pickup Slot & Details ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Select doorstep pickup slot</h3>

            <div className="space-y-2">
              {PICKUP_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setPickupSlot(slot.label)}
                  className={`w-full flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                    pickupSlot === slot.label
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{slot.label.split('·')[0]}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {slot.label.split('·')[1]}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">Free</span>
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Optional notes for courier partner</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Leave with security, call before arrival..."
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm & Schedule Pickup'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Success Screen ── */}
        {step === 4 && (
          <div className="py-6 text-center space-y-5 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {resolutionType === 'EXCHANGE' ? 'Smart Exchange Confirmed! 🎉' : 'Return Request Approved! 🎉'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {submittedReturn?.message || 'Your doorstep courier has been assigned.'}
              </p>
            </div>

            {/* Courier Dispatch Card */}
            <div className="rounded-2xl border border-indigo-100 bg-slate-50 p-4 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Pickup Slot:</span>
                <span className="font-bold text-slate-900">{submittedReturn?.pickup_slot || pickupSlot}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Assigned Driver:</span>
                <span className="font-bold text-slate-900">{submittedReturn?.driver_name || 'Suresh Kumar'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Live Status:</span>
                <span className="font-bold text-emerald-700">
                  {submittedReturn?.estimated_arrival_window || '2.3 km away'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
            >
              Done & View Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
