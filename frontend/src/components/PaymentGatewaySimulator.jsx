import { useState } from 'react'
import { INR } from '../lib/format'

// Stands in for the real payment gateway during mock-first development
// (Section 5.7/5.8 of the backend blueprint). The shopper fills in a card
// like they would on any checkout — they never pick an outcome. The mock
// gateway decides success/failure/rejection itself, keyed off the card
// number, the same way real sandbox gateways (Stripe, Razorpay, etc.)
// publish fixed test-card numbers that trigger each outcome. Django never
// trusts this panel's result directly — CheckoutPage forwards whatever
// outcome the "gateway" (this component) resolves to, the same as it would
// forward a real signed webhook.
const TEST_CARDS = {
  '4242424242424242': 'success',
  '4000000000000002': 'failed', // card declined
  '4000000000009995': 'failed', // insufficient funds
  '4000000000000119': 'rejected', // flagged by risk check
}

function normalizeCardNumber(value) {
  return value.replace(/\s+/g, '')
}

function formatCardNumber(value) {
  return normalizeCardNumber(value)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export default function PaymentGatewaySimulator({ orderNumber, amount, onResolve, resolving }) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')

  const digits = normalizeCardNumber(cardNumber)
  const canPay = digits.length === 16 && expiry.length === 5 && cvv.length === 3 && !resolving

  const handlePay = (e) => {
    e.preventDefault()
    if (!canPay) return
    setError('')
    // Unrecognized-but-valid-looking numbers fall back to success, same as
    // most sandbox gateways treat any well-formed card outside their test list.
    const outcome = TEST_CARDS[digits] || 'success'
    onResolve(outcome)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
        {resolving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
        ) : (
          '₹'
        )}
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">
        {resolving ? 'Contacting payment gateway…' : 'Enter card details'}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {orderNumber} · {INR.format(amount)}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        This panel stands in for the gateway's signed webhook — the order isn't marked paid until it resolves.
      </p>

      <form onSubmit={handlePay} className="mt-6 space-y-3 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-600">Card number</label>
          <input
            value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            disabled={resolving}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm tracking-widest focus:border-indigo-500 focus:outline-none disabled:bg-slate-50"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600">Expiry</label>
            <input
              value={expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`
                setExpiry(v)
              }}
              placeholder="MM/YY"
              inputMode="numeric"
              disabled={resolving}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600">CVV</label>
            <input
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
              placeholder="123"
              inputMode="numeric"
              disabled={resolving}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-50"
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={!canPay}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {resolving ? 'Processing…' : `Pay ${INR.format(amount)}`}
        </button>

        <details className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <summary className="cursor-pointer select-none font-semibold text-slate-600">
            Sandbox test cards
          </summary>
          <div className="mt-2 space-y-1">
            <p>4242 4242 4242 4242 — success</p>
            <p>4000 0000 0000 0002 — declined</p>
            <p>4000 0000 0000 9995 — insufficient funds</p>
            <p>4000 0000 0000 0119 — rejected by risk check</p>
            <p>Any other 16-digit number — treated as success.</p>
          </div>
        </details>
      </form>
    </div>
  )
}
