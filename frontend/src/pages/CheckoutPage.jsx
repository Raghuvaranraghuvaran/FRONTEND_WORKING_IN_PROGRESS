import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import PaymentGatewaySimulator from '../components/PaymentGatewaySimulator'

export default function CheckoutPage() {
  const { shopper, cart, clearCart } = useApp()
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [selectedAddressId, setSelectedAddressId] = useState(shopper?.addresses?.[0]?.id || 'custom')
  const [customAddress, setCustomAddress] = useState('')
  const [step, setStep] = useState('checkout')
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolvingPayment, setResolvingPayment] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const addresses = shopper?.addresses || []
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
  const deliveryAddressLine = selectedAddress ? selectedAddress.line : customAddress

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
          await api.addAddress(customAddress, 'Home')
        } catch {
          // address save optional
        }
      }

      const placed = await api.placeOrder({
        items: cart,
        paymentMethod,
        address: effectiveAddress,
      })

      const placedOrder = placed.order || placed
      const placedPayment = placed.payment || null
      setOrder(placedOrder)
      setPayment(placedPayment)
      clearCart()

      if (paymentMethod === 'Prepaid' && placed.payment) {
        setStep('payment_gateway')
      } else if (placedOrder?.risk_tier === 'Medium' || placedOrder?.verification_status === 'Pending') {
        setStep('otp')
      } else {
        setStep('confirmation')
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please check your details and try again.')
    } finally {
      setSubmitting(false)
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
          <div className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            Demo OTP: <strong>123456</strong>
          </div>
          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <form onSubmit={confirmOtp} className="mt-6 space-y-4">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-lg tracking-[0.5em] focus:border-indigo-500 focus:outline-none"
            />
            <button
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition shadow-sm"
            >
              {submitting ? 'Verifying…' : 'Verify & Confirm Order'}
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

      <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
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
                    <textarea
                      rows={2}
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Enter flat/house no, street, locality, city and pincode"
                      className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Payment Method</h2>
            <div className="mt-3 space-y-3">
              {[
                { id: 'COD', label: 'Cash on Delivery (COD)', note: 'Risk-scored in real-time before acceptance.' },
                { id: 'Prepaid', label: 'Prepaid (Card / UPI / Netbanking)', note: 'Payment gateway verification simulator.' },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    paymentMethod === method.id
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{method.label}</p>
                    <p className="text-xs text-slate-500">{method.note}</p>
                  </div>
                </label>
              ))}
            </div>
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
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>Delivery</span>
            <span className="font-semibold text-emerald-600">Free</span>
          </div>
          <div className="my-4 h-px bg-slate-200" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Total Amount</span>
            <span className="text-indigo-600">{INR.format(subtotal)}</span>
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
