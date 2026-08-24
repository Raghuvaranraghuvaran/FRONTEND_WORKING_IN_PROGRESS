import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, Package, ArrowRight } from 'lucide-react'
import { api } from '../mock/api'
import { INR } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) {
        navigate('/orders')
        return
      }

      try {
        const orders = await api.getShopperOrders()
        const orderList = Array.isArray(orders) ? orders : []
        const foundOrder = orderList.find(
          (o) => String(o.id) === String(orderId) || String(o.order_number) === String(orderId)
        )
        
        if (foundOrder) {
          setOrder(foundOrder)
          setInvoice(foundOrder.invoice || null)
        } else if (orderList.length > 0) {
          // If ID not matched exactly, take the most recent order
          setOrder(orderList[0])
          setInvoice(orderList[0].invoice || null)
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, navigate])

  const handleDownloadInvoice = async () => {
    const targetId = invoice?.id || order?.invoice?.id || orderId
    if (!targetId) return

    setDownloading(true)
    try {
      const result = await api.downloadInvoice(targetId)
      if (!result.downloaded && result.download_url) {
        window.open(result.download_url, '_blank')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Unable to download invoice directly. You can also download it from My Orders.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-600">Verifying Payment Confirmation…</p>
        </div>
      </main>
    )
  }

  const items = order?.items || []
  const orderTotal = Number(order?.total) || 0
  const orderNumber = order?.order_number || (orderId ? `#${orderId}` : '#1030')
  const paymentMethodDisplay = order?.payment_method?.replace(/_/g, ' ') || 'UPI / Online'

  return (
    <main className="min-h-[85vh] bg-slate-50/70 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 text-center"
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="bg-emerald-100/80 rounded-full p-4 text-emerald-600 shadow-sm"
            >
              <CheckCircle2 size={56} className="text-emerald-600 stroke-[2.2]" />
            </motion.div>
          </div>

          {/* Success Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payment Successful!
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Your transaction has been approved and your order is confirmed.
          </p>

          {/* Order Summary Box */}
          <div className="mt-8 bg-slate-50/80 rounded-2xl p-6 border border-slate-200/70 text-left">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200/70">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Number</p>
                <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900 font-mono">{orderNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</p>
                <p className="mt-0.5 text-sm sm:text-base font-bold text-indigo-600">{paymentMethodDisplay}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</p>
                <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900">{INR.format(orderTotal)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {order?.status || 'Confirmed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Earned Reward Points Row */}
            {(Number(order?.reward_points_earned) > 0 || Math.floor(orderTotal / 100) * 10 > 0) && (
              <div className="py-3 px-3.5 my-3 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <span>⭐</span> Reward Points Earned:
                </span>
                <span className="font-bold text-amber-800">
                  +{order?.reward_points_earned || Math.floor(orderTotal / 100) * 10} pts <span className="text-[11px] font-medium text-amber-600">(10 pts / ₹100 credited)</span>
                </span>
              </div>
            )}

            {/* Instant Invoice Download Row */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📄</span> {invoice?.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Official Tax Invoice'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  PDF invoice has been sent to your registered email.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition shadow-sm cursor-pointer shrink-0"
              >
                {downloading ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Downloading…</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Download Invoice PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ordered Products Item List */}
          {items.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Order Items</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-900 font-mono">
                      {INR.format(Number(item.price || 0) * (Number(item.quantity) || 1))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/orders"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-md transition"
            >
              <span>View My Orders</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/shop"
              className="flex-1 flex items-center justify-center px-6 py-3.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
