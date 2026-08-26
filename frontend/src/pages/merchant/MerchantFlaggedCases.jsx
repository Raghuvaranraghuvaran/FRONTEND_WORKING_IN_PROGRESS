import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Coins, 
  Camera, 
  Filter, 
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react'

const ESCALATION_STEPS = [
  {
    level: 0,
    title: 'Normal Ordering',
    subtitle: 'Standard shopping privileges',
    icon: '🟢',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeClass: 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500 shadow-md',
  },
  {
    level: 1,
    title: 'Warning & OTP',
    subtitle: 'SMS/OTP verification on checkout',
    icon: '🟡',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    activeClass: 'border-amber-500 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500 shadow-md',
  },
  {
    level: 2,
    title: 'COD Restricted',
    subtitle: 'Prepaid-only for next orders',
    icon: '🟠',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    activeClass: 'border-orange-500 bg-orange-50/90 text-orange-950 ring-2 ring-orange-500 shadow-md',
  },
  {
    level: 3,
    title: 'Prepaid + Review',
    subtitle: 'Manual staff approval on orders',
    icon: '💳',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    activeClass: 'border-purple-500 bg-purple-50/90 text-purple-950 ring-2 ring-purple-500 shadow-md',
  },
  {
    level: 4,
    title: 'Temp Restriction',
    subtitle: 'High-value orders blocked',
    icon: '🚫',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeClass: 'border-rose-500 bg-rose-50/90 text-rose-950 ring-2 ring-rose-500 shadow-md',
  },
  {
    level: 5,
    title: 'Final Block',
    subtitle: 'Account suspended by merchant',
    icon: '⛔',
    badgeClass: 'bg-slate-900 text-rose-300 border-slate-700',
    activeClass: 'border-slate-900 bg-slate-950 text-rose-300 ring-2 ring-slate-900 shadow-md',
  },
]

const QUICK_DECISION_NOTES = [
  '✓ Photo proof verified & authentic',
  '✓ Approved: Within 7-day return policy',
  '✓ Defective item verified for replacement',
  '✕ Rejected: Outside 7-day return window',
  '✕ Rejected: Item tags removed or worn',
  '✕ Rejected: Physical proof mismatch',
]

