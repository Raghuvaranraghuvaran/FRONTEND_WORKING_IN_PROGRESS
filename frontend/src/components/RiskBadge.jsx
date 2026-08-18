import { classNames } from '../lib/format'

const styles = {
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Neutral: 'bg-slate-100 text-slate-700 ring-slate-600/10',
}

export default function RiskBadge({ tier, className }) {
  const label = tier || '—'
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        styles[tier] || styles.Neutral,
        className,
      )}
    >
      {label}
    </span>
  )
}
