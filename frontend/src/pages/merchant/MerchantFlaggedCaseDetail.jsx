import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../mock/api'
import { formatDate } from '../../lib/format'
import RiskBadge from '../../components/RiskBadge'
import StatusBadge from '../../components/StatusBadge'
import RiskCheckpointsPipeline from '../../components/RiskCheckpointsPipeline'
import ProductVerificationPanel from '../../components/ProductVerificationPanel'
import ProductSwapAlertCard from '../../components/ProductSwapAlertCard'
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Package,
  Camera,
  Coins,
  FileText,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Check,
  X,
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
    title: 'Freeze + Review',
    subtitle: 'High-risk automated return hold',
    icon: '🔴',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    activeClass: 'border-rose-500 bg-rose-50/90 text-rose-950 ring-2 ring-rose-500 shadow-md',
  },
  {
    level: 4,
    title: 'Term Escalation',
    subtitle: 'High-risk strict delivery gate',
    icon: '⛔',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    activeClass: 'border-red-500 bg-red-50/90 text-red-950 ring-2 ring-red-500 shadow-md',
  },
  {
    level: 5,
    title: 'Final Ban',
    subtitle: 'Permanent account cancellation',
    icon: '🚫',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    activeClass: 'border-red-700 bg-red-100 text-red-950 ring-2 ring-red-700 shadow-lg',
  },
]

