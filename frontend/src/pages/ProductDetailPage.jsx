import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'
import { Ruler, Sparkles, Layers, Bell, Star, Heart, Check, ShieldCheck } from 'lucide-react'
import ProductTrustBadge from '../components/ProductTrustBadge'
import SizeRecommendationModal from '../components/SizeRecommendationModal'
import ProductComparisonModal from '../components/ProductComparisonModal'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const { addToCart, cart, toggleWishlist, isInWishlist, toggleCompare, isComparing, comparisonList, setPriceAlert, priceAlerts } = useApp()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [coupons, setCoupons] = useState([])
  const [copiedCode, setCopiedCode] = useState(null)
  const [sizeModalOpen, setSizeModalOpen] = useState(false)
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false)
  const [showPriceWatchInput, setShowPriceWatchInput] = useState(false)
  const [targetPriceVal, setTargetPriceVal] = useState('')
  const [priceWatchSaved, setPriceWatchSaved] = useState(false)

  const cartItem = cart.find((item) => item.product_id === productId)
  const isInCart = Boolean(cartItem)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getProduct(productId),
      api.getCategories(),
      api.getCouponsForProduct(productId),
      api.getProductVariants(productId),
    ])
      .then(([productData, categories, couponData, variantData]) => {
        setProduct(productData || null)
        const cats = Array.isArray(categories) ? categories : []
        setCategory(cats.find((c) => c.id === productData?.category_id) || null)
        setCoupons(Array.isArray(couponData) ? couponData : [])
        const vars = Array.isArray(variantData) ? variantData : []
        setVariants(vars)
        if (vars.length > 0) {
          setSelectedVariant(vars.find((v) => v.stock > 0) || vars[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setProduct(null)
        setLoading(false)
      })
  }, [productId])

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  const handleSavePriceWatch = (e) => {
    e.preventDefault()
    if (!targetPriceVal || Number(targetPriceVal) <= 0) return
    setPriceAlert(productId, Number(targetPriceVal))
    setPriceWatchSaved(true)
    setShowPriceWatchInput(false)
    setTimeout(() => setPriceWatchSaved(false), 3000)
  }

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
    addToCart(product, 1, selectedVariant)
    setMessage('✓ Added to cart successfully!')
    window.setTimeout(() => setMessage(''), 2500)
  }

  const existingPriceAlert = priceAlerts[productId]

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/shop" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          ← Back to shop
        </Link>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCompare(product)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
              isComparing(productId)
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {isComparing(productId) ? 'Comparing' : 'Compare'}
          </button>
          {comparisonList.length >= 2 && (
            <button
              onClick={() => setComparisonModalOpen(true)}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
            >
              View Compare ({comparisonList.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Product Image & Badges */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute right-4 top-4 rounded-full p-2.5 backdrop-blur-md transition ${
                isInWishlist(product.id)
                  ? 'bg-rose-50 text-rose-600 shadow-md'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-rose-600' : ''}`} />
            </button>
          </div>

          {/* Trust Seal Banner */}
          <ProductTrustBadge
            returnWindowDays={product.return_window_days || 30}
            isReturnable={product.is_returnable ?? true}
          />
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {category?.name || 'Uncategorized'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.rating || 4.7} ({product.review_count || 120} reviews)
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">{INR.format(product.price)}</span>
              {product.original_price && Number(product.original_price) > Number(product.price) && (
                <span className="text-base text-slate-400 line-through">
                  {INR.format(product.original_price)}
                </span>
              )}
            </div>
          </div>

          {/* ── Size Variant Selector & "Find My Size" ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Size {selectedVariant ? `(${selectedVariant.size})` : ''}
              </span>
              <button
                type="button"
                onClick={() => setSizeModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Ruler className="h-3.5 w-3.5" />
                Find My Size (AI Calculator)
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {variants.length > 0 ? (
                variants.map((v) => (
                  <button
                    key={v.id || v.size}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock <= 0}
                    className={`min-w-[48px] rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                      selectedVariant?.id === v.id
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : v.stock <= 0
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {v.size}
                  </button>
                ))
              ) : (
                ['S', 'M', 'L', 'XL'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedVariant({ size: sz })}
                    className={`min-w-[48px] rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                      selectedVariant?.size === sz
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Price Watch Alert ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Bell className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">
                  {existingPriceAlert
                    ? `Price alert active (Alert when under ₹${existingPriceAlert})`
                    : 'Get notified on price drops'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceWatchInput(!showPriceWatchInput)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                {existingPriceAlert ? 'Edit Alert' : 'Set Target Price'}
              </button>
            </div>

            {showPriceWatchInput && (
              <form onSubmit={handleSavePriceWatch} className="mt-3 flex gap-2">
                <input
                  type="number"
                  value={targetPriceVal}
                  onChange={(e) => setTargetPriceVal(e.target.value)}
                  placeholder={`e.g. ${Math.round(Number(product.price) * 0.85)}`}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Save Alert
                </button>
              </form>
            )}

            {priceWatchSaved && (
              <p className="mt-2 text-[11px] font-bold text-emerald-700">✓ Target price saved! We'll notify you on price drops.</p>
            )}
          </div>

          {/* Coupons */}
          {coupons.length > 0 && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                🏷️ Available Coupons
              </p>
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between rounded-lg border border-purple-200 bg-white px-3 py-2"
                  >
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      {coupon.code}
                    </span>
                    <span className="text-xs text-slate-700 font-semibold">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                    </span>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100"
                    >
                      {copiedCode === coupon.code ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="leading-relaxed text-xs text-slate-600">{product.description}</p>

          {message && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
              {message}
            </div>
          )}

          {/* Add to Cart Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAdd}
              className="flex-1 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition cursor-pointer"
            >
              Add to Cart {selectedVariant ? `(Size ${selectedVariant.size})` : ''}
            </button>
            <Link
              to="/cart"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cart ({cart.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Size Recommendation Modal */}
      {sizeModalOpen && (
        <SizeRecommendationModal
          product={product}
          isOpen={sizeModalOpen}
          onClose={() => setSizeModalOpen(false)}
          onApplySize={(recSize) => {
            const found = variants.find((v) => v.size.toUpperCase() === recSize.toUpperCase())
            if (found) setSelectedVariant(found)
            else setSelectedVariant({ size: recSize })
          }}
        />
      )}

      {/* Product Comparison Modal */}
      {comparisonModalOpen && (
        <ProductComparisonModal
          isOpen={comparisonModalOpen}
          onClose={() => setComparisonModalOpen(false)}
        />
      )}
    </main>
  )
}

