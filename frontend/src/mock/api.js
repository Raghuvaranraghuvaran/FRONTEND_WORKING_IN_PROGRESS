import {
  AUDIT_LOG,
  CATEGORIES,
  CATEGORY_RETURN_RATES,
  DELIVERY_AGENTS,
  FRAUD_CONFIG,
  MERCHANT,
  MERCHANT_ADMIN,
  NOTIFICATIONS,
  ORDERS,
  PRODUCTS,
  RETURNS,
  RISK_SCORING_EVENTS,
  SELF_TUNING_SUGGESTIONS,
  SHOPPERS,
  TOP_FLAGGED_CUSTOMERS,
  VERIFICATION_ATTEMPTS,
  WEEKLY_TREND,
} from './seed'
import { hasLiveApi, request } from '../lib/http'

const MERCHANT_RECORD_KEY = 'returnguard_merchant_record'

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms))

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

let session = {
  shopper: null,
  merchant: null,
}

function loadSession() {
  try {
    const stored = JSON.parse(localStorage.getItem('returnguard_session') || 'null')
    if (stored?.shopper) {
      const match = store.shoppers.find((s) => s.email === stored.shopper.email)
      if (match) session.shopper = clone(match)
    }
    if (stored?.merchant) {
      session.merchant = clone(store.merchantAdmin)
    }
  } catch {
    session = { shopper: null, merchant: null }
  }
}

function saveSession() {
  try {
    localStorage.setItem('returnguard_session', JSON.stringify(session))
  } catch {
    // storage unavailable; session remains in memory
  }
}

let store = {
  categories: clone(CATEGORIES),
  products: clone(PRODUCTS),
  shoppers: clone(SHOPPERS),
  orders: clone(ORDERS),
  returns: clone(RETURNS),
  auditLog: clone(AUDIT_LOG),
  merchant: clone(MERCHANT),
  merchantAdmin: clone(MERCHANT_ADMIN),
  deliveryAgents: clone(DELIVERY_AGENTS),
  fraudConfig: clone(FRAUD_CONFIG),
  selfTuningSuggestions: clone(SELF_TUNING_SUGGESTIONS),
  notifications: clone(NOTIFICATIONS),
  scoringEvents: clone(RISK_SCORING_EVENTS),
  verificationAttempts: clone(VERIFICATION_ATTEMPTS),
  weeklyTrend: clone(WEEKLY_TREND),
  topFlaggedCustomers: clone(TOP_FLAGGED_CUSTOMERS),
  categoryReturnRates: clone(CATEGORY_RETURN_RATES),
  payments: [],
  invoices: [],
}

function persistMerchant(merchant) {
  store.merchant = clone(merchant)
  try {
    localStorage.setItem(MERCHANT_RECORD_KEY, JSON.stringify(merchant))
  } catch {
    // storage unavailable
  }
}

function loadMerchantRecord() {
  try {
    const stored = JSON.parse(localStorage.getItem(MERCHANT_RECORD_KEY) || 'null')
    if (stored?.id) store.merchant = stored
  } catch {
    // keep seeded merchant
  }
}

loadSession()
loadMerchantRecord()

function nextId(prefix, list) {
  const max = list.reduce((acc, item) => {
    const num = Number(String(item.id).split('_').pop())
    return Number.isFinite(num) ? Math.max(acc, num) : acc
  }, 0)
  return `${prefix}_${max + 1}`
}

function createMerchantId(storeSlug) {
  const storePrefix = storeSlug
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 8)
    .toUpperCase()
    .padEnd(3, 'X')
  const uniqueSuffix = crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase()
  return `RG-${storePrefix}-${uniqueSuffix}`
}

function findShopperByEmail(email) {
  return store.shoppers.find((s) => s.email.toLowerCase() === email.toLowerCase())
}

