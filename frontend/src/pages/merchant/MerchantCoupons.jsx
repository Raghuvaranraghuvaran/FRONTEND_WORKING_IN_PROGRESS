import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Ticket,
  Percent,
  IndianRupee,
  Tag,
  Calendar,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  ShoppingCart,
  Clock,
  LayoutGrid,
  Sparkles
} from 'lucide-react'
import { api } from '../../mock/api'
import EmptyState from '../../components/EmptyState'

const statusFilters = [
  { id: 'all', label: 'All Coupons' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'expired', label: 'Expired' },
]

const EMPTY_FORM = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_value: '',
  applicable_product_ids: [],
  applicable_category_ids: [],
  max_uses: '100',
  is_active: true,
  expires_at: '',
  description: '',
}

function formatExpiryDate(isoString) {
  if (!isoString) return '01/01/2027'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '01/01/2027'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return '01/01/2027'
  }
}

function getCouponTheme(coupon, index) {
  const code = (coupon.code || '').toUpperCase()
  if (code.includes('WELCOME') || coupon.discount_value === 10 || index === 0) {
    return {
      border: 'border-l-indigo-600',
      badgeBg: 'bg-indigo-50/80',
      textColor: 'text-indigo-600',
      subTextColor: 'text-indigo-400',
      discountBoxBg: 'bg-indigo-50/80',
    }
  }
  if (code.includes('FESTIVE') || coupon.discount_value === 20 || index === 1) {
    return {
      border: 'border-l-emerald-500',
      badgeBg: 'bg-emerald-50/80',
      textColor: 'text-emerald-600',
      subTextColor: 'text-emerald-500',
      discountBoxBg: 'bg-emerald-50/80',
    }
  }
  return {
    border: 'border-l-amber-500',
    badgeBg: 'bg-amber-50/80',
    textColor: 'text-amber-600',
    subTextColor: 'text-amber-500',
    discountBoxBg: 'bg-amber-50/80',
  }
}

