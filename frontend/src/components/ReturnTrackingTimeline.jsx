import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  Calendar,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Package,
} from 'lucide-react'
import { api } from '../mock/api'
import { INR } from '../lib/format'

export default function ReturnTrackingTimeline({ returnId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleMessage, setRescheduleMessage] = useState('')

  useEffect(() => {
    if (returnId) {
      setLoading(true)
      api
        .getShopperReturnTracking(returnId)
        .then((res) => setData(res))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [returnId])

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Loading return milestones…</p>
      </div>
    )
  }

  if (!data) return null

  const handleCallDriver = () => {
    setCalling(true)
    setTimeout(() => {
      alert(`Connecting call to courier partner (${data.driver?.phone || '+91 98451 22301'})…`)
      setCalling(false)
    }, 600)
  }

  const handleReschedule = () => {
    setRescheduling(true)
    setTimeout(() => {
      setRescheduleMessage('✓ Pickup rescheduled to Day After Tomorrow (10:00 AM – 1:00 PM)')
      setRescheduling(false)
    }, 800)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Reverse Logistics & Reverse Tracking
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Return ID: {data.return_id} ({data.order_number})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reason: <span className="font-semibold text-slate-700">{data.reason}</span> · Type:{' '}
            <span className="font-semibold text-indigo-600 uppercase">{data.type}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> Auto-Approved
          </span>
        </div>
      </div>

      {/* ── Driver Live Dispatch Banner ── */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{data.driver?.name}</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                  ⚡ En Route
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {data.driver?.distance} · Expected ETA {data.driver?.eta} · {data.driver?.vehicle}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pickup Slot: {data.pickup_slot}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCallDriver}
              disabled={calling}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 transition"
            >
              <Phone className="h-3.5 w-3.5" /> {calling ? 'Connecting…' : 'Call Driver'}
            </button>
            <button
              onClick={handleReschedule}
              disabled={rescheduling}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <Calendar className="h-3.5 w-3.5" /> {rescheduling ? 'Updating…' : 'Reschedule'}
            </button>
          </div>
        </div>

        {rescheduleMessage && (
          <p className="mt-3 rounded-lg bg-emerald-100/70 p-2 text-center text-xs font-bold text-emerald-800">
            {rescheduleMessage}
          </p>
        )}
      </div>

      {/* ── Timeline Visualizer ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Milestone Progression
        </h3>
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {data.milestone_steps?.map((step, idx) => (
            <div key={step.id || idx} className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold ${
                  step.completed ? 'bg-indigo-600 shadow-sm' : 'bg-slate-300'
                }`}
              >
                {step.completed ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <p
                  className={`text-xs font-bold ${
                    step.completed ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                {step.date && <p className="text-[11px] text-slate-400">{step.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exchange or Refund Summary Footnote */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-500">Expected Settlement Date:</span>{' '}
          <span className="font-bold text-slate-900">{data.expected_refund_date}</span>
        </div>
        <div className="font-bold text-indigo-600">{data.refund_method}</div>
      </div>
    </div>
  )
}
