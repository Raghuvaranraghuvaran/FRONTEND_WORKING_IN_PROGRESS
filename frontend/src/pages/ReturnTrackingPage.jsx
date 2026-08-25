import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ReturnTrackingTimeline from '../components/ReturnTrackingTimeline'

export default function ReturnTrackingPage() {
  const { returnId } = useParams()

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders & Returns
      </Link>
      <ReturnTrackingTimeline returnId={returnId} />
    </main>
  )
}