export default function MerchantCoupons() {
  const [coupons, setCoupons] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Copied code feedback
  const [copiedId, setCopiedId] = useState(null)

  const isExpired = (coupon) => {
    if (!coupon.expires_at) return false
    return new Date(coupon.expires_at) < new Date()
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [couponData, prodData, catData] = await Promise.all([
        api.getMerchantCoupons(),
        api.getProducts(),
        api.getCategories(),
      ])
      setCoupons(Array.isArray(couponData) ? couponData : [])
      setProducts(Array.isArray(prodData) ? prodData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredCoupons = useMemo(() => {
    let list = [...coupons]
    const now = new Date()

    if (selectedStatus === 'active') {
      list = list.filter((c) => c.is_active && new Date(c.expires_at) >= now)
    } else if (selectedStatus === 'inactive') {
      list = list.filter((c) => !c.is_active)
    } else if (selectedStatus === 'expired') {
      list = list.filter((c) => new Date(c.expires_at) < now)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      )
    }

    if (sortBy === 'discount') {
      list.sort((a, b) => (b.discount_value || 0) - (a.discount_value || 0))
    } else if (sortBy === 'uses') {
      list.sort((a, b) => (b.used_count || 0) - (a.used_count || 0))
    }

    return list
  }, [coupons, selectedStatus, searchQuery, sortBy])

  const openCreateModal = () => {
    setEditingCoupon(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_value: String(coupon.min_order_value || ''),
      applicable_product_ids: coupon.applicable_product_ids || [],
      applicable_category_ids: coupon.applicable_category_ids || [],
      max_uses: String(coupon.max_uses),
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      description: coupon.description || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormError('')
    if (!form.code.trim()) {
      setFormError('Coupon code is required.')
      return
    }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      setFormError('Discount value must be greater than 0.')
      return
    }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      setFormError('Percentage discount cannot exceed 100%.')
      return
    }
    if (!form.expires_at) {
      setFormError('Expiry date is required.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        min_order_value: Number(form.min_order_value) || 0,
        max_uses: Number(form.max_uses) || 100,
        expires_at: new Date(form.expires_at + 'T23:59:59Z').toISOString(),
      }
      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, payload)
      } else {
        await api.createCoupon(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      setFormError(err.message || 'Failed to save coupon.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.deleteCoupon(deleteTarget.id)
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete coupon.')
    }
  }

  const handleCopyCode = (coupon) => {
    navigator.clipboard?.writeText(coupon.code)
    setCopiedId(coupon.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // Summary statistics
  const totalCouponsCount = coupons.length
  const activeCouponsCount = coupons.filter((c) => c.is_active && !isExpired(c)).length
  const expiredCouponsCount = coupons.filter((c) => isExpired(c)).length
  const totalUsesCount = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)

  return (
    <div className="space-y-6 pb-20">
      {/* ── TOP HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Icon, Title & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-xs">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coupons</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Create and manage discount coupons for your store products.
            </p>
          </div>
        </div>

        {/* Center / Decorative Slogan Badge */}
        <div className="hidden lg:flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-100/40 border border-indigo-100/80 px-4 py-2 shadow-2xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xs font-black text-sm">
            %
          </div>
          <div className="text-left">
            <p className="text-[12px] font-bold text-indigo-700 leading-tight flex items-center gap-1">
              <span>Drive more sales</span>
              <Sparkles className="h-3 w-3 text-indigo-500" />
            </p>
            <p className="text-[11px] font-medium text-indigo-500 leading-tight">with smart discounts!</p>
          </div>
        </div>

        {/* Right: + Create Coupon Button */}
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Coupons */}
        <div className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Coupons</div>
              <div className="text-2xl font-black text-slate-900 leading-tight my-0.5">{totalCouponsCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">All created coupons</div>
            </div>
          </div>
          {/* Subtle Graphic */}
          <div className="flex items-end gap-1 h-8 opacity-40 pr-2">
            <div className="w-1.5 h-3 rounded-full bg-indigo-400" />
            <div className="w-1.5 h-6 rounded-full bg-indigo-500" />
            <div className="w-1.5 h-8 rounded-full bg-indigo-600" />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="flex items-center justify-between rounded-3xl border border-emerald-100/80 bg-emerald-50/20 p-4.5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Active</div>
              <div className="text-2xl font-black text-slate-900 leading-tight my-0.5">{activeCouponsCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Currently active coupons</div>
            </div>
          </div>
          {/* Subtle Wave */}
          <svg className="w-14 h-8 opacity-40 text-emerald-500" viewBox="0 0 100 50" fill="none">
            <path d="M0 40 Q25 45 50 25 T100 10 L100 50 L0 50 Z" fill="currentColor" opacity="0.3" />
            <path d="M0 40 Q25 45 50 25 T100 10" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>

        {/* Card 3: Expired */}
        <div className="flex items-center justify-between rounded-3xl border border-rose-100/80 bg-rose-50/20 p-4.5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100/80 text-rose-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Expired</div>
              <div className="text-2xl font-black text-slate-900 leading-tight my-0.5">{expiredCouponsCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Coupons no longer valid</div>
            </div>
          </div>
          {/* Subtle Wave */}
          <svg className="w-14 h-8 opacity-30 text-rose-500" viewBox="0 0 100 50" fill="none">
            <path d="M0 35 Q30 45 60 20 T100 30 L100 50 L0 50 Z" fill="currentColor" opacity="0.3" />
            <path d="M0 35 Q30 45 60 20 T100 30" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>

        {/* Card 4: Total Uses */}
        <div className="flex items-center justify-between rounded-3xl border border-amber-100/80 bg-amber-50/20 p-4.5 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Total Uses</div>
              <div className="text-2xl font-black text-slate-900 leading-tight my-0.5">{totalUsesCount}</div>
              <div className="text-[10px] text-slate-400 font-medium">Times coupons have been used</div>
            </div>
          </div>
          {/* Subtle Graphic */}
          <div className="flex items-end gap-1 h-8 opacity-40 pr-2">
            <div className="w-1.5 h-4 rounded-full bg-amber-400" />
            <div className="w-1.5 h-6 rounded-full bg-amber-500" />
            <div className="w-1.5 h-8 rounded-full bg-amber-600" />
          </div>
        </div>
      </div>

      {/* ── CONTROLS & FILTER BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupons by code, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 shadow-2xs"
          />
        </div>

        {/* Center: Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {statusFilters.map((f) => {
            const isActive = selectedStatus === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedStatus(f.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isActive
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Right: Sort Dropdown */}
        <div className="relative self-end md:self-auto">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-2xl border border-slate-200 bg-white pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 shadow-2xs cursor-pointer"
          >
            <option value="recent">Sort by Recent</option>
            <option value="discount">Sort by Discount</option>
            <option value="uses">Sort by Total Uses</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── COUPONS LIST ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          title="No coupons found"
          description={
            coupons.length === 0
              ? 'Create your first coupon to offer discounts to shoppers.'
              : 'Try adjusting your search or filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredCoupons.map((coupon, idx) => {
            const expired = isExpired(coupon)
            const theme = getCouponTheme(coupon, idx)
            const isPercentage = coupon.discount_type === 'percentage'
            const displayVal = isPercentage ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`

            return (
              <div
                key={coupon.id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all border-l-[5px] ${theme.border} hover:shadow-xs`}
              >
                {/* Left side: Discount badge + Details */}
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  {/* Left Big Discount Box */}
                  <div className={`flex flex-col items-center justify-center rounded-2xl p-3 w-20 sm:w-24 shrink-0 shadow-2xs ${theme.badgeBg}`}>
                    <span className={`text-2xl font-black ${theme.textColor} leading-tight`}>
                      {displayVal}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${theme.subTextColor} mt-0.5`}>
                      OFF
                    </span>
                  </div>

                  {/* Middle Info Details */}
                  <div className="min-w-0 space-y-1.5">
                    {/* Code Row + Copy + Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg tracking-wider shadow-2xs">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Copy code"
                      >
                        {copiedId === coupon.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                        expired
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : coupon.is_active
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {expired ? 'EXPIRED' : coupon.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-xs font-medium text-slate-600">
                      {coupon.description || `${displayVal} discount on your order`}
                    </div>

                    {/* Meta Row: Min order, Uses, Categories, Expires */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 pt-0.5">
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-3.5 w-3.5 text-slate-400" />
                        <span>Min: ₹{coupon.min_order_value || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Uses: {coupon.used_count || 0}/{coupon.max_uses || 500}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
                        <span>Categories: All</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Expires: {formatExpiryDate(coupon.expires_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Discount Pill + Action Buttons */}
                <div className="flex items-center justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Discount pill box */}
                  <div className={`hidden sm:flex flex-col items-center justify-center rounded-2xl px-4 py-2 text-center min-w-[85px] shadow-2xs ${theme.discountBoxBg}`}>
                    <span className={`text-lg font-black ${theme.textColor} leading-tight`}>
                      {displayVal}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Discount</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(coupon)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-indigo-600 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(coupon)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FOOTER: Showing X of Y coupons + Pagination ── */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div className="text-xs font-medium text-slate-500">
          Showing {filteredCoupons.length} of {coupons.length} coupons
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors cursor-not-allowed opacity-50"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs"
          >
            1
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors cursor-not-allowed opacity-50"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Ticket className="h-5 w-5 text-indigo-600" />
                <span>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="e.g. SUMMER25"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.discount_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? '10' : '150'}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    placeholder="500"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 10% off on first order above ₹500"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="coupon_active" className="font-semibold text-slate-700 cursor-pointer">
                  Activate this coupon immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Coupon</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to delete coupon <strong className="font-mono text-slate-900">{deleteTarget.code}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
