import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, ShoppingBag, ArrowRight, Truck, AlertTriangle, ShieldCheck, Trash2, Plus, Minus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import { INR } from '../lib/format'

export default function SmartCartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, updateCartItem, clearCart } = useApp()
  const navigate = useNavigate()
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      setLoading(true)
      api
        .validateCart(cart)
        .then((res) => setValidation(res))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, cart])

  if (!isOpen) return null

  const freeThreshold = 3000
  const remainingForFree = Math.max(0, freeThreshold - subtotal)
  const freeProgress = Math.min(100, Math.round((subtotal / freeThreshold) * 100))

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Smart Cart</h2>
                <p className="text-xs text-slate-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-indigo-600" />
                {remainingForFree === 0 ? (
                  <span className="text-emerald-700 font-bold">🎉 You unlocked FREE Delivery!</span>
                ) : (
                  <span>Add {INR.format(remainingForFree)} more for FREE Delivery</span>
                )}
              </span>
              <span className="font-extrabold text-indigo-600">{freeProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  remainingForFree === 0 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${freeProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">Your cart is empty</p>
                <p className="text-xs text-slate-400">Discover zero-return-risk verified items</p>
                <button
                  onClick={() => {
                    onClose()
                    navigate('/shop')
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const key = item.cart_key || item.product_id
                return (
                  <div
                    key={key}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm relative group"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl object-cover border border-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(key)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {item.size && (
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Size: {item.size}
                        </span>
                      )}

                      <p className="mt-1 text-xs font-bold text-slate-900">{INR.format(item.price)}</p>

                      {/* Final Sale or Low Stock Alerts */}
                      {item.is_returnable === false && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> Final Sale (Non-Returnable)
                        </p>
                      )}

                      {/* Quantity Stepper */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                          <button
                            onClick={() => updateCartItem(key, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-l-lg transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(key, item.quantity + 1)}
                            className="p-1 text-slate-600 hover:bg-slate-200 rounded-r-lg transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Warnings Banner */}
          {validation?.warnings?.length > 0 && (
            <div className="bg-amber-50 px-6 py-2 border-t border-amber-200 text-[11px] font-medium text-amber-800 space-y-0.5">
              {validation.warnings.slice(0, 2).map((w, idx) => (
                <p key={idx}>⚠️ {w}</p>
              ))}
            </div>
          )}

          {/* Drawer Footer */}
          {cart.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{INR.format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery</span>
                  <span className="font-semibold text-emerald-700">
                    {remainingForFree === 0 ? 'FREE' : '₹99'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{INR.format(subtotal + (remainingForFree === 0 ? 0 : 99))}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose()
                  navigate('/checkout')
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
