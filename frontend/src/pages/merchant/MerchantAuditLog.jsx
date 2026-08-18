import { useEffect, useState } from 'react'
import { api } from '../../mock/api'
import { formatDateTime, titleCase } from '../../lib/format'
import EmptyState from '../../components/EmptyState'

export default function MerchantAuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMerchantAuditLog().then((data) => {
      setLogs(data)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
      <p className="text-sm text-slate-500">Every admin review action is recorded for accountability.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-6"><EmptyState title="No audit events yet" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{log.actor}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${log.action === 'rejected' ? 'bg-rose-50 text-rose-700' : log.action === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {titleCase(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.target}</td>
                    <td className="px-4 py-3 text-slate-500">{log.notes}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
