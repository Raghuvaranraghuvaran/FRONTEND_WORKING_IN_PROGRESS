import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../mock/api'
import { TrendingUp, AlertTriangle, Clock, DollarSign, ArrowUpRight, Filter, ExternalLink, CheckCircle2 } from 'lucide-react'

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
          <p className="mt-2 text-4xl font-bold">{value}</p>
          <p className="mt-1 text-sm opacity-80">{subtitle}</p>
        </div>
        {Icon && <Icon className="h-8 w-8 opacity-80" />}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-sm">
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
function OrderTrendsChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Order Trends (Past 30 Days)</h3>
        <button className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
          Filters <Filter className="h-3 w-3" />
        </button>
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
      <div className="mt-4 flex h-48 items-end justify-between gap-2">
        {[65, 75, 60, 80, 70, 90, 85, 95, 88, 92, 87, 90, 85, 88, 92, 85, 80, 85, 90, 88, 85, 80, 75, 70, 65, 70, 75, 80, 75, 70].map((height, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1 items-center">
            <div className="w-full bg-blue-500 rounded-t opacity-50" style={{ height: `${height}%` }}></div>
            <div className="w-full bg-red-500 rounded-t opacity-70" style={{ height: `${height * 0.3}%` }}></div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>Oct 3</span>
        <span>Oct 18</span>
        <span>Oct 30</span>
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
function TaskList() {
  const tasks = [
    { title: 'Review Rohit Verma\'s Case', icon: ExternalLink },
    { title: 'Process 3 Approved Returns', icon: CheckCircle2 },
    { title: 'Process 3 Approved Returns', icon: CheckCircle2 },
    { title: 'Review Polluted Returns', icon: AlertTriangle },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Task List</h3>
      <div className="space-y-2">
        {tasks.map((task, i) => (
          <button
            key={i}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
          >
            <span className="text-sm font-medium text-slate-900">{task.title}</span>
            <task.icon className="h-4 w-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MerchantDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('recent')

  useEffect(() => {
    api.getMerchantDashboard().then((result) => {
      setData(result)
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Live view of orders and flagged returns for your store.</p>
      </div>

      {/* Top Stats Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Orders"
          value={data.totalOrders || 24}
          subtitle="+12% vs last month"
          color="purple"
          trend={12}
        />
        <StatCard
          title="Flagged cases"
          value={data.flaggedCases || 7}
          subtitle="2 cases"
          color="orange"
        />
        <StatCard
          title="Pending review"
          value={data.pendingReview || 3}
          subtitle="3 cases"
          color="pink"
        />
      </div>

      {/* Second Row Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Revenue (INR)"
          value="₹1,24,850"
          subtitle="+8%"
          color="green"
          icon={DollarSign}
          trend={8}
        />
        <StatCard
          title="Flagged Return Rate"
          value="8.3%"
          subtitle="-1.2%"
          color="yellow"
          icon={TrendingUp}
          trend={-1.2}
        />
        <StatCard
          title="Store Risk Tier"
          value="'Stable' ↑"
          subtitle="Prev: Low Risk"
          color="dark"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderTrendsChart />
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
          <div className="mb-4 flex gap-4 border-b border-slate-200">
            {['Recent Activity', 'Flagged Cases', 'Flagged Customers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === tab.toLowerCase().replace(' ', '-')
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
            <button className="ml-auto flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Sorted: All <Filter className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Filters <Filter className="h-3 w-3" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Customer ↕</th>
                  <th className="py-3 pr-4">Order ↕</th>
                  <th className="py-3 pr-4">Risk ↕</th>
                  <th className="py-3 pr-4">Status ↕</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="whitespace-nowrap hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-900">Rohit Verma</td>
                  <td className="py-3 pr-4 text-slate-600">#1025</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">High</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Manual Review</span>
                  </td>
                  <td className="py-3">
                    <button className="text-slate-400 hover:text-slate-600">
                      <Clock className="h-4 w-4" />
                    </button>
                    <button className="ml-2 text-slate-400 hover:text-slate-600">⋮</button>
                  </td>
                </tr>
                <tr className="whitespace-nowrap hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-900">Meera Iyer</td>
                  <td className="py-3 pr-4 text-slate-600">#1026</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">Medium</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Manual Review</span>
                  </td>
                  <td className="py-3">
                    <button className="text-slate-400 hover:text-slate-600">
                      <Clock className="h-4 w-4" />
                    </button>
                    <button className="ml-2 text-slate-400 hover:text-slate-600">⋮</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Task List */}
        <TaskList />
      </div>

      {/* Footer Alerts */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-slate-900">Key Alerts</span>
          </div>
          <span className="text-slate-600">🔺 New High Risk Case detected</span>
          <span className="text-slate-600">🔴 New High Case detected</span>
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <button className="hover:text-slate-900">📊 Report center</button>
          <button className="hover:text-slate-900">❤️ System health</button>
        </div>
      </div>
    </div>
  )
}
