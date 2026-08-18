export default function EmptyState({ title = 'Nothing here yet', description }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  )
}
