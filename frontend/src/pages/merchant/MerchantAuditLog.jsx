import { useEffect, useState, useMemo } from 'react'
import { api } from '../../mock/api'
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  UploadCloud, 
  Search, 
  Calendar, 
  Filter, 
  MoreVertical, 
  ShoppingCart, 
  Tag, 
  Package, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function MerchantAuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [targetFilter, setTargetFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    api.getMerchantAuditLog().then((data) => {
      setLogs(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = logs.length
    const approvals = logs.filter((l) => l.action?.toLowerCase() === 'approve' || l.action?.toLowerCase() === 'approved').length
    const rejections = logs.filter((l) => l.action?.toLowerCase() === 'reject' || l.action?.toLowerCase() === 'rejected').length
    const creations = logs.filter((l) => l.action?.toLowerCase() === 'created' || l.action?.toLowerCase() === 'create').length
    const bulkImports = logs.filter((l) => l.action?.toLowerCase().includes('bulk') || l.action?.toLowerCase().includes('import')).length

    return { total, approvals, rejections, creations, bulkImports }
  }, [logs])

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = 
        !q ||
        (log.actor && log.actor.toLowerCase().includes(q)) ||
        (log.target && log.target.toLowerCase().includes(q)) ||
        (log.notes && log.notes.toLowerCase().includes(q))

      const matchesAction = 
        actionFilter === 'all' || 
        (log.action && log.action.toLowerCase().includes(actionFilter.toLowerCase()))

      const matchesTarget = 
        targetFilter === 'all' ||
        (targetFilter === 'return' && log.target?.toLowerCase().includes('return')) ||
        (targetFilter === 'product' && log.target?.toLowerCase().includes('product'))

      return matchesSearch && matchesAction && matchesTarget
    })
  }, [logs, searchQuery, actionFilter, targetFilter])

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const formatLogTime = (isoString) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return isoString
      const day = String(d.getDate()).padStart(2, '0')
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
      const month = months[d.getMonth()]
      const year = d.getFullYear()
      let hours = d.getHours()
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'pm' : 'am'
      hours = hours % 12 || 12
      const formattedHours = String(hours).padStart(2, '0')
      return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`
    } catch {
      return isoString
    }
  }

  const renderActionBadge = (action) => {
    const act = (action || '').toLowerCase()
    if (act.includes('reject')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
          <XCircle className="h-3 w-3 text-rose-600" />
          Reject
        </span>
      )
    }
    if (act.includes('approve')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Approve
        </span>
      )
    }
    if (act.includes('create')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
          <PlusCircle className="h-3 w-3 text-blue-600" />
          Created
        </span>
      )
    }
    if (act.includes('bulk') || act.includes('import')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
          <UploadCloud className="h-3 w-3 text-amber-600" />
          Bulk Imported
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
        {action}
      </span>
    )
  }

  const renderTargetIcon = (target) => {
    const tgt = (target || '').toLowerCase()
    if (tgt.includes('return') || tgt.includes('ord')) {
      return <ShoppingCart className="h-3.5 w-3.5 text-slate-500 shrink-0" />
    }
    if (tgt.includes('product') && !tgt.includes('bulk')) {
      return <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
    }
    return <Package className="h-3.5 w-3.5 text-slate-500 shrink-0" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
          <p className="text-sm text-slate-500">Every admin review action is recorded for accountability.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none focus:outline-hidden cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5">
        {/* Total Actions */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500">Total Actions</div>
          </div>
        </div>

        {/* Approvals */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.approvals}</div>
            <div className="text-xs font-medium text-slate-500">Approvals</div>
          </div>
        </div>

        {/* Rejections */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.rejections}</div>
            <div className="text-xs font-medium text-slate-500">Rejections</div>
          </div>
        </div>

        {/* Creations */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.creations}</div>
            <div className="text-xs font-medium text-slate-500">Creations</div>
          </div>
        </div>

        {/* Bulk Imports */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{stats.bulkImports}</div>
            <div className="text-xs font-medium text-slate-500">Bulk Imports</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by actor, target, or notes..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden shadow-2xs"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden shadow-2xs cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="create">Created</option>
            <option value="bulk">Bulk Imported</option>
          </select>

          <select
            value={targetFilter}
            onChange={(e) => {
              setTargetFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-hidden shadow-2xs cursor-pointer"
          >
            <option value="all">All Targets</option>
            <option value="return">Returns & Orders</option>
            <option value="product">Products</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('')
              setActionFilter('all')
              setTargetFilter('all')
            }}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/60 shadow-2xs transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            <p>Loading audit trail…</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">No audit logs match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your search query or reset filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Notes</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Actor */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                          {log.actor ? log.actor.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span className="font-medium text-slate-800">{log.actor}</span>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>

                    {/* Target */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        {renderTargetIcon(log.target)}
                        <span>{log.target}</span>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{log.notes || '—'}</span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{formatLogTime(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Three Dots Menu */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === log.id ? null : log.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === log.id && (
                        <div 
                          className="absolute right-5 mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-20 text-left text-xs"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(log.target || '')
                              setActiveMenuId(null)
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            Copy Target ID
                          </button>
                          <button
                            onClick={() => {
                              alert(`Audit Log #${log.id}\nActor: ${log.actor}\nAction: ${log.action}\nTarget: ${log.target}\nNotes: ${log.notes}`)
                              setActiveMenuId(null)
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredLogs.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
