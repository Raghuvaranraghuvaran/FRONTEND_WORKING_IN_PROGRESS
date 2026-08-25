import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import { Store, MapPin, Phone, ShieldCheck, Tag, Mail, CheckCircle2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react'

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

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

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

    const cleanPin = form.pincode ? form.pincode.replace(/\D/g, '') : ''
    if (cleanPin && cleanPin.length !== 6) {
      setError('PIN Code must be a valid 6-digit number.')
      return
    }

    const cleanPhone = form.phone ? form.phone.replace(/\D/g, '') : ''
    if (cleanPhone && cleanPhone.length !== 10) {
      setError('Phone number must be a valid 10-digit mobile number.')
      return
    }

    setSaving(true)
    try {
      const updated = await api.updateMerchantSettings({
        ...form,
        pincode: cleanPin,
        phone: cleanPhone,
      })
      setSettings(updated)
      setSaving(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Failed to save merchant settings.')
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.')
      return
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('New password and confirm password do not match.')
      return
    }
    setPwdSaving(true)
    try {
      await api.updateMerchantPassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        merchantUsername: settings?.merchant_username || form.admin_email,
      })
      setPwdSuccess('Merchant password updated successfully!')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      window.setTimeout(() => setPwdSuccess(''), 4000)
    } catch (err) {
      setPwdError(err.message || 'Failed to update merchant password.')
    } finally {
      setPwdSaving(false)
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">PIN / Postal Code (6 Digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="e.g. 560038"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">Contact Phone (10 Digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
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

      {/* ── Merchant Change Password Section ────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Security & Account Password</h2>
            <p className="text-xs text-slate-500">Update your merchant portal sign-in password.</p>
          </div>
        </div>

        {pwdError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
            {pwdError}
          </div>
        )}

        {pwdSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                placeholder="Enter current password (optional for demo)"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showCurrentPwd ? 'Hide password' : 'Show password'}
              >
                {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPwd ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showNewPwd ? 'Hide password' : 'Show password'}
              >
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Re-type your new password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirmPwd ? 'Hide password' : 'Show password'}
              >
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwdSaving}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              {pwdSaving ? 'Updating Password…' : 'Update Merchant Password'}
            </button>
          </div>
        </form>
      </div>

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
