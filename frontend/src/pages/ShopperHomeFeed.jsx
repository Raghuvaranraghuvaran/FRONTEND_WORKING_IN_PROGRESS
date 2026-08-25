import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ShoppingBag,
  Truck,
  RefreshCw,
  Coins,
  ArrowRight,
  Star,
  Ruler,
  TrendingDown,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Eye,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import { INR } from '../lib/format'
import SizeRecommendationModal from '../components/SizeRecommendationModal'
import ProductComparisonModal from '../components/ProductComparisonModal'

function getTimeGreeting() {
  const hr = new Date().getHours()
  if (hr < 12) return 'Good morning'
  if (hr < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function ShopperHomeFeed() {
  const { shopper, addToCart, toggleWishlist, isInWishlist, toggleCompare, isComparing, comparisonList } = useApp()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProductForSize, setSelectedProductForSize] = useState(null)
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false)
  const [addedId, setAddedId] = useState(null)

  useEffect(() => {
    Promise.all([api.getProducts(), api.getShopperActivitySummary()])
      .then(([prodData, actData]) => {
        setProducts(Array.isArray(prodData) ? prodData : [])
        setActivity(actData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleQuickAdd = (p) => {
    addToCart(p, 1)
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1800)
  }

  const recommendedProducts = products.slice(0, 4)
  const buyAgainProducts = products.slice(3, 7)
  const dealProducts = products.filter((p) => p.original_price && Number(p.original_price) > Number(p.price)).slice(0, 4)

  const greeting = getTimeGreeting()
  const shopperName = shopper?.name?.split(' ')[0] || 'Shopper'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* ── Personalized Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {greeting}, {shopperName}! 👋
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              Verified Shopper
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Enjoy guaranteed hassle-free reverse logistics and zero-risk size fitting.
          </p>
        </div>

        {/* Action button pills */}
        <div className="flex flex-wrap items-center gap-2">
          {comparisonList.length >= 2 && (
            <button
              onClick={() => setComparisonModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition shadow-sm"
            >
              <Layers className="h-4 w-4" /> Compare ({comparisonList.length}) Products
            </button>
          )}
          <Link
            to="/shop"
            className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition"
          >
            <ShoppingBag className="h-4 w-4" /> Browse Full Store
          </Link>
        </div>
      </div>

      {/* ── Active Activity Bar ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Orders in Transit */}
        <Link
          to="/orders"
          className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
            <Truck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500">Active Deliveries</p>
            <p className="text-lg font-extrabold text-slate-900">
              {activity?.in_transit_orders_count ?? 2} Orders On The Way
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              Live tracking <ArrowRight className="h-3 w-3" />
            </p>
          </div>
        </Link>

        {/* Returns / Exchanges in Progress */}
        <Link
          to="/returns"
          className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500">Reverse Logistics</p>
            <p className="text-lg font-extrabold text-slate-900">
              {activity?.active_returns_count ?? 1} Return in Progress
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              Driver 2.3 km away · Details <ArrowRight className="h-3 w-3" />
            </p>
          </div>
        </Link>

        {/* Reward Points */}
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm">
            <Coins className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500">Reward Wallet</p>
            <p className="text-lg font-extrabold text-purple-900">
              {activity?.reward_points ?? 1250} Points
            </p>
            <p className="text-[11px] text-purple-700 font-semibold">
              Save ₹{Math.round((activity?.reward_points ?? 1250) * 0.1)} on your next order
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 1: Recommended For You ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Recommended for You</h2>
          </div>
          <Link to="/shop" className="text-xs font-bold text-indigo-600 hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedProducts.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-xl hover:border-indigo-200 transition duration-200"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 mb-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={() => toggleWishlist(p)}
                  className={`absolute right-3 top-3 rounded-full p-2 backdrop-blur-md transition ${
                    isInWishlist(p.id)
                      ? 'bg-rose-50 text-rose-600 shadow-sm'
                      : 'bg-white/80 text-slate-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(p.id) ? 'fill-rose-600' : ''}`} />
                </button>

                <button
                  onClick={() => setSelectedProductForSize(p)}
                  className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-xl bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-900 transition"
                >
                  <Ruler className="h-3 w-3" /> Find My Size
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating || 4.7}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Low Return Risk
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                    <Link to={`/products/${p.id}`}>{p.name}</Link>
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-base font-extrabold text-slate-900">{INR.format(p.price)}</span>
                    {p.original_price && (
                      <span className="ml-1.5 text-xs text-slate-400 line-through">
                        {INR.format(p.original_price)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleQuickAdd(p)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                      addedId === p.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {addedId === p.id ? '✓ Added' : '+ Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Buy Again (1-Click Reorder) ── */}
      <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Buy Again</h2>
            <p className="text-xs text-slate-500">Quick 1-click reorder from your past verified orders</p>
          </div>
          <Link to="/orders" className="text-xs font-bold text-indigo-600 hover:underline">
            Past Orders →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buyAgainProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
            >
              <img src={p.image} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                <p className="text-xs font-extrabold text-indigo-600 mt-0.5">{INR.format(p.price)}</p>
                <button
                  onClick={() => handleQuickAdd(p)}
                  className="mt-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  ⚡ Reorder Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Deals & Price Drops ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900">Deals & Price Drops for You</h2>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            Limited Time Offers
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dealProducts.map((p) => {
            const savings = Number(p.original_price) - Number(p.price)
            return (
              <div
                key={p.id}
                className="group flex flex-col rounded-3xl border border-rose-100 bg-white p-4 shadow-sm hover:shadow-lg hover:border-rose-300 transition"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 mb-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                    Save {INR.format(savings)}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      <Link to={`/products/${p.id}`}>{p.name}</Link>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.return_window_days}-Day Return Guarantee</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">{INR.format(p.price)}</span>
                      <span className="ml-1.5 text-xs text-slate-400 line-through">
                        {INR.format(p.original_price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickAdd(p)}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                    >
                      Grab Deal
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Size Recommendation Modal */}
      {selectedProductForSize && (
        <SizeRecommendationModal
          product={selectedProductForSize}
          isOpen={Boolean(selectedProductForSize)}
          onClose={() => setSelectedProductForSize(null)}
          onApplySize={(sz) => {
            addToCart(selectedProductForSize, 1, { size: sz })
          }}
        />
      )}

      {/* Comparison Modal */}
      {comparisonModalOpen && (
        <ProductComparisonModal
          isOpen={comparisonModalOpen}
          onClose={() => setComparisonModalOpen(false)}
        />
      )}
    </div>
  )
}
