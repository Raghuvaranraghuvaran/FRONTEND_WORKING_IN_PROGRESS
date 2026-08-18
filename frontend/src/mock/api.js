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
}

loadSession()

function nextId(prefix, list) {
  const max = list.reduce((acc, item) => {
    const num = Number(String(item.id).split('_').pop())
    return Number.isFinite(num) ? Math.max(acc, num) : acc
  }, 0)
  return `${prefix}_${max + 1}`
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
    const order = {
      id: nextId('ord', store.orders),
      order_number: makeOrderNumber(),
      merchant_id: 'merchant_1',
      user_id: shopper.id,
      customer_name: shopper.name,
      items: orderItems,
      total,
      payment_method: paymentMethod,
      status: risk.tier === 'High' ? 'Review' : 'Active',
      delivery_status: risk.tier === 'High' ? 'Pending Review' : 'Processing',
      risk_tier: risk.tier,
      verification_status: risk.tier === 'Medium' ? 'Pending' : 'Verified',
      verification_method: risk.tier === 'Medium' ? 'unverified' : 'device_only',
      device_token: 'device_' + (shopper.id || 'unknown'),
      created_at: new Date().toISOString(),
      risk_context: risk.signals.length ? risk.signals.join('; ') : 'No material risk signals.',
      tracking_events: [
        { label: 'Order placed', at: new Date().toISOString(), done: true },
        { label: 'Packed', at: null, done: false },
        { label: 'Out for delivery', at: null, done: false },
        { label: 'Delivered', at: null, done: false },
      ],
    }
    store.orders.unshift(order)

    shopper.total_orders += 1
    if (shopper.risk_tier !== 'High' && risk.tier === 'High') shopper.risk_tier = 'High'
    session.shopper = clone(shopper)
    saveSession()

    store.notifications.unshift({
      id: nextId('notif', store.notifications),
      user_id: shopper.id,
      type: 'order_placed',
      channel: 'in_app',
      title: 'Order placed',
      body: `Order ${order.order_number} was placed successfully.`,
      read: false,
      created_at: new Date().toISOString(),
    })

    return clone(order)
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
    await delay(500)
    Object.assign(store.merchant, patch)
    return clone(store.merchant)
  },

  async getMerchantOnboarding() {
    await delay(300)
    return clone(store.merchant)
  },

  async registerMerchant({ businessName, storeSlug, adminEmail }) {
    await delay(700)
    const merchant = {
      id: nextId('merchant', [store.merchant]),
      business_name: businessName,
      store_slug: storeSlug,
      admin_email: adminEmail,
      api_token: `rg_live_${Math.random().toString(36).slice(2, 18)}`,
      plan_tier: 'Pilot',
      created_at: new Date().toISOString(),
    }
    store.merchant = merchant
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
