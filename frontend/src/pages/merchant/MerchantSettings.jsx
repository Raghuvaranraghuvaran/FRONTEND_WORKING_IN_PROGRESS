import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'

export default function MerchantSettings() {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({ business_name: '', plan_tier: '' })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getMerchantOnboarding().then((merchant) => {
      const current = {
        business_name: merchant?.business_name || '',
        plan_tier: merchant?.plan_tier || 'Pilot',
      }
      setSettings(merchant)
      setForm(current)
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const updated = await api.updateMerchantSettings(form)
    setSettings(updated)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-500">Store configuration and merchant identity.</p>

      <div className="mt-6">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Store profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Business name</label>
              <input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Plan tier</label>
              <select
                value={form.plan_tier}
                onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option>Pilot</option>
                <option>Growth</option>
                <option>Scale</option>
              </select>
            </div>
            <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </form>

      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Fraud rule weights & thresholds</h2>
            <p className="mt-1 text-sm text-slate-500">Manage risk weights, thresholds, and manual review settings.</p>
          </div>
          <Link to="/merchant/fraud-config" className="w-fit rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
            Open config
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Return frequency weight', value: '0.32' },
            { label: 'COD refusal weight', value: '0.18' },
            { label: 'Device reuse weight', value: '0.22' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">Merchant created {settings ? formatDate('2025-08-01') : '—'}</p>
    </div>
  )
}
