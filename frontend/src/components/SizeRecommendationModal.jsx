import { useState } from 'react'
import { X, Sparkles, CheckCircle2, ShieldCheck, Ruler, ArrowRight, RefreshCw } from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'

const BRANDS = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', "Levi's", 'Uniqlo', 'Other']
const POPULAR_SIZES = ['S', 'M', 'L', 'XL', '7', '8', '9', '10', '30', '32', '34']

export default function SizeRecommendationModal({ product, isOpen, onClose, onApplySize }) {
  const { preferences, setPreferences } = useApp()
  const [referenceBrand, setReferenceBrand] = useState(preferences?.preferred_brands?.[0] || 'Nike')
  const [referenceSize, setReferenceSize] = useState(preferences?.default_size || 'M')
  const [fitPreference, setFitPreference] = useState(preferences?.fit_preference || 'Regular')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  if (!isOpen || !product) return null

  const handleCalculate = async () => {
    if (!referenceSize.trim()) {
      setError('Please select or enter your usual size.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.getSizeRecommendation({
        productId: product.id,
        referenceBrand,
        referenceSize,
        fitPreference,
      })
      setResult(res)
      // Persist preferences
      setPreferences((prev) => ({
        ...prev,
        default_size: referenceSize,
        fit_preference: fitPreference,
      }))
    } catch (err) {
      setError(err.message || 'Failed to calculate size recommendation.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (size, variantId) => {
    if (onApplySize) {
      onApplySize(size, variantId)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
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
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Find My Size</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <Sparkles className="h-3 w-3" /> AI Size Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500">Zero return risk size calculator for {product.name}</p>
          </div>
        </div>

        {!result ? (
          <div className="mt-6 space-y-5">
            {/* Step 1: Reference Brand */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. What brand fits you best?
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {BRANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setReferenceBrand(b)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      referenceBrand === b
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Reference Size */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Your usual size in {referenceBrand}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {POPULAR_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setReferenceSize(sz)}
                    className={`min-w-[42px] rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      referenceSize === sz
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Fit Preference */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. How do you like it to fit?
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {['Tight', 'Regular', 'Relaxed'].map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => setFitPreference(fit)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                      fitPreference === fit
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {fit === 'Tight' ? 'Snug Fit' : fit === 'Regular' ? 'Standard Fit' : 'Relaxed / Loose'}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Calculating Perfect Size…
                </>
              ) : (
                <>
                  Calculate My Size <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Result Box */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 p-6 text-center shadow-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> {result.confidence_score}% Fit Confidence
              </span>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">Recommended size for you</p>
                <p className="mt-1 text-4xl font-extrabold text-indigo-600 tracking-tight">
                  Size {result.recommended_size}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-600 max-w-sm mx-auto">
                  {result.fit_guidance}
                </p>
              </div>

              {result.in_stock ? (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  ✓ In stock & ready to ship with instant exchange guarantee
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  ⚠️ Low stock in this size — order now
                </div>
              )}
            </div>

            {/* Trust note */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>If Size {result.recommended_size} doesn't fit perfectly, enjoy 1-click doorstep exchange for free.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Recalculate
              </button>
              <button
                type="button"
                onClick={() => handleApply(result.recommended_size, result.variant_id)}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
              >
                Apply Size {result.recommended_size}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
