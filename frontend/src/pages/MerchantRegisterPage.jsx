import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Copy, Eye, EyeOff, Store, ShieldCheck, ArrowRight, Mail, Lock, User, Tag } from 'lucide-react'
import { api } from '../mock/api'
import BrandLogo from '../components/BrandLogo'

export default function MerchantRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    storeSlug: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Success Modal state
  const [successData, setSuccessData] = useState(null)
  const [showModalPassword, setShowModalPassword] = useState(false)
  const [copiedUsername, setCopiedUsername] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const update = (field) => (e) => {
    const val = e.target.value
    if (field === 'storeSlug') {
      setForm({ ...form, storeSlug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })
    } else {
      setForm({ ...form, [field]: val })
    }
  }

  const handleCopy = (text, type) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (type === 'username') {
      setCopiedUsername(true)
      setTimeout(() => setCopiedUsername(false), 2000)
    } else if (type === 'password') {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validations
    if (!form.name.trim()) {
      setError('Your Name is required.')
      return
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!form.businessName.trim()) {
      setError('Business Name is required.')
      return
    }
    if (!form.storeSlug.trim() || !/^[a-z0-9-]+$/.test(form.storeSlug.trim())) {
      setError('Store Slug can only contain lowercase letters, numbers, and hyphens.')
      return
    }

    try {
      setSubmitting(true)
      const res = await api.registerMerchantAccount({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        businessName: form.businessName.trim(),
        storeSlug: form.storeSlug.trim().toLowerCase(),
      })

      // Store created credentials for the modal
      setSuccessData({
        email: form.email.trim().toLowerCase(),
        merchant_username: res.merchant_username,
        password: form.password,
        business_name: form.businessName.trim(),
      })
    } catch (err) {
      setError(err.message || 'Failed to create merchant account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-4 py-12 text-slate-100 relative">
      <div className="w-full max-w-lg">
        {/* Brand Logo Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <BrandLogo className="h-10 w-auto" />
          </Link>
          <p className="mt-2 text-xs font-medium text-slate-400 tracking-wide">
            Enterprise E-Commerce Return & Fraud Protection
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0d1424] p-8 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-800/80 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Merchant Account</h1>
            <p className="mt-1 text-xs text-slate-400">
              Register your business to begin managing returns and risk scoring.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {/* Personal Information */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Personal Information
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Sai Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="merchant@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={update('password')}
                    className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="border-t border-slate-800/80 pt-5 space-y-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Business Information
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Business Name *</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={update('businessName')}
                    className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Sai Fashion Store"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Store Slug *</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={form.storeSlug}
                    onChange={update('storeSlug')}
                    className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="sai-fashion-store"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Unique identifier used in URLs (lowercase letters, numbers, hyphens).
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 uppercase tracking-wider hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Creating account…' : 'Create merchant account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have a merchant account?{' '}
            <Link to="/merchant/login" className="font-semibold text-teal-400 hover:text-teal-300">
              Sign in with username
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300 transition-colors">
            ← Back to Storefront
          </Link>
        </p>
      </div>

      {/* Success Popup Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0d1424] p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Merchant Account Created Successfully</h3>
                <p className="text-xs text-slate-400">Your account has been created successfully.</p>
              </div>
            </div>

            {/* Credentials box */}
            <div className="my-5 space-y-3.5 rounded-xl border border-slate-800 bg-[#070b14] p-4">
              {/* Registered Email */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Registered Email
                </span>
                <span className="text-xs font-semibold text-slate-200">{successData.email}</span>
              </div>

              {/* Merchant Username */}
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Merchant Username
                  </span>
                  <span className="font-mono text-sm font-bold text-teal-400 tracking-wider">
                    {successData.merchant_username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(successData.merchant_username, 'username')}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {copiedUsername ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Username
                    </>
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Password
                  </span>
                  <span className="font-mono text-xs text-slate-200">
                    {showModalPassword ? successData.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title={showModalPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(successData.password, 'password')}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-teal-300/90 flex items-start gap-2">
              <Mail className="h-4 w-4 shrink-0 mt-0.5 text-teal-400" />
              <span>Your merchant credentials have been sent to your registered email.</span>
            </div>

            {/* Continue to Login Action */}
            <div className="mt-5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/merchant/login')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 uppercase tracking-wider hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20"
              >
                Continue to Login <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
