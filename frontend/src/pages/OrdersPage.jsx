import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../mock/api'
import { formatDate, formatDateTime, INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders')
  const [tracking, setTracking] = useState(null)

  useEffect(() => {
    Promise.all([api.getShopperOrders(), api.getShopperReturns()]).then(([orderData, returnData]) => {
      setOrders(orderData)
      setReturns(returnData)
      setLoading(false)
    })
  }, [])

  const trackOrder = async (orderId) => {
    const events = await api.trackOrder(orderId)
    setTracking(events)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Your activity</h1>
        <p className="text-sm text-slate-500">Track orders, request returns, and check return status.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab('orders')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          Orders
        </button>
        <button
          onClick={() => setTab('returns')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === 'returns' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          Returns
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your placed orders will appear here." />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-base font-bold text-slate-900">{order.order_number}</h2>
                      <RiskBadge tier={order.risk_tier} />
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.delivery_status} />
                      {order.payment_status && <StatusBadge status={order.payment_status} />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(order.created_at)} · {order.payment_method}
                    </p>
                    {order.invoice && (
                      <a
                        href={order.invoice.invoice_url}
                        className="mt-1 inline-block text-xs font-semibold text-indigo-600"
                      >
                        Invoice {order.invoice.invoice_number}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900">{INR.format(order.total)}</p>
                    <p className="text-xs text-slate-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/orders/${order.id}/return`}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Request return
                  </Link>
                  <button
                    onClick={() => trackOrder(order.id)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Track order
                  </button>
                </div>

                {tracking && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-900">Tracking timeline</p>
                    <div className="mt-2 space-y-2">
                      {tracking.map((event, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className={`h-2 w-2 rounded-full ${event.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="font-medium text-slate-700">{event.label}</span>
                          <span className="text-slate-400">{event.at ? formatDateTime(event.at) : 'Pending'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : returns.length === 0 ? (
        <EmptyState title="No return requests" description="Your return requests will appear here." />
      ) : (
        <div className="space-y-3">
          {returns.map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">Return for {record.order_number}</h2>
                    <RiskBadge tier={record.risk_tier} />
                    <StatusBadge status={record.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(record.created_at)} · {record.reason.replaceAll('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-900">Status timeline</p>
                <div className="mt-2 space-y-2">
                  {(record.timeline || []).map((event, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="font-medium text-slate-700">{event.label}</span>
                      <span className="text-slate-400">{event.at ? formatDateTime(event.at) : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
