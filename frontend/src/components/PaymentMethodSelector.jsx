import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Wallet,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'

const PAYMENT_METHODS = [
  {
    id: 'COD',
    name: 'Cash on Delivery',
    icon: Banknote,
    description: 'Pay when you receive',
    details: null,
  },
  {
    id: 'UPI',
    name: 'UPI',
    icon: Smartphone,
    description: 'PhonePe, Google Pay, Paytm',
    details: {
      type: 'input',
      placeholder: 'Enter UPI ID (e.g., user@paytm)',
      field: 'upi_id',
    },
  },
  {
    id: 'CREDIT_CARD',
    name: 'Credit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, Amex',
    details: {
      type: 'card',
      fields: ['card_number', 'card_holder', 'expiry', 'cvv'],
    },
  },
  {
    id: 'DEBIT_CARD',
    name: 'Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, RuPay',
    details: {
      type: 'card',
      fields: ['card_number', 'card_holder', 'expiry', 'cvv'],
    },
  },
  {
    id: 'NET_BANKING',
    name: 'Net Banking',
    icon: Building2,
    description: 'All major banks',
    details: {
      type: 'select',
      options: [
        'State Bank of India',
        'HDFC Bank',
        'ICICI Bank',
        'Axis Bank',
        'Kotak Mahindra Bank',
        'Punjab National Bank',
        'Bank of Baroda',
        'Canara Bank',
        'Union Bank of India',
        'Indian Bank',
      ],
      field: 'bank_name',
    },
  },
  {
    id: 'MOBILE_BANKING',
    name: 'Mobile Banking',
    icon: Wallet,
    description: 'Pay via bank mobile app',
    details: {
      type: 'select',
      options: [
        'SBI YONO',
        'iMobile Pay (ICICI)',
        'Axis Mobile',
        'HDFC Bank MobileBanking',
        'Kotak Mobile Banking',
        'PNB ONE',
      ],
      field: 'mobile_banking_app',
    },
  },
]

export default function PaymentMethodSelector({ onSelect, selectedMethod, onDetailsChange, paymentDetails = {} }) {
  const [expandedMethod, setExpandedMethod] = useState(null)

  const handleMethodClick = (method) => {
    if (method.id === 'COD' || !method.details) {
      // COD or no details needed - select immediately
      onSelect(method.id)
      onDetailsChange({})
      setExpandedMethod(null)
    } else {
      // Expand to show details form
      setExpandedMethod(method.id)
      onSelect(method.id)
    }
  }

  const handleDetailChange = (field, value) => {
    const newDetails = { ...paymentDetails, [field]: value }
    onDetailsChange(newDetails)
  }

  const renderDetailForm = (method) => {
    if (!method.details) return null

    const { type, placeholder, field, options, fields } = method.details

    if (type === 'input') {
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 px-4 pb-4"
        >
          <input
            type="text"
            placeholder={placeholder}
            value={paymentDetails[field] || ''}
            onChange={(e) => handleDetailChange(field, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">
            Demo mode: Use any UPI ID format (e.g., demo@paytm)
          </p>
        </motion.div>
      )
    }

    if (type === 'select') {
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 px-4 pb-4"
        >
          <select
            value={paymentDetails[field] || ''}
            onChange={(e) => handleDetailChange(field, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          >
            <option value="">Select {field.replace(/_/g, ' ')}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Demo mode: All options will simulate a payment
          </p>
        </motion.div>
      )
    }

    if (type === 'card') {
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 px-4 pb-4 space-y-3"
        >
          <input
            type="text"
            placeholder="Card Number (e.g., 4111 1111 1111 1111)"
            value={paymentDetails.card_number || ''}
            onChange={(e) => handleDetailChange('card_number', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength="19"
            autoFocus
          />
          <input
            type="text"
            placeholder="Cardholder Name"
            value={paymentDetails.card_holder || ''}
            onChange={(e) => handleDetailChange('card_holder', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="MM/YY"
              value={paymentDetails.expiry || ''}
              onChange={(e) => handleDetailChange('expiry', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength="5"
            />
            <input
              type="text"
              placeholder="CVV"
              value={paymentDetails.cvv || ''}
              onChange={(e) => handleDetailChange('cvv', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength="4"
            />
          </div>
          <p className="text-xs text-gray-500">
            Demo mode: Use test card 4111 1111 1111 1111 or any format
          </p>
        </motion.div>
      )
    }

    return null
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Payment Method
      </label>
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon
        const isSelected = selectedMethod === method.id
        const isExpanded = expandedMethod === method.id

        return (
          <motion.div
            key={method.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
            }`}
            layout
          >
            <button
              type="button"
              onClick={() => handleMethodClick(method)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-xs text-gray-500">{method.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isSelected && <CheckCircle2 size={20} className="text-blue-600" />}
                {method.details && (
                  <ChevronRight
                    size={18}
                    className={`text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </div>
            </button>
            <AnimatePresence>
              {isExpanded && renderDetailForm(method)}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
