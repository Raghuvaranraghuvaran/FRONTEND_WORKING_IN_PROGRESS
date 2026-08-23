# Phase 2 & 3 Implementation - COMPLETE GUIDE

## ✅ BACKEND COMPLETE (Just Committed - `4b313dd`)

### What Was Done:
1. ✅ Enhanced CheckoutService with PaymentService integration
2. ✅ Created Payment Processing APIs (process, status, retry)
3. ✅ Created Invoice Download APIs (shopper + merchant)
4. ✅ Updated serializers for all payment methods
5. ✅ Added URL routes

### Backend is 100% Ready!

---

## 🎯 FRONTEND - What Needs to Be Done

### Step 1: Update Mock API (frontend/src/mock/api.js)

Add these methods to the existing `api` object:

```javascript
// In frontend/src/mock/api.js

// Add to existing api object:

async processPayment({ paymentId, paymentData }) {
  if (hasLiveApi()) {
    return live('/payments/process/', { 
      method: 'POST', 
      body: { payment_id: paymentId, payment_data: paymentData } 
    })
  }
  
  await delay(1500) // Simulate processing time
  
  // 90% success rate
  const success = Math.random() < 0.9
  
  if (success) {
    const payment = store.payments.find(p => p.id === paymentId)
    if (payment) {
      payment.status = 'paid'
      payment.transaction_id = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }
    
    return {
      payment: clone(payment),
      result: {
        success: true,
        status: 'paid',
        transaction_id: payment.transaction_id,
        message: 'Payment successful'
      }
    }
  } else {
    return {
      payment: store.payments.find(p => p.id === paymentId),
      result: {
        success: false,
        status: 'failed',
        message: 'Payment failed - Insufficient balance'
      }
    }
  }
},

async downloadInvoice(invoiceId) {
  if (hasLiveApi()) {
    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/download/`, {
      headers: { Authorization: `Bearer ${tokens.shopper?.access}` }
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceId}.pdf`
    a.click()
    return { success: true }
  }
  
  await delay(500)
  // In mock mode, just show message
  alert('Mock Mode: In production, PDF would download here')
  return { success: true }
},
```

### Step 2: Create PaymentMethodSelector Component

Create `frontend/src/components/PaymentMethodSelector.jsx`:

```javascript
import { useState } from 'react'
import { CreditCard, Smartphone, Building2, Wallet, DollarSign } from 'lucide-react'

export default function PaymentMethodSelector({ selected, onChange, onDetailsChange }) {
  const [paymentDetails, setPaymentDetails] = useState({})
  
  const methods = [
    { id: 'COD', name: 'Cash on Delivery', icon: DollarSign, desc: 'Pay when you receive' },
    { id: 'UPI', name: 'UPI', icon: Smartphone, desc: 'PhonePe, Google Pay, Paytm' },
    { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
    { id: 'DEBIT_CARD', name: 'Debit Card', icon: CreditCard, desc: 'All major debit cards' },
    { id: 'NET_BANKING', name: 'Net Banking', icon: Building2, desc: 'All major banks' },
    { id: 'MOBILE_BANKING', name: 'Mobile Banking', icon: Wallet, desc: 'Bank mobile apps' },
  ]
  
  const handleSelect = (methodId) => {
    onChange(methodId)
    setPaymentDetails({})
    onDetailsChange({})
  }
  
  const handleDetailChange = (key, value) => {
    const newDetails = { ...paymentDetails, [key]: value }
    setPaymentDetails(newDetails)
    onDetailsChange(newDetails)
  }
  
  return (
    <div className="space-y-4">
      {/* Method Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {methods.map(method => {
          const Icon = method.icon
          const isSelected = selected === method.id
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleSelect(method.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected 
                  ? 'border-indigo-600 bg-indigo-50' 
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {method.name}
                    </span>
                    {isSelected && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Payment Details Forms */}
      {selected === 'UPI' && (
        <div className="p-4 bg-slate-50 rounded-xl">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            UPI ID
          </label>
          <input
            type="text"
            placeholder="yourname@upi"
            value={paymentDetails.upi_id || ''}
            onChange={(e) => handleDetailChange('upi_id', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-2">
            🧪 Demo Mode: Enter any UPI ID (e.g., demo@upi)
          </p>
        </div>
      )}
      
      {(selected === 'CREDIT_CARD' || selected === 'DEBIT_CARD') && (
        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              value={paymentDetails.card_number || ''}
              onChange={(e) => handleDetailChange('card_number', e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                maxLength="5"
                value={paymentDetails.expiry || ''}
                onChange={(e) => handleDetailChange('expiry', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                maxLength="3"
                value={paymentDetails.cvv || ''}
                onChange={(e) => handleDetailChange('cvv', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            🧪 Demo Mode: Enter any card details (not stored or validated)
          </p>
        </div>
      )}
      
      {(selected === 'NET_BANKING' || selected === 'MOBILE_BANKING') && (
        <div className="p-4 bg-slate-50 rounded-xl">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Bank
          </label>
          <select
            value={paymentDetails.bank_name || ''}
            onChange={(e) => handleDetailChange('bank_name', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Choose your bank</option>
            <option value="HDFC Bank">HDFC Bank</option>
            <option value="ICICI Bank">ICICI Bank</option>
            <option value="SBI">State Bank of India</option>
            <option value="Axis Bank">Axis Bank</option>
            <option value="Kotak Mahindra">Kotak Mahindra Bank</option>
            <option value="Yes Bank">Yes Bank</option>
          </select>
          <p className="text-xs text-slate-500 mt-2">
            🧪 Demo Mode: Select any bank (no credentials required)
          </p>
        </div>
      )}
      
      {selected === 'COD' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-900">
            💵 Pay cash when your order is delivered. Additional charges may apply.
          </p>
        </div>
      )}
    </div>
  )
}
```

