import { useEffect, useState } from 'react'
import { X, Sparkles, Star, ShieldCheck, Check, ShoppingCart, ArrowRight } from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { INR } from '../lib/format'

export default function ProductComparisonModal({ isOpen, onClose }) {
  const { comparisonList, setComparisonList, addToCart } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [addedId, setAddedId] = useState(null)

  useEffect(() => {
    if (isOpen && comparisonList.length >= 2) {
      setLoading(true)
      const ids = comparisonList.map((p) => p.id || p.product_id)
      api
        .compareProducts(ids)
        .then((res) => setData(res))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, comparisonList])

  if (!isOpen) return null

  const handleSelect = (prod) => {
    addToCart(prod, 1)
    setAddedId(prod.id || prod.product_id)
    setTimeout(() => setAddedId(null), 2000)
  }

  const handleRemove = (productId) => {
    const updated = comparisonList.filter((p) => (p.id || p.product_id) !== productId)
    setComparisonList(updated)
    if (updated.length < 2) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Product Comparison & AI Score</h2>
            <p className="text-xs text-slate-500">
              Side-by-side spec comparison, verified customer return rates, and smart fit scores.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Generating comparative analysis…</p>
          </div>
        ) : !data || comparisonList.length < 2 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-600">Please select at least 2 products to compare.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* AI Summary Banner */}
            {data.ai_summary && (
              <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 p-4 text-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                  ★
                </span>
                <div>
                  <p className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">
                    ReturnGuard AI Verdict
                  </p>
                  <p className="mt-0.5 text-slate-700 leading-relaxed font-medium">{data.ai_summary}</p>
                </div>
              </div>
            )}

            {/* Comparison Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-3 font-semibold text-slate-400 uppercase tracking-wider w-36">
                      Feature
                    </th>
                    {data.comparison_matrix.map((p) => (
                      <th key={p.product_id} className="py-3 px-3 font-bold text-slate-900 text-center min-w-[180px]">
                        <div className="relative group">
                          {p.product_id === data.recommended_product_id && (
                            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              <Sparkles className="h-3 w-3" /> Top Pick
                            </span>
                          )}
                          <img
                            src={p.image}
                            alt={p.name}
                            className="mx-auto h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                          />
                          <button
                            onClick={() => handleRemove(p.product_id)}
                            className="mt-1 text-[11px] text-rose-500 hover:underline"
                          >
                            Remove
                          </button>
                          <p className="mt-1 font-bold text-slate-900 line-clamp-1">{p.name}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Price */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-500">Price</td>
                    {data.comparison_matrix.map((p) => (
                      <td key={p.product_id} className="py-3 px-3 text-center">
                        <span className="text-sm font-bold text-slate-900">{INR.format(p.price)}</span>
                        {p.original_price && Number(p.original_price) > Number(p.price) && (
                          <span className="block text-[11px] text-slate-400 line-through">
                            {INR.format(p.original_price)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Customer Rating */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-500">Rating & Reviews</td>
                    {data.comparison_matrix.map((p) => (
                      <td key={p.product_id} className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {p.rating} ({p.review_count})
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Verified Return Rate */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-500">
                      <div>
                        Verified Return Rate
                        <span className="block text-[10px] text-slate-400">Lower is better</span>
                      </div>
                    </td>
                    {data.comparison_matrix.map((p) => (
                      <td key={p.product_id} className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            p.return_rate_percent < 8
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {p.return_rate_percent}% returns
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Fit Confidence */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-500">Fit Confidence</td>
                    {data.comparison_matrix.map((p) => (
                      <td key={p.product_id} className="py-3 px-3 text-center text-slate-700 font-medium">
                        {p.fit_score}
                      </td>
                    ))}
                  </tr>

                  {/* Return Window */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-slate-500">Return Window</td>
                    {data.comparison_matrix.map((p) => (
                      <td key={p.product_id} className="py-3 px-3 text-center font-semibold text-slate-700">
                        {p.return_window_days} Days (Doorstep Pickup)
                      </td>
                    ))}
                  </tr>

                  {/* Action Row */}
                  <tr>
                    <td className="py-4 px-3 font-medium text-slate-500">Action</td>
                    {data.comparison_matrix.map((p) => (
                      <td key={p.product_id} className="py-4 px-3 text-center">
                        <button
                          onClick={() => handleSelect(p)}
                          className={`w-full rounded-xl py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                            addedId === p.product_id
                              ? 'bg-emerald-600 text-white'
                              : p.product_id === data.recommended_product_id
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                              : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {addedId === p.product_id ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Added to Cart
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3.5 w-3.5" /> Select This
                            </>
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
