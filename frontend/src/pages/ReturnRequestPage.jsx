import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../mock/api'
import { formatDate, INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import { 
  Package, 
  Calendar, 
  Clock, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Coins, 
  Building2, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

const REASONS = [
  { id: 'wrong_size', label: 'Wrong size / Fit issue' },
  { id: 'damaged', label: 'Damaged or defective product' },
  { id: 'quality', label: 'Quality not as expected' },
  { id: 'wrong_product', label: 'Wrong item received' },
  { id: 'missing_item', label: 'Missing item or component' },
  { id: 'changed_mind', label: 'Changed mind / No longer needed' },
  { id: 'not_as_described', label: 'Item does not match website description' },
  { id: 'other', label: 'Other' },
]

const PICKUP_SLOTS = [
  { id: 'tomorrow_morning', label: 'Tomorrow · 10:00 AM – 1:00 PM', value: 'tomorrow_morning' },
  { id: 'tomorrow_afternoon', label: 'Tomorrow · 2:00 PM – 5:00 PM', value: 'tomorrow_afternoon' },
  { id: 'day_after_morning', label: 'Day after tomorrow · 10:00 AM – 1:00 PM', value: 'day_after_morning' },
]

const REFUND_METHODS = [
  {
    id: 'original',
    title: 'Original Payment Method',
    subtitle: 'Refunded to original UPI / Card account within 3-5 business days of inspection',
    icon: CreditCard,
    badge: 'Standard',
  },
  {
    id: 'store_credit',
    title: 'Store Credit / Reward Points',
    subtitle: 'Instant credit to your ReturnGuard account with 5% bonus reward points',
    icon: Coins,
    badge: 'Instant + 5% Bonus',
    highlight: true,
  },
  {
    id: 'bank_transfer',
    title: 'Direct Bank Transfer / UPI',
    subtitle: 'Direct NEFT/IMPS transfer to your verified bank account',
    icon: Building2,
    badge: 'Direct Transfer',
  },
]

export default function ReturnRequestPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [existingReturn, setExistingReturn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [selectedLines, setSelectedLines] = useState({})
  const [pickupSlot, setPickupSlot] = useState('tomorrow_morning')
  const [refundMethod, setRefundMethod] = useState('original')
  const [uploadedImages, setUploadedImages] = useState([])
  const [shopperCondition, setShopperCondition] = useState('unused')
  const [shopperSerial, setShopperSerial] = useState('')
  const [shopperImei, setShopperImei] = useState('')
  const [result, setResult] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showOtp, setShowOtp] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getShopperOrders(),
      api.getShopperReturns().catch(() => [])
    ])
      .then(([orders, returns]) => {
        const found = (orders || []).find((o) => String(o.id) === String(orderId) || String(o.order_number) === String(orderId))
        setOrder(found || null)

        if (found) {
          // Check if lines should default to all selected
          const lines = {}
          ;(found.items || []).forEach((item) => {
            lines[item.product_id] = {
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }
          })
          setSelectedLines(lines)

          // Check if return request already exists
          const existing = (returns || []).find(
            (r) => (String(r.order_id) === String(found.id) || r.order_number === found.order_number) && r.status !== 'rejected'
          )
          if (existing) {
            setExistingReturn(existing)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load order:', err)
        setError('Failed to load order details.')
        setLoading(false)
      })
  }, [orderId])

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      if (uploadedImages.length >= 4) return
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImages((prev) => [...prev.slice(0, 3), reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
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

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4" />
        <p className="text-sm font-medium text-slate-600">Verifying return eligibility & order details…</p>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-2xl mb-4">
          📦
        </div>
        <p className="text-lg font-bold text-slate-900">Order Not Found</p>
        <p className="mt-1 text-sm text-slate-500">We could not find an order matching identifier "{orderId}".</p>
        <Link to="/orders" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Back to My Orders
        </Link>
      </main>
    )
  }

  // Check if return request already exists
  if (existingReturn) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Return Already Submitted</h1>
          <p className="mt-2 text-sm text-slate-600">
            A return request has already been submitted for Order <strong>#{order.order_number}</strong> (Return ID: <span className="font-mono font-semibold text-indigo-600">{existingReturn.id}</span>).
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <div className="flex justify-between items-center text-xs text-slate-600 pb-2 border-b border-slate-200">
              <span>Status:</span>
              <StatusBadge status={existingReturn.status} />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 pt-2">
              <span>Reason:</span>
              <span className="font-medium text-slate-900">{existingReturn.reason?.replaceAll('_', ' ')}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              to="/orders"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              View in My Orders
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Return window validation (7 days)
  const returnWindowDays = 7
  let isExpired = false
  let deliveryDateStr = order.delivered_at || order.created_at
  if (order.delivered_at) {
    const deliveryTime = new Date(order.delivered_at).getTime()
    const diffDays = (Date.now() - deliveryTime) / (1000 * 60 * 60 * 24)
    if (diffDays > returnWindowDays) {
      isExpired = true
    }
  }

  if (isExpired) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Return Policy Window Expired</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            This order was delivered on <strong>{formatDate(deliveryDateStr)}</strong>. The <strong>{returnWindowDays}-day</strong> return eligibility window has expired.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            For manufacturer warranty or exceptional service assistance, please contact our customer support.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              to="/orders"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to My Orders
            </Link>
            <Link
              to="/help"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    )
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
        refundMethod,
        images: uploadedImages,
        returnLines: selectedItems,
        pickupSlot,
        product_condition: shopperCondition,
        serial_number: shopperSerial,
        imei_number: shopperImei,
      })
      setResult(record)
      if (record.risk_tier === 'Medium') {
        setShowOtp(true)
      }
    } catch (err) {
      setError(err.message || 'Failed to submit return request.')
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
      setError(err.message || 'Invalid verification code.')
    } finally {
      setSubmitting(false)
    }
  }

  // Confirmation view after submission
  if (result) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700">
              Return Request #{result.id || 'RET-SUCCESS'}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Return Request Submitted</h1>
            <p className="mt-1 text-sm text-slate-500">Order #{order.order_number}</p>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Status:</span>
              <StatusBadge status={result.status} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Preferred Refund:</span>
              <span className="font-semibold text-slate-900">
                {REFUND_METHODS.find((m) => m.id === (result.refund_method || refundMethod))?.title || 'Original Payment Method'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Pickup Scheduled:</span>
              <span className="font-medium text-slate-900">
                {PICKUP_SLOTS.find((s) => s.id === (result.pickup_slot || pickupSlot))?.label || 'Tomorrow Morning'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Verification Status:</span>
              <span className="font-semibold text-indigo-600">{result.verification_status || 'Verified'}</span>
            </div>
          </div>

          {showOtp && (
            <form onSubmit={submitOtp} className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Step-up OTP Confirmation</p>
              <p className="mt-1 text-xs text-amber-700">Enter the 6-digit OTP sent to your registered phone (for demo use: 123456).</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 123456"
                  className="min-w-0 flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm focus:outline-none"
                />
                <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white">Verify</button>
              </div>
            </form>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/orders?tab=returns" className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">
              View in Returns Tab →
            </Link>
            <Link to="/shop" className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb / Back */}
      <Link to="/orders" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to My Orders
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Return Order #{order.order_number}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Delivered on {formatDate(deliveryDateStr)} · Eligible for return until {formatDate(new Date(new Date(deliveryDateStr).getTime() + returnWindowDays * 86400000))}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 self-start">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Return Eligible (7-Day Policy)</span>
        </div>
      </div>

      <form onSubmit={submitReturn} className="mt-6 space-y-6">
        
        {/* Step 1: Select Items to Return */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">1. Select Item(s) to Return</h2>
            <span className="text-xs text-slate-500">{selectedItems.length} selected</span>
          </div>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => {
              const isChecked = Boolean(selectedLines[item.product_id])
              return (
                <label
                  key={item.product_id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    isChecked ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => toggleLine(item, e.target.checked)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} · Price: {INR.format(item.price)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{INR.format(item.price * item.quantity)}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Step 2: Return Reason */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">2. Reason for Return</h2>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {REASONS.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs sm:text-sm font-medium transition-all ${
                  reason === option.id ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm font-semibold' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={option.id}
                  checked={reason === option.id}
                  onChange={() => setReason(option.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                {option.label}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold uppercase text-slate-500">Additional Details / Comments (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Describe any defects, fit issues, or specific details for the merchant…"
            />
          </div>

          {/* Shopper Self-Reported Condition & Serial Check (Type B Shopper Input) */}
          <div className="mt-5 border-t border-slate-100 pt-4 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">Item Physical Condition</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'unused', label: 'Unused / Tags Attached', icon: '✨' },
                  { id: 'used', label: 'Used / Tried On', icon: '👕' },
                  { id: 'damaged', label: 'Damaged / Defective', icon: '⚠️' },
                  { id: 'tag_removed', label: 'Tag Removed', icon: '🏷️' },
                ].map((cond) => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setShopperCondition(cond.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      shopperCondition === cond.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cond.icon}</span>
                    <span>{cond.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Device Serial / IMEI for electronics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Device Serial Number (Optional / If applicable)</label>
                <input
                  type="text"
                  value={shopperSerial}
                  onChange={(e) => setShopperSerial(e.target.value)}
                  placeholder="e.g. SN-8829-X"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Device IMEI Number (For phones)</label>
                <input
                  type="text"
                  value={shopperImei}
                  onChange={(e) => setShopperImei(e.target.value)}
                  placeholder="e.g. 358920192837192"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Photo Uploads */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">3. Upload Photos (Optional but recommended)</h2>
            <span className="text-xs text-slate-400">Max 4 photos</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Attach photos of the item condition, product tags, or defects for fast auto-approval.</p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative h-24 rounded-xl border border-slate-200 overflow-hidden group">
                <img src={img} alt="Proof" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-slate-900/80 p-1 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {uploadedImages.length < 4 && (
              <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-colors text-center p-2">
                <UploadCloud className="h-6 w-6 text-slate-400" />
                <span className="mt-1 text-[11px] font-semibold text-indigo-600">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Step 4: Preferred Refund Method */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">4. Preferred Refund Method</h2>
          <div className="mt-4 space-y-3">
            {REFUND_METHODS.map((m) => {
              const Icon = m.icon
              const isSelected = refundMethod === m.id
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start justify-between rounded-xl border p-4 transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="refundMethod"
                      value={m.id}
                      checked={isSelected}
                      onChange={() => setRefundMethod(m.id)}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-900">{m.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{m.subtitle}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    m.highlight ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.badge}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Step 5: Pickup Slot */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">5. Doorstep Pickup Slot</h2>
          <div className="mt-4 space-y-2.5">
            {PICKUP_SLOTS.map((slot) => (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-xs sm:text-sm font-medium transition-all ${
                  pickupSlot === slot.id ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pickup"
                  value={slot.id}
                  checked={pickupSlot === slot.id}
                  onChange={() => setPickupSlot(slot.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>{slot.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!reason || !hasSelection || submitting}
          className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting Return Request…' : 'Submit Return Request →'}
        </button>
      </form>
    </main>
  )
}
