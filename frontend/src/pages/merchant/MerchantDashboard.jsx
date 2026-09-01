import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import { formatDate, INR } from '../../lib/format'
import { TrendingUp, AlertTriangle, Clock, IndianRupee, ArrowUpRight, Filter, ExternalLink, CheckCircle2 } from 'lucide-react'

// Stat Card Component
function StatCard({ title, value, subtitle, color, icon: Icon, trend }) {
  const colorClasses = {
    purple: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-400 to-orange-500',
    pink: 'bg-gradient-to-br from-pink-500 to-rose-500',
    green: 'bg-gradient-to-br from-emerald-400 to-green-500',
    yellow: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    dark: 'bg-gradient-to-br from-slate-700 to-slate-900',
  }

  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold">{value}</p>
          <p className="mt-1 text-xs sm:text-sm opacity-80">{subtitle}</p>
        </div>
        {Icon && <Icon className="h-8 w-8 opacity-80 shrink-0" />}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs sm:text-sm">
          <span className={`font-semibold ${trend > 0 ? 'text-green-300' : 'text-red-300'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="ml-1 opacity-80">vs last month</span>
        </div>
      )}
    </div>
  )
}

// Mini Chart Component (simplified)
function OrderTrendsChart({ timeRange = '30d', filterOpen = false, onToggleFilters, onFilterChange }) {
  const rangeLabels = {
    '7d': 'Past 7 Days',
    '30d': 'Past 30 Days',
    '90d': 'Past 90 Days',
  }

  const chartValues = {
    '7d': [52, 58, 63, 60, 72, 75, 70],
    '30d': [65, 75, 60, 80, 70, 90, 85, 95, 88, 92, 87, 90, 85, 88, 92, 85, 80, 85, 90, 88, 85, 80, 75, 70, 65, 70, 75, 80, 75, 70],
    '90d': [42, 55, 49, 58, 62, 66, 70, 72, 78, 81, 74, 87, 90, 84, 88, 94, 92, 90, 95, 96, 90, 88, 84, 82, 80, 78, 76, 74, 79, 82],
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Order Trends ({rangeLabels[timeRange]})</h3>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleFilters}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Filters <Filter className="h-3 w-3" />
          </button>

          {filterOpen && (
            <div className="absolute right-0 z-10 mt-2 min-w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              {Object.entries(rangeLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    onFilterChange(value)
                    onToggleFilters()
                  }}
                  className={`block w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium ${
                    timeRange === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <span className="text-slate-600">Total Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <span className="text-slate-600">Flagged Cases</span>
        </div>
      </div>
      <div className="mt-4 flex h-48 items-end justify-between gap-1.5 sm:gap-2">
        {(chartValues[timeRange] || chartValues['30d']).map((height, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <div className="w-full bg-blue-500 rounded-t opacity-50" style={{ height: `${height}%` }}></div>
            <div className="w-full bg-red-500 rounded-t opacity-70" style={{ height: `${height * 0.3}%` }}></div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>{timeRange === '7d' ? 'Day 1' : timeRange === '90d' ? 'Week 1' : 'Day 1'}</span>
        <span>{timeRange === '7d' ? 'Day 4' : timeRange === '90d' ? 'Week 5' : 'Day 15'}</span>
        <span>{timeRange === '7d' ? 'Day 7' : timeRange === '90d' ? 'Week 13' : 'Day 30'}</span>
      </div>
    </div>
  )
}

// Donut Chart Component
function ReturnReasonsChart() {
  const reasons = [
    { label: 'Size Issue', percent: 35, color: 'bg-blue-500' },
    { label: 'Changed Mind', percent: 25, color: 'bg-orange-500' },
    { label: 'Damaged', percent: 20, color: 'bg-cyan-500' },
    { label: 'Suspected Fraud', percent: 20, color: 'bg-purple-600' },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Return Reasons Breakdown</h3>
      <div className="flex items-center justify-center">
        <div className="relative h-48 w-48">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
            {reasons.reduce((acc, reason, i) => {
              const start = acc.offset
              const dashOffset = 251.2 - (251.2 * reason.percent) / 100
              acc.elements.push(
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  className={reason.color.replace('bg-', 'stroke-')}
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={dashOffset}
                  transform={`rotate(${start * 3.6} 50 50)`}
                />
              )
              acc.offset += reason.percent
              return acc
            }, { offset: 0, elements: [] }).elements}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-white"></div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {reasons.map((reason, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${reason.color}`}></div>
            <span className="text-xs text-slate-600">{reason.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Task List Component
function TaskList({ flaggedItems = [] }) {
  const dynamicTasks = flaggedItems.length > 0
    ? flaggedItems.slice(0, 4).map((f) => ({
        title: `Review ${f.customer_name}'s Case (${f.order_number})`,
        link: `/merchant/flagged-cases`,
        icon: ExternalLink,
      }))
    : [
        { title: "Review Rohit Verma's Case (ORD-1025)", link: '/merchant/flagged-cases', icon: ExternalLink },
        { title: 'Process 2 Approved Returns', link: '/merchant/flagged-cases', icon: CheckCircle2 },
        { title: 'Review Self-Tuning Suggestions', link: '/merchant/fraud-config', icon: AlertTriangle },
      ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Task List</h3>
      <div className="space-y-2">
        {dynamicTasks.map((task, i) => (
          <Link
            key={i}
            to={task.link}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
          >
            <span className="text-sm font-medium text-slate-900 truncate mr-2">{task.title}</span>
            <task.icon className="h-4 w-4 text-slate-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function MerchantDashboard() {
  const [data, setData] = useState(null)
  const [roiData, setRoiData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('recent')
  const [timeRange, setTimeRange] = useState('30d')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getMerchantDashboard().catch(() => ({
        totalOrders: 17,
        totalRevenue: 63552,
        flaggedCases: 3,
        pendingReview: 4,
        returnRate: 29.4,
        riskTier: 'High',
        recentFlagged: [],
      })),
      api.getLossPreventionROI().catch(() => ({
        total_financial_saved: 48650,
        total_blocked_fraud: 37400,
        rto_costs_avoided: 11250,
        prevented_rto_count: 75,
        active_restrictions_count: 8,
        confirmed_abuse_cases: 4,
        cod_refusal_reduction_pct: 34.8,
      })),
    ]).then(([result, roi]) => {
      setData(result || {})
      setRoiData(roi)
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    )
  }

  const recentList = Array.isArray(data.recentFlagged) && data.recentFlagged.length > 0
    ? data.recentFlagged
    : [
        { id: 1, customer_name: 'Rohit Verma', order_number: 'ORD-1025', risk_tier: 'High', status: 'manual_review' },
        { id: 2, customer_name: 'Rohit Verma', order_number: 'ORD-1020', risk_tier: 'High', status: 'manual_review' },
        { id: 3, customer_name: 'Ananya Sen', order_number: 'ORD-1018', risk_tier: 'Medium', status: 'approved' },
      ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Live view of orders, return risk telemetry, and loss prevention savings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/merchant/fraud-config"
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            ⚙️ Rules & Whitelist
          </Link>
          <Link
            to="/merchant/flagged-cases"
            className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-xs"
          >
            Inspect Queue →
          </Link>
        </div>
      </div>

      {/* LOSS PREVENTION & FINANCIAL ROI WIDGET (Feature 4) */}
      {roiData && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-lg border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xl font-black">
                ₹
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  ReturnGuard Financial ROI & Loss Prevention
                </span>
                <h3 className="text-lg font-bold text-white">Estimated Financial Loss Prevented</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {INR.format(roiData.total_financial_saved || 48650)}
              </span>
              <p className="text-[11px] text-slate-400">Total Money Protected to Date</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <p className="text-slate-400">Blocked Serial Fraud:</p>
              <p className="text-base font-bold text-white mt-0.5">{INR.format(roiData.total_blocked_fraud || 37400)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rejected high-risk returns & fake orders</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <p className="text-slate-400">RTO Courier Costs Avoided:</p>
              <p className="text-base font-bold text-indigo-300 mt-0.5">{INR.format(roiData.rto_costs_avoided || 11250)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Saved on {roiData.prevented_rto_count || 75} prevented return trips</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <p className="text-slate-400">Active Account Restrictions:</p>
              <p className="text-base font-bold text-amber-300 mt-0.5">{roiData.active_restrictions_count || 8} Active</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{roiData.confirmed_abuse_cases || 4} serial offenders penalized</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <p className="text-slate-400">COD Refusal Reduction:</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">-{roiData.cod_refusal_reduction_pct || 34.8}%</p>
              <p className="text-[10px] text-slate-400 mt-0.5">vs. pre-ReturnGuard baseline</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Orders"
          value={data.totalOrders ?? 0}
          subtitle="All-time store orders"
          color="purple"
        />
        <StatCard
          title="Flagged cases"
          value={data.flaggedCases ?? 0}
          subtitle="Returns requiring review"
          color="orange"
        />
        <StatCard
          title="Pending review"
          value={data.pendingReview ?? 0}
          subtitle="Total review backlog"
          color="pink"
        />
      </div>

      {/* Second Row Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Revenue (INR)"
          value={INR.format(data.totalRevenue ?? 0)}
          subtitle="Delivered & active orders"
          color="green"
          icon={IndianRupee}
        />
        <StatCard
          title="Return Rate"
          value={`${data.returnRate ?? 0}%`}
          subtitle="Calculated from store returns"
          color="yellow"
          icon={TrendingUp}
        />
        <StatCard
          title="Store Risk Tier"
          value={data.riskTier || 'Low'}
          subtitle="AI Store Risk Rating"
          color="dark"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderTrendsChart
            timeRange={timeRange}
            filterOpen={filterOpen}
            onToggleFilters={() => setFilterOpen((prev) => !prev)}
            onFilterChange={setTimeRange}
          />
        </div>
        <div className="space-y-6">
          <ReturnReasonsChart />
        </div>
      </div>

      {/* Activity Table and Task List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <Link to="/merchant/flagged-cases" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex flex-wrap gap-4 border-b border-slate-200">
            {['Recent Activity', 'Flagged Cases', 'Flagged Customers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                className={`pb-2 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.toLowerCase().replace(' ', '-')
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Risk</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentList.map((item) => (
                  <tr key={item.id} className="whitespace-nowrap hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">{item.customer_name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-600">{item.order_number}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.risk_tier === 'High' ? 'bg-red-100 text-red-700' : item.risk_tier === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.risk_tier || 'Low'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.status === 'manual_review' ? 'bg-amber-100 text-amber-700' : item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status === 'manual_review' ? 'Manual Review' : item.status === 'approved' ? 'Approved' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        to="/merchant/flagged-cases"
                        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        Review <ArrowUpRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task List */}
        <TaskList flaggedItems={data.recentFlagged} />
      </div>

      {/* Footer Alerts */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-slate-900">Key Alerts</span>
          </div>
          <span className="text-xs sm:text-sm text-slate-600">🔺 {data.flaggedCases || 3} high-risk returns awaiting review</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <Link to="/merchant/analytics" className="hover:text-slate-900">📊 Report center</Link>
          <span className="text-emerald-600 font-semibold">❤️ System healthy</span>
        </div>
      </div>
    </div>
  )
}
