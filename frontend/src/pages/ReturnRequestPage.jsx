import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../mock/api'
import { formatDate, INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'

const REASONS = [
  { id: 'wrong_size', label: 'Wrong size' },
  { id: 'changed_mind', label: 'Changed mind' },
  { id: 'damaged', label: 'Damaged product' },
  { id: 'wrong_product', label: 'Wrong product received' },
  { id: 'missing_item', label: 'Missing item or component' },
  { id: 'quality', label: 'Quality issue' },
  { id: 'not_as_described', label: 'Not as described' },
  { id: 'other', label: 'Other' },
]

const PICKUP_SLOTS = [
  { id: 'tomorrow_morning', label: 'Tomorrow · 10:00 AM – 1:00 PM', value: 'tomorrow_morning' },
  { id: 'tomorrow_afternoon', label: 'Tomorrow · 2:00 PM – 5:00 PM', value: 'tomorrow_afternoon' },
  { id: 'day_after_morning', label: 'Day after · 10:00 AM – 1:00 PM', value: 'day_after_morning' },
]

export default function ReturnRequestPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [selectedLines, setSelectedLines] = useState({})
  const [pickupSlot, setPickupSlot] = useState('')
  const [result, setResult] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showOtp, setShowOtp] = useState(false)

  useEffect(() => {
    api.getShopperOrders().then((orders) => {
      const found = orders.find((o) => o.id === orderId)
      setOrder(found || null)
    })
  }, [orderId])

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">Order not found</p>
        <Link to="/orders" className="mt-3 inline-block text-sm font-semibold text-indigo-600">
          Back to orders
        </Link>
      </main>
    )
  }

  const toggleLine = (item, checked) => {
    setSelectedLines((current) => {
      const next = { ...current }
      if (checked) {
        next[item.product_id] = { product_id: item.product_id, name: item.name, price: item.price, quantity: item.quantity }
      } else {
        delete next[item.product_id]
      }
      return next
    })
  }

  const selectedItems = Object.values(selectedLines)
  const hasSelection = selectedItems.length > 0

  const submitReturn = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const record = await api.createReturn({
        orderId: order.id,
        reason,
        note,
        returnLines: selectedItems,
        pickupSlot,
      })
      setResult(record)
      if (record.risk_tier === 'Medium') {
        setShowOtp(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const submitOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.verifyOtp({ returnId: result.id, code: otp })
      setShowOtp(false)
      setResult((current) => ({ ...current, verification_status: 'Verified', verification_method: 'sms_otp' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const escalate = async () => {
    setError('')
    setSubmitting(true)
    try {
      const escalated = await api.escalateReturn(result.id, 'OTP unavailable or failed')
      setResult(escalated)
      setShowOtp(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">↩</div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Return request submitted</h1>
            <p className="mt-1 text-sm text-slate-500">Order {order.order_number}</p>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Risk tier</span>
              <RiskBadge tier={result.risk_tier} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              <StatusBadge status={result.status} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Verification</span>
              <span className="text-sm font-semibold text-slate-900">{result.verification_status}</span>
            </div>
          </div>

          {result.pickup_slot && (
            <p className="mt-3 text-xs text-slate-500">Pickup slot: {result.pickup_slot}</p>
          )}

          {showOtp && (
            <form onSubmit={submitOtp} className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Step-up confirmation</p>
              <p className="mt-1 text-xs text-amber-700">Enter the OTP sent to your phone.</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="min-w-0 flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm focus:outline-none"
                />
                <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Verify</button>
              </div>
              <button
                type="button"
                onClick={escalate}
                className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-500"
              >
                Escalate: OTP unavailable or failed
              </button>
            </form>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/orders" className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">
              Back to orders
            </Link>
            <Link to="/shop" className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/orders" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Back to orders
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Request return</h1>
      <p className="text-sm text-slate-500">Order {order.order_number} · {formatDate(order.created_at)}</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-base font-semibold text-slate-900">Select items to return</p>
        <p className="text-xs text-slate-500">You can return part of the order.</p>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <label key={item.product_id} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(selectedLines[item.product_id])}
                  onChange={(e) => toggleLine(item, e.target.checked)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">
                  {item.name} × {item.quantity}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-900">{INR.format(item.price * item.quantity)}</span>
            </label>
          ))}
        </div>
      </div>

      <form onSubmit={submitReturn} className="mt-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="text-base font-semibold text-slate-900">Return reason</label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {REASONS.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${reason === option.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={option.id}
                  checked={reason === option.id}
                  onChange={() => setReason(option.id)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="text-base font-semibold text-slate-900">Pickup slot</label>
          <div className="mt-3 space-y-2">
            {PICKUP_SLOTS.map((slot) => (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${pickupSlot === slot.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name="pickup"
                  value={slot.id}
                  checked={pickupSlot === slot.id}
                  onChange={() => setPickupSlot(slot.id)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                {slot.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="text-base font-semibold text-slate-900">Additional notes (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Anything the merchant should know?"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">
            Doorstep pickup proof is captured by the delivery partner at pickup — a geo-stamped signature plus
            barcode/QR scan. No self-attested proof is required from you.
          </p>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          disabled={!reason || !hasSelection || !pickupSlot || submitting}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit return request'}
        </button>
      </form>
    </main>
  )
}
