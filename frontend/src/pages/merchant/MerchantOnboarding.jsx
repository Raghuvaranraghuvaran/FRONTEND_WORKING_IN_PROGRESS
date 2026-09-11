import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../mock/api'
import { useApp } from '../../context/AppContext'
import { formatDate } from '../../lib/format'
import { 
  Store, 
  ShieldCheck, 
  TrendingUp, 
  HelpCircle, 
  Link as LinkIcon, 
  Mail, 
  Info, 
  Pencil, 
  Save, 
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export default function MerchantOnboarding() {
  const navigate = useNavigate()
  const { merchant: merchantUser } = useApp()
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ businessName: '', storeSlug: '', adminEmail: '' })
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    api
      .getMerchantOnboarding()
      .then((m) => {
        if (m) {
          setExisting(m)
        }
        setLoading(false)
      })
      .catch(() => {
        setExisting(null)
        setLoading(false)
      })
  }, [merchantUser])

  const handlePrefillChange = () => {
    if (existing) {
      setForm({
        businessName: existing.business_name || '',
        storeSlug: existing.store_slug || '',
        adminEmail: existing.admin_email || '',
      })
      setIsEditing(true)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const merchant = await api.registerMerchant(form)
      setSaved(merchant)
      setExisting(merchant)
    } catch (err) {
      setError(err.message || 'Failed to save store configuration')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {saved ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Store Configured Successfully</h2>
          <p className="mt-1 text-sm text-slate-500">{saved.business_name}</p>
          <div className="mx-auto mt-6 max-w-sm rounded-xl bg-slate-50 p-4 text-left border border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Merchant ID</p>
            <code className="mt-1 block break-all text-sm font-mono font-bold text-indigo-600">{saved.id}</code>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Store URL Slug</p>
            <p className="text-sm font-mono text-slate-800">/{saved.store_slug}</p>
          </div>
          <p className="mt-4 text-xs text-slate-400">Created / Updated: {formatDate(saved.created_at || new Date())}</p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => navigate('/merchant')}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
            >
              Go to Merchant Dashboard
            </button>
            <button
              onClick={() => setSaved(null)}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Update Tenant Again
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN: Hero & Value Proposition */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Merchant <span className="text-indigo-600">onboarding</span>
              </h1>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Create or update your store tenant and merchant ID to start selling with confidence.
              </p>
            </div>

            {/* 3 Steps / Features */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Set up your store</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Create a unique store profile.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Get a merchant ID</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Auto-generated for your business.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Start selling</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Access tools, analytics and fraud protection.</p>
                </div>
              </div>
            </div>

            {/* Visual Storefront Graphic Card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-purple-50/40 p-6 text-center">
              <div className="mx-auto flex h-32 max-w-xs items-center justify-center">
                <svg viewBox="0 0 240 140" className="h-full w-auto">
                  {/* Store Building Base */}
                  <rect x="30" y="50" width="180" height="85" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  
                  {/* Store Roof Awning Stripes */}
                  <path d="M20 50 L35 15 L205 15 L220 50 Z" fill="#4f46e5" />
                  <path d="M35 15 L60 15 L50 50 L25 50 Z" fill="#6366f1" />
                  <path d="M85 15 L110 15 L100 50 L75 50 Z" fill="#6366f1" />
                  <path d="M135 15 L160 15 L150 50 L125 50 Z" fill="#6366f1" />
                  <path d="M185 15 L205 15 L200 50 L175 50 Z" fill="#6366f1" />

                  {/* Store Sign */}
                  <rect x="70" y="24" width="100" height="20" rx="4" fill="#1e1b4b" />
                  <text x="120" y="38" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="1">YOUR STORE</text>

                  {/* Window & Door */}
                  <rect x="45" y="65" width="60" height="55" rx="4" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5" />
                  <rect x="120" y="70" width="45" height="65" rx="3" fill="#312e81" />
                  <circle cx="155" cy="102" r="2.5" fill="#f8fafc" />

                  {/* Potted Plant */}
                  <path d="M180 110 L195 110 L192 125 L183 125 Z" fill="#d97706" />
                  <circle cx="187" cy="98" r="10" fill="#10b981" />
                  <circle cx="192" cy="103" r="8" fill="#059669" />

                  {/* Shopping Bag with Checkmark */}
                  <path d="M175 90 L205 90 L200 128 L170 128 Z" fill="#4338ca" />
                  <path d="M182 90 C182 80, 198 80, 198 90" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                  <path d="M182 108 L187 113 L195 103" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-3 text-xs italic text-slate-500 font-medium">
                “Empowering merchants, building safer commerce.”
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Store Tenant Form Card */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs">
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Store tenant</h2>
                    <p className="text-xs text-slate-500">This creates the store profile and assigns a unique merchant ID.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Need help? You can configure your store details here or update your credentials anytime in Store Settings.")}
                  className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  Need help?
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
                  {error}
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={submit} className="mt-6 space-y-5">
                {/* Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Business name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      placeholder="e.g. Acme Fashion"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Enter your official business name as it appears on documents.
                  </p>
                </div>

                {/* Store Slug */}
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Store slug <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.storeSlug}
                      onChange={(e) => setForm({ ...form, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="e.g. acme-fashion"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    This will be used in your store URL. Only lowercase letters, numbers and hyphens.
                  </p>
                </div>

                {/* Admin Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Admin email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      placeholder="e.g. admin@acmefashion.com"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    We'll use this email for important notifications.
                  </p>
                </div>

                {/* Current Tenant Banner */}
                <div className="flex items-center justify-between rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-950">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>
                      Current tenant: <strong className="text-indigo-900">{existing?.business_name || "Aria Admin's Store"}</strong> · slug <strong className="font-mono text-indigo-800">{existing?.store_slug || "demo"}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrefillChange}
                    className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    Change
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{submitting ? 'Saving store configuration…' : 'Save store configuration'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
