import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { formatDate } from '../lib/format'
import RiskBadge from '../components/RiskBadge'

export default function ProfilePage() {
  const { shopper, setShopper } = useApp()
  const [form, setForm] = useState({
    name: shopper?.name || '',
    phone: shopper?.phone || '',
  })
  const [newAddress, setNewAddress] = useState({ label: 'Home', line: '' })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(shopper?.profilePhoto || null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (shopper) {
      setForm({
        name: shopper.name || '',
        phone: shopper.phone || '',
      })
      setProfilePhoto(shopper.profilePhoto || null)
    }
  }, [shopper])

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const updated = await api.updateProfile({ 
      name: form.name, 
      phone: form.phone,
      profilePhoto: profilePhoto 
    })
    setShopper(updated)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const addAddress = async () => {
    if (!newAddress.line.trim()) return
    const updated = await api.addAddress(newAddress)
    setShopper(updated)
    setNewAddress({ label: 'Home', line: '' })
  }

  const removeAddress = async (addressId) => {
    const updated = await api.removeAddress(addressId)
    setShopper(updated)
  }

  const addresses = shopper?.addresses || []

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
      <p className="text-sm text-slate-500">Update personal details and manage saved addresses.</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* Profile Photo Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: profilePhoto ? `url(${profilePhoto}) center/cover` : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 48,
              fontWeight: 700,
              border: '4px solid #e2e8f0',
            }}>
              {!profilePhoto && shopper?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Upload Photo
              </button>
              {profilePhoto && (
                <button
                  type="button"
                  onClick={() => setProfilePhoto(null)}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-slate-500">JPG, PNG or GIF (max. 5MB)</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Member QR Code</h2>
          <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-xl p-6">
            <p className="text-sm text-slate-600">Your unique member ID</p>
            {shopper?.email && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG 
                  value={JSON.stringify({
                    email: shopper.email,
                    name: shopper.name,
                    customerId: shopper.customer_id,
                    memberSince: shopper.joined_at
                  })}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">{shopper?.name}</p>
              <p className="text-xs text-slate-500 mt-1">{shopper?.customer_id}</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">Scan this QR code at store for quick checkout</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Saved addresses</h2>
          <div className="mt-3 space-y-3">
            {addresses.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">No saved addresses yet.</p>
            )}
            {addresses.map((address) => (
              <div key={address.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{address.label}</span>
                  <p className="mt-1 text-sm text-slate-700">{address.line}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAddress(address.id)}
                  className="w-fit text-xs font-semibold text-rose-600 hover:text-rose-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={newAddress.label}
              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              className="w-full sm:w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option>Home</option>
              <option>Office</option>
              <option>Other</option>
            </select>
            <input
              value={newAddress.line}
              onChange={(e) => setNewAddress({ ...newAddress, line: e.target.value })}
              placeholder="Address line (House, Street, City, Pincode)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={newAddress.altPhone || ''}
              onChange={(e) => setNewAddress({ ...newAddress, altPhone: e.target.value })}
              placeholder="Alt phone (Optional)"
              className="w-full sm:w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={async () => {
                if (!newAddress.line.trim()) return
                const fullLine = newAddress.altPhone?.trim() 
                  ? `${newAddress.line.trim()} (Alt: ${newAddress.altPhone.trim()})`
                  : newAddress.line.trim()
                const updated = await api.addAddress({ label: newAddress.label, line: fullLine })
                setShopper(updated)
                setNewAddress({ label: 'Home', line: '', altPhone: '' })
              }}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Account snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{shopper?.total_orders ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">Orders</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{shopper?.total_returns ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">Returns</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{shopper?.total_cod_refusals ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">COD refusals</p>
            </div>
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{shopper?.reward_points ?? 1000}</p>
              <p className="text-xs font-semibold text-amber-700">Reward points</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <span className="text-sm text-slate-600">Current risk tier</span>
            <RiskBadge tier={shopper?.risk_tier} />
          </div>
          <p className="mt-2 text-xs text-slate-400">Member since {formatDate(shopper?.joined_at)}</p>
        </div>

        <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}
