import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import PaymentGatewaySimulator from '../components/PaymentGatewaySimulator'
import PaymentMethodSelector from '../components/PaymentMethodSelector'

export default function CheckoutPage() {
  const { shopper, cart, clearCart, appliedCoupon, setAppliedCoupon } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [paymentDetails, setPaymentDetails] = useState({})
  const [selectedAddressId, setSelectedAddressId] = useState(shopper?.addresses?.[0]?.id || 'custom')
  const [customAddress, setCustomAddress] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [step, setStep] = useState('checkout')
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolvingPayment, setResolvingPayment] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Coupon state
  const [coupons, setCoupons] = useState([])
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    api.getAvailableCoupons().then((data) => setCoupons(Array.isArray(data) ? data : []))
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Check if coupon applies to items in cart
  const isCouponApplicable = (coupon) => {
    const hasProductScope = coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0
    const hasCategoryScope = coupon.applicable_category_ids && coupon.applicable_category_ids.length > 0
    if (!hasProductScope && !hasCategoryScope) return true
    return cart.some((item) => {
      if (hasProductScope && coupon.applicable_product_ids.includes(item.product_id)) return true
      if (hasCategoryScope && coupon.applicable_category_ids.includes(item.category_id)) return true
      return false
    })
  }

  const applicableCoupons = coupons.filter((c) => isCouponApplicable(c))

  const calculateDiscount = (coupon) => {
    if (!coupon) return 0
    if (coupon.min_order_value > 0 && subtotal < coupon.min_order_value) return 0
    if (coupon.discount_type === 'percentage') {
      return Math.round((subtotal * coupon.discount_value) / 100)
    }
    return Math.min(coupon.discount_value, subtotal)
  }

  const couponDiscount = calculateDiscount(appliedCoupon)
  const finalTotal = Math.max(0, subtotal - couponDiscount)

  const handleApplyCoupon = () => {
    setCouponError('')
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      setCouponError('Please enter a coupon code.')
      return
    }
    const found = coupons.find((c) => c.code === code)
    if (!found) {
      setCouponError('Invalid coupon code.')
      return
    }
    if (!isCouponApplicable(found)) {
      setCouponError('This coupon is not applicable to items in your cart.')
      return
    }
    if (found.min_order_value > 0 && subtotal < found.min_order_value) {
      setCouponError(`Minimum order value of ${INR.format(found.min_order_value)} required.`)
      return
    }
    setAppliedCoupon(found)
    setCouponInput('')
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const handleQuickApply = (coupon) => {
    setCouponError('')
    if (coupon.min_order_value > 0 && subtotal < coupon.min_order_value) {
      setCouponError(`Min order ${INR.format(coupon.min_order_value)} required for ${coupon.code}.`)
      return
    }
    setAppliedCoupon(coupon)
    setCouponInput('')
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const addresses = shopper?.addresses || []
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
  const baseAddressLine = selectedAddress ? selectedAddress.line : customAddress
  const deliveryAddressLine = altPhone.trim()
    ? `${baseAddressLine.trim()} (Alt Phone: ${altPhone.trim()})`
    : baseAddressLine.trim()

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

  const placeOrder = async (e) => {
    e.preventDefault()
    setError('')

    const effectiveAddress = deliveryAddressLine?.trim() || '14, Lake View Street, Adyar, Chennai 600020'

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
        couponCode: appliedCoupon?.code || null,
        discount: couponDiscount,
      })

      const placedOrder = placed.order || placed
      const placedPayment = placed.payment || null
      setOrder(placedOrder)
      setPayment(placedPayment)
      clearCart()

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
        orderId: order.id,
        paymentMethod,
        paymentDetails,
      })

      if (result.success) {
        // Payment successful - redirect to success page
        navigate(`/payment/success?order_id=${order.id}&payment_id=${result.payment.id}`)
      } else {
        // Payment failed - redirect to failure page
        navigate(`/payment/failure?order_id=${order.id}&payment_id=${result.payment.id}&reason=${encodeURIComponent(result.payment.failure_reason || 'Payment failed')}`)
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

  if (step === 'payment_processing') {
    return (
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Processing Payment</h1>
          <p className="mt-2 text-sm text-slate-500">
            {order?.order_number || `#${order?.id}`} · {INR.format(order?.total)}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Please wait while we process your payment securely...
          </p>
          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          
          {/* Auto-trigger payment processing */}
          {!processingPayment && !error && (
            <button
              onClick={processPayment}
              disabled={processingPayment}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {processingPayment ? 'Processing...' : 'Complete Payment'}
            </button>
          )}

          {/* Auto-process after mount */}
          {typeof window !== 'undefined' && !error && setTimeout(() => !processingPayment && processPayment(), 1000)}
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
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xl">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Order {order.order_number || `#${order.id}`} Placed!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Total {INR.format(order.total)} · {order.payment_method}
          </p>

          {/* Applied coupon badge on confirmation */}
          {order.coupon_code && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
              🏷️ Coupon <strong className="font-mono">{order.coupon_code}</strong> applied ({INR.format(order.discount)} saved)
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <RiskBadge tier={order.risk_tier || 'Low'} />
            {order.status && <StatusBadge status={order.status} />}
            {order.payment_status && <StatusBadge status={order.payment_status} />}
          </div>
          {order.invoice && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-sm border border-slate-200">
              <p className="font-semibold text-slate-900">Invoice {order.invoice.invoice_number}</p>
              <p className="mt-1 text-xs text-slate-500">
                Generated {new Date(order.invoice.generated_at).toLocaleString('en-IN')}
              </p>
              {order.invoice.invoice_url && (
                <a href={order.invoice.invoice_url} className="mt-2 inline-block text-xs font-semibold text-indigo-600">
                  View invoice
                </a>
              )}
            </div>
          )}
          {order.payment_method === 'COD' && (
            <p className="mt-5 text-xs text-slate-500">
              An invoice will be generated once payment is collected on delivery.
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/orders"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm"
            >
              View My Orders
            </Link>
            <Link
              to="/shop"
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Delivery Address</h2>
            <div className="mt-3 space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selectedAddressId === address.id
                      ? 'border-indigo-600 bg-indigo-50/50'
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
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{address.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{address.line}</p>
                  </div>
                </label>
              ))}

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  selectedAddressId === 'custom' || addresses.length === 0
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value="custom"
                  checked={selectedAddressId === 'custom' || addresses.length === 0}
                  onChange={() => setSelectedAddressId('custom')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {addresses.length === 0 ? 'Enter Delivery Address' : '+ Deliver to a new address'}
                  </p>
                  {(selectedAddressId === 'custom' || addresses.length === 0) && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={2}
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="Enter flat/house no, street, locality, city and pincode"
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <input
                        type="tel"
                        value={altPhone}
                        onChange={(e) => setAltPhone(e.target.value)}
                        placeholder="Alternate phone number for delivery (Optional)"
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <PaymentMethodSelector
              onSelect={setPaymentMethod}
              selectedMethod={paymentMethod}
              onDetailsChange={setPaymentDetails}
              paymentDetails={paymentDetails}
            />
          </div>

          {/* Coupon Section */}
          <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              🏷️ Apply Coupon Code
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                placeholder="Enter coupon code (e.g. SAVE10)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tracking-wider uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="mt-2 text-xs text-rose-600 font-medium">{couponError}</p>}

            {/* Applied Coupon Banner */}
            {appliedCoupon && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">✓</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-900 tracking-wider">{appliedCoupon.code}</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {appliedCoupon.discount_type === 'percentage'
                          ? `${appliedCoupon.discount_value}% off`
                          : `₹${appliedCoupon.discount_value} off`}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Coupon applied! Saving <strong className="font-bold">{INR.format(couponDiscount)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Available Coupons list */}
            {!appliedCoupon && applicableCoupons.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Available coupons:</p>
                <div className="space-y-2">
                  {applicableCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 hover:border-purple-200 hover:bg-purple-50/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider"
                          style={{
                            fontFamily: 'monospace',
                            background: coupon.discount_type === 'percentage' ? '#ede9fe' : '#dcfce7',
                            color: coupon.discount_type === 'percentage' ? '#7c3aed' : '#16a34a',
                            border: `1px dashed ${coupon.discount_type === 'percentage' ? '#a78bfa' : '#86efac'}`,
                          }}
                        >
                          {coupon.code}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}% off`
                              : `₹${coupon.discount_value} off`}
                            {coupon.min_order_value > 0 && (
                              <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                                (on orders above {INR.format(coupon.min_order_value)})
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500">{coupon.description || 'Applicable to your items'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyCode(coupon.code)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {copiedCode === coupon.code ? '✓ Copied' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickApply(coupon)}
                          className="rounded-lg bg-indigo-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Order Items</h2>
            <div className="mt-3 space-y-2">
              {cart.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700">
                    {item.name} <span className="text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-slate-900">{INR.format(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>Delivery</span>
            <span className="font-semibold text-emerald-600">Free</span>
          </div>
          <div className="my-4 h-px bg-slate-200" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Total Amount</span>
            <span className="text-indigo-600">{INR.format(finalTotal)}</span>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition shadow-md flex items-center justify-center gap-2"
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
