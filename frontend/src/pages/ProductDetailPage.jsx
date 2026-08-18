import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const { addToCart } = useApp()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getProduct(productId), api.getCategories()]).then(([productData, categories]) => {
      setProduct(productData)
      setCategory(categories.find((c) => c.id === productData?.category_id) || null)
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
    addToCart(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
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
          <p className="text-sm font-semibold text-indigo-600">{category?.name || 'Uncategorized'}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <p className="mt-3 text-2xl font-bold text-slate-900">{INR.format(product.price)}</p>
          <p className="mt-5 leading-7 text-slate-600">{product.description}</p>
          <p className="mt-2 text-sm text-slate-400">{product.stock} in stock</p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAdd}
              className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
            <Link
              to="/cart"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
