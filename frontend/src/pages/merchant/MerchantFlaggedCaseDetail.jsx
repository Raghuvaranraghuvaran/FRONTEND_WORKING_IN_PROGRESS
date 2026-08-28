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
  const [similarCases, setSimilarCases] = useState([])

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
          // Load similar cases
          const allReturns = await api.getMerchantReturns()
          const similar = (allReturns || []).filter(r =>
            String(r.id) !== String(found.id) &&
            (r.user_id === found.user_id || r.order_number === found.order_number)
          ).slice(0, 5)
          setSimilarCases(similar)
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

      {/* Risk Score Breakdown Chart */}
      {(() => {
        const checkpoints = returnCase.checkpoint_signals || []
        const typeA = checkpoints.filter(c => c.tier_type === 'A').reduce((s, c) => s + (c.score_delta || 0), 0)
        const typeB = checkpoints.filter(c => c.tier_type === 'B').reduce((s, c) => s + (c.score_delta || 0), 0)
        const typeC = checkpoints.filter(c => c.tier_type === 'C').reduce((s, c) => s + (c.score_delta || 0), 0)
        const total = Math.max(typeA + typeB + typeC, 1)
        const score = returnCase.risk_score || 0
        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <span>📊</span> Risk Score Breakdown
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-3xl font-black text-slate-900">{score}</span>
                  <span className="text-xs text-slate-500 font-bold">/ 100 pts</span>
                  <RiskBadge tier={returnCase.risk_tier} />
                </div>
                {/* Horizontal stacked bar */}
                <div className="h-4 rounded-full overflow-hidden bg-slate-100 flex border border-slate-200">
                  {typeA > 0 && <div style={{ width: `${(typeA / total) * 100}%` }} className="bg-emerald-500 transition-all" title={`Type A: +${typeA} pts`} />}
                  {typeB > 0 && <div style={{ width: `${(typeB / total) * 100}%` }} className="bg-amber-500 transition-all" title={`Type B: +${typeB} pts`} />}
                  {typeC > 0 && <div style={{ width: `${(typeC / total) * 100}%` }} className="bg-rose-500 transition-all" title={`Type C: +${typeC} pts`} />}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Policy ({typeA} pts)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Product ({typeB} pts)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Behavior ({typeC} pts)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Timeline Visualization */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-1.5">
          <span>⏳</span> Return Timeline
        </h3>
        <div className="relative">
          {(() => {
            const steps = [
              { label: 'Return Requested', time: returnCase.created_at, done: true, icon: '📝' },
              { label: 'Pickup Scheduled', time: returnCase.pickup_slot, done: returnCase.status !== 'pending', icon: '🚚' },
              { label: 'Product Inspection', time: returnCase.verification_status === 'Verified' ? returnCase.updated_at : null, done: !!returnCase.verification_status, icon: '🔍' },
              { label: 'Risk Evaluation', time: returnCase.risk_score ? returnCase.updated_at : null, done: !!returnCase.risk_score, icon: '⚖️' },
              { label: 'Merchant Decision', time: ['approved', 'rejected', 'hold'].includes(returnCase.status) ? returnCase.updated_at : null, done: ['approved', 'rejected', 'hold'].includes(returnCase.status), icon: '✅' },
            ]
            return (
              <div className="flex items-start gap-0">
                {steps.map((step, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center relative">
                    {/* Connector line */}
                    {i > 0 && (
                      <div className={`absolute top-4 right-1/2 w-full h-0.5 ${step.done ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                    )}
                    {/* Step circle */}
                    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm ${
                      step.done
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {step.done ? '✓' : step.icon}
                    </div>
                    <span className={`text-[10px] font-bold mt-1.5 text-center ${step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                    {step.time && (
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {formatDate(step.time)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Similar Cases */}
      {similarCases.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
            <span>🔗</span> Similar Cases ({similarCases.length})
          </h3>
          <div className="space-y-2">
            {similarCases.map(c => (
              <Link
                key={c.id}
                to={`/merchant/flagged-cases/${c.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-white hover:border-amber-400 transition-all no-underline"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-amber-700">#{c.id}</span>
                  <span className="text-xs font-bold text-slate-900">Order {c.order_number}</span>
                  <RiskBadge tier={c.risk_tier} />
                  <StatusBadge status={c.status} />
                </div>
                <span className="text-xs text-slate-500">{formatDate(c.created_at)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
              {/* Customer Lifetime Value Card */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-violet-50/40 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💎</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">Customer Lifetime Value</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Total Revenue</span>
                    <p className="font-mono text-xl font-black text-indigo-900 mt-0.5">
                      ₹{((behavior?.total_orders ?? 10) * (behavior?.avg_order_value || 2850)).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Avg Order Value</span>
                    <p className="font-mono text-xl font-black text-indigo-900 mt-0.5">
                      ₹{(behavior?.avg_order_value || 2850).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Refund Amount</span>
                    <p className="font-mono text-xl font-black text-rose-700 mt-0.5">
                      ₹{((behavior?.total_returns ?? 2) * (behavior?.avg_order_value || 2850)).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-400">Net Value</span>
                    <p className={`font-mono text-xl font-black mt-0.5 ${
                      ((behavior?.total_orders ?? 10) - (behavior?.total_returns ?? 2)) * (behavior?.avg_order_value || 2850) > 0
                        ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      ₹{(((behavior?.total_orders ?? 10) - (behavior?.total_returns ?? 2)) * (behavior?.avg_order_value || 2850)).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-500 mt-3 font-semibold">
                  💡 {((behavior?.return_rate || 0.2) * 100).toFixed(0)}% return rate — {
                    (behavior?.return_rate || 0.2) < 0.15 ? 'Loyal customer. Consider leniency.' :
                    (behavior?.return_rate || 0.2) < 0.3 ? 'Moderate risk. Monitor patterns.' :
                    'High-risk customer. Apply stricter verification.'
                  }
                </p>
              </div>

              {/* Behavior Stats */}
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

              {/* Return History List */}
              {behavior?.recent_returns?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-3">📜 Recent Return History</h4>
                  <div className="space-y-2">
                    {behavior.recent_returns.map((ret, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                        <div className="flex items-center gap-3">
                          <RiskBadge tier={ret.risk_tier} />
                          <span className="font-bold text-slate-900 capitalize">{ret.reason?.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-700">₹{(ret.value || 0).toLocaleString()}</span>
                          <StatusBadge status={ret.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>⚖️</span> Merchant Decision
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review signals and execute your final decision below.
              </p>
            </div>
            <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/20">
              Status: <strong className="uppercase">{returnCase.status}</strong>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Decision Notes</label>
            <input
              type="text"
              placeholder="Add notes for this decision..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Primary Decision Buttons - Clear Visual Hierarchy */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Decision</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('approved', 'Approved for original payment refund')}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-3 text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer border border-emerald-600"
              >
                <Check className="h-5 w-5" /> <span>Approve Refund</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('approved', 'Approved with Store Credit (+5% bonus value)')}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-3 py-3 text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer border border-blue-600"
              >
                <Coins className="h-5 w-5" /> <span>Store Credit +5%</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('approved', 'Replacement item dispatched (Size / Variant swap)')}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-3 text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer border border-indigo-600"
              >
                <Package className="h-5 w-5" /> <span>Replacement</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('hold', 'Case placed on HOLD awaiting warehouse physical inspection')}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-3 text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer border border-amber-600"
              >
                <AlertTriangle className="h-5 w-5" /> <span>Hold</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => handleDecision('rejected', 'Rejected: Policy violation / physical proof mismatch')}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-3 py-3 text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer border border-rose-600"
              >
                <X className="h-5 w-5" /> <span>Reject</span>
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setApplyingRestriction(true)
                  handleDecision('rejected', 'Rejected & customer account restricted for repeated fraud')
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white px-3 py-3 text-xs font-bold shadow-sm transition-all active:scale-[0.97] cursor-pointer border border-red-800"
              >
                <ShieldAlert className="h-5 w-5" /> <span>Reject + Restrict</span>
              </button>
            </div>
          </div>

          {/* Restriction Checkbox */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200">
            <input
              type="checkbox"
              checked={applyingRestriction}
              onChange={(e) => setApplyingRestriction(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Apply customer restriction alongside this decision</span>
          </label>

          {/* Customer Account Actions - Clearly Separated */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                🛡️ Customer Account Actions
              </span>
              <span className="text-xs text-slate-500">
                Target: <strong className="text-slate-900">{returnCase.customer_name}</strong> (Level {currentLevel})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
                className="flex flex-col items-center gap-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">📱</span> Force OTP
              </button>
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
                className="flex flex-col items-center gap-1 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">💳</span> Block COD
              </button>
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
                className="flex flex-col items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">🚫</span> Suspend
              </button>
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
                className="flex flex-col items-center gap-1 rounded-xl bg-slate-900 hover:bg-black text-white border border-slate-950 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">⛔</span> Permanent Ban
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`🛡️ Device token added to Suspicious Hardware Blacklist`, 'success')
                }}
                className="flex flex-col items-center gap-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">🛡️</span> Flag Device
              </button>
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
                className="flex flex-col items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="text-base">🟢</span> Restore Account
              </button>
            </div>
          </div>

          {/* Utility Actions */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => showToast(`📲 SMS OTP verification triggered`, 'success')}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                📱 Send SMS OTP
              </button>
              <button
                type="button"
                onClick={() => showToast(`🚚 Warehouse pickup scheduled`, 'success')}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                🚚 Dispatch Pickup
              </button>
              <button
                type="button"
                onClick={() => showToast(`💬 Notification sent to ${returnCase.customer_name}`, 'success')}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
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
                  showToast('📄 Audit dossier downloaded', 'success')
                }}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                📄 Export Dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
