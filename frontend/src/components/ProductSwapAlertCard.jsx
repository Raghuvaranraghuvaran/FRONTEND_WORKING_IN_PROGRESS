import { motion } from 'framer-motion'

export default function ProductSwapAlertCard({
  purchased = {
    name: 'Nike Air Max 270',
    price: 8000,
    sku: 'NK-AM270-BLK-9',
    color: 'Triple Black',
    size: 'UK 9',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    serial: 'SN-NK-892401',
  },
  returned = {
    name: 'Generic Runner / Counterfeit Replica',
    price: 2000,
    sku: 'NK-REPLICA-987',
    color: 'Faded Black / Grey',
    size: 'UK 8.5',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=400&q=80',
    serial: 'NO-SERIAL-TAG-MISSING',
    swap_reason: 'Counterfeit replica returned instead of original item',
  },
  riskScore = 95,
  isSimulated = false,
}) {
  const valueLoss = (purchased.price || 8000) - (returned.price || 2000)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-2xl border-2 border-red-500 bg-gradient-to-br from-red-50 via-rose-50/50 to-red-100/40 p-5 shadow-lg relative overflow-hidden"
    >
      {/* Background Warning Watermark */}
      <div className="absolute -right-8 -top-8 text-9xl font-black text-red-500/5 select-none pointer-events-none">
        SWAP
      </div>

      {/* Main Alert Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-red-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white text-2xl shadow-md animate-pulse">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                CRITICAL RISK
              </span>
              <span className="font-mono text-xs font-bold text-red-700">CP21: PRODUCT SWAP DETECTED</span>
            </div>
            <h3 className="text-base font-black text-red-950 mt-0.5">
              Physical Product Mismatch & Value Substitution
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-red-500">Value Delta (Loss)</span>
            <div className="font-mono text-lg font-black text-red-700 leading-none mt-0.5">
              -₹{valueLoss.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-red-300 bg-white/90 px-3 py-1.5 text-center shadow-xs">
            <div className="font-mono text-xl font-black text-red-600 leading-none">{riskScore}/100</div>
            <span className="text-[9px] font-extrabold uppercase text-slate-500">Risk Score</span>
          </div>
        </div>
      </div>

      {/* Visual Side-by-Side Comparison (The WOW Section) */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        
        {/* LEFT: Shipped / Purchased Product */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              1. Dispatched Product
            </span>
            <span className="font-mono text-sm font-black text-slate-900">₹{(purchased.price || 8000).toLocaleString()}</span>
          </div>

          <div className="flex items-start gap-3">
            {purchased.image && (
              <img
                src={purchased.image}
                alt={purchased.name}
                className="h-20 w-20 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
              />
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-900 truncate">{purchased.name}</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                <span className="text-slate-500">SKU:</span>
                <span className="font-mono font-bold text-slate-800 truncate">{purchased.sku || 'NK123'}</span>
                <span className="text-slate-500">Color:</span>
                <span className="font-semibold text-slate-800">{purchased.color || 'Black'}</span>
                <span className="text-slate-500">Size:</span>
                <span className="font-semibold text-slate-800">{purchased.size || '9'}</span>
                {purchased.serial && (
                  <>
                    <span className="text-slate-500">Serial:</span>
                    <span className="font-mono text-[10px] font-bold text-slate-700 truncate">{purchased.serial}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: Swap Connector Arrow */}
        <div className="flex flex-col items-center justify-center gap-1 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-black shadow-md">
            ⇄
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full border border-red-300">
            SWAPPED
          </span>
        </div>

        {/* RIGHT: Actually Returned Item */}
        <div className="rounded-xl border-2 border-red-300 bg-white p-4 shadow-xs relative ring-2 ring-red-500/10">
          <div className="flex items-center justify-between border-b border-red-100 pb-2 mb-3">
            <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              2. Physically Received
            </span>
            <span className="font-mono text-sm font-black text-red-600">₹{(returned.price || 2000).toLocaleString()}</span>
          </div>

          <div className="flex items-start gap-3">
            {returned.image && (
              <img
                src={returned.image}
                alt={returned.name}
                className="h-20 w-20 rounded-lg object-cover border-2 border-red-300 shrink-0 bg-red-50"
              />
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-xs font-black text-red-950 truncate">{returned.name}</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                <span className="text-slate-500">Received SKU:</span>
                <span className="font-mono font-bold text-red-700 truncate">{returned.sku || 'NK987'}</span>
                <span className="text-slate-500">Condition:</span>
                <span className="font-bold text-red-700">{returned.color || 'Different Product'}</span>
                <span className="text-slate-500">Received Size:</span>
                <span className="font-semibold text-slate-800">{returned.size || 'Mismatched'}</span>
                {returned.serial && (
                  <>
                    <span className="text-slate-500">Serial Match:</span>
                    <span className="font-mono text-[10px] font-bold text-red-600 truncate">❌ MISMATCH</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Directive Footer */}
      <div className="mt-4 rounded-xl border border-red-300 bg-red-600 text-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🛡️</span>
          <div>
            <div className="text-xs font-black uppercase tracking-wider">
              Automated Fraud Directive: HOLD REFUND + ESCALATE
            </div>
            <p className="text-[11px] text-red-100">
              Immediate refund blocked. Evidence photos & serial hash logged for merchant dispute.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-lg bg-white/20 border border-white/30 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white">
            Action: STRICT HOLD
          </span>
        </div>
      </div>
    </motion.div>
  )
}