### Step 3: Update CheckoutPage.jsx

Major changes needed in `frontend/src/pages/CheckoutPage.jsx`:

1. Import PaymentMethodSelector
2. Add payment method state
3. Add payment details state
4. Update placeOrder to include payment details
5. Add payment processing step
6. Handle payment success/failure

Key code snippets to add/update:

```javascript
import PaymentMethodSelector from '../components/PaymentMethodSelector'

// In component state:
const [paymentMethod, setPaymentMethod] = useState('COD')
const [paymentDetails, setPaymentDetails] = useState({})
const [processingPayment, setProcessingPayment] = useState(false)

// Update placeOrder function:
const placed = await api.placeOrder({
  items: cart,
  paymentMethod,
  paymentDetails,
  address: effectiveAddress,
})

// After order placement, if online payment:
if (paymentMethod !== 'COD' && placed.payment) {
  setStep('processing_payment')
  await processPayment(placed.payment.id)
}

// Add processPayment function:
const processPayment = async (paymentId) => {
  setProcessingPayment(true)
  try {
    const result = await api.processPayment({
      paymentId,
      paymentData: paymentDetails
    })
    
    if (result.result.success) {
      setStep('payment_success')
    } else {
      setStep('payment_failed')
      setError(result.result.message)
    }
  } catch (err) {
    setStep('payment_failed')
    setError(err.message)
  } finally {
    setProcessingPayment(false)
  }
}

// In the checkout form, replace payment method select with:
<PaymentMethodSelector
  selected={paymentMethod}
  onChange={setPaymentMethod}
  onDetailsChange={setPaymentDetails}
/>
```

### Step 4: Create PaymentSuccessPage.jsx

Create `frontend/src/pages/PaymentSuccessPage.jsx`:

```javascript
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Download, Package } from 'lucide-react'
import { api } from '../mock/api'
import { INR } from '../lib/format'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (orderId) {
      api.getShopperOrders().then(orders => {
        const found = orders.find(o => o.id === orderId)
        setOrder(found)
        setLoading(false)
      })
    }
  }, [orderId])
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>
        
        {/* Success Message */}
        <h1 className="text-3xl font-bold text-center text-slate-900 mt-6">
          Payment Successful!
        </h1>
        <p className="text-center text-slate-600 mt-2">
          Your order has been confirmed and invoice has been sent to your email.
        </p>
        
        {/* Order Details */}
        {order && (
          <div className="mt-8 bg-slate-50 rounded-xl p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Order Number</span>
              <span className="font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Payment Method</span>
              <span className="font-semibold">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Total Amount</span>
              <span className="font-bold text-lg text-green-600">{INR(order.total)}</span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700"
          >
            <Package className="h-5 w-5" />
            View My Orders
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50"
          >
            Continue Shopping
          </button>
        </div>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          📧 Invoice has been sent to your registered email address
        </p>
      </div>
    </div>
  )
}
```

### Step 5: Create PaymentFailurePage.jsx

Similar structure but with error styling and retry button.

### Step 6: Update OrdersPage to show invoice download button

Add to each order card:

```javascript
{order.invoice && (
  <button
    onClick={() => api.downloadInvoice(order.invoice.id)}
    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
  >
    📄 Download Invoice
  </button>
)}
```

---

## 🚀 TESTING STEPS

1. **Install reportlab**: `pip install reportlab`
2. **Start Redis**: `redis-server`
3. **Start Celery**: `celery -A config worker --loglevel=info --pool=solo`
4. **Start Django**: `python manage.py runserver`
5. **Start Frontend**: `npm run dev`

## Test Each Payment Method:
- COD → Instant confirmation
- UPI → 90% success, 10% failure
- Credit Card → Demo processing
- Net Banking → Demo bank selection
- etc.

Check:
- Order created ✅
- Payment processed ✅
- Invoice PDF generated ✅
- Email sent (check console or SMTP) ✅
- Invoice downloadable ✅

---

All backend infrastructure is complete and pushed to GitHub!
Frontend UI components are the final step.