export default function MerchantFlaggedCaseDetail() {
  const { caseId } = useParams()
  const navigate = useNavigate()

  const [returnCase, setReturnCase] = useState(null)
  const [behavior, setBehavior] = useState(null)
  const [escalationHistory, setEscalationHistory] = useState([])
  const [restrictions, setRestrictions] = useState([])
  const [currentLevel, setCurrentLevel] = useState(0)
  const [activeTab, setActiveTab] = useState('checkpoints')
  const [loading, setLoading] = useState(true)

  // Decision state
  const [decisionNotes, setDecisionNotes] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [applyingRestriction, setApplyingRestriction] = useState(false)
  const [restrictionType, setRestrictionType] = useState('cod_block')
  const [restrictionDuration, setRestrictionDuration] = useState('30_days')
  const [updating, setUpdating] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadCase = async () => {
    setLoading(true)
    try {
      const returns = await api.getMerchantReturns()
      const found = (returns || []).find(r => String(r.id) === String(caseId))
      if (!found) {
        navigate('/merchant/flagged-cases', { replace: true })
        return
      }
      setReturnCase(found)

      // Fetch customer profile & review details
      if (found.user_id) {
        try {
          const reviewData = await api.getCustomerReview(found.user_id)
          setBehavior(reviewData?.behavior || { total_orders: 10, total_returns: 2, return_rate: 0.2 })
          setCurrentLevel(reviewData?.profile?.escalation_level || 0)
          setRestrictions(reviewData?.restrictions || [])
          setEscalationHistory(reviewData?.escalation_history || [])
        } catch (e) {
          console.warn('Customer review fallback:', e)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCase()
  }, [caseId])

  const handleDecision = async (status, reasonOverride) => {
    if (!returnCase) return
    setUpdating(true)
    const reasonText = reasonOverride || selectedReason || 'Merchant decision finalized'
    const fullNotes = decisionNotes ? `${reasonText} — ${decisionNotes}` : reasonText

    try {
      const action = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status
      await api.reviewReturn({
        returnId: returnCase.id,
        action,
        notes: fullNotes,
      })

      // If applying restriction alongside decision
      if (applyingRestriction && returnCase.user_id) {
        await api.performMerchantAction({
          customerId: returnCase.user_id,
          action: 'restrict_cod',
          notes: `Applied during ${status.toUpperCase()} of Return #${returnCase.id}: ${reasonText}`,
        })
      }

      showToast(`Return #${returnCase.id} successfully marked as ${status.toUpperCase()}!`, 'success')
      setReturnCase(prev => ({ ...prev, status }))
      setTimeout(() => {
        loadCase()
      }, 800)
    } catch (err) {
      showToast(err.message || 'Action failed', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleSetEscalationLevel = async (level) => {
    if (!returnCase?.user_id) return
    try {
      await api.performMerchantAction({
        customerId: returnCase.user_id,
        action: 'set_escalation_level',
        escalation_level: level,
        notes: `Manual escalation shift from case review #${returnCase.id}`,
      })
      setCurrentLevel(level)
      showToast(`Customer escalation set to Step ${level} (${ESCALATION_STEPS[level]?.title})`, 'success')
      loadCase()
    } catch (err) {
      showToast(err.message || 'Failed to update level', 'error')
    }
  }

  const handleRemoveRestriction = async (restrictionId) => {
    try {
      if (returnCase?.user_id) {
        await api.performMerchantAction({
          customerId: returnCase.user_id,
          action: 'lift_restrictions',
          notes: 'Merchant removed active restriction',
        })
      }
      showToast('Restriction removed successfully', 'success')
      loadCase()
    } catch (err) {
      showToast(err.message || 'Failed to remove restriction', 'error')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    )
  }

  if (!returnCase) return null

  const activeRestrictions = restrictions.filter(r => r.is_active)

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`fixed top-20 right-8 z-50 rounded-2xl p-4 shadow-xl border text-sm font-bold flex items-center gap-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <span>{toastMessage.type === 'error' ? '❌' : '✅'}</span>
          <span>{toastMessage.msg}</span>
        </motion.div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/merchant/flagged-cases')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Back to all cases"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/merchant/flagged-cases" className="hover:text-indigo-600">Flagged Cases</Link>
              <span>/</span>
              <span className="font-mono text-indigo-600 font-bold">#{returnCase.id}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Case Review: Order {returnCase.order_number}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge tier={returnCase.risk_tier} />
          <StatusBadge status={returnCase.status} />
        </div>
      </div>

      {/* Main Case Summary Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Customer Details</span>
            <p className="text-sm font-extrabold text-slate-900">{returnCase.customer_name}</p>
            <p className="text-xs text-slate-500 font-medium">{returnCase.customer_email || 'demo@shopper.com'}</p>
          </div>

          <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
            <span className="text-[11px] font-bold uppercase text-slate-400">Return Reason</span>
            <p className="text-sm font-extrabold text-slate-900 capitalize flex items-center gap-1.5">
              <span>🏷️</span> {returnCase.reason?.replaceAll('_', ' ')}
            </p>
            <p className="text-xs text-slate-500 truncate">"{returnCase.note || 'Standard return request'}"</p>
          </div>

          <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
            <span className="text-[11px] font-bold uppercase text-slate-400">Claimed Order Value</span>
            <p className="text-base font-black text-slate-900 font-mono">
              ₹{(
                (returnCase.return_lines && returnCase.return_lines.length > 0)
                  ? returnCase.return_lines.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                  : (returnCase.order_total || returnCase.total || 6499)
              ).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500">{(returnCase.return_lines?.length || 1)} Item(s) Claimed</p>
          </div>

          <div className="space-y-1 md:pl-4 pt-3 md:pt-0">
            <span className="text-[11px] font-bold uppercase text-slate-400">Submission Timestamp</span>
            <p className="text-sm font-bold text-slate-800">{formatDate(returnCase.created_at)}</p>
            <p className="text-xs text-slate-500">Pickup: {returnCase.pickup_slot || 'Tomorrow'}</p>
          </div>
        </div>
      </div>

      {/* SHOWSTOPPER: Product Swap Alert Hero Card (CP21) */}
      {returnCase.is_product_swap_detected && (
        <ProductSwapAlertCard
          purchased={returnCase.swap_purchased || {
            name: returnCase.return_lines?.[0]?.name || 'Nike Air Max 270',
            price: returnCase.return_lines?.[0]?.price || 8000,
            sku: returnCase.return_lines?.[0]?.sku || 'NK-AM270-BLK-9',
            color: returnCase.return_lines?.[0]?.color || 'Black',
            size: returnCase.return_lines?.[0]?.size || '9',
            image: returnCase.return_lines?.[0]?.image || returnCase.images?.[0],
            serial: 'SN-NK-892401',
          }}
          returned={returnCase.swap_returned || {
            name: 'Generic Runner / Counterfeit Replica',
            price: 2000,
            sku: 'NK-REPLICA-987',
            color: 'Faded Black',
            size: '8.5',
            image: returnCase.images?.[1] || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80',
            serial: 'TAG-REMOVED-FAKE',
          }}
          riskScore={returnCase.risk_score || 95}
        />
      )}

      {/* Progressive Escalation Ladder (PDF §6 & §7) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>🪜</span> Progressive Escalation Ladder (PDF §6 & §7)
            </h3>
            <p className="text-[11px] text-slate-500">
              Click on any step below to instantaneously test and adjust the customer's escalation tier.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
            Active: Step {currentLevel} ({ESCALATION_STEPS[currentLevel]?.title})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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

      {/* Modern Highlighted Tabs Bar */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'checkpoints', label: '🔬 28-Checkpoint Pipeline', badge: '28 Checks', badgeColor: 'bg-indigo-100 text-indigo-800' },
          { id: 'verification', label: '🔍 Physical Verification', badge: 'Inspection', badgeColor: 'bg-purple-100 text-purple-800' },
          { id: 'overview', label: '📋 Case Dossier & Proofs', badge: `${returnCase.return_lines?.length || 1} Item(s)`, badgeColor: 'bg-emerald-100 text-emerald-800' },
          { id: 'behavior', label: '👤 Customer Profile', badge: `${((behavior?.return_rate || 0.3) * 100).toFixed(0)}% Rate`, badgeColor: 'bg-amber-100 text-amber-800' },
          { id: 'history', label: '⚖️ Restriction History', badge: `${escalationHistory.length + restrictions.length}`, badgeColor: 'bg-rose-100 text-rose-800' },
        ].map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md scale-[1.02]'
                  : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-950 border border-slate-200/60 shadow-2xs'
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                isActive ? 'bg-white/20 text-white' : t.badgeColor
              }`}>
                {t.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {/* TAB 0: 28-CHECKPOINTS PIPELINE */}
          {activeTab === 'checkpoints' && (
            <RiskCheckpointsPipeline
              checkpoints={returnCase.checkpoint_signals || []}
              riskScore={returnCase.risk_score || 25}
              riskTier={returnCase.risk_tier || 'Low'}
              returnData={returnCase}
              onGoToVerification={() => setActiveTab('verification')}
              decision={{
                recommended_action: returnCase.risk_tier === 'Critical' ? 'hold' : returnCase.risk_tier === 'High' || returnCase.status === 'manual_review' ? 'manual_review' : returnCase.risk_tier === 'Medium' ? 'verify' : 'accept',
                status: returnCase.status,
                requires_otp: returnCase.risk_tier === 'Medium',
              }}
            />
          )}

          {/* TAB 1: PRODUCT VERIFICATION PANEL */}
          {activeTab === 'verification' && (
            <ProductVerificationPanel
              returnData={returnCase}
              onVerificationComplete={(updatedResult) => {
                showToast('Product verification submitted and risk score updated!', 'success')
                setReturnCase(prev => ({
                  ...prev,
                  risk_score: updatedResult.risk_score || prev.risk_score,
                  risk_tier: updatedResult.risk_tier || prev.risk_tier,
                  verification_status: updatedResult.verification_status || 'Verified',
                  serial_mismatch: updatedResult.serial_mismatch,
                  product_condition: updatedResult.product_condition,
                  packaging_condition: updatedResult.packaging_condition,
                  accessories_missing: updatedResult.accessories_missing,
                }))
                loadCase()
              }}
            />
          )}

          {/* TAB 2: COMPLETE CASE DOSSIER & PROOFS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Claimed Return Items */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-3 flex items-center gap-2">
                  <span>📦</span> Claimed Return Items ({(returnCase.return_lines?.length || 1)})
                </h4>
                <div className="space-y-2.5">
                  {(returnCase.return_lines || [
                    { name: 'Product Item', quantity: 1, price: returnCase.order_total || 2499, size: 'M', color: 'Standard', sku: 'SKU-001' }
                  ]).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover border border-slate-200 bg-white" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">👕</div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku || 'N/A'} • Size: {item.size || 'Free'} • Color: {item.color || 'Standard'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-slate-900">₹{(item.price || 0).toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Qty: {item.quantity || 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Notes & Shopper Self Report */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Return Reason & Note</span>
                  <div className="font-bold text-sm text-slate-900 capitalize mt-1 flex items-center gap-1.5">
                    <span>🏷️</span> {returnCase.reason?.replaceAll('_', ' ')}
                  </div>
                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-2 font-medium leading-relaxed">
                    "{returnCase.note || 'No specific customer note entered.'}"
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Shopper Self-Reported Metrics</span>
                  <div className="font-bold text-xs text-slate-900 mt-1">
                    Reported Condition: <span className="text-indigo-600 capitalize">{returnCase.shopper_reported_condition || 'Standard Unused with tags'}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Shopper Serial: <span className="font-mono font-bold text-slate-700">{returnCase.shopper_serial_number || '— (None reported)'}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Refund Method: <span className="font-bold text-slate-800 capitalize">{returnCase.refund_method?.replace(/_/g, ' ') || 'Original payment'}</span>
                  </div>
                </div>
              </div>

              {/* Photos Gallery */}
              {returnCase.images?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-3 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-indigo-600" /> Attached Photo Proofs ({returnCase.images.length})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {returnCase.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs hover:border-indigo-500 transition-all"
                      >
                        <img src={img} alt={`Proof ${i + 1}`} className="h-28 w-28 object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                          Enlarge ↗
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Risk Signals */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-2">
                  🤖 AI Risk Signals Detected
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(returnCase.signals?.length ? returnCase.signals : ['Standard return request', 'Within return window']).map(
                    (signal, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        <span className="text-indigo-600 font-bold">•</span>
                        {signal}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER BEHAVIOR PROFILE */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <p className="text-2xl font-black text-slate-900">{behavior?.total_orders ?? 10}</p>
                  <p className="text-xs text-slate-500 font-bold">Total Orders</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <p className="text-2xl font-black text-slate-900">{behavior?.total_returns ?? 2}</p>
                  <p className="text-xs text-slate-500 font-bold">Total Returns</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <p className="text-2xl font-black text-slate-900">{((behavior?.return_rate || 0.2) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-500 font-bold">Return Rate</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <p className="text-2xl font-black text-slate-900">{behavior?.confirmed_violations ?? 0}</p>
                  <p className="text-xs text-slate-500 font-bold">Violations</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESTRICTION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {activeRestrictions.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs">
                  <h4 className="text-xs font-extrabold uppercase text-amber-900 tracking-wider mb-3">
                    ⚠ Active Customer Restrictions ({activeRestrictions.length})
                  </h4>
                  <div className="space-y-2.5">
                    {activeRestrictions.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-3.5 text-xs shadow-2xs">
                        <div>
                          <span className="font-black text-amber-950 uppercase">{r.restriction_type?.replaceAll('_', ' ')}</span>
                          <p className="text-amber-900 text-xs mt-0.5">{r.reason}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRestriction(r.id)}
                          className="rounded-lg bg-amber-100 border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-3">
                  📜 Escalation & Restriction Audit Trail
                </h4>
                {escalationHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No previous escalation records for this customer account.</p>
                ) : (
                  <div className="space-y-2">
                    {escalationHistory.map((hist, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{hist.action}</span>
                          <p className="text-[11px] text-slate-500">{hist.notes || hist.reason}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{formatDate(hist.created_at || hist.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Merchant Authority Decision Bar */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>⚖️</span> Merchant Final Authority & Decision
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review physical findings and checkpoint signals, then execute final decision:
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
            Current Status: <strong className="uppercase text-slate-900">{returnCase.status}</strong>
          </span>
        </div>

        {/* Quick Decision Chips (10 Canonical Templates) */}
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block">
            ⚡ Quick Decision Templates (Click to apply & execute):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '✓ Approved: Photo proof verified & authentic', status: 'approved', color: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800' },
              { label: '✓ Approved: Within 7-day return policy', status: 'approved', color: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800' },
              { label: '✓ Approved: Size replacement authorized', status: 'approved', color: 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800' },
              { label: '🎁 Approved: Store credit + 5% bonus', status: 'approved', color: 'hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800' },
              { label: '⚠️ Hold: Serial/IMEI verification required', status: 'hold', color: 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800' },
              { label: '⚠️ Hold: Product swap / replica inspection', status: 'hold', color: 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800' },
              { label: '✕ Rejected: Item tag removed / worn', status: 'rejected', color: 'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800' },
              { label: '✕ Rejected: Outside 7-day return window', status: 'rejected', color: 'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800' },
              { label: '✕ Rejected: Physical proof mismatch', status: 'rejected', color: 'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800' },
              { label: '🚨 Rejected: Repeated wardrobing / fraud flag', status: 'rejected', color: 'hover:border-red-500 hover:bg-red-50 hover:text-red-900' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedReason(chip.label)
                  setDecisionNotes(chip.label)
                  handleDecision(chip.status, chip.label)
                }}
                className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs ${chip.color}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Notes & Actions */}
        <div className="space-y-3 pt-2">
          <input
            type="text"
            placeholder="Add custom decision notes or customer communication message..."
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />

          {/* Restriction Checkbox & Primary Authority Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyingRestriction}
                onChange={(e) => setApplyingRestriction(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Apply customer restriction alongside decision</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Approve Original Payment */}
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('approved', 'Approved for original payment refund')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-black shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Check className="h-4 w-4" /> Approve (Refund)
              </button>

              {/* 2. Approve Store Credit */}
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('approved', 'Approved with Store Credit (+5% bonus value)')}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 text-xs font-black shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Coins className="h-4 w-4" /> Store Credit (+5%)
              </button>

              {/* 3. Issue Replacement */}
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('approved', 'Replacement item dispatched (Size / Variant swap)')}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 text-xs font-black shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Package className="h-4 w-4" /> Issue Replacement
              </button>

              {/* 4. Put on Hold */}
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('hold', 'Case placed on HOLD awaiting warehouse physical inspection')}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2.5 text-xs font-black shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4" /> Put on Hold
              </button>

              {/* 5. Reject Return */}
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('rejected', 'Rejected: Policy violation / physical proof mismatch')}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 text-xs font-black shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <X className="h-4 w-4" /> Reject Return
              </button>

              {/* 6. Restrict Customer Account */}
              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setApplyingRestriction(true)
                  handleDecision('rejected', 'Rejected & customer account restricted for repeated fraud')
                }}
                className="flex items-center gap-1.5 rounded-xl bg-red-800 hover:bg-red-900 text-white px-3.5 py-2.5 text-xs font-black shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4" /> Reject & Restrict COD
              </button>
            </div>
          </div>

          {/* Customer Account Sanctions & Enforcement Bar (Suspend, Ban, Block COD, Lift) */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50/80 p-3.5 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <span>🛡️</span> Customer Account Sanctions & Interventions:
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Target: <strong className="text-slate-900">{returnCase.customer_name}</strong> (Level {currentLevel})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Suspend Account */}
              <button
                type="button"
                onClick={async () => {
                  if (returnCase.user_id) {
                    await api.performMerchantAction({
                      customerId: returnCase.user_id,
                      action: 'suspend_account',
                      notes: `Account suspended by merchant during review of Return #${returnCase.id}`,
                    })
                    showToast(`🚫 Account for ${returnCase.customer_name} has been SUSPENDED`, 'error')
                    loadCase()
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 text-xs font-black shadow-2xs transition-all cursor-pointer"
              >
                <span>🚫</span> Suspend Account
              </button>

              {/* Permanent Ban */}
              <button
                type="button"
                onClick={async () => {
                  if (returnCase.user_id) {
                    await api.performMerchantAction({
                      customerId: returnCase.user_id,
                      action: 'set_escalation_level',
                      escalation_level: 5,
                      notes: `Permanent account cancellation (Step 5 Ban) on Return #${returnCase.id}`,
                    })
                    showToast(`⛔ Permanent BAN issued for ${returnCase.customer_name}`, 'error')
                    loadCase()
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-slate-950 hover:bg-black text-rose-300 border border-rose-900 px-3 py-1.5 text-xs font-black shadow-2xs transition-all cursor-pointer"
              >
                <span>⛔</span> Permanent Ban (Step 5)
              </button>

              {/* Force Prepaid Only */}
              <button
                type="button"
                onClick={async () => {
                  if (returnCase.user_id) {
                    await api.performMerchantAction({
                      customerId: returnCase.user_id,
                      action: 'require_prepaid',
                      notes: `Forced prepaid-only (COD blocked) on Return #${returnCase.id}`,
                    })
                    showToast(`💳 COD blocked. Customer must pay online for future orders`, 'success')
                    loadCase()
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <span>💳</span> Restrict to Prepaid (Block COD)
              </button>

              {/* Force Checkout OTP */}
              <button
                type="button"
                onClick={async () => {
                  if (returnCase.user_id) {
                    await api.performMerchantAction({
                      customerId: returnCase.user_id,
                      action: 'set_escalation_level',
                      escalation_level: 1,
                      notes: `Warning & OTP required at checkout (Step 1)`,
                    })
                    showToast(`📱 Mandatory SMS OTP set for all future checkouts`, 'success')
                    loadCase()
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <span>📱</span> Force Checkout OTP (Step 1)
              </button>

              {/* Flag Device */}
              <button
                type="button"
                onClick={() => {
                  showToast(`🛡️ Device token device_${returnCase.user_id || '9021'} added to Suspicious Hardware Blacklist`, 'success')
                }}
                className="flex items-center gap-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <span>🛡️</span> Flag Device Token
              </button>

              {/* Lift All Restrictions */}
              <button
                type="button"
                onClick={async () => {
                  if (returnCase.user_id) {
                    await api.performMerchantAction({
                      customerId: returnCase.user_id,
                      action: 'lift_restrictions',
                      notes: `Merchant lifted all account restrictions and reset to Step 0`,
                    })
                    await api.performMerchantAction({
                      customerId: returnCase.user_id,
                      action: 'set_escalation_level',
                      escalation_level: 0,
                      notes: `Reset to Step 0 (Normal Ordering)`,
                    })
                    showToast(`🟢 All restrictions lifted! Customer account restored to Normal`, 'success')
                    loadCase()
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 px-3 py-1.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <span>🟢</span> Restore Account (Lift Bans)
              </button>
            </div>
          </div>

          {/* Quick Ops & Utility Actions Bar */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              🛠️ Operational Tools & Direct Interventions:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => showToast(`📲 SMS OTP verification triggered to customer (${returnCase.customer_name})`, 'success')}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                📱 Send SMS OTP
              </button>
              <button
                type="button"
                onClick={() => showToast(`🚚 Warehouse pickup scheduled for ${returnCase.pickup_slot || 'Tomorrow'}`, 'success')}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                🚚 Dispatch Pickup
              </button>
              <button
                type="button"
                onClick={() => showToast(`💬 SMS & In-app notification sent to ${returnCase.customer_name}`, 'success')}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                💬 Message Shopper
              </button>
              <button
                type="button"
                onClick={() => {
                  const jsonStr = JSON.stringify(returnCase, null, 2)
                  const blob = new Blob([jsonStr], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `Case_Audit_Return_${returnCase.id}.json`
                  a.click()
                  showToast('📄 Audit dossier JSON downloaded', 'success')
                }}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors cursor-pointer shadow-2xs"
              >
                📄 Export Dossier (JSON)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
