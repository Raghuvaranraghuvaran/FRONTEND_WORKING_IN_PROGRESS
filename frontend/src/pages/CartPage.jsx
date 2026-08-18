import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'
import EmptyState from '../components/EmptyState'

export default function CartPage() {
  const { cart, updateCartItem } = useApp()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{INR.format(item.price)} each</p>
              </div>
              <div className="flex items-center gap-3">
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
                <p className="w-24 text-right font-semibold text-slate-900">{INR.format(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{INR.format(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-slate-600">
            <span>Shipping</span>
            <span className="font-semibold text-emerald-600">Free</span>
          </div>
          <div className="my-4 h-px bg-slate-200" />
          <div className="flex justify-between text-base font-bold text-slate-900">
            <span>Total</span>
            <span>{INR.format(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </main>
  )
}
