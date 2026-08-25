import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  ShieldCheck,
  ArrowRight,
  Camera,
  Calendar,
  Shield,
  Star,
  ShoppingBag,
  Package,
  Ban,
  MapPin,
  Plus,
  Check,
  Save,
  CreditCard,
  Lock,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import { formatDate } from '../lib/format'

export default function ProfilePage() {
  const { shopper, setShopper } = useApp()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'addresses' | 'payments' | 'security'

  // Default values favoring logged-in user / gmail / demo
  const userEmail = shopper?.email || 'raghuvaranraghuvaran65@gmail.com'
  const defaultName = shopper?.name || userEmail.split('@')[0] || 'Raghuvaranraghuvaran65'
  const defaultPhone = shopper?.phone || '+91 97012 34567'
  const defaultGender = shopper?.gender || 'Male'

  const [form, setForm] = useState({
    name: defaultName,
    phone: defaultPhone,
    email: userEmail,
    gender: defaultGender,
  })

  const [profilePhoto, setProfilePhoto] = useState(shopper?.profile_photo || shopper?.profilePhoto || null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  // Address modal / management state
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressForm, setAddressForm] = useState({ label: 'Home', line: '', isPrimary: false })

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  const handleChangePassword = async (e) => {
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
      await api.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        email: shopper?.email || form.email,
      })
      setPwdSuccess('Password changed successfully!')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwdSuccess(''), 4000)
    } catch (err) {
      setPwdError(err.message || 'Failed to change password.')
    } finally {
      setPwdSaving(false)
    }
  }

  // Sync state when shopper changes
  useEffect(() => {
    if (shopper) {
      const email = shopper.email || 'raghuvaranraghuvaran65@gmail.com'
      setForm({
        name: shopper.name || email.split('@')[0] || 'Raghuvaranraghuvaran65',
        phone: shopper.phone || '+91 97012 34567',
        email: email,
        gender: shopper.gender || 'Male',
      })
      setProfilePhoto(shopper.profile_photo || shopper.profilePhoto || null)
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
    if (e && e.preventDefault) e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.updateProfile({
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        profile_photo: profilePhoto || '',
        profilePhoto: profilePhoto || '',
      })
      setShopper(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!addressForm.line.trim()) return
    try {
      const updated = await api.addAddress({
        label: addressForm.label,
        line: addressForm.line.trim(),
      })
      setShopper(updated)
      setShowAddressModal(false)
      setAddressForm({ label: 'Home', line: '', isPrimary: false })
      setEditingAddressId(null)
    } catch (err) {
      console.error('Failed to add address:', err)
    }
  }

  const removeAddress = async (addressId) => {
    try {
      const updated = await api.removeAddress(addressId)
      setShopper(updated)
    } catch (err) {
      console.error('Failed to remove address:', err)
    }
  }

  const addresses = shopper?.addresses || []
  const customerId = shopper?.customer_id || 'CUST-1003'
  const rewardPoints = shopper?.reward_points ?? 1000
  const totalOrders = shopper?.total_orders ?? 0
  const totalReturns = shopper?.total_returns ?? 0
  const totalCodRefusals = shopper?.total_cod_refusals ?? 0
  const memberSince = shopper?.joined_at ? formatDate(shopper.joined_at) : '24 Aug 2026'

  // Avatar initial or photo
  const initialLetter = (form.name || form.email || 'R').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* ── Top Header Bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account</h1>
            <p className="text-sm text-slate-500 mt-1">
              Update your personal details and manage your account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Verified Storefront Badge */}
            <div className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 px-3.5 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">ReturnGuard Verified Storefront</p>
                <p className="text-[10px] text-slate-500">Official tax invoices, authentic products, and automated returns.</p>
              </div>
            </div>

            {/* Explore Catalog Button */}
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-2xs hover:bg-blue-50 transition"
            >
              Explore Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Tab Navigation ─────────────────────────────────────────────── */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 -mb-px">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'addresses', label: 'Saved Addresses' },
              { id: 'payments', label: 'Payment Methods' },
              { id: 'security', label: 'Security' },
            ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-3 text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="profileTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* ── Animated Tab Content View ──────────────────────────────────── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'profile' && (
          <form onSubmit={submit} className="space-y-6">
            
            {/* 1. Personal Information Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Personal information</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Update your personal details.</p>
              </div>

              <div className="mt-6 flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left Column: Avatar & Upload */}
                <div className="flex flex-col items-center shrink-0 w-full md:w-44">
                  <div className="relative group">
                    <div
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-blue-600 bg-blue-100/90 border-4 border-slate-100 overflow-hidden shadow-inner"
                      style={
                        profilePhoto
                          ? { backgroundImage: `url(${profilePhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : {}
                      }
                    >
                      {!profilePhoto && initialLetter}
                    </div>

                    {/* Camera Button Badge */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white border-2 border-white shadow-md hover:bg-blue-700 transition cursor-pointer"
                      title="Upload profile photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 w-full rounded-xl border border-blue-600 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition shadow-2xs cursor-pointer"
                  >
                    Upload Photo
                  </button>

                  <p className="mt-1.5 text-[11px] text-slate-400 text-center">
                    JPG, PNG or GIF (max. 5MB)
                  </p>

                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setProfilePhoto(null)}
                      className="mt-1 text-[11px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                {/* Right Column: 2x2 Form Inputs Grid */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 00000 00000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="youremail@gmail.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Gender Dropdown */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* 2. Member QR Code Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                {/* Left Side: Member QR Code */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-full text-left sm:text-center md:text-left">
                    <h2 className="text-lg font-bold text-slate-900">Member QR Code</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Your unique member ID</p>
                    <span className="inline-block rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600 mt-2">
                      {customerId}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col items-center">
                    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <QRCodeSVG
                        value={JSON.stringify({
                          email: form.email,
                          customerId: customerId,
                          memberSince: memberSince,
                        })}
                        size={150}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Scan this QR code at store for quick checkout
                    </p>
                  </div>
                </div>

                {/* Right Side: Member Metadata (Divided by border) */}
                <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-8 space-y-6">
                  
                  {/* Member Since */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Member since</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{memberSince}</span>
                  </div>

                  {/* Current Risk Tier */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                        <Shield className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Current risk tier</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      <Check className="h-3 w-3 text-emerald-600" /> Low
                    </span>
                  </div>

                  {/* Reward Points */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Reward points</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {rewardPoints.toLocaleString()} pts
                      </span>
                      <p className="text-[11px] text-slate-400 font-normal">+10 pts per ₹100 spent</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* 3. Account Snapshot Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Account snapshot</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Orders */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingBag className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{totalOrders}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Orders</p>
                  </div>
                </div>

                {/* Returns */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Package className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{totalReturns}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Returns</p>
                  </div>
                </div>

                {/* COD Refusals */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Ban className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{totalCodRefusals}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">COD refusals</p>
                  </div>
                </div>

                {/* Reward Points */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200/50 bg-amber-50/50 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                    <Star className="h-5 w-5 fill-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">
                      {rewardPoints.toLocaleString()}
                    </p>
                    <p className="text-xs font-bold text-amber-700 mt-1">Reward points</p>
                    <p className="text-[10px] text-amber-600/90 font-medium">+10 pts per ₹100 spent</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Saved Addresses Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Saved Addresses</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                >
                  Manage Addresses <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {addresses.length === 0 ? (
                /* Empty State Illustration */
                <div className="mt-8 flex flex-col items-center text-center py-6">
                  {/* Stylized Map Pin & Skyline Graphic */}
                  <div className="relative flex items-center justify-center w-36 h-28">
                    {/* Skyline background */}
                    <div className="absolute bottom-2 flex items-end justify-center gap-1.5 opacity-30">
                      <div className="w-4 h-12 bg-blue-300 rounded-t-xs"></div>
                      <div className="w-5 h-16 bg-blue-400 rounded-t-xs"></div>
                      <div className="w-6 h-10 bg-blue-300 rounded-t-xs"></div>
                      <div className="w-5 h-14 bg-blue-400 rounded-t-xs"></div>
                      <div className="w-4 h-8 bg-blue-300 rounded-t-xs"></div>
                    </div>
                    {/* Glowing Pin */}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg ring-4 ring-blue-100">
                      <MapPin className="h-7 w-7" />
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-800">No saved addresses yet.</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add your first address for faster checkout.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setAddressForm({ label: 'Home', line: '', isPrimary: false })
                      setShowAddressModal(true)
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add New Address
                  </button>
                </div>
              ) : (
                /* Addresses List Summary */
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.slice(0, 2).map((addr) => (
                    <div key={addr.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-blue-100/80 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                          {addr.label}
                        </span>
                        {addr.is_primary && (
                          <span className="text-[10px] font-semibold text-emerald-600">Default</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-700 line-clamp-2 leading-relaxed">{addr.line}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Save Changes Action Button */}
            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition cursor-pointer disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving Changes...
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-5 w-5" /> Saved Successfully!
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" /> Save Changes
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* ── SAVED ADDRESSES TAB VIEW ─────────────────────────────────────── */}
        {activeTab === 'addresses' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Saved Addresses</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage delivery addresses for your orders.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddressForm({ label: 'Home', line: '', isPrimary: false })
                  setShowAddressModal(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <MapPin className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No saved addresses</p>
                <p className="text-xs text-slate-500 mt-1">Add an address to checkout quickly in the future.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                          {addr.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAddress(addr.id)}
                          className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Delete address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed">{addr.line}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT METHODS TAB VIEW ────────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Methods</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your saved cards, UPI IDs, and net banking options.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <CreditCard className="h-6 w-6 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">ReturnGuard Pay</span>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-mono text-slate-400">Card Number</p>
                  <p className="text-base font-mono tracking-wider font-semibold">•••• •••• •••• 4242</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                  <div>
                    <p className="text-[10px] text-slate-400">Cardholder</p>
                    <p className="font-semibold">{form.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Expires</p>
                    <p className="font-semibold">08/29</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center">
                <CreditCard className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-800">Add New Payment Method</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Save UPI ID, Credit/Debit Card for instant one-click verified checkout.
                </p>
                <button
                  type="button"
                  onClick={() => alert('New payment method setup is ready during checkout.')}
                  className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Add UPI / Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY TAB VIEW ───────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Security & Sign-In</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage authentication, 2FA OTP, and active sessions.</p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Email Verification</p>
                      <p className="text-xs text-slate-500">{form.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <Check className="h-3 w-3" /> Verified
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Two-Factor OTP Authentication</p>
                      <p className="text-xs text-slate-500">Fast login via email challenge or SMS bypass.</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* ── Change Password Card ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                  <p className="text-xs text-slate-500">Update your account login password.</p>
                </div>
              </div>

              {pwdError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-medium text-rose-700">
                  {pwdError}
                </div>
              )}

              {pwdSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-700 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  {pwdSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      placeholder="Enter current password (optional for demo)"
                      value={pwdForm.currentPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60"
                >
                  {pwdSaving ? 'Updating Password…' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* ── Add Address Modal ────────────────────────────────────────────── */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Address</h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address Label</label>
                <select
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address Line</label>
                <textarea
                  rows={3}
                  value={addressForm.line}
                  onChange={(e) => setAddressForm({ ...addressForm, line: e.target.value })}
                  placeholder="House/Flat No, Street, Landmark, City, State, PIN"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
