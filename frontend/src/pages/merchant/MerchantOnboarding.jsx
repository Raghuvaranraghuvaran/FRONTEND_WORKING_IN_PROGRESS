import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'

export default function MerchantOnboarding() {
  const navigate = useNavigate()
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ businessName: '', storeSlug: '', adminEmail: '' })
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.getMerchantOnboarding().then((merchant) => {
      setExisting(merchant)
      setForm({
        businessName: merchant.business_name,
        storeSlug: merchant.store_slug,
        adminEmail: merchant.admin_email,
      })
      setLoading(false)
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const merchant = await api.registerMerchant(form)
      setSaved(merchant)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Merchant onboarding</h1>
          <p className="text-sm text-slate-500">Create or update your store tenant and scoped API token.</p>
        </div>
        <Link to="/merchant/settings" className="text-sm font-semibold text-indigo-600">
          View settings
        </Link>
      </div>

      {saved ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Store configured</h2>
          <p className="mt-1 text-sm text-slate-500">{saved.business_name}</p>
          <div className="mt-6 rounded-lg bg-slate-950 p-4 text-left">
            <code className="break-all text-sm text-emerald-400">{saved.api_token}</code>
          </div>
          <p className="mt-3 text-xs text-slate-400">Created {formatDate(saved.created_at)}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate('/merchant')}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Store tenant</h2>
          <p className="mt-1 text-sm text-slate-500">
            This matches the plan's merchant onboarding: admin account, store profile, and API token generation.
          </p>

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Business name</label>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Store slug</label>
              <input
                value={form.storeSlug}
                onChange={(e) => setForm({ ...form, storeSlug: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Admin email</label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Current tenant: {existing?.business_name || 'None'} · slug {existing?.store_slug || '—'}
          </div>

          <button className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            {submitting ? 'Saving…' : 'Save store configuration'}
          </button>
        </form>
      )}
    </div>
  )
}
