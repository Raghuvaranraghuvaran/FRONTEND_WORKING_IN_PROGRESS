import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react'
import { api } from '../mock/api'

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
        navigate('/orders')
        return
      }

      try {
        // Fetch order and payment details
        const orders = await api.getShopperOrders()
        const foundOrder = orders.find((o) => o.id === orderId)
        
        if (foundOrder) {
          setOrder(foundOrder)
        }

        if (paymentId) {
          const paymentData = await api.getPaymentStatus(paymentId)
          setPayment(paymentData)
        }
      } catch (error) {
        console.error('Error fetching payment:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [orderId, paymentId, navigate])

  const handleRetryPayment = async () => {
    if (!orderId) return

    setRetrying(true)
    try {
      // Retry payment redirects to checkout with the order
      navigate(`/checkout?retry=${orderId}`)
    } catch (error) {
      console.error('Error retrying payment:', error)
      alert('Failed to retry payment. Please try again.')
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const failureReason = payment?.failure_reason || reason || 'Payment could not be processed'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {/* Failure Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="bg-red-100 rounded-full p-4"
            >
              <XCircle size={64} className="text-red-600" />
            </motion.div>
          </div>

          {/* Failure Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600">
              We couldn't process your payment
            </p>
          </div>

          {/* Failure Reason */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Reason:</p>
              <p className="text-red-800">{failureReason}</p>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-900">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-gray-900">₹{order.total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-red-600">{order.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900">
                    {order.payment_method?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Common Reasons */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-900 mb-2">Common reasons for payment failure:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Insufficient balance in your account</li>
              <li>Card declined by issuing bank</li>
              <li>Incorrect card details or CVV</li>
              <li>Payment timeout - no response from bank</li>
              <li>Transaction flagged by fraud detection</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {retrying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Retry Payment</span>
                </>
              )}
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>View Orders</span>
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <button
                onClick={() => navigate('/orders')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
