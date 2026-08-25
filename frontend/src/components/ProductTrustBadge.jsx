import { ShieldCheck, RefreshCw, Truck, Sparkles, CheckCircle2 } from 'lucide-react'

export default function ProductTrustBadge({ returnWindowDays = 30, isReturnable = true }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 p-4 shadow-sm">
      {/* Seal Header */}
      <div className="flex items-center justify-between border-b border-indigo-100/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
              Protected by ReturnGuard™
              <Sparkles className="h-3 w-3 text-indigo-600" />
            </span>
            <p className="text-[10px] font-medium text-slate-500">Verified Authentic & Frictionless Returns</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          Smart Shield Active
        </span>
      </div>

      {/* Pillars */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/80 p-2 border border-slate-100">
          <RefreshCw className="mx-auto h-4 w-4 text-indigo-600 mb-1" />
          <p className="text-[11px] font-bold text-slate-900">
            {isReturnable ? `${returnWindowDays}-Day Returns` : 'Final Sale'}
          </p>
          <p className="text-[9px] text-slate-500">
            {isReturnable ? 'Hassle-free guarantee' : 'Non-returnable item'}
          </p>
        </div>

        <div className="rounded-xl bg-white/80 p-2 border border-slate-100">
          <Truck className="mx-auto h-4 w-4 text-indigo-600 mb-1" />
          <p className="text-[11px] font-bold text-slate-900">Free Pickup</p>
          <p className="text-[9px] text-slate-500">Doorstep courier service</p>
        </div>

        <div className="rounded-xl bg-white/80 p-2 border border-slate-100">
          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 mb-1" />
          <p className="text-[11px] font-bold text-slate-900">Instant Exchange</p>
          <p className="text-[9px] text-slate-500">Zero fee size swap</p>
        </div>
      </div>
    </div>
  )
}
