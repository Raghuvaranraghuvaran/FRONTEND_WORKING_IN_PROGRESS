import { classNames, titleCase } from '../lib/format'

const statusStyles = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  manual_review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  auto_approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  confirmed_fraud: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  legitimate_return: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  // Payment / invoice layer (Section 5.1 notification matrix)
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Processing: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Failed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'COD pending': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'Payment Pending': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'Payment Failed': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'Payment Rejected': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'Awaiting payment': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'Payment failed': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'Payment rejected': 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

export default function StatusBadge({ status, label }) {
  const key = String(status || '').toLowerCase()
  const display = label || titleCase(status)
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        statusStyles[status] || statusStyles[key] || 'bg-slate-100 text-slate-700 ring-slate-600/10',
      )}
    >
      {display}
    </span>
  )
}
