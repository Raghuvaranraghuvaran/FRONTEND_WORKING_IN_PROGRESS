import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import PaymentGatewaySimulator from '../components/PaymentGatewaySimulator'
import PaymentMethodSelector from '../components/PaymentMethodSelector'

const DEFAULT_PRIMARY_ADDRESS = {
  id: 'default_primary',
  label: 'Default Delivery Address',
  line: '14, Lake View Street, Adyar, Chennai, Tamil Nadu - 600020',
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { shopper, setShopper, cart, clearCart, appliedCoupon } = useApp()

  // --- All React state hooks strictly at the top level ---
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [paymentDetails, setPaymentDetails] = useState({})
  const [selectedAddressId, setSelectedAddressId] = useState(
    shopper?.addresses?.[0]?.id || DEFAULT_PRIMARY_ADDRESS.id
  )
  const [customAddress, setCustomAddress] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [step, setStep] = useState('checkout')
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [otp, setOtp] = useState('123456')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolvingPayment, setResolvingPayment] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [useRewardPoints, setUseRewardPoints] = useState(false)
  const [rewardPointsInput, setRewardPointsInput] = useState('')

  const addresses = (shopper?.addresses && shopper.addresses.length > 0)
    ? shopper.addresses
    : [DEFAULT_PRIMARY_ADDRESS]

  const availableRewardPoints = shopper?.reward_points ?? 1000
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const calculateDiscount = (coupon) => {
    if (!coupon) return 0
    if (coupon.min_order_value > 0 && subtotal < coupon.min_order_value) return 0
    if (coupon.discount_type === 'percentage') {
      return Math.round((subtotal * coupon.discount_value) / 100)
    }
    return Math.min(coupon.discount_value, subtotal)
  }

  const couponDiscount = calculateDiscount(appliedCoupon)
  const remainingBeforePoints = Math.max(0, subtotal - couponDiscount)

  // 100 reward points = ₹10 (10 pts = ₹1 => discount = points / 10)
  const maxAllowedPoints = Math.min(availableRewardPoints, Math.ceil(remainingBeforePoints * 10))
  const parsedPointsInput = rewardPointsInput !== '' ? Number(rewardPointsInput) : 0
  const pointsToRedeem = useRewardPoints
    ? Math.min(Math.max(0, parsedPointsInput), maxAllowedPoints)
    : 0
  const rewardDiscount = Math.round(pointsToRedeem / 10)
  const finalTotal = Math.max(0, remainingBeforePoints - rewardDiscount)

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
  const baseAddressLine = selectedAddressId === 'custom'
    ? customAddress.trim()
    : (selectedAddress ? selectedAddress.line : DEFAULT_PRIMARY_ADDRESS.line)

  const deliveryAddressLine = altPhone.trim()
    ? `${baseAddressLine} (Alt Phone: ${altPhone.trim()})`
    : baseAddressLine

  const handleInstantInvoiceDownload = async () => {
    if (!order) return
    setDownloadingInvoice(true)
    try {
      const invId = order.invoice?.id || order.id
      const result = await api.downloadInvoice(invId)
      if (!result.downloaded && result.download_url) {
        window.open(result.download_url, '_blank')
      }
    } catch (err) {
      console.error('Download invoice failed:', err)
      alert('Unable to download invoice directly. You can also download it from My Orders.')
    } finally {
      setDownloadingInvoice(false)
    }
  }

  const validatePaymentDetails = () => {
    if (paymentMethod === 'Card') {
      if (!paymentDetails.card_number || paymentDetails.card_number.replace(/\s/g, '').length !== 16) {
        throw new Error('Please enter a valid 16-digit card number')
      }
      if (!paymentDetails.card_expiry || !paymentDetails.card_expiry.match(/^\d{2}\/\d{2}$/)) {
        throw new Error('Please enter a valid expiry date (MM/YY)')
      }
      if (!paymentDetails.card_cvv || paymentDetails.card_cvv.length !== 3) {
        throw new Error('Please enter a valid 3-digit CVV')
      }
      if (!paymentDetails.card_holder_name) {
        throw new Error('Please enter cardholder name')
      }
    } else if (paymentMethod === 'UPI') {
      if (paymentDetails.upi_mode === 'id' && !paymentDetails.upi_id) {
        throw new Error('Please enter a valid UPI ID (e.g. name@upi)')
      }
    } else if (paymentMethod === 'Netbanking') {
      if (!paymentDetails.bank_code) {
        throw new Error('Please select a bank')
      }
    }
    return true
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    setError('')

    if (selectedAddressId === 'custom' && !customAddress.trim()) {
      setError('Please enter your alternate delivery address.')
      return
    }

    if (altPhone.trim() && altPhone.trim().length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    const effectiveAddress = deliveryAddressLine?.trim() || DEFAULT_PRIMARY_ADDRESS.line
    const contactPhone = altPhone.trim() || shopper?.phone || ''

    try {
      if (paymentMethod !== 'COD') {
        validatePaymentDetails()
      }
    } catch (validationErr) {
      setError(validationErr.message)
      return
    }

    setSubmitting(true)
    try {
      if (shopper && customAddress && selectedAddressId === 'custom') {
        try {
          await api.addAddress({ line: customAddress, label: 'Home' })
        } catch {
          // address save optional
        }
      }

      const placed = await api.placeOrder({
        items: cart,
        paymentMethod,
        address: effectiveAddress,
        phone: contactPhone,
        paymentDetails: paymentMethod !== 'COD' ? paymentDetails : undefined,
        couponCode: appliedCoupon?.code || null,
        discount: couponDiscount,
        rewardPointsUsed: pointsToRedeem,
        rewardDiscount: rewardDiscount,
      })

      const placedOrder = placed.order || placed
      const placedPayment = placed.payment || null
      setOrder(placedOrder)
      setPayment(placedPayment)
      clearCart()

      if (placed.user) {
        setShopper(placed.user)
      } else if (shopper) {
        const curPts = shopper.reward_points ?? 1000
        const remPts = pointsToRedeem > 0 ? Math.max(0, curPts - pointsToRedeem) : curPts
        const pointsEarned = placedOrder?.reward_points_earned ?? (Math.floor(Number(placedOrder.total || finalTotal) / 100) * 10)
        setShopper({
          ...shopper,
          reward_points: remPts + pointsEarned,
          total_orders: (shopper.total_orders || 0) + 1,
        })
      }

      // If COD, proceed to OTP or confirmation
      if (paymentMethod === 'COD') {
        if (placedOrder?.risk_tier === 'Medium' || placedOrder?.verification_status === 'Pending') {
          setStep('otp')
        } else {
          setStep('confirmation')
        }
      } else {
        // For online payments, show payment processing screen
        setStep('payment_processing')
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const processPayment = async () => {
    if (!order || !payment) return

    setError('')
    setProcessingPayment(true)

    try {
      const result = await api.processPayment({
        paymentId: payment.id,
        orderId: order.id,
        paymentMethod,
        paymentDetails,
      })
      const paymentResult = result?.result || result || { success: true }
      const paymentRecord = result?.payment || payment || { id: 'pay_confirmed' }

      if (paymentResult.success !== false) {
        navigate(`/payment/success?order_id=${order.id}&payment_id=${paymentRecord.id || 'pay_confirmed'}`)
      } else {
        navigate(`/payment/failure?order_id=${order.id}&payment_id=${paymentRecord.id || 'pay_failed'}&reason=${encodeURIComponent(paymentRecord.failure_reason || paymentResult.message || 'Payment failed')}`)
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed')
      setProcessingPayment(false)
    }
  }

  const resolvePayment = async (outcome) => {
    setError('')
    setResolvingPayment(true)
    try {
      const result = await api.simulatePaymentResult({ orderId: order.id, outcome })
      setOrder(result.order)
      setPayment(result.payment)
      if (outcome === 'success') {
        setStep(result.order.risk_tier === 'Medium' ? 'otp' : 'confirmation')
      } else if (outcome === 'failed') {
        setStep('payment_failed')
      } else {
        setStep('payment_rejected')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setResolvingPayment(false)
    }
  }

  const retryPayment = async () => {
    setError('')
    setSubmitting(true)
    try {
      const result = await api.retryPayment(order.id)
      setOrder(result.order)
      setPayment(result.payment)
      setStep('payment_gateway')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.verifyOtp({ returnId: null, code: otp || '123456' })
      setStep('confirmation')
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please enter 123456.')
    } finally {
      setSubmitting(false)
    }
  }

  // Early return for empty cart (when not viewing a placed order step)
  if (cart.length === 0 && !order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
        <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-indigo-600">
          Browse products
        </Link>
      </main>
    )
  }

  if (step === 'payment_processing') {
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-2xl animate-pulse">
            💳
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Processing Payment</h1>
          <p className="mt-2 text-sm text-slate-500">
            Order {order?.order_number} · Total: {INR.format(order?.total)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Payment Method: {paymentMethod}
          </p>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Payment Simulation:</p>
            <p>• Ready to simulate gateway transaction</p>
            <p>• PDF invoice will generate upon success</p>
            <p>• Email confirmation will be triggered</p>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={processPayment}
              disabled={processingPayment}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 shadow-sm transition"
            >
              {processingPayment ? 'Connecting to Gateway…' : 'Complete Payment →'}
            </button>
            <button
              onClick={() => resolvePayment('failed')}
              disabled={processingPayment}
              className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Simulate Payment Failure
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'payment_gateway') {
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <PaymentGatewaySimulator
          orderNumber={order?.order_number || `#${order?.id}`}
          amount={order?.total}
          resolving={resolvingPayment}
          onResolve={resolvePayment}
        />
      </main>
    )
  }

  if (step === 'payment_failed' || step === 'payment_rejected') {
    const isFailed = step === 'payment_failed'
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold">
            !
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            {isFailed ? 'Payment failed' : 'Payment rejected'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {order?.order_number || `#${order?.id}`} · {INR.format(order?.total)}
          </p>
          <div className="mt-4 flex justify-center">
            <StatusBadge status={payment?.status || 'Failed'} />
          </div>
          {payment?.failure_reason && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{payment.failure_reason}</p>
          )}
          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={retryPayment}
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 shadow-sm"
            >
              {submitting ? 'Retrying…' : 'Retry payment'}
            </button>
            <Link
              to="/orders"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View order
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'otp') {
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold">
            OTP
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Verify with SMS OTP</h1>
          <p className="mt-2 text-sm text-slate-500">
            This action requires SMS verification to confirm your order.
          </p>
          <form onSubmit={confirmOtp} className="mt-6 space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP (e.g. 123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-center text-lg font-bold tracking-widest focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-2 text-xs text-slate-400">Default test OTP: 123456</p>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 p-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Verifying…' : 'Verify & Place Order'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (step === 'confirmation' && order) {
    const customerEmail = shopper?.email || order?.user?.email || 'your registered email'
    const orderNumber = order?.order_number || (order?.id ? `#${order.id}` : '#1030')
    const orderTotal = Number(order?.total) || 0

    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-2xl shadow-xs">
            ✓
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Order {orderNumber} Placed!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Total {INR.format(orderTotal)} · {order.payment_method?.replace(/_/g, ' ') || 'Cash on Delivery (COD)'}
          </p>

          {/* Applied coupon badge */}
          {order.coupon_code && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
              🏷️ Coupon <strong className="font-mono">{order.coupon_code}</strong> applied ({INR.format(Number(order.discount) || 0)} saved)
            </div>
          )}

          {/* Applied reward points badge */}
          {Number(order.reward_points_used) > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              ⭐ <strong>{order.reward_points_used} reward points</strong> redeemed ({INR.format(Number(order.reward_discount) || Math.round(order.reward_points_used / 10))} saved)
            </div>
          )}

          {/* Earned reward points badge */}
          {(Number(order.reward_points_earned) > 0 || Math.floor(orderTotal / 100) * 10 > 0) && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              🎉 <strong>+{order.reward_points_earned || Math.floor(orderTotal / 100) * 10} reward points</strong> earned on this order! (10 pts per ₹100)
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <RiskBadge tier={order.risk_tier || 'Low'} />
            <StatusBadge status={order.status || 'Confirmed'} />
            <StatusBadge status={order.payment_status || 'Paid'} />
          </div>

          {/* Immediate Invoice Download Card */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-5 text-left border border-indigo-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {order.invoice?.invoice_number ? `Invoice ${order.invoice.invoice_number}` : 'Official Order Invoice'}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Detailed PDF invoice with complete itemized pricing & order metadata.
                </p>
              </div>

              <button
                type="button"
                onClick={handleInstantInvoiceDownload}
                disabled={downloadingInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer shrink-0"
              >
                {downloadingInvoice ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Downloading…</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Invoice PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Email Dispatch Notice */}
            <div className="mt-3 pt-3 border-t border-indigo-100/80 flex items-start gap-2 text-xs text-indigo-900/80">
              <span className="text-indigo-600 text-sm">✉️</span>
              <p>
                A copy of this invoice has been sent to <strong>{customerEmail}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/orders"
              className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
            >
              View My Orders →
            </Link>
            <Link
              to="/shop"
              className="rounded-xl border border-slate-300 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        {!shopper && (
          <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:underline">
            Already have an account? Sign in
          </Link>
        )}
      </div>

      <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Delivery Address Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📍</span> Delivery Address
              </h2>
              <span className="text-xs text-slate-500">Choose where to deliver</span>
            </div>

            <div className="space-y-3">
              {/* Default Registered Address */}
              {addresses.map((address, idx) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selectedAddressId === address.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{address.label || 'Registered Address'}</p>
                      {idx === 0 && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{address.line}</p>
                  </div>
                </label>
              ))}

              {/* Alternate Address Option */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  selectedAddressId === 'custom'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value="custom"
                  checked={selectedAddressId === 'custom'}
                  onChange={() => setSelectedAddressId('custom')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>➕</span> Deliver to Alternate / New Address
                    </p>
                    <span className="text-[11px] text-indigo-600 font-semibold">Custom</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Specify a different shipping address or recipient contact number.</p>

                  {selectedAddressId === 'custom' && (
                    <div className="mt-3 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Alternate Street Address <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={customAddress}
                          onChange={(e) => { setCustomAddress(e.target.value); setError('') }}
                          placeholder="Enter complete building name, flat/house no, street, landmark, city and pincode"
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Alternate Contact Mobile Number (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            value={altPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                              setAltPhone(val)
                              setError('')
                            }}
                            placeholder="10-digit mobile number (e.g. 9876543210)"
                            className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 font-mono bg-white"
                          />
                          {altPhone.length > 0 && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold ${altPhone.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {altPhone.length}/10 digits
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Reward Points Redemption Card */}
          {availableRewardPoints > 0 && (
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 to-orange-50/40 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 border border-amber-300 text-amber-700 text-xl shadow-xs">
                    ⭐
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Redeem Reward Points
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Balance: <strong className="text-amber-800 font-bold">{availableRewardPoints.toLocaleString()} pts</strong> (worth <strong className="text-emerald-700">{INR.format(availableRewardPoints / 10)}</strong>) · <span className="text-slate-500 font-medium">100 pts = ₹10</span>
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={useRewardPoints}
                    onChange={(e) => {
                      setUseRewardPoints(e.target.checked)
                      if (!e.target.checked) {
                        setRewardPointsInput('')
                      }
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>

              {useRewardPoints && (
                <div className="mt-4 pt-4 border-t border-amber-200/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Enter points to redeem:</span>
                    <div className="flex items-center gap-1.5">
                      {[100, 200, 500].filter((pts) => pts <= maxAllowedPoints).map((pts) => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setRewardPointsInput(String(pts))}
                          className="rounded-lg border border-amber-300 bg-amber-50/80 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                        >
                          {pts} pts (₹{pts / 10})
                        </button>
                      ))}
                      {rewardPointsInput !== '' && (
                        <button
                          type="button"
                          onClick={() => setRewardPointsInput('')}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={maxAllowedPoints}
                      step={10}
                      value={rewardPointsInput}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          setRewardPointsInput('')
                        } else {
                          const n = Math.min(Math.max(0, Number(val)), maxAllowedPoints)
                          setRewardPointsInput(String(n))
                        }
                      }}
                      className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono shadow-xs"
                      placeholder="e.g. 100"
                    />
                    <div className="text-xs text-slate-700">
                      {pointsToRedeem > 0 ? (
                        <>
                          = <span className="font-bold text-emerald-700 text-sm">−{INR.format(rewardDiscount)} discount</span> ({availableRewardPoints - pointsToRedeem} pts will remain)
                        </>
                      ) : (
                        <span className="text-slate-500 italic">Type points (e.g. 100 pts = ₹10)</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <PaymentMethodSelector
              onSelect={setPaymentMethod}
              selectedMethod={paymentMethod}
              onDetailsChange={setPaymentDetails}
              paymentDetails={paymentDetails}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Order Summary</h2>
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{INR.format(subtotal)}</span>
          </div>
          {appliedCoupon && couponDiscount > 0 && (
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-emerald-700 font-medium flex items-center gap-1">🏷️ {appliedCoupon.code}</span>
              <span className="font-semibold text-emerald-700">−{INR.format(couponDiscount)}</span>
            </div>
          )}
          {useRewardPoints && rewardDiscount > 0 && (
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-amber-700 font-medium flex items-center gap-1">⭐ {pointsToRedeem} pts</span>
              <span className="font-semibold text-amber-700">−{INR.format(rewardDiscount)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>Delivery</span>
            <span className="font-semibold text-emerald-600">Free</span>
          </div>
          <div className="my-4 h-px bg-slate-200" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Total Amount</span>
            <span className="text-indigo-600">{INR.format(finalTotal)}</span>
          </div>

          {Math.floor(finalTotal / 100) * 10 > 0 && (
            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-amber-50/90 border border-amber-200/90 px-3.5 py-2 text-xs shadow-xs">
              <span className="flex items-center gap-1.5 font-semibold text-amber-900">
                <span className="text-sm">⭐</span> Points to earn:
              </span>
              <span className="font-bold text-amber-800">
                +{Math.floor(finalTotal / 100) * 10} pts <span className="text-[11px] font-medium text-amber-600">(10 pts / ₹100)</span>
              </span>
            </div>
          )}

          {useRewardPoints && rewardDiscount > 0 && (
            <p className="mt-2 text-center text-xs font-semibold text-emerald-600">
              🎉 You are saving {INR.format(rewardDiscount + (couponDiscount || 0))} on this order!
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing Order…
              </>
            ) : (
              'Place Order →'
            )}
          </button>
        </div>
      </form>
    </main>
  )
}
