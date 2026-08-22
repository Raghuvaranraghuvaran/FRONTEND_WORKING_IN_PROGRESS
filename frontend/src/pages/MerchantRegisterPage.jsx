import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'

export default function MerchantRegisterPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    storeSlug: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // Register merchant admin user
      const adminPayload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'merchant_admin',
      }
      
      // In mock mode, we'll simulate merchant registration
      const merchantData = await api.registerMerchantAccount({
        admin: adminPayload,
        businessName: form.businessName,
        storeSlug: form.storeSlug,
      })
      
      setMerchant(merchantData.admin)
      
      // Clear form
      setForm({
        name: '',
        email: '',
        password: '',
        businessName: '',
        storeSlug: '',
      })
      
      navigate('/merchant')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">
            R
          </span>
          <div>
            <div className="text-lg font-bold text-white">ReturnGuard</div>
            <div className="text-xs text-slate-400">Smart Returns. Happy Business.</div>
          </div>
        </Link>
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white">Create Merchant Account</h1>
          <p className="mt-1 text-sm text-slate-400">Register your business with ReturnGuard.</p>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Your Name</label>
              <input
                required
                value={form.name}
                onChange={update('name')}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Your Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="admin@yourbusiness.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={update('password')}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Business Information
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Business Name</label>
                  <input
                    required
                    value={form.businessName}
                    onChange={update('businessName')}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Your Store Name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Store Slug</label>
                  <input
                    required
                    value={form.storeSlug}
                    onChange={update('storeSlug')}
                    pattern="[a-z0-9-]+"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="your-store-slug"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </div>
            </div>

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Create merchant account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/merchant/login"
              className="font-semibold text-teal-400 hover:text-teal-300"
            >
              Sign in
            </Link>
          </p>
        </div>
        
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-300">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </main>
  )
}
