import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import { Store, MapPin, Phone, ShieldCheck, Tag, Mail, CheckCircle2 } from 'lucide-react'

export default function MerchantSettings() {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({
    business_name: '',
    admin_email: '',
    plan_tier: 'Pilot',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    gstin: '',
    return_window_days: 7,
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMerchantOnboarding().then((merchant) => {
      if (merchant) {
        setSettings(merchant)
        setForm({
          business_name: merchant.business_name || '',
          admin_email: merchant.admin_email || '',
          plan_tier: merchant.plan_tier || 'Pilot',
          address: merchant.address || '',
          city: merchant.city || '',
          state: merchant.state || '',
          pincode: merchant.pincode || '',
          phone: merchant.phone || '',
          gstin: merchant.gstin || '',
          return_window_days: merchant.return_window_days || 7,
        })
      }
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const updated = await api.updateMerchantSettings(form)
      setSettings(updated)
      setSaving(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Failed to save merchant settings.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Store Settings & Profile</h1>
        <p className="text-sm text-slate-500">
          Manage your business credentials, registered location, contact address, and return policy.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>✓ Store details & address updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Store Identity & Credentials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Store className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Store Identity & Plan</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Business Name</label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Store Slug</label>
              <input
                type="text"
                disabled
                value={settings?.store_slug || 'store-slug'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Merchant Username (Sign-in Key)</label>
              <input
                type="text"
                disabled
                value={settings?.merchant_username || 'MERCHANT-ID'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-indigo-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Admin Email</label>
              <input
                type="email"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Plan Tier</label>
              <select
                value={form.plan_tier}
                onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="Pilot">Pilot (Free / Testing)</option>
                <option value="Growth">Growth (Scale Orders)</option>
                <option value="Scale">Enterprise Scale</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Return Window Policy (Days)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.return_window_days}
                onChange={(e) => setForm({ ...form, return_window_days: Number(e.target.value) || 7 })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Business Location & Address */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Business Location & Registered Address</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Street Address / Building / Locality
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 42 MG Road, Indiranagar, 2nd Floor"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">State / Region</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Karnataka"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="e.g. 560038"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">GSTIN / Business Tax ID</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {saving ? 'Saving Changes…' : saved ? '✓ Saved!' : 'Save Store Details'}
            </button>
          </div>
        </div>
      </form>

      {/* Fraud Rules Shortcut */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fraud Rule Weights & Thresholds</h2>
            <p className="mt-1 text-xs text-slate-500">Manage risk weights, policy thresholds, and self-tuning suggestions.</p>
          </div>
          <Link
            to="/merchant/fraud-config"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Open Risk Rules →
          </Link>
        </div>
      </div>
    </div>
  )
}
