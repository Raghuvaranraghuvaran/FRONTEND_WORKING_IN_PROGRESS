import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Heart, Trash2, Bell, ShoppingCart, Check, ShieldCheck } from 'lucide-react'
import { INR } from '../lib/format'

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, priceAlerts, setPriceAlert } = useApp()
  const [editingAlertId, setEditingAlertId] = useState(null)
  const [targetInput, setTargetInput] = useState('')
  const [addedId, setAddedId] = useState(null)

  const handleSaveAlert = (productId) => {
    if (!targetInput || Number(targetInput) <= 0) return
    setPriceAlert(productId, Number(targetInput))
    setEditingAlertId(null)
    setTargetInput('')
  }

  const handleAdd = (product) => {
    addToCart(product, 1)
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 2000)
  }

  if (wishlist.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
        <p className="text-sm text-slate-500 mt-1">Save items you love for later with automated price drop alerts.</p>

        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Your wishlist is empty</h2>
          <p className="mt-2 text-xs text-slate-500 max-w-xs">
            Tap the heart icon on any product to save it and set automated price drop alerts!
          </p>
          <Link
            to="/shop"
            className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
          >
            Browse Catalog
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Wishlist & Price Watch</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved · Set target prices to receive instant alerts
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wishlist.map((product) => {
          const alertPrice = priceAlerts[product.id]
          return (
            <div
              key={product.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg transition"
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-rose-50 text-rose-600 transition shadow-sm"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Info */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                </h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-slate-900">{INR.format(product.price)}</span>
                  {product.original_price && (
                    <span className="text-xs text-slate-400 line-through">{INR.format(product.original_price)}</span>
                  )}
                </div>

                {/* Price Watch alert banner */}
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <Bell className="h-3 w-3 text-indigo-600" />
                      {alertPrice ? `Alert under ₹${alertPrice}` : 'Price Alert'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlertId(editingAlertId === product.id ? null : product.id)
                        setTargetInput(alertPrice || '')
                      }}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      {alertPrice ? 'Edit' : 'Set Target'}
                    </button>
                  </div>

                  {editingAlertId === product.id && (
                    <div className="mt-2 flex gap-1.5">
                      <input
                        type="number"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        placeholder="Target ₹"
                        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveAlert(product.id)}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleAdd(product)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition shadow-sm ${
                    addedId === product.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {addedId === product.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