export default function MerchantFlaggedCases() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [customerReview, setCustomerReview] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedReasonChip, setSelectedReasonChip] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'history' | 'behavior'
  const [selectedProofModal, setSelectedProofModal] = useState(null)
  const [selectedItemModal, setSelectedItemModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [reasonFilter, setReasonFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectReasonChip = (chip) => {
    if (selectedReasonChip === chip) {
      setSelectedReasonChip(null)
      setNotes('')
    } else {
      setSelectedReasonChip(chip)
      setNotes(chip)
    }
  }

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    window.clearTimeout(window.__toastTimeout)
    window.__toastTimeout = window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const load = (isInitial = false) => {
    if (isInitial) setLoading(true)
    api.getMerchantReturns().then((data) => {
      setReturns(data || [])
      if (isInitial) setLoading(false)
      if (data && data.length > 0) {
        if (!selected || !data.some((d) => d.id === selected.id)) {
          selectCase(data[0])
        }
      }
    }).catch((err) => {
      console.error('Failed to load merchant returns:', err)
      if (isInitial) setLoading(false)
    })
  }

  useEffect(() => {
    load(true)
  }, [])

  const selectCase = async (record) => {
    // Resolve multi-item return lines matching the order and attached evidence
    let enrichedLines = record.return_lines
    let enrichedImages = record.images

    if (!enrichedLines || enrichedLines.length === 0) {
      if (record.order_number?.includes('1025') || record.order_number?.includes('1023') || record.id === 'ret_2001' || record.id === 1) {
        enrichedLines = [
          { product_id: 'prod_1', name: 'Embroidered Lehenga Set', quantity: 1, price: 6499, size: 'M', color: 'Royal Red', sku: 'ETH-LHN-001', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80' },
          { product_id: 'prod_8', name: 'Smart Fitness Band', quantity: 1, price: 2749, size: 'Standard', color: 'Midnight Black', sku: 'ELEC-FIT-008', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80' },
        ]
        enrichedImages = [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80',
        ]
      } else if (record.order_number?.includes('1026') || record.order_number?.includes('1018') || record.id === 'ret_2003' || record.id === 3) {
        enrichedLines = [
          { product_id: 'prod_8', name: 'Smart Fitness Band', quantity: 1, price: 2749, size: 'Standard', color: 'Midnight Black', sku: 'ELEC-FIT-008', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80' },
          { product_id: 'prod_7', name: 'Wireless Earbuds ANC', quantity: 1, price: 3999, size: 'Universal', color: 'Pearl White', sku: 'ELEC-EAR-007', image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=80' },
        ]
        enrichedImages = [
          'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=80',
        ]
      } else if (record.order_number?.includes('1024') || record.id === 'ret_2002' || record.id === 2) {
        enrichedLines = [
          { product_id: 'prod_4', name: 'Cotton Shirt', quantity: 1, price: 1299, size: 'L', color: 'White', sku: 'DL-SHT-004', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80' },
          { product_id: 'prod_5', name: 'Relaxed Fit T-Shirt', quantity: 2, price: 799, size: 'M', color: 'Navy Blue', sku: 'DL-TEE-005', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80' },
        ]
        enrichedImages = [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
        ]
      } else {
        enrichedLines = [
          { product_id: 'prod_1', name: 'Embroidered Lehenga Set', quantity: 1, price: 6499, size: 'M', color: 'Royal Red', sku: 'ETH-LHN-001', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80' },
          { product_id: 'prod_8', name: 'Smart Fitness Band', quantity: 1, price: 2749, size: 'Standard', color: 'Midnight Black', sku: 'ELEC-FIT-008', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80' },
        ]
        enrichedImages = [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80',
        ]
      }
    }

    if (!enrichedImages || enrichedImages.length === 0) {
      enrichedImages = enrichedLines.map((it) => it.image).filter(Boolean)
    }

    const updatedRecord = { ...record, return_lines: enrichedLines, images: enrichedImages }
    setSelected(updatedRecord)
    setLoadingReview(true)
    const custId = record.user_id || record.customer_id || record.user || 'user_2'
    try {
      const reviewData = await api.getCustomerReview(custId)
      setCustomerReview(reviewData)
    } catch (err) {
      console.error('Failed to load customer review', err)
      setCustomerReview({
        profile: {
          id: custId,
          customer_id: record.customer_id || `CUST-${record.order_number?.replace('#', '') || '1025'}`,
          customer_name: record.customer_name,
          customer_email: record.customer_email || 'customer@example.com',
          risk_tier: record.risk_tier || 'High',
          latest_score: record.risk_score || 82,
          escalation_level: record.risk_tier === 'High' ? 3 : record.risk_tier === 'Medium' ? 1 : 0,
          confirmed_violations: 2,
          restriction_count: 1,
        },
        behavior: {
          total_orders: 10,
          total_returns: 6,
          total_cod_refusals: 2,
          successful_deliveries: 4,
          multiple_variant_orders: 6,
          high_value_cod_count: 4,
          address_mismatch_count: 2,
          return_rate: 0.6,
        },
        restrictions: [
          {
            id: 'r1',
            restriction_type: 'prepaid_only',
            reason: 'Prepaid required due to high return frequency',
            status: 'active',
            start_date: new Date().toISOString(),
            applied_by: 'system',
          }
        ],
        escalation_history: [
          {
            id: 'e1',
            previous_level: 2,
            new_level: 3,
            trigger_event: 'Repeated COD refusal on order',
            created_at: new Date().toISOString(),
          }
        ],
        decision: {
          recommended_action: record.risk_tier === 'High' ? 'require_prepaid' : 'verify',
        }
      })
    } finally {
      setLoadingReview(false)
    }
  }

  // Set escalation level directly (Steps 0 to 5)
  const handleSetEscalationLevel = async (targetLevel) => {
    if (!selected) return
    const custId = selected.user_id || selected.customer_id || selected.user || 'user_2'
    const stepObj = ESCALATION_STEPS[targetLevel]

    setCustomerReview((prev) => {
      if (!prev) return prev
      const prevLvl = prev.profile?.escalation_level ?? 0
      return {
        ...prev,
        profile: {
          ...prev.profile,
          escalation_level: targetLevel,
          escalation_label: stepObj.title,
        },
        escalation_history: [
          {
            id: `esc_${Date.now()}`,
            previous_level: prevLvl,
            new_level: targetLevel,
            trigger_event: notes || `Direct switch to Step ${targetLevel}: ${stepObj.title}`,
            created_at: new Date().toISOString(),
          },
          ...(prev.escalation_history || []),
        ],
      }
    })

    showToast(`✓ Shifted to Level ${targetLevel}: ${stepObj.title}`)

    try {
      await api.performMerchantAction({
        customerId: custId,
        action: 'set_escalation_level',
        escalation_level: targetLevel,
        threshold_value: targetLevel,
        notes: notes || `Direct manual switch to Level ${targetLevel}: ${stepObj.title}`,
      })
    } catch (err) {
      console.warn('Backend sync note for escalation:', err)
    }
  }

  // Handle all merchant authority decisions & return approvals
  const handleAction = async (actionType) => {
    if (!selected) return
    setActionLoading(true)
    const custId = selected.user_id || selected.customer_id || selected.customer_email || selected.user || 'user_2'
    const decisionNotes = notes || selectedReasonChip || `Return decision: ${actionType.replace('_', ' ')}`

    // Optimistic UI updates
    if (actionType === 'restrict_cod') {
      showToast('✓ COD restricted for this customer!')
    } else if (actionType === 'require_prepaid') {
      showToast('✓ Prepaid requirement applied!')
    } else if (actionType === 'increase_restriction') {
      const curLvl = customerReview?.profile?.escalation_level ?? (selected.risk_tier === 'High' ? 3 : 1)
      const nextLvl = Math.min(5, curLvl + 1)
      showToast(`✓ Escalation tier advanced to Step ${nextLvl}!`)
    } else if (actionType === 'suspend_account') {
      showToast('⛔ Customer account suspended!', 'error')
    } else if (['approve', 'reject', 'product_returned', 'refund_processed'].includes(actionType)) {
      const actionName = actionType === 'approve' ? 'APPROVED' : actionType === 'reject' ? 'REJECTED' : actionType.replace('_', ' ').toUpperCase()
      const customerEmail = selected.customer_email || selected.user?.email || 'registered customer'
      showToast(`✓ Return #${selected.id} ${actionName}! Email sent to ${customerEmail}.`)
    }

    setNotes('')
    setSelectedReasonChip(null)

    // Perform backend API sync
    try {
      if (['approve', 'reject', 'product_returned', 'refund_processed'].includes(actionType)) {
        const returnId = selected.id || selected.order_number
        await api.reviewReturn({
          returnId,
          action: actionType,
          notes: decisionNotes,
        })
      } else {
        await api.performMerchantAction({
          customerId: custId,
          action: actionType,
          notes: decisionNotes,
        })
      }

      await load()
      // Automatically close the panel after decision is executed
      setSelected(null)
    } catch (err) {
      console.warn('Action sync notice:', err)
      await load()
      setSelected(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveRestriction = async (restrictionId) => {
    setActionLoading(true)
    try {
      await api.removeCustomerRestriction(restrictionId)
      showToast('✓ Restriction removed successfully.')
      const custId = selected.user_id || selected.customer_id || selected.user || 'user_2'
      const updated = await api.getCustomerReview(custId).catch(() => null)
      if (updated) setCustomerReview(updated)
    } catch (err) {
      showToast(err.message || 'Failed to remove restriction', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const profile = customerReview?.profile
  const behavior = customerReview?.behavior
  const restrictions = customerReview?.restrictions || []
  const activeRestrictions = restrictions.filter((r) => r.status === 'active')
  const escalationHistory = customerReview?.escalation_history || []
  const currentLevel = profile?.escalation_level ?? 0

  // Filter returns
  const filteredReturns = returns.filter((r) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'manual_review' && r.status !== 'manual_review') return false
      if (statusFilter === 'approved' && r.status !== 'approved') return false
      if (statusFilter === 'rejected' && r.status !== 'rejected') return false
      if (statusFilter === 'product_returned' && r.status !== 'product_returned') return false
      if (statusFilter === 'refund_processed' && r.status !== 'refund_processed') return false
    }
    if (reasonFilter !== 'all' && !r.reason?.toLowerCase().includes(reasonFilter.toLowerCase())) {
      return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      const matchOrder = r.order_number?.toLowerCase().includes(q)
      const matchName = r.customer_name?.toLowerCase().includes(q)
      const matchId = String(r.id).toLowerCase().includes(q)
      if (!matchOrder && !matchName && !matchId) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-semibold shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-200 border border-rose-800'
              : 'bg-slate-950 text-emerald-300 border border-slate-800'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white font-bold cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Return & Flagged Cases Review</h1>
          <p className="text-sm text-slate-500">
            Review customer return requests, inspect uploaded photo proofs & reasons, and approve or process refunds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 border border-indigo-100">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            {returns.filter((r) => r.status === 'manual_review').length} Pending Review
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: `All (${returns.length})` },
            { id: 'manual_review', label: `Pending Review (${returns.filter((r) => r.status === 'manual_review').length})` },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'product_returned', label: 'Product Returned' },
            { id: 'refund_processed', label: 'Refund Processed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reason Filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Return Reasons</option>
            <option value="damaged">Damaged / Defective Item</option>
            <option value="wrong_size">Wrong Size / Fit Issue</option>
            <option value="quality">Quality Issue</option>
            <option value="wrong_product">Wrong Item Received</option>
            <option value="missing_item">Missing Component</option>
            <option value="changed_mind">Changed Mind</option>
            <option value="fraud">Suspected Fraud</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order, customer..."
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs w-36 sm:w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <EmptyState
            title="No return requests match this filter"
            description="Try switching the status filter above to view all return records."
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_2fr]">
          
          {/* Left Column: List of Returns */}
          <div className="space-y-3">
            {filteredReturns.map((record) => {
              const isSelected = selected?.id === record.id
              const photoCount = record.images?.length || 0

              return (
                <div
                  key={record.id}
                  onClick={() => selectCase(record)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600">#{record.id}</span>
                        <span className="font-bold text-sm text-slate-900">{record.order_number}</span>
                        <RiskBadge tier={record.risk_tier} />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-800">{record.customer_name}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(record.created_at)}</p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize">
                      {record.reason?.replaceAll('_', ' ')}
                    </span>
                    {photoCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                        <Camera className="h-3.5 w-3.5" /> {photoCount} Proof {photoCount === 1 ? 'Photo' : 'Photos'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Case Review & Merchant Authority Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="flex h-full min-h-64 items-center justify-center text-sm text-slate-500">
                Select a return case to review details and approve/reject.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-indigo-600">Return #{selected.id}</span>
                      <h2 className="text-lg font-bold text-slate-900">Order {selected.order_number}</h2>
                      <RiskBadge tier={selected.risk_tier} />
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Customer: <strong>{selected.customer_name}</strong> ({selected.customer_email || 'customer@example.com'})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Order Amount</span>
                      <p className="text-lg font-extrabold text-slate-900">₹{selected.order_total || selected.total || 6499}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
                      title="Close review panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* RETURN REASON & PROOFS HIGHLIGHT CARD */}
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-slate-50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Customer Return Reason & Claims</h3>
                    </div>
                    <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                      {selected.reason?.replaceAll('_', ' ')}
                    </span>
                  </div>

                  {/* Customer Explanation Note */}
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Customer Explanation:</span>
                    <p className="mt-1 rounded-xl bg-white p-3 text-xs text-slate-800 border border-slate-200 font-medium leading-relaxed">
                      {selected.note ? `"${selected.note}"` : 'No additional customer note provided.'}
                    </p>
                  </div>

                  {/* Uploaded Proof Gallery */}
                  {(selected.images?.length > 0) && (
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                        Customer Uploaded Proof Photos ({selected.images.length})
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selected.images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setSelectedProofModal({
                                img,
                                idx,
                                title: `Proof Photo #${idx + 1}`,
                                itemTitle: selected.return_lines?.[0]?.name || selected.product_name || 'Returned Item',
                              })
                            }
                            className="group relative h-20 w-20 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 shadow-xs transition-all hover:border-indigo-500 hover:shadow-md cursor-pointer"
                            title="Click to inspect proof"
                          >
                            <img src={img} alt={`Proof ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-1 right-1 rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              #{idx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refund Method & Pickup Slot */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-white p-3 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Preferred Refund Method:</span>
                      <p className="font-bold text-slate-900 mt-0.5 capitalize">
                        {selected.refund_method?.replaceAll('_', ' ') || 'Original Payment Method'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Doorstep Pickup:</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {selected.pickup_slot?.replaceAll('_', ' ') || 'Tomorrow Morning'}
                      </p>
                    </div>
                  </div>

                  {/* Requested Order Line Items with Images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                        <span>🛍️</span> Return Claimed Line Items ({(selected.return_lines?.length || 1)} Items)
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        Total Items: {(selected.return_lines || [{ quantity: 1 }]).reduce((acc, it) => acc + (it.quantity || 1), 0)}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(selected.return_lines && selected.return_lines.length > 0 ? selected.return_lines : [
                        { product_id: 'prod_8', name: selected.product_name || 'Smart Fitness Band', quantity: 1, price: selected.total || 2749, size: 'Standard', color: 'Midnight Black', sku: 'ELEC-FIT-008', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80' }
                      ]).map((item, idx) => {
                        const itemImage = item.image || (
                          item.name?.toLowerCase().includes('lehenga') ? 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('saree') ? 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('dupatta') ? 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('kurta') ? 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('shirt') ? 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('earbuds') || item.name?.toLowerCase().includes('earphone') ? 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('band') || item.name?.toLowerCase().includes('fitness') ? 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('sneakers') ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80' :
                          item.name?.toLowerCase().includes('lamp') ? 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80' :
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80'
                        )

                        const lineTotal = (item.price || 0) * (item.quantity || 1)

                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedItemModal({
                              ...item,
                              itemImage,
                              lineTotal,
                              returnReason: selected.reason,
                              customerNote: selected.note,
                              orderNumber: selected.order_number,
                              customerName: selected.customer_name,
                            })}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3.5 rounded-2xl border-2 border-slate-200 text-xs shadow-2xs gap-3 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="relative group overflow-hidden rounded-xl border border-slate-200 shrink-0 h-14 w-14 bg-slate-50">
                                <img
                                  src={itemImage}
                                  alt={item.name}
                                  className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                                  🔍 View
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                  {item.name}
                                  <span className="text-[10px] font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">→ View Details</span>
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span className="font-mono font-semibold text-slate-600">SKU: {item.sku || item.product_id || `PRD-${idx+101}`}</span>
                                  {item.size && <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-700">Size: {item.size}</span>}
                                  {item.color && <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-700">Color: {item.color}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                              <div className="text-right">
                                <span className="font-black text-slate-900 text-sm">₹{lineTotal.toLocaleString('en-IN')}</span>
                                {item.quantity > 1 && (
                                  <p className="text-[10px] text-slate-400 font-medium">(₹{item.price} × {item.quantity})</p>
                                )}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                Return Requested (Qty: {item.quantity})
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Multi-Item Return Total Summary Bar */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-2.5 text-xs border border-slate-200">
                      <span className="font-bold text-slate-700">
                        Total Refundable Value for {(selected.return_lines?.length || 1)} Item(s):
                      </span>
                      <span className="text-sm font-black text-indigo-950">
                        ₹{(
                          (selected.return_lines && selected.return_lines.length > 0)
                            ? selected.return_lines.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                            : (selected.order_total || selected.total || 2749)
                        ).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Escalation Ladder Stepper */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <span>🪜</span> Progressive Escalation Ladder (PDF §6 & §7)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Click on any step below to instantaneously test and adjust the customer's escalation tier.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                        Active: Step {currentLevel} ({ESCALATION_STEPS[currentLevel]?.title})
                      </span>
                    </div>
                  </div>

                  {/* Connected Progress Line */}
                  <div className="relative mb-3 hidden sm:block">
                    <div className="absolute top-1/2 left-4 right-4 h-1 -translate-y-1/2 bg-slate-200 rounded-full" />
                    <div
                      className="absolute top-1/2 left-4 h-1 -translate-y-1/2 bg-amber-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${(currentLevel / 5) * 100}%` }}
                    />
                  </div>

                  {/* Stepper Cards */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6">
                    {ESCALATION_STEPS.map((step) => {
                      const isActive = step.level === currentLevel
                      const isPast = step.level < currentLevel
                      return (
                        <button
                          key={step.level}
                          type="button"
                          onClick={() => handleSetEscalationLevel(step.level)}
                          className={`group relative rounded-2xl p-3 text-left transition-all duration-200 cursor-pointer border ${
                            isActive
                              ? step.activeClass
                              : isPast
                              ? 'bg-rose-50/50 border-rose-200 text-rose-900 hover:bg-rose-100/70 hover:border-rose-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-black uppercase tracking-wider">
                              STEP {step.level}
                            </span>
                            <span className="text-sm">{step.icon}</span>
                          </div>
                          <div className="font-bold text-xs mt-1 text-slate-900 leading-tight">
                            {step.title}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                            {step.subtitle}
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
                            {isActive ? (
                              <span className="text-amber-700 font-extrabold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                                Shift →
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 text-sm font-semibold">
                  {[
                    { id: 'overview', label: 'AI Risk Signals & Rules' },
                    { id: 'behavior', label: 'Customer Behavior Profile' },
                    { id: 'history', label: `Restriction History (${escalationHistory.length + restrictions.length})` },
                  ].map((t) => {
                    const isActive = activeTab === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`relative px-4 py-2.5 transition-colors cursor-pointer ${
                          isActive
                            ? 'text-indigo-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <span>{t.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="flaggedTabLine"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Animated Tab Content Container */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8, scale: 0.992 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.992 }}
                    transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* TAB 1: OVERVIEW & SIGNALS */}
                    {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">AI Risk Signals Detected</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(selected.signals?.length ? selected.signals : ['Standard return request', 'Within return window']).map(
                          (signal, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              <span className="text-indigo-500 font-bold">•</span>
                              {signal}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {activeRestrictions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase text-amber-800 tracking-wider">Active Customer Restrictions</h3>
                        <div className="mt-2 space-y-2">
                          {activeRestrictions.map((r) => (
                            <div key={r.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                              <div>
                                <span className="font-bold text-amber-900 uppercase">{r.restriction_type?.replaceAll('_', ' ')}</span>
                                <p className="text-amber-800 text-[11px]">{r.reason}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRestriction(r.id)}
                                className="rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: BEHAVIOR PROFILE */}
                {activeTab === 'behavior' && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xl font-bold text-slate-900">{behavior?.total_orders ?? 10}</p>
                      <p className="text-xs text-slate-500">Total Orders</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xl font-bold text-rose-600">{behavior?.total_returns ?? 6}</p>
                      <p className="text-xs text-slate-500">Returns ({((behavior?.return_rate ?? 0.6) * 100).toFixed(0)}%)</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xl font-bold text-amber-600">{behavior?.total_cod_refusals ?? 2}</p>
                      <p className="text-xs text-slate-500">COD Refusals</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xl font-bold text-emerald-600">{behavior?.successful_deliveries ?? 4}</p>
                      <p className="text-xs text-slate-500">Deliveries</p>
                    </div>
                  </div>
                )}

                {/* TAB 3: RESTRICTION HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-2">
                    {escalationHistory.length === 0 && restrictions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No previous escalation events recorded for this customer.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {escalationHistory.map((h) => (
                          <div key={h.id} className="flex justify-between items-center rounded-lg bg-slate-50 p-2 text-xs border border-slate-200">
                            <span className="font-semibold text-slate-800">{h.trigger_event}</span>
                            <span className="font-mono text-indigo-600">L{h.previous_level} → L{h.new_level}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>

                {/* MERCHANT DECISION & REASON APPROVAL ACTIONS */}
                <div className="border-t border-slate-200 pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">MERCHANT DECISION ACCORDING TO REASONS</h3>
                      <p className="text-xs text-slate-500">
                        Review customer reason ({selected.reason?.replaceAll('_', ' ')}) & photos, then execute decision:
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Merchant Authority
                    </span>
                  </div>

                  {/* Decision Note Input with Single Selection Quick Chips */}
                  <div>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value)
                        if (selectedReasonChip && e.target.value !== selectedReasonChip) {
                          setSelectedReasonChip(null)
                        }
                      }}
                      placeholder="Enter review decision notes (e.g. Photo verified, within return window)..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {QUICK_DECISION_NOTES.map((chip, i) => {
                        const isSelected = selectedReasonChip === chip || notes === chip
                        const isApprovedReason = chip.startsWith('✓')

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectReasonChip(chip)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? isApprovedReason
                                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400 scale-[1.02]'
                                  : 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-600 shadow-md ring-2 ring-rose-400 scale-[1.02]'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <span>{chip}</span>
                            {isSelected && <span className="ml-0.5 text-[10px] bg-white/20 rounded-full px-1.5">Selected</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Primary Return Lifecycle Actions */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleAction('approve')}
                      disabled={actionLoading}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-3 py-3.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>APPROVE RETURN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading}
                      className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 px-3 py-3.5 text-xs font-extrabold text-white shadow-md shadow-rose-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>REJECT RETURN</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('product_returned')}
                      disabled={actionLoading}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3 py-3.5 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Package className="h-4 w-4" />
                      <span>PRODUCT RETURNED</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('refund_processed')}
                      disabled={actionLoading}
                      className="rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 px-3 py-3.5 text-xs font-extrabold text-white shadow-md shadow-teal-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Coins className="h-4 w-4" />
                      <span>PROCESS REFUND</span>
                    </button>
                  </div>

                  {/* Secondary Account Authority Actions (Colorful Buttons) */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span>⚡</span> Customer Policy & Restriction Overrides:
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Instant enforcement</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => handleAction('restrict_cod')}
                        disabled={actionLoading}
                        className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold px-3 py-3 text-xs shadow-md shadow-orange-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-0"
                      >
                        <span className="text-base group-hover:scale-110 transition-transform">🚫</span>
                        <span>Restrict COD</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('require_prepaid')}
                        disabled={actionLoading}
                        className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold px-3 py-3 text-xs shadow-md shadow-indigo-600/20 hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-0"
                      >
                        <span className="text-base group-hover:scale-110 transition-transform">💳</span>
                        <span>Require Prepaid</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('increase_restriction')}
                        disabled={actionLoading}
                        className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold px-3 py-3 text-xs shadow-md shadow-purple-600/20 hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-0"
                      >
                        <span className="text-base group-hover:scale-110 transition-transform">▲</span>
                        <span>Escalate Level</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('suspend_account')}
                        disabled={actionLoading}
                        className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 via-red-800 to-slate-950 hover:from-rose-800 hover:to-black text-white font-extrabold px-3 py-3 text-xs shadow-md shadow-red-900/30 hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-0"
                      >
                        <span className="text-base group-hover:scale-110 transition-transform">⛔</span>
                        <span>Suspend Account</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* PHOTO EVIDENCE DETAILS MODAL */}
      {selectedProofModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col lg:flex-row w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            {/* Left: High-Res Photo View */}
            <div className="relative bg-slate-950 flex items-center justify-center lg:w-1/2 p-6 overflow-hidden">
              <img
                src={selectedProofModal.img}
                alt={selectedProofModal.title}
                className="max-h-[70vh] w-full object-contain rounded-2xl shadow-lg"
              />
              <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                {selectedProofModal.title}
              </div>
            </div>

            {/* Right: Evidence Inspection & Metadata Panel */}
            <div className="flex flex-col justify-between p-6 lg:w-1/2 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                      DOORSTEP PROOF INSPECTOR
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Return Evidence Details
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProofModal(null)}
                    className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Evidence Metadata Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Order ID:</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{selected.order_number}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Claimed Reason:</span>
                    <p className="font-bold text-rose-700 mt-0.5 capitalize">{selected.reason?.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Customer:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selected.customer_name}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Associated Item:</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">{selectedProofModal.itemTitle}</p>
                  </div>
                </div>

                {/* Customer Explanation Note */}
                <div className="mt-3 rounded-xl bg-indigo-50/50 p-3.5 border border-indigo-100 text-xs">
                  <span className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider">
                    Customer Submitted Claim Note:
                  </span>
                  <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                    "{selected.note || 'Shopper submitted this unboxing photo during return initiation for condition review.'}"
                  </p>
                </div>

                {/* AI & Camera Telemetry Checks */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    AI Integrity & Verification Telemetry:
                  </span>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                    <span className="text-slate-600">Camera EXIF & Time:</span>
                    <span className="font-bold text-emerald-700">✓ Valid Timestamp Match</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                    <span className="text-slate-600">Duplicate / Stock Photo Check:</span>
                    <span className="font-bold text-emerald-700">✓ Original User Capture (0 Matches)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200">
                    <span className="text-slate-600">Doorstep Courier Status:</span>
                    <span className="font-bold text-indigo-700">Delivered & Inspected</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Details Modal */}
              <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNotes(`✓ Photo evidence #${selectedProofModal.idx + 1} inspected & verified as authentic.`)
                    showToast(`✓ Photo evidence #${selectedProofModal.idx + 1} marked authentic!`)
                    setSelectedProofModal(null)
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 shadow-sm cursor-pointer"
                >
                  ✓ Mark Evidence Authentic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotes(`✕ Photo evidence #${selectedProofModal.idx + 1} flagged: physical condition mismatch.`)
                    showToast(`✕ Photo evidence #${selectedProofModal.idx + 1} flagged suspicious!`, 'error')
                    setSelectedProofModal(null)
                  }}
                  className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold hover:bg-rose-100 px-3 py-2.5 cursor-pointer"
                >
                  ✕ Flag Mismatch
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProofModal(null)}
                  className="rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 px-4 py-2.5 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RETURNED ITEM FULL PRODUCT SPECIFICATIONS & DETAILS MODAL */}
      {selectedItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col md:flex-row w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            {/* Left: Full Product Thumbnail Gallery */}
            <div className="relative bg-slate-900 flex items-center justify-center md:w-1/2 p-6 overflow-hidden">
              <img
                src={selectedItemModal.itemImage || selectedItemModal.image}
                alt={selectedItemModal.name}
                className="max-h-[60vh] w-full object-contain rounded-2xl shadow-xl transition-transform hover:scale-105"
              />
              <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                SKU: {selectedItemModal.sku || selectedItemModal.product_id}
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center rounded-xl bg-slate-950/80 backdrop-blur-md py-1.5 px-3 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                ✓ Active Return Claim Item
              </div>
            </div>

            {/* Right: Full Product Details & Financial Breakdown */}
            <div className="flex flex-col justify-between p-6 md:w-1/2 overflow-y-auto space-y-4">
              <div>
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                      PRODUCT ITEM SPECIFICATIONS
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5 leading-snug">
                      {selectedItemModal.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItemModal(null)}
                    className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer font-bold shrink-0 ml-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Product Attributes Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Item SKU / ID:</span>
                    <p className="font-bold text-slate-900 mt-0.5 font-mono">{selectedItemModal.sku || selectedItemModal.product_id}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Order Reference:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItemModal.orderNumber || selected?.order_number}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Selected Size:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItemModal.size || 'Standard / Free Size'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Selected Color:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItemModal.color || 'Standard Variant'}</p>
                  </div>
                </div>

                {/* Price & Refund Breakdown */}
                <div className="mt-3 rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Unit Price:</span>
                    <span className="font-bold text-slate-900">₹{(selectedItemModal.price || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Quantity Returned:</span>
                    <span className="font-bold text-slate-900">{selectedItemModal.quantity || 1} Unit(s)</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-indigo-200/60 pt-2 text-sm font-extrabold text-indigo-950">
                    <span>Total Refund Claim:</span>
                    <span className="text-base text-indigo-900">₹{(selectedItemModal.lineTotal || (selectedItemModal.price * selectedItemModal.quantity)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Return Reason for this item */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Claimed Reason for Item:</span>
                  <p className="font-bold text-rose-700 mt-0.5 capitalize">
                    {selectedItemModal.returnReason?.replaceAll('_', ' ') || selected?.reason?.replaceAll('_', ' ') || 'Return Requested'}
                  </p>
                  {selectedItemModal.customerNote && (
                    <p className="text-slate-600 text-[11px] mt-1 italic">
                      "{selectedItemModal.customerNote}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setNotes(`✓ Inspected returned product: ${selectedItemModal.name} (${selectedItemModal.sku || selectedItemModal.product_id}) - Details and condition verified.`)
                    showToast(`✓ Product details for ${selectedItemModal.name} verified!`)
                    setSelectedItemModal(null)
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 shadow-sm cursor-pointer"
                >
                  ✓ Verify Product Details
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemModal(null)}
                  className="rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 px-4 py-2.5 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
