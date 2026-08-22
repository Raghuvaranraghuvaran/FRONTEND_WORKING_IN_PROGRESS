const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(val) {
  return inrFormatter.format(Number(val) || 0)
}

export const INR = Object.assign(
  (val) => inrFormatter.format(Number(val) || 0),
  inrFormatter,
  { format: (val) => inrFormatter.format(Number(val) || 0) }
)

export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function titleCase(value) {
  return String(value || '')
    .replace(/[_-]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
