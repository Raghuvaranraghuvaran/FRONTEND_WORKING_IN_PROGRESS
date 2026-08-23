import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import { INR } from '../lib/format'
import EmptyState from '../components/EmptyState'

export default function CartPage() {
  const { cart, updateCartItem, appliedCoupon, setAppliedCoupon } = useApp()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const [coupons, setCoupons] = useState([])
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)

  useEffect(() => {
    api.getAvailableCoupons().then((data) => setCoupons(Array.isArray(data) ? data : []))
  }, [])

  // Check if coupon applies to at least one item in cart
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

  const discount = calculateDiscount(appliedCoupon)
  const total = Math.max(0, subtotal - discount)

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
      setCouponError(`Minimum order value of ${INR.format(coupon.min_order_value)} required for ${coupon.code}.`)
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

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Your cart</h1>
        <EmptyState title="Your cart is empty" description="Add some products to get started." />
        <div className="mt-6 text-center">
          <Link to="/shop" className="text-sm font-semibold text-indigo-600">
            Browse products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Your cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {cart.map((item) => {
            // Find applicable coupon for this individual item
            const itemCoupon = coupons.find((c) => {
              if (!c.is_active) return false
              if (c.applicable_product_ids?.length > 0 && c.applicable_product_ids.includes(item.product_id)) return true
              if (c.applicable_category_ids?.length > 0 && item.category_id && c.applicable_category_ids.includes(item.category_id)) return true
              return false
            })

            return (
              <div key={item.product_id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                {/* Product image */}
                {item.image && (
                  <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{INR.format(item.price)} each</p>
                  {itemCoupon && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                      🏷️ Coupon available: <strong className="font-mono">{itemCoupon.code}</strong> ({itemCoupon.discount_type === 'percentage' ? `${itemCoupon.discount_value}% off` : `₹${itemCoupon.discount_value} off`})
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartItem(item.product_id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItem(item.product_id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="w-24 text-right font-semibold text-slate-900">{INR.format(item.price * item.quantity)}</p>
                </div>
              </div>
            )
          })}

          {/* Coupon Section */}
          <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              🏷️ Apply Coupon Code
            </h3>

            {/* Coupon Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                placeholder="Enter coupon code (e.g. SAVE10)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tracking-wider uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleApplyCoupon}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
              >
                Apply
              </button>
            </div>

            {couponError && (
              <p className="text-xs text-rose-600 font-medium mb-3">{couponError}</p>
            )}

            {/* Applied coupon banner */}
            {appliedCoupon && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 mb-3">
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
                      Coupon applied successfully! You save <strong className="font-bold">{INR.format(discount)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Available coupons list */}
            {applicableCoupons.length > 0 && !appliedCoupon && (
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Available for your cart:</p>
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
                          onClick={() => copyCode(coupon.code)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          {copiedCode === coupon.code ? '✓ Copied' : 'Copy'}
                        </button>
                        <button
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
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{INR.format(subtotal)}</span>
          </div>
          {appliedCoupon && discount > 0 && (
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                🏷️ {appliedCoupon.code}
              </span>
              <span className="font-semibold text-emerald-700">−{INR.format(discount)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>Shipping</span>
            <span className="font-semibold text-emerald-600">Free</span>
          </div>
          <div className="my-4 h-px bg-slate-200" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Total</span>
            <span className="text-indigo-600">{INR.format(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block rounded-xl bg-indigo-600 px-4 py-3.5 text-center text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
          >
            Proceed to checkout →
          </Link>
        </div>
      </div>
    </main>
  )
}
