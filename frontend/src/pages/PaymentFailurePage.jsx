import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react'
import { api } from '../mock/api'
import { INR } from '../lib/format'

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(null)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')
  const reason = searchParams.get('reason')

  useEffect(() => {
    async function fetchPaymentDetails() {
      if (!orderId) {
        setLoading(false)
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
        }

        if (paymentId) {
          try {
            const paymentData = await api.getPaymentStatus(paymentId)
            setPayment(paymentData)
          } catch {
            // optional
          }
        }
      } catch (error) {
        console.error('Error fetching payment details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [orderId, paymentId])

  const handleRetryPayment = () => {
    navigate('/checkout')
  }

  if (loading) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-600">Checking Payment Status…</p>
        </div>
      </main>
    )
  }

  const failureReason = payment?.failure_reason || reason || 'Payment transaction was declined or timed out.'
  const orderNumber = order?.order_number || (orderId ? `#${orderId}` : '')
  const orderTotal = Number(order?.total) || 0

  return (
    <main className="min-h-[85vh] bg-slate-50/70 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-10 text-center"
        >
          {/* Failure Icon */}
          <div className="flex justify-center mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="bg-rose-100/80 rounded-full p-4 text-rose-600 shadow-sm"
            >
              <XCircle size={56} className="text-rose-600 stroke-[2.2]" />
            </motion.div>
          </div>

          {/* Failure Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Payment Failed
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            We were unable to process your payment for this transaction.
          </p>

          {/* Failure Reason Callout */}
          <div className="mt-6 bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-left flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900 uppercase tracking-wider">Decline Reason</p>
              <p className="mt-0.5 text-xs text-rose-800 leading-relaxed font-medium">{failureReason}</p>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="mt-6 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Order Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Order Number</p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900 font-mono">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Amount</p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{INR.format(orderTotal)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Status</p>
                  <p className="mt-0.5 text-xs font-bold text-rose-600">Payment Failed</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Payment Method</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-900">
                    {order.payment_method?.replace(/_/g, ' ') || 'Online Payment'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Common Suggestions */}
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-left">
            <p className="text-xs font-bold text-slate-800 mb-1.5">Troubleshooting Tips:</p>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
              <li>Check if your bank server is responding or if daily UPI limit was exceeded.</li>
              <li>Verify that your card details and CVV are typed correctly.</li>
              <li>Alternatively, select <strong>Cash on Delivery (COD)</strong> at checkout.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition shadow-md cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>Retry Payment / Change Method</span>
            </button>
            <Link
              to="/orders"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              <ArrowLeft size={15} />
              <span>View My Orders</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
