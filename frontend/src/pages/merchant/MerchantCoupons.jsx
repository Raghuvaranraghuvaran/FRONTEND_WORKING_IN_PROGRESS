import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Check, X, Ticket, Percent, IndianRupee, Tag, Calendar, Copy } from 'lucide-react'
import { api } from '../../mock/api'
import { INR } from '../../lib/format'
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

export default function MerchantCoupons() {
  const [coupons, setCoupons] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

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

    return list
  }, [coupons, selectedStatus, searchQuery])

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
      await loadData()
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
      await loadData()
    } catch {
      // ignore
    }
  }

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const formatDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}% OFF`
    return `${INR.format(coupon.discount_value)} OFF`
  }

  const isExpired = (coupon) => new Date(coupon.expires_at) < new Date()

  const getCategoryNames = (ids) => {
    if (!ids || ids.length === 0) return 'All'
    return ids
      .map((id) => categories.find((c) => c.id === id)?.name || id)
      .join(', ')
  }

  const getProductNames = (ids) => {
    if (!ids || ids.length === 0) return ''
    return ids
      .map((id) => products.find((p) => p.id === id)?.name || id)
      .join(', ')
  }

  const toggleCategoryFilter = (catId) => {
    setForm((prev) => {
      const current = prev.applicable_category_ids || []
      return {
        ...prev,
        applicable_category_ids: current.includes(catId)
          ? current.filter((c) => c !== catId)
          : [...current, catId],
      }
    })
  }

  const toggleProductFilter = (prodId) => {
    setForm((prev) => {
      const current = prev.applicable_product_ids || []
      return {
        ...prev,
        applicable_product_ids: current.includes(prodId)
          ? current.filter((p) => p !== prodId)
          : [...current, prodId],
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Coupons</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>Create and manage discount coupons for your store products.</p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#6366f1', color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Coupons', value: coupons.length, icon: <Ticket size={20} />, bg: '#ede9fe', color: '#7c3aed' },
          { label: 'Active', value: coupons.filter((c) => c.is_active && !isExpired(c)).length, icon: <Check size={20} />, bg: '#dcfce7', color: '#16a34a' },
          { label: 'Expired', value: coupons.filter((c) => isExpired(c)).length, icon: <Calendar size={20} />, bg: '#fee2e2', color: '#dc2626' },
          { label: 'Total Uses', value: coupons.reduce((s, c) => s + (c.used_count || 0), 0), icon: <Tag size={20} />, bg: '#fef3c7', color: '#d97706' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#fff', borderRadius: 12, padding: '16px 18px',
            border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: stat.bg, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
          padding: '8px 14px', flex: 1, minWidth: 200, maxWidth: 340,
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, flex: 1, color: '#0f172a',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: 'all .15s',
                background: selectedStatus === f.id ? '#6366f1' : '#fff',
                color: selectedStatus === f.id ? '#fff' : '#475569',
                borderColor: selectedStatus === f.id ? '#6366f1' : '#e2e8f0',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons table/cards */}
      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 80, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <EmptyState
          title="No coupons found"
          description={coupons.length === 0 ? 'Create your first coupon to offer discounts to shoppers.' : 'Try adjusting your search or filter.'}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredCoupons.map((coupon) => {
            const expired = isExpired(coupon)
            return (
              <div
                key={coupon.id}
                style={{
                  background: '#fff', borderRadius: 14, padding: '18px 22px',
                  border: `1.5px solid ${expired ? '#fecaca' : coupon.is_active ? '#e2e8f0' : '#fde68a'}`,
                  display: 'flex', alignItems: 'center', gap: 18,
                  opacity: expired ? 0.7 : 1,
                  transition: 'all .2s',
                }}
              >
                {/* Left: Discount badge */}
                <div style={{
                  minWidth: 90, textAlign: 'center', padding: '12px 8px',
                  borderRadius: 12, background: expired ? '#fef2f2' : coupon.discount_type === 'percentage' ? '#ede9fe' : '#dcfce7',
                  border: `1px dashed ${expired ? '#fca5a5' : coupon.discount_type === 'percentage' ? '#a78bfa' : '#86efac'}`,
                }}>
                  <div style={{
                    fontSize: 20, fontWeight: 800,
                    color: expired ? '#dc2626' : coupon.discount_type === 'percentage' ? '#7c3aed' : '#16a34a',
                  }}>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : INR.format(coupon.discount_value)}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    OFF
                  </div>
                </div>

                {/* Middle: Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#0f172a',
                      background: '#f1f5f9', padding: '3px 10px', borderRadius: 6,
                      letterSpacing: '0.1em',
                    }}>
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => copyCode(coupon.code, coupon.id)}
                      title="Copy code"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: copiedId === coupon.id ? '#16a34a' : '#94a3b8',
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      {copiedId === coupon.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {/* Status badges */}
                    {expired ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#dc2626',
                        background: '#fee2e2', padding: '2px 8px', borderRadius: 4,
                      }}>EXPIRED</span>
                    ) : coupon.is_active ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#16a34a',
                        background: '#dcfce7', padding: '2px 8px', borderRadius: 4,
                      }}>ACTIVE</span>
                    ) : (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#d97706',
                        background: '#fef3c7', padding: '2px 8px', borderRadius: 4,
                      }}>INACTIVE</span>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    {coupon.description || formatDiscount(coupon)}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                    {coupon.min_order_value > 0 && (
                      <span>Min: {INR.format(coupon.min_order_value)}</span>
                    )}
                    <span>Uses: {coupon.used_count}/{coupon.max_uses}</span>
                    <span>Categories: {getCategoryNames(coupon.applicable_category_ids)}</span>
                    {coupon.applicable_product_ids?.length > 0 && (
                      <span>Products: {coupon.applicable_product_ids.length} selected</span>
                    )}
                    <span>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEditModal(coupon)}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      border: '1px solid #e2e8f0', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#6366f1',
                    }}
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(coupon)}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      border: '1px solid #fecaca', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#dc2626',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <>
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 1000, backdropFilter: 'blur(4px)',
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            background: '#fff', borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            zIndex: 1001, padding: '28px 32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px', fontSize: 12,
                color: '#dc2626', fontWeight: 500, marginBottom: 16,
              }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Coupon Code */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE10"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 13,
                    fontFamily: 'monospace', letterSpacing: '0.1em',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 10% off on all products"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                  }}
                />
              </div>

              {/* Discount Type + Value */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Discount Type *
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 13,
                      outline: 'none', background: '#fff',
                    }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 200'}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Min Order + Max Uses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    placeholder="0"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="100"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
                  }}
                />
              </div>

              {/* Applicable Categories */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Applicable Categories
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(empty = all categories)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map((cat) => {
                    const selected = (form.applicable_category_ids || []).includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoryFilter(cat.id)}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: '1.5px solid', cursor: 'pointer',
                          background: selected ? '#6366f1' : '#fff',
                          color: selected ? '#fff' : '#475569',
                          borderColor: selected ? '#6366f1' : '#e2e8f0',
                        }}
                      >
                        {cat.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Applicable Products */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Applicable Products
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(empty = all products)</span>
                </label>
                <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8 }}>
                  {products.map((prod) => {
                    const selected = (form.applicable_product_ids || []).includes(prod.id)
                    return (
                      <label
                        key={prod.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                          fontSize: 12, color: '#374151',
                          background: selected ? '#eef2ff' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleProductFilter(prod.id)}
                          style={{ accentColor: '#6366f1' }}
                        />
                        <span style={{ fontWeight: selected ? 600 : 400 }}>{prod.name}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{INR.format(prod.price)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Active</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none',
                    background: form.is_active ? '#6366f1' : '#cbd5e1',
                    cursor: 'pointer', position: 'relative', transition: 'background .2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: form.is_active ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#475569', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, border: 'none',
                  background: '#6366f1', color: '#fff', cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: 400,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            zIndex: 1001, padding: '28px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Delete Coupon?</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Are you sure you want to delete <strong>{deleteTarget.code}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '10px 20px', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#475569', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 24px', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, border: 'none',
                  background: '#dc2626', color: '#fff', cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
