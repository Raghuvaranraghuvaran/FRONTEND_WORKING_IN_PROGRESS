import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const { addToCart, cart } = useApp()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const cartItem = cart.find((item) => item.product_id === productId)
  const isInCart = Boolean(cartItem)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getProduct(productId), api.getCategories()])
      .then(([productData, categories]) => {
        setProduct(productData || null)
        const cats = Array.isArray(categories) ? categories : []
        setCategory(cats.find((c) => c.id === productData?.category_id) || null)
        setLoading(false)
      })
      .catch(() => {
        setProduct(null)
        setLoading(false)
      })
  }, [productId])

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-32 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-slate-900">Product not found</p>
        <Link to="/shop" className="mt-4 inline-block text-sm font-semibold text-indigo-600">
          Back to shop
        </Link>
      </main>
    )
  }

  const handleAdd = () => {
    if (isInCart) {
      setMessage('Already in cart! You can adjust quantity on the Cart page.')
      window.setTimeout(() => setMessage(''), 3000)
      return
    }
    addToCart(product)
    setMessage('✓ Added to cart successfully!')
    window.setTimeout(() => setMessage(''), 2500)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/shop" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Back to shop
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-600">{category?.name || 'Uncategorized'}</p>
            {isInCart && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                ✓ In your cart ({cartItem.quantity})
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold text-slate-900">{INR.format(product.price)}</p>
          <p className="mt-5 leading-7 text-slate-600">{product.description}</p>
          <p className="mt-2 text-sm text-slate-400">{product.stock} in stock</p>

          {message && (
            <div
              className={`mt-4 rounded-xl px-4 py-2.5 text-xs font-medium ${
                message.includes('Already')
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {isInCart ? (
              <Link
                to="/cart"
                className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm"
              >
                ✓ View in Cart ({cartItem.quantity})
              </Link>
            ) : (
              <button
                onClick={handleAdd}
                className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm transition"
              >
                Add to cart
              </button>
            )}
            <Link
              to="/cart"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Go to cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