function computeRisk(input = {}) {
  let score = 10
  const signals = []

  if (input.paymentMethod === 'COD') {
    score += 5
    signals.push('COD order')
  }

  const shopper = session.shopper ? findShopperByEmail(session.shopper.email) : null
  if (shopper) {
    const returnRate = shopper.total_orders ? shopper.total_returns / shopper.total_orders : 0
    if (returnRate > 0.4) {
      score += 32
      signals.push('High return frequency')
    } else if (returnRate > 0.2) {
      score += 16
      signals.push('Elevated return frequency')
    } else {
      score -= 5
      signals.push('Low return frequency')
    }

    if (shopper.total_cod_refusals > 0) {
      score += 18
      signals.push('COD refusal history')
    }

    if (shopper.device_reuse_flag) {
      score += 22
      signals.push('Device reuse')
    }

    if (shopper.risk_tier === 'Low') {
      score -= 8
      signals.push('Known low-risk customer')
    }
  }

  const category = (input.categoryId && store.products.find((p) => p.id === input.categoryId)?.category_id) || null
  if (category === 'cat_ethnic') {
    score += 14
    signals.push('Festive category')
  }

  if (input.reason) {
    const reasonWeights = {
      changed_mind: 12,
      wrong_size: 4,
      damaged: 2,
      wrong_product: 6,
      missing_item: 4,
      quality: 5,
      not_as_described: 8,
      other: 10,
    }
    score += reasonWeights[input.reason] || 6
    signals.push('Return reason')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const tier = score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low'
  return { score, tier, signals }
}

function makeOrderNumber() {
  const n = 1028 + store.orders.length
  return `#${n}`
}

function makeInvoiceNumber() {
  const year = new Date().getFullYear()
  const n = 4001 + store.invoices.length
  return `INV-${year}-${n}`
}

const GATEWAY_FAILURE_REASONS = [
  'Card declined by issuing bank.',
  'Insufficient balance.',
  'Payment timed out — no response from bank.',
]

const GATEWAY_REJECTION_REASONS = [
  'Transaction rejected by gateway risk check.',
  'Bank flagged this transaction as suspicious.',
]

function pushNotification({ userId, type, channel = 'in_app', title, body }) {
  store.notifications.unshift({
    id: nextId('notif', store.notifications),
    user_id: userId,
    type,
    channel,
    title,
    body,
    read: false,
    created_at: new Date().toISOString(),
  })
}

function findOrderPayment(orderId) {
  return store.payments.find((p) => p.order_id === orderId)
}

export const api = {
  async getDeviceSession() {
    await delay(150)
    return { captured: true }
  },

  // ---- Catalog ----
  async getCategories() {
    await delay(300)
    return clone(store.categories)
  },

  async getProducts({ categoryId, query } = {}) {
    await delay(400)
    let products = clone(store.products)
    if (categoryId && categoryId !== 'all') {
      products = products.filter((p) => p.category_id === categoryId)
    }
    if (query) {
      const q = query.toLowerCase()
      products = products.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return products
  },

  async getProduct(id) {
    await delay(250)
    return clone(store.products.find((p) => p.id === id) || null)
  },

  // ---- Auth ----
  async register({ name, email, password: _password, phone, address }) {
    await delay(600)
    if (findShopperByEmail(email)) {
      throw new Error('An account with this email already exists.')
    }
    const shopper = {
      id: nextId('user', store.shoppers),
      merchant_id: 'merchant_1',
      customer_id: `CUST-${1000 + store.shoppers.length + 1}`,
      name,
      email,
      phone,
      role: 'shopper',
      addresses: address ? [{ id: nextId('addr', store.shoppers.flatMap((s) => s.addresses || [])), label: 'Home', line: address }] : [],
      total_orders: 0,
      total_returns: 0,
      total_cod_refusals: 0,
      risk_tier: 'Low',
      device_reuse_flag: false,
      joined_at: new Date().toISOString(),
    }
    store.shoppers.push(shopper)
    session.shopper = clone(shopper)
    saveSession()
    return clone(session.shopper)
  },

  async login({ email, password }) {
    await delay(600)
    if (!password || password.length < 1) {
      throw new Error('Password is required.')
    }
    const shopper = findShopperByEmail(email)
    if (!shopper) {
      throw new Error('No account found for this email.')
    }
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async googleSignIn() {
    await delay(700)
    const existing = store.shoppers.find((s) => s.email === 'meera@example.com')
    const shopper =
      existing ||
      {
        id: nextId('user', store.shoppers),
        merchant_id: 'merchant_1',
        customer_id: 'CUST-1003',
        name: 'Meera Iyer',
        email: 'meera@example.com',
        phone: '+91 90123 45678',
        role: 'shopper',
        addresses: [{ id: 'addr_google', label: 'Home', line: '14, Lake View Street, Adyar, Chennai 600020' }],
        total_orders: 6,
        total_returns: 1,
        total_cod_refusals: 0,
        risk_tier: 'Low',
        device_reuse_flag: false,
        joined_at: new Date().toISOString(),
      }
    if (!existing) store.shoppers.push(shopper)
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async merchantLogin({ email, password }) {
    await delay(600)
    if (email === store.merchantAdmin.email && password === store.merchantAdmin.password) {
      session.merchant = clone(store.merchantAdmin)
      saveSession()
      return { admin: clone(session.merchant), merchant: clone(store.merchant) }
    }
    throw new Error('Invalid merchant credentials.')
  },

  async logout(role = 'shopper') {
    await delay(150)
    if (role === 'merchant') session.merchant = null
    else session.shopper = null
    saveSession()
    return true
  },

  getSession() {
    return {
      shopper: clone(session.shopper),
      merchant: clone(session.merchant),
    }
  },

  // ---- Shopper ----
  async getCurrentShopper() {
    await delay(200)
    return clone(session.shopper)
  },

  async updateProfile(patch) {
    await delay(500)
    const shopper = findShopperByEmail(session.shopper.email)
    if (!shopper) throw new Error('Not authenticated.')
    Object.assign(shopper, patch)
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async addAddress({ label, line }) {
    await delay(400)
    const shopper = findShopperByEmail(session.shopper.email)
    const address = { id: nextId('addr', shopper.addresses), label: label || 'Home', line }
    shopper.addresses.push(address)
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async removeAddress(addressId) {
    await delay(400)
    const shopper = findShopperByEmail(session.shopper.email)
    shopper.addresses = shopper.addresses.filter((a) => a.id !== addressId)
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async getShopperOrders() {
    await delay(500)
    const shopperId = session.shopper?.id
    const orders = clone(store.orders).filter((o) => o.user_id === shopperId)
    return orders
  },

  async getShopperReturns() {
    await delay(500)
    const shopperId = session.shopper?.id
    return clone(store.returns).filter((r) => r.user_id === shopperId)
  },

  async trackOrder(orderId) {
    await delay(400)
    const order = store.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found.')
    return clone(order.tracking_events || [])
  },

  async placeOrder({ items, paymentMethod, address: _address }) {
    await delay(900)
    if (!session.shopper) throw new Error('Please sign in to continue.')
    const shopper = findShopperByEmail(session.shopper.email)
    const orderItems = items.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }))
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const risk = computeRisk({ paymentMethod })
    const isCod = paymentMethod === 'COD'

    // Order status/delivery status while a Prepaid gateway result is outstanding.
    // Per the payment/invoice notification matrix, COD orders confirm immediately;
    // gateway orders wait for a verified webhook (simulated here) before the order
    // or invoice state changes.
    const orderStatus = isCod ? (risk.tier === 'High' ? 'Review' : 'Confirmed') : 'Payment Pending'
    const deliveryStatus = isCod
      ? risk.tier === 'High'
        ? 'Pending Review'
        : 'Processing'
      : 'Awaiting payment'

    const order = {
      id: nextId('ord', store.orders),
      order_number: makeOrderNumber(),
      merchant_id: 'merchant_1',
      user_id: shopper.id,
      customer_name: shopper.name,
      items: orderItems,
      total,
      payment_method: paymentMethod,
      status: orderStatus,
      delivery_status: deliveryStatus,
      risk_tier: risk.tier,
      verification_status: risk.tier === 'Medium' ? 'Pending' : 'Verified',
      verification_method: risk.tier === 'Medium' ? 'unverified' : 'device_only',
      device_token: 'device_' + (shopper.id || 'unknown'),
      created_at: new Date().toISOString(),
      risk_context: risk.signals.length ? risk.signals.join('; ') : 'No material risk signals.',
      payment_status: isCod ? 'COD pending' : 'Processing',
      invoice: null,
      tracking_events: [
        { label: 'Order placed', at: new Date().toISOString(), done: true },
        { label: 'Packed', at: null, done: false },
        { label: 'Out for delivery', at: null, done: false },
        { label: 'Delivered', at: null, done: false },
      ],
    }
    store.orders.unshift(order)

    // Payment record — hangs off the order, same as Payment/PaymentEvent in the backend model.
    const payment = {
      id: nextId('pay', store.payments),
      order_id: order.id,
      order_number: order.order_number,
      user_id: shopper.id,
      gateway: isCod ? 'cod' : 'mock_gateway',
      gateway_payment_id: isCod ? null : `mockpay_${crypto.randomUUID().slice(0, 12)}`,
      amount: total,
      status: isCod ? 'COD pending' : 'Processing',
      failure_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store.payments.unshift(payment)

    shopper.total_orders += 1
    if (shopper.risk_tier !== 'High' && risk.tier === 'High') shopper.risk_tier = 'High'
    session.shopper = clone(shopper)
    saveSession()

    if (isCod) {
      // COD orders confirm immediately and email the customer without waiting on a gateway.
      pushNotification({
        userId: shopper.id,
        type: 'order_confirmation',
        title: 'Order confirmed',
        body: `Order ${order.order_number} was confirmed for Cash on Delivery.`,
      })
    }
    // Prepaid orders stay quiet here — the "Payment initiated" row in the notification
    // matrix marks the customer email as optional, so no email fires until the gateway
    // (simulator) resolves the outcome.

    return { order: clone(order), payment: clone(payment) }
  },

  // ---- Payment gateway simulation ----
  // Mirrors "Never trust the frontend payment message alone": the order/invoice state
  // only changes once this (mock) webhook-equivalent resolves, not when the UI shows a result.
  async getOrderPayment(orderId) {
    await delay(200)
    return clone(findOrderPayment(orderId) || null)
  },

  async simulatePaymentResult({ orderId, outcome }) {
    await delay(1400)
    const order = store.orders.find((o) => o.id === orderId)
    const payment = findOrderPayment(orderId)
    if (!order || !payment) throw new Error('Order not found.')

    payment.updated_at = new Date().toISOString()

    if (outcome === 'success') {
      payment.status = 'Paid'
      payment.failure_reason = null
      order.status = order.risk_tier === 'High' ? 'Review' : 'Confirmed'
      order.delivery_status = order.risk_tier === 'High' ? 'Pending Review' : 'Processing'
      order.payment_status = 'Paid'

      const invoice = {
        id: nextId('inv', store.invoices),
        order_id: order.id,
        order_number: order.order_number,
        invoice_number: makeInvoiceNumber(),
        invoice_url: `/invoices/${order.order_number.replace('#', '')}.pdf`,
        status: 'issued',
        generated_at: new Date().toISOString(),
      }
      store.invoices.unshift(invoice)
      order.invoice = invoice

      pushNotification({
        userId: order.user_id,
        type: 'payment_success_invoice',
        title: 'Payment successful',
        body: `Payment for ${order.order_number} succeeded. Invoice ${invoice.invoice_number} is ready.`,
      })

      return { order: clone(order), payment: clone(payment), invoice: clone(invoice) }
    }

    if (outcome === 'failed') {
      payment.status = 'Failed'
      payment.failure_reason = GATEWAY_FAILURE_REASONS[Math.floor(Math.random() * GATEWAY_FAILURE_REASONS.length)]
      order.status = 'Payment Failed'
      order.delivery_status = 'Payment failed'
      order.payment_status = 'Failed'

      pushNotification({
        userId: order.user_id,
        type: 'payment_failure',
        title: 'Payment failed',
        body: `Payment for ${order.order_number} failed: ${payment.failure_reason}`,
      })

      return { order: clone(order), payment: clone(payment), invoice: null }
    }

    // rejected
    payment.status = 'Rejected'
    payment.failure_reason =
      GATEWAY_REJECTION_REASONS[Math.floor(Math.random() * GATEWAY_REJECTION_REASONS.length)]
    order.status = 'Payment Rejected'
    order.delivery_status = 'Payment rejected'
    order.payment_status = 'Rejected'

    pushNotification({
      userId: order.user_id,
      type: 'payment_rejected',
      title: 'Payment rejected',
      body: `Payment for ${order.order_number} was rejected: ${payment.failure_reason}`,
    })

    return { order: clone(order), payment: clone(payment), invoice: null }
  },

  async retryPayment(orderId) {
    await delay(300)
    const order = store.orders.find((o) => o.id === orderId)
    const payment = findOrderPayment(orderId)
    if (!order || !payment) throw new Error('Order not found.')
    payment.status = 'Processing'
    payment.failure_reason = null
    payment.gateway_payment_id = `mockpay_${crypto.randomUUID().slice(0, 12)}`
    payment.updated_at = new Date().toISOString()
    order.status = 'Payment Pending'
    order.delivery_status = 'Awaiting payment'
    order.payment_status = 'Processing'
    return { order: clone(order), payment: clone(payment) }
  },

  async createReturn({ orderId, reason, note, returnLines, pickupSlot }) {
    await delay(800)
    const order = store.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found.')
    const shopper = findShopperByEmail(session.shopper.email)
    const risk = computeRisk({ reason, categoryId: returnLines?.[0]?.product_id || order.items[0]?.product_id })
    const lines = (returnLines || order.items).map((line) => ({
      product_id: line.product_id,
      name: line.name,
      quantity: line.quantity,
      price: line.price,
    }))
    const record = {
      id: nextId('ret', store.returns),
      order_id: order.id,
      order_number: order.order_number,
      merchant_id: 'merchant_1',
      user_id: shopper.id,
      customer_name: shopper.name,
      reason,
      note,
      risk_tier: risk.tier,
      risk_score: risk.score,
      status: risk.tier === 'Low' ? 'approved' : 'manual_review',
      outcome: risk.tier === 'Low' ? 'auto_approved' : 'pending_review',
      verification_status: risk.tier === 'Low' ? 'Verified' : 'Pending',
      verification_method: risk.tier === 'Low' ? 'device_only' : 'unverified',
      created_at: new Date().toISOString(),
      risk_context: risk.signals.join('; '),
      signals: risk.signals,
      return_lines: lines,
      pickup_slot: pickupSlot || null,
      timeline: [
        { label: 'Return requested', at: new Date().toISOString() },
        { label: 'Pickup scheduled', at: pickupSlot ? new Date().toISOString() : null },
        ...(risk.tier !== 'Low' ? [{ label: 'OTP sent', at: new Date().toISOString() }] : []),
      ],
    }
    store.returns.unshift(record)
    shopper.total_returns += 1
    if (record.risk_tier === 'High' && shopper.risk_tier !== 'High') shopper.risk_tier = 'High'
    else if (record.risk_tier === 'Medium' && shopper.risk_tier === 'Low') shopper.risk_tier = 'Medium'
    session.shopper = clone(shopper)
    saveSession()

    store.notifications.unshift({
      id: nextId('notif', store.notifications),
      user_id: shopper.id,
      type: 'return_submitted',
      channel: 'in_app',
      title: 'Return request submitted',
      body: `Your return for ${record.order_number} is ${record.status === 'approved' ? 'approved' : 'under review'}.`,
      read: false,
      created_at: new Date().toISOString(),
    })

    return clone(record)
  },

  async escalateReturn(returnId, escalationReason = 'OTP unavailable or failed') {
    await delay(500)
    const record = store.returns.find((r) => r.id === returnId)
    if (!record) throw new Error('Return not found.')
    record.status = 'manual_review'
    record.outcome = 'pending_review'
    record.verification_status = 'Escalated'
    record.verification_method = 'unverified'
    record.risk_score = Math.min(100, record.risk_score + 8)
    record.timeline = [
      ...(record.timeline || []),
      { label: escalationReason, at: new Date().toISOString() },
      { label: 'Escalated to review', at: new Date().toISOString() },
    ]
    return clone(record)
  },

  async verifyOtp({ returnId, code }) {
    await delay(800)
    if (code !== '123456') {
      store.verificationAttempts.unshift({
        id: nextId('verify', store.verificationAttempts),
        customer_id: session.shopper?.id || 'guest',
        method: 'sms_otp',
        status: 'failed',
        confidence: 0,
        created_at: new Date().toISOString(),
      })
      throw new Error('Invalid OTP. For demo, use 123456.')
    }
    const record = store.returns.find((r) => r.id === returnId)
    if (record) {
      record.verification_status = 'Verified'
      record.verification_method = 'sms_otp'
      record.status = record.risk_tier === 'High' ? 'manual_review' : 'approved'
      record.outcome = record.risk_tier === 'High' ? 'pending_review' : 'auto_approved'
      record.risk_score = Math.max(5, record.risk_score - 15)
    }
    store.verificationAttempts.unshift({
      id: nextId('verify', store.verificationAttempts),
      customer_id: session.shopper?.id || 'guest',
      method: 'sms_otp',
      status: 'confirmed',
      confidence: 0.7,
      created_at: new Date().toISOString(),
    })
    return clone(record)
  },

  // ---- Merchant ----
  async getMerchantDashboard() {
    await delay(500)
    const flagged = store.returns.filter((r) => r.status === 'manual_review').length
    const pendingReview = store.orders.filter((o) => o.status === 'Review').length + flagged
    return {
      totalOrders: store.orders.length,
      flaggedCases: flagged,
      pendingReview,
      recentFlagged: clone(store.returns.filter((r) => r.status === 'manual_review').slice(0, 5)),
    }
  },

  async getMerchantOrders() {
    await delay(500)
    return clone(store.orders)
  },

  async getMerchantCustomers() {
    await delay(500)
    return clone(store.shoppers)
  },

  async getMerchantReturns() {
    await delay(500)
    return clone(store.returns)
  },

  async getMerchantAuditLog() {
    await delay(500)
    return clone(store.auditLog)
  },

  async getAnalytics() {
    await delay(600)
    return {
      weeklyTrend: clone(store.weeklyTrend),
      topFlaggedCustomers: clone(store.topFlaggedCustomers),
      categoryReturnRates: clone(store.categoryReturnRates),
      selfTuningSuggestions: clone(store.selfTuningSuggestions),
    }
  },

  async applySelfTuningSuggestion(suggestionId) {
    await delay(600)
    const suggestion = store.selfTuningSuggestions.find((s) => s.id === suggestionId)
    if (!suggestion) throw new Error('Suggestion not found.')
    const weights = { ...store.fraudConfig.weights }
    if (weights[suggestion.rule] !== undefined) weights[suggestion.rule] = suggestion.suggested_value
    store.fraudConfig = { ...store.fraudConfig, weights, updated_at: new Date().toISOString() }
    suggestion.status = 'applied'
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action: 'applied',
      target: `Self-tuning suggestion: ${suggestion.label}`,
      timestamp: new Date().toISOString(),
      notes: `Changed from ${suggestion.current_value} to ${suggestion.suggested_value}.`,
    })
    return clone(suggestion)
  },

  async getDeliveryAgents() {
    await delay(500)
    return clone(store.deliveryAgents)
  },

  async reviewReturn({ returnId, action, notes }) {
    await delay(700)
    const record = store.returns.find((r) => r.id === returnId)
    if (!record) throw new Error('Return not found.')
    record.status = action === 'approve' ? 'approved' : 'rejected'
    record.outcome = action === 'approve' ? 'legitimate_return' : 'confirmed_fraud'
    record.reviewed_by = session.merchant?.email || 'admin@returnguard.in'
    record.reviewed_at = new Date().toISOString()
    record.timeline = [
      ...(record.timeline || []),
      { label: action === 'approve' ? 'Approved' : 'Rejected', at: new Date().toISOString() },
    ]
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action,
      target: `Return ${record.order_number}`,
      timestamp: new Date().toISOString(),
      notes,
    })

    store.notifications.unshift({
      id: nextId('notif', store.notifications),
      user_id: record.user_id,
      type: action === 'approve' ? 'return_approved' : 'return_rejected',
      channel: action === 'approve' ? 'in_app' : 'sms',
      title: action === 'approve' ? 'Return approved' : 'Return rejected',
      body: `Your return for ${record.order_number} was ${action === 'approve' ? 'approved' : 'rejected'} after review.`,
      read: false,
      created_at: new Date().toISOString(),
    })

    return clone(record)
  },

  async getCustomerRiskProfile(customerId) {
    await delay(400)
    const customer = store.shoppers.find((s) => s.id === customerId)
    if (!customer) throw new Error('Customer not found.')
    const orders = clone(store.orders).filter((o) => o.user_id === customerId)
    const returns = clone(store.returns).filter((r) => r.user_id === customerId)
    const scoring = clone(store.scoringEvents).filter((e) => e.customer_id === customerId)
    const verification = clone(store.verificationAttempts).filter((e) => e.customer_id === customerId)
    return { customer, orders, returns, scoring, verification }
  },

  async updateMerchantSettings(patch) {
    if (hasLiveApi()) {
      const merchant = await request('/merchants/me', { method: 'PATCH', body: patch })
      persistMerchant(merchant)
      return merchant
    }
    await delay(500)
    Object.assign(store.merchant, patch)
    persistMerchant(store.merchant)
    return clone(store.merchant)
  },

  async getMerchantOnboarding() {
    if (hasLiveApi()) {
      const merchant = await request('/merchants/me')
      persistMerchant(merchant)
      return merchant
    }
    await delay(300)
    return clone(store.merchant)
  },

  async registerMerchant({ businessName, storeSlug, adminEmail }) {
    const payload = {
      business_name: businessName,
      store_slug: storeSlug,
      admin_email: adminEmail,
    }
    if (hasLiveApi()) {
      const merchant = await request('/merchants', { method: 'POST', body: payload })
      persistMerchant(merchant)
      return merchant
    }
    await delay(700)
    const merchant = {
      id: createMerchantId(storeSlug),
      business_name: businessName,
      store_slug: storeSlug,
      admin_email: adminEmail,
      plan_tier: 'Pilot',
      created_at: new Date().toISOString(),
    }
    persistMerchant(merchant)
    return clone(merchant)
  },

  async getFraudConfig() {
    await delay(400)
    return clone(store.fraudConfig)
  },

  async updateFraudConfig(patch) {
    await delay(500)
    store.fraudConfig = {
      ...store.fraudConfig,
      ...patch,
      weights: { ...store.fraudConfig.weights, ...(patch.weights || {}) },
      thresholds: { ...store.fraudConfig.thresholds, ...(patch.thresholds || {}) },
      updated_at: new Date().toISOString(),
    }
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action: 'updated',
      target: 'Fraud rule configuration',
      timestamp: new Date().toISOString(),
      notes: 'Rule weights or thresholds changed.',
    })
    return clone(store.fraudConfig)
  },

  async getNotifications() {
    await delay(350)
    const userId = session.shopper?.id || session.merchant?.id
    return clone(store.notifications.filter((n) => n.user_id === userId))
  },

  async markNotificationsRead() {
    await delay(250)
    const userId = session.shopper?.id || session.merchant?.id
    store.notifications = store.notifications.map((n) => (n.user_id === userId ? { ...n, read: true } : n))
    return clone(store.notifications.filter((n) => n.user_id === userId))
  },
}
