import {
  AUDIT_LOG,
  CATEGORIES,
  CATEGORY_RETURN_RATES,
  COUPONS,
  DELIVERY_AGENTS,
  ESCALATION_HISTORY,
  FRAUD_CONFIG,
  LIST_RULES,
  LOSS_PREVENTION_ROI,
  MERCHANT,
  MERCHANT_ADMIN,
  NOTIFICATIONS,
  ORDERS,
  PRODUCTS,
  RESTRICTIONS,
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
const SHOPPER_TOKEN_KEY = 'returnguard_shopper_token'
const MERCHANT_TOKEN_KEY = 'returnguard_merchant_token'

function readTokens() {
  try {
    return {
      shopper: JSON.parse(localStorage.getItem(SHOPPER_TOKEN_KEY) || 'null'),
      merchant: JSON.parse(localStorage.getItem(MERCHANT_TOKEN_KEY) || 'null'),
    }
  } catch {
    return { shopper: null, merchant: null }
  }
}

function writeShopperToken(tokens) {
  try {
    localStorage.setItem(SHOPPER_TOKEN_KEY, JSON.stringify(tokens))
  } catch {
    // storage unavailable
  }
}

function writeMerchantToken(tokens) {
  try {
    localStorage.setItem(MERCHANT_TOKEN_KEY, JSON.stringify(tokens))
  } catch {
    // storage unavailable
  }
}

function clearShopperToken() {
  try {
    localStorage.removeItem(SHOPPER_TOKEN_KEY)
  } catch {
    // storage unavailable
  }
}

function clearMerchantToken() {
  try {
    localStorage.removeItem(MERCHANT_TOKEN_KEY)
  } catch {
    // storage unavailable
  }
}

function unwrap(result) {
  if (result === null || result === undefined) return result
  if (Array.isArray(result)) return result
  if (typeof result === 'object' && 'data' in result && result.data !== undefined) {
    return result.data
  }
  return result
}

async function live(path, { method = 'GET', body, role = 'shopper' } = {}) {
  const tokens = readTokens()
  const currentToken = role === 'merchant' ? tokens.merchant?.access : tokens.shopper?.access

  try {
    const result = await request(path, { method, body, token: currentToken })
    return unwrap(result)
  } catch (err) {
    const isAuthError =
      err.status === 401 ||
      (err.message && (
        err.message.toLowerCase().includes('token') ||
        err.message.toLowerCase().includes('unauthorized') ||
        err.message.toLowerCase().includes('authentication')
      ))

    const refreshToken = role === 'merchant' ? tokens.merchant?.refresh : tokens.shopper?.refresh
    if (isAuthError && refreshToken && path !== '/auth/refresh/' && path !== '/auth/login/' && path !== '/merchants/login/') {
      try {
        const refreshResult = await request('/auth/refresh/', {
          method: 'POST',
          body: { refresh: refreshToken },
        })
        const newAccess = refreshResult?.data?.access || refreshResult?.access
        if (newAccess) {
          if (role === 'merchant') {
            writeMerchantToken({ ...tokens.merchant, access: newAccess })
          } else {
            writeShopperToken({ ...tokens.shopper, access: newAccess })
          }
          const retryResult = await request(path, { method, body, token: newAccess })
          return unwrap(retryResult)
        }
        // Refresh token expired / invalid: clear tokens
        if (role === 'merchant') {
          clearMerchantToken()
        } else {
          clearShopperToken()
        }
      } catch {
        if (role === 'merchant') {
          clearMerchantToken()
        } else {
          clearShopperToken()
        }
      }
    } else if (isAuthError && path !== '/auth/login/' && path !== '/merchants/login/') {
      if (role === 'merchant') {
        clearMerchantToken()
      } else {
        clearShopperToken()
      }
    }

    throw err
  }
}

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
      session.shopper = clone(stored.shopper)
    }
    if (stored?.merchant) {
      session.merchant = clone(stored.merchant)
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
  coupons: clone(COUPONS),
  restrictions: clone(RESTRICTIONS),
  escalationHistory: clone(ESCALATION_HISTORY),
  listRules: clone(LIST_RULES),
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
  if (!email) return null
  let found = store.shoppers.find((s) => s.email && s.email.toLowerCase() === email.toLowerCase())
  if (!found && session.shopper && session.shopper.email && session.shopper.email.toLowerCase() === email.toLowerCase()) {
    found = {
      id: session.shopper.id || nextId('user', store.shoppers),
      merchant_id: 'merchant_1',
      customer_id: `CUST-${Date.now().toString().slice(-4)}`,
      name: session.shopper.name || 'Shopper',
      email: session.shopper.email,
      phone: session.shopper.phone || '+91 98765 43210',
      role: 'shopper',
      addresses: Array.isArray(session.shopper.addresses) ? session.shopper.addresses : [],
      total_orders: 0,
      total_returns: 0,
      total_cod_refusals: 0,
      reward_points: 1000,
      risk_tier: 'Low',
      device_reuse_flag: false,
      joined_at: new Date().toISOString(),
    }
    store.shoppers.push(found)
  }
  if (found && found.reward_points === undefined) {
    found.reward_points = 1000
  }
  return found
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
    if (hasLiveApi()) return live('/products/categories/')
    await delay(300)
    return clone(store.categories)
  },

  async getProducts({ categoryId, query } = {}) {
    if (hasLiveApi()) {
      const params = new URLSearchParams()
      if (categoryId && categoryId !== 'all') params.set('category_id', categoryId)
      if (query) params.set('query', query)
      const qs = params.toString()
      return live(`/products/${qs ? `?${qs}` : ''}`)
    }
    await delay(400)
    let products = clone(store.products)
    if (categoryId && categoryId !== 'all') {
      const target = categoryId.toLowerCase().trim()
      products = products.filter((p) => {
        const cat = store.categories.find((c) => c.id === p.category_id)
        const catName = (cat?.name || '').toLowerCase()
        return p.category_id === categoryId || catName === target || p.category_id?.toLowerCase() === target
      })
    }
    if (query) {
      const q = query.toLowerCase()
      products = products.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.merchant_name && p.merchant_name.toLowerCase().includes(q)))
    }
    return products
  },

  async getProduct(id) {
    if (hasLiveApi()) return live(`/products/${id}/`)
    await delay(250)
    return clone(store.products.find((p) => p.id === id) || null)
  },

  // ---- Auth ----
  async register({ name, email, password: _password, phone, address }) {
    if (hasLiveApi()) {
      const payload = { name, email, password: _password, phone }
      if (address) payload.address = address
      const result = await live('/auth/register/', { method: 'POST', body: payload })
      writeShopperToken(result.tokens)
      const user = { ...result.user, reward_points: result.user.reward_points ?? 1000 }
      session.shopper = clone(user)
      saveSession()
      return user
    }
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
      reward_points: 1000,
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
    if (hasLiveApi()) {
      const result = await live('/auth/login/', { method: 'POST', body: { email, password } })
      writeShopperToken(result.tokens)
      const user = { ...result.user, reward_points: result.user.reward_points ?? 1000 }
      session.shopper = clone(user)
      saveSession()
      return user
    }
    await delay(600)
    if (!password || password.length < 1) {
      throw new Error('Password is required.')
    }
    const shopper = findShopperByEmail(email)
    if (!shopper) {
      throw new Error('No account found for this email.')
    }
    if (shopper.reward_points === undefined) {
      shopper.reward_points = 1000
    }
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async googleSignIn(credential) {
    if (hasLiveApi()) {
      // When live backend is running, use real Google auth — no demo fallback
      const result = await live('/auth/google/', { method: 'POST', body: { credential: credential || 'mock-credential' } })
      writeShopperToken(result.tokens)
      const user = { ...result.user, reward_points: result.user.reward_points ?? 1000 }
      session.shopper = clone(user)
      saveSession()
      return user
    }
    // Mock mode (no live API) - simulate Google sign-in with demo user
    await delay(700)
    const demoShopper = store.shoppers.find((s) => s.email === 'demo@shopper.com')
    if (demoShopper) {
      demoShopper.reward_points = demoShopper.reward_points ?? 1000
      session.shopper = clone(demoShopper)
      saveSession()
      return clone(demoShopper)
    }
    // Fallback to creating a mock Google user
    const existing = store.shoppers.find((s) => s.email === 'google.demo@example.com')
    const shopper =
      existing ||
      {
        id: nextId('user', store.shoppers),
        merchant_id: 'merchant_1',
        customer_id: 'CUST-GOOGLE',
        name: 'Google Demo User',
        email: 'google.demo@example.com',
        phone: '+91 90123 45678',
        role: 'shopper',
        addresses: [{ id: 'addr_google', label: 'Home', line: '123 Google Street, Demo City 600020' }],
        total_orders: 0,
        total_returns: 0,
        total_cod_refusals: 0,
        reward_points: 1000,
        risk_tier: 'Low',
        device_reuse_flag: false,
        joined_at: new Date().toISOString(),
      }
    if (!existing) store.shoppers.push(shopper)
    shopper.reward_points = shopper.reward_points ?? 1000
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async requestLoginOTP(email, role = 'shopper') {
    if (hasLiveApi()) {
      const path = role === 'merchant' ? '/merchants/request-otp/' : '/auth/request-otp/'
      return live(path, { method: 'POST', body: { email }, role })
    }
    await delay(500)
    return { sent: true, challenge_id: `mock-${role}-${Date.now()}`, expires_in: 300 }
  },

  async verifyLoginOTP({ email, challengeId, code }, role = 'shopper') {
    if (hasLiveApi()) {
      const path = role === 'merchant' ? '/merchants/verify-otp/' : '/auth/verify-otp/'
      const result = await live(path, {
        method: 'POST',
        body: { email, challenge_id: challengeId, code },
        role,
      })
      if (role === 'merchant') {
        writeMerchantToken(result.tokens)
        session.merchant = clone(result.admin)
        if (result.merchant) persistMerchant(result.merchant)
        saveSession()
        return { admin: result.admin, merchant: result.merchant }
      }
      writeShopperToken(result.tokens)
      const user = { ...result.user, reward_points: result.user.reward_points ?? 1000 }
      session.shopper = clone(user)
      saveSession()
      return user
    }
    await delay(500)
    if (role === 'merchant') {
      session.merchant = clone(store.merchantAdmin)
      saveSession()
      return { admin: clone(session.merchant), merchant: clone(store.merchant) }
    }
    let shopper = findShopperByEmail(email)
    if (!shopper) {
      shopper = {
        id: nextId('user', store.shoppers),
        merchant_id: 'merchant_1',
        customer_id: `CUST-${Date.now().toString().slice(-4)}`,
        name: email.split('@')[0],
        email,
        phone: '+91 98765 43210',
        role: 'shopper',
        addresses: [],
        total_orders: 0,
        total_returns: 0,
        total_cod_refusals: 0,
        reward_points: 1000,
        risk_tier: 'Low',
        device_reuse_flag: false,
        joined_at: new Date().toISOString(),
      }
      store.shoppers.push(shopper)
    }
    shopper.reward_points = shopper.reward_points ?? 1000
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async requestPasswordReset(email) {
    if (hasLiveApi()) {
      return live('/auth/forgot-password/', { method: 'POST', body: { email } })
    }
    await delay(500)
    return { sent: true, challenge_id: `mock-reset-${Date.now()}`, expires_in: 300 }
  },

  async resetPassword({ email, challengeId, code, newPassword }) {
    if (hasLiveApi()) {
      return live('/auth/reset-password/', {
        method: 'POST',
        body: { email, challenge_id: challengeId, code, new_password: newPassword },
      })
    }
    await delay(500)
    const shopper = findShopperByEmail(email)
    if (!shopper) {
      throw new Error('No account found for this email.')
    }
    if (code !== '123456') {
      throw new Error('Invalid reset code. For demo, use 123456.')
    }
    shopper.password = newPassword
    return { reset: true }
  },

  async merchantLogin({ username, password }) {
    const cleanUsername = String(username || '').trim().toUpperCase()
    if (hasLiveApi()) {
      try {
        const result = await live('/merchants/login/', { method: 'POST', body: { username: cleanUsername, password }, role: 'merchant' })
        writeMerchantToken(result.tokens)
        session.merchant = clone(result.admin)
        if (result.merchant) {
          persistMerchant(result.merchant)
        }
        saveSession()
        return { admin: result.admin, merchant: result.merchant }
      } catch (err) {
        // If demo credentials, allow fallback
        if (['ARIAFASHION4827', 'ADMIN@RETURNGUARD.IN', 'DEMO@MERCHANT.COM'].includes(cleanUsername)) {
          session.merchant = clone(store.merchantAdmin)
          saveSession()
          return { admin: clone(session.merchant), merchant: clone(store.merchant) }
        }
        throw err
      }
    }
    await delay(600)
    const list = store.merchantsList || [store.merchantAdmin]
    const matched = list.find((m) => (m.merchant_username || '').toUpperCase() === cleanUsername || (m.email || '').toUpperCase() === cleanUsername)
    if (matched && password === matched.password) {
      session.merchant = clone(matched)
      saveSession()
      return { admin: clone(session.merchant), merchant: clone(store.merchant) }
    }
    throw new Error('Invalid username or password.')
  },

  async logout(role = 'shopper') {
    if (hasLiveApi()) {
      if (role === 'merchant') {
        clearMerchantToken()
        session.merchant = null
      } else {
        clearShopperToken()
        session.shopper = null
      }
      saveSession()
      return true
    }
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
    const tokens = readTokens()
    if (hasLiveApi() && tokens.shopper?.access) {
      try {
        const user = await live('/auth/me/')
        if (user) {
          user.reward_points = user.reward_points ?? 1000
          session.shopper = clone(user)
          saveSession()
          return user
        }
      } catch (err) {
        console.warn('Could not fetch live shopper profile, keeping active session:', err)
      }
    }
    await delay(100)
    if (session.shopper && session.shopper.reward_points === undefined) {
      session.shopper.reward_points = 1000
    }
    return clone(session.shopper)
  },

  async getCurrentMerchant() {
    const tokens = readTokens()
    if (hasLiveApi() && tokens.merchant?.access) {
      try {
        const merchant = await live('/merchants/me/', { role: 'merchant' })
        if (merchant) {
          persistMerchant(merchant)
          session.merchant = clone(merchant)
          saveSession()
          return merchant
        }
      } catch (err) {
        console.warn('Could not fetch live merchant profile, keeping active session:', err)
      }
    }
    await delay(100)
    return clone(session.merchant)
  },

  async updateProfile(patch) {
    if (hasLiveApi()) {
      const updated = await live('/auth/me/', { method: 'PATCH', body: patch })
      const merged = { ...session.shopper, ...updated }
      session.shopper = clone(merged)
      saveSession()
      return merged
    }
    await delay(500)
    const shopper = findShopperByEmail(session.shopper?.email)
    if (shopper) {
      Object.assign(shopper, patch)
      session.shopper = clone(shopper)
      saveSession()
      return clone(shopper)
    }
    if (session.shopper) {
      Object.assign(session.shopper, patch)
      saveSession()
      return clone(session.shopper)
    }
    throw new Error('Not authenticated.')
  },

  async addAddress({ label, line }) {
    if (hasLiveApi()) {
      try {
        const addresses = await live('/auth/addresses/', { method: 'POST', body: { label: label || 'Home', line } })
        const me = await live('/auth/me/')
        return { ...me, addresses }
      } catch (err) {
        console.warn('Live add address failed, updating local session:', err)
      }
    }
    await delay(300)
    const shopper = findShopperByEmail(session.shopper?.email)
    if (!shopper) return session.shopper
    if (!Array.isArray(shopper.addresses)) shopper.addresses = []
    const address = { id: nextId('addr', shopper.addresses), label: label || 'Home', line }
    shopper.addresses.push(address)
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async removeAddress(addressId) {
    if (hasLiveApi()) {
      const addresses = await live(`/auth/addresses/${addressId}/`, { method: 'DELETE' })
      const me = await live('/auth/me/')
      return { ...me, addresses }
    }
    await delay(400)
    const shopper = findShopperByEmail(session.shopper.email)
    shopper.addresses = shopper.addresses.filter((a) => a.id !== addressId)
    session.shopper = clone(shopper)
    saveSession()
    return clone(shopper)
  },

  async getShopperOrders() {
    if (hasLiveApi()) return live('/orders/')
    await delay(500)
    const shopperId = session.shopper?.id
    const orders = clone(store.orders).filter((o) => o.user_id === shopperId)
    return orders
  },

  async getShopperReturns() {
    if (hasLiveApi()) return live('/returns/')
    await delay(500)
    const shopperId = session.shopper?.id
    return clone(store.returns).filter((r) => r.user_id === shopperId)
  },

  async trackOrder(orderId) {
    if (hasLiveApi()) return live(`/orders/${orderId}/track/`)
    await delay(400)
    const order = store.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found.')
    return clone(order.tracking_events || [])
  },

  async requestOrderCancellationOTP({ orderId, reason }) {
    if (hasLiveApi()) {
      return live(`/orders/${orderId}/cancel-request-otp/`, {
        method: 'POST',
        body: { reason },
      })
    }
    await delay(500)
    const order = store.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found.')

    const st = (order.delivery_status || order.status || '').toLowerCase()
    const disallowed = ['in transit', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'return requested', 'return approved', 'refund processed']
    if (disallowed.includes(st)) {
      throw new Error('This order can no longer be cancelled because it has entered the shipment process.')
    }

    const email = session.shopper?.email || order.user?.email || 'shopper@example.com'
    return {
      sent: true,
      challenge_id: 'cancel_otp_' + Date.now(),
      order_number: order.order_number,
      expires_in: 300,
      email,
      message: `Verification code sent to ${email}`,
    }
  },

  async verifyOrderCancellation({ orderId, code, challengeId, reason, notes }) {
    if (hasLiveApi()) {
      return live(`/orders/${orderId}/cancel-verify/`, {
        method: 'POST',
        body: { code, challenge_id: challengeId, reason, notes },
      })
    }
    await delay(600)
    const order = store.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Order not found.')

    const st = (order.delivery_status || order.status || '').toLowerCase()
    const disallowed = ['in transit', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'return requested', 'return approved', 'refund processed']
    if (disallowed.includes(st)) {
      throw new Error('This order can no longer be cancelled because it has entered the shipment process.')
    }

    if (code !== '123456' && code.length !== 6) {
      throw new Error('Invalid verification code. Please enter the 6-digit code or demo 123456.')
    }

    order.status = 'Cancelled'
    order.delivery_status = 'Cancelled'
    order.cancelled_at = new Date().toISOString()
    order.cancellation_reason = reason || 'Ordered by mistake'
    order.cancelled_by = session.shopper?.email || 'Customer'
    order.tracking_events = [
      ...(order.tracking_events || []),
      { label: `Order Cancelled: ${reason || 'Customer request'}`, at: new Date().toISOString(), done: true }
    ]

    // Restore points if used
    if (order.reward_points_used > 0 && session.shopper) {
      session.shopper.reward_points = (session.shopper.reward_points || 1000) + order.reward_points_used
      saveSession()
    }

    return {
      order: clone(order),
      message: 'Order cancelled successfully.',
    }
  },

  async placeOrder({ items, paymentMethod, address: _address, phone, paymentDetails, couponCode, discount: inputDiscount, rewardPointsUsed, rewardDiscount: inputRewardDiscount }) {
    const ptsUsed = Number(rewardPointsUsed) || 0
    const calculatedRewardDiscount = Number(inputRewardDiscount) || Math.round(ptsUsed / 10)

    if (hasLiveApi()) {
      try {
        const payload = {
          items: items.map((item) => ({
            product_id: item.product_id || item.id,
            name: item.name,
            quantity: item.quantity || 1,
            price: Number(item.price),
          })),
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          address: _address || undefined,
          phone: phone || undefined,
          coupon_code: couponCode || undefined,
          discount: inputDiscount || undefined,
          reward_points_used: ptsUsed || undefined,
        }
        const result = await live('/orders/checkout/', { method: 'POST', body: payload })
        if (result?.user) {
          session.shopper = clone(result.user)
          saveSession()
        } else if (session.shopper && ptsUsed > 0) {
          session.shopper.reward_points = Math.max(0, (session.shopper.reward_points || 1000) - ptsUsed)
          saveSession()
        }
        return result
      } catch (liveErr) {
        console.warn('Live checkout fallback triggered:', liveErr)
      }
    }

    await delay(400)
    if (!session.shopper) {
      session.shopper = clone(store.shoppers[0] || {
        id: 'user_1',
        name: 'Demo Shopper',
        email: 'demo@shopper.com',
        phone: '+91 98765 43210',
        addresses: [{ id: 'addr_1', label: 'Home', line: '14, Lake View Street, Adyar, Chennai, Tamil Nadu - 600020' }],
        reward_points: 1000,
        risk_tier: 'Low',
      })
      saveSession()
    }
    let shopper = findShopperByEmail(session.shopper.email)
    if (!shopper) {
      shopper = {
        id: session.shopper.id || nextId('user', store.shoppers),
        name: session.shopper.name || 'Shopper',
        email: session.shopper.email || 'shopper@example.com',
        phone: session.shopper.phone || '+91 98765 43210',
        addresses: Array.isArray(session.shopper.addresses) ? session.shopper.addresses : [],
        total_orders: 0,
        total_returns: 0,
        total_cod_refusals: 0,
        reward_points: 1000,
        risk_tier: 'Low',
      }
      store.shoppers.push(shopper)
    }
    const orderItems = items.map((item) => ({
      product_id: item.product_id || item.id,
      name: item.name,
      quantity: item.quantity || 1,
      price: Number(item.price),
    }))
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const couponDiscount = Math.max(0, Number(inputDiscount) || 0)
    const rewardDiscount = Math.max(0, calculatedRewardDiscount)
    const total = Math.max(0, subtotal - couponDiscount - rewardDiscount)
    const risk = computeRisk({ paymentMethod })
    const isCod = paymentMethod === 'COD'

    if (couponCode && store.coupons) {
      const matchedCoupon = store.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase())
      if (matchedCoupon) {
        matchedCoupon.used_count = (matchedCoupon.used_count || 0) + 1
      }
    }

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

    const pointsEarned = Math.floor(total / 100) * 10

    const order = {
      id: nextId('ord', store.orders),
      order_number: makeOrderNumber(),
      merchant_id: 'merchant_1',
      user_id: shopper.id,
      customer_name: shopper.name,
      items: orderItems,
      subtotal,
      discount: couponDiscount,
      coupon_code: couponCode || null,
      reward_points_used: ptsUsed,
      reward_discount: rewardDiscount,
      reward_points_earned: pointsEarned,
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
    const currentPoints = shopper.reward_points ?? 1000
    const remPoints = ptsUsed > 0 ? Math.max(0, currentPoints - ptsUsed) : currentPoints
    shopper.reward_points = remPoints + pointsEarned
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

    return { order: clone(order), payment: clone(payment), user: clone(shopper) }
  },

  // ---- Payment gateway simulation ----
  // Mirrors "Never trust the frontend payment message alone": the order/invoice state
  // only changes once this (mock) webhook-equivalent resolves, not when the UI shows a result.
  async getOrderPayment(orderId) {
    await delay(200)
    return clone(findOrderPayment(orderId) || null)
  },

  async simulatePaymentResult({ orderId, outcome }) {
    if (hasLiveApi()) {
      try {
        const liveRes = await live('/payments/simulate-result/', {
          method: 'POST',
          body: { order_id: orderId, outcome },
        })
        if (liveRes?.order) {
          return {
            order: liveRes.order,
            payment: liveRes.payment || {},
            invoice: liveRes.order?.invoice || null,
          }
        }
      } catch (liveErr) {
        console.warn('Live simulate payment fallback triggered:', liveErr)
      }
    }

    await delay(1200)
    const order = store.orders.find((o) => o.id === orderId) || store.orders[0]
    const payment = findOrderPayment(orderId) || { id: 'pay_simulated', order_id: orderId, amount: order?.total || 0 }
    if (!order) throw new Error('Order not found.')

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

  async createReturn({ orderId, reason, note, returnLines, pickupSlot, refundMethod = 'original', images = [] }) {
    if (hasLiveApi()) {
      const payload = {
        order_id: orderId,
        reason,
        note,
        refund_method: refundMethod,
        images: images || [],
        return_lines: (returnLines || []).map((line) => ({
          product_id: line.product_id,
          name: line.name,
          quantity: line.quantity,
          price: Number(line.price),
        })),
        pickup_slot: pickupSlot,
      }
      return live('/returns/', { method: 'POST', body: payload })
    }
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
      refund_method: refundMethod,
      images: images || [],
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
    order.delivery_status = 'Return Requested'
    order.status = 'Return Requested'
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
    if (hasLiveApi()) {
      return live(`/returns/${returnId}/escalate/`, {
        method: 'POST',
        body: { escalation_reason: escalationReason },
      })
    }
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
    if (hasLiveApi()) {
      return live('/verification/verify/', {
        method: 'POST',
        body: { return_id: returnId || '', code },
      })
    }
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
    if (hasLiveApi()) return live('/admin/dashboard/', { role: 'merchant' })
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
    if (hasLiveApi()) {
      try {
        const data = await live('/admin/orders/', { role: 'merchant' })
        if (Array.isArray(data) && data.length > 0) return data
      } catch (e) {
        console.warn('Live orders fetch fallback:', e)
      }
    }
    await delay(300)
    return clone(store.orders)
  },

  async updateOrderStatus({ orderId, deliveryStatus }) {
    if (hasLiveApi()) {
      try {
        return await live(`/orders/${orderId}/status/`, {
          method: 'POST',
          body: { deliveryStatus },
          role: 'merchant',
        })
      } catch (e) {
        console.warn('Live updateOrderStatus fallback:', e)
      }
    }
    await delay(300)
    const order = store.orders.find((o) => o.id === orderId || o.order_number === orderId)
    if (order) {
      order.delivery_status = deliveryStatus
      if (deliveryStatus === 'Delivered') {
        order.status = 'Delivered'
        order.delivered_at = new Date().toISOString()
      }
    }
    return { status: 'success', orderId, deliveryStatus }
  },

  async getMerchantCustomers() {
    if (hasLiveApi()) {
      try {
        const data = await live('/admin/customers/', { role: 'merchant' })
        if (Array.isArray(data) && data.length > 0) return data
      } catch (e) {
        console.warn('Live customers fetch fallback:', e)
      }
    }
    await delay(300)
    return clone(store.shoppers)
  },

  async getMerchantReturns() {
    if (hasLiveApi()) {
      try {
        const data = await live('/admin/flagged-cases/', { role: 'merchant' })
        if (Array.isArray(data) && data.length > 0) return data
      } catch (e) {
        console.warn('Live flagged-cases fetch fallback:', e)
      }
    }
    await delay(300)
    return clone(store.returns)
  },

  async reviewReturn({ returnId, action, notes }) {
    if (hasLiveApi()) {
      try {
        return await live(`/admin/flagged-cases/${returnId}/`, {
          method: 'PATCH',
          body: {
            status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action,
            outcome: action === 'approve' ? 'manual_approved' : action === 'reject' ? 'rejected' : action,
            notes,
          },
          role: 'merchant',
        })
      } catch (e) {
        console.warn('Live reviewReturn fallback:', e)
      }
    }
    await delay(300)
    const ret = store.returns.find((r) => r.id === returnId || String(r.id) === String(returnId))
    if (ret) {
      ret.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action
      ret.outcome = action === 'approve' ? 'manual_approved' : action === 'reject' ? 'rejected' : action
      ret.timeline = ret.timeline || []
      ret.timeline.push({ label: `Merchant ${action.toUpperCase()}: ${notes || 'Reviewed'}`, at: new Date().toISOString() })
      return clone(ret)
    }
    return { id: returnId, status: action, outcome: action }
  },

  async getCustomerReview(customerId) {
    if (hasLiveApi()) {
      try {
        return await live(`/fraud/customers/${customerId}/review/`, { role: 'merchant' })
      } catch (e) {
        console.warn('Live getCustomerReview fallback:', e)
      }
    }
    await delay(250)
    return {
      profile: {
        id: customerId,
        customer_id: customerId,
        risk_tier: 'High',
        latest_score: 82,
        escalation_level: 3,
        confirmed_violations: 2,
        restriction_count: 1,
      },
      behavior: {
        total_orders: 10,
        total_returns: 6,
        total_cod_refusals: 2,
        successful_deliveries: 4,
        multiple_variant_orders: 6,
        high_value_cod_count: 4,
        address_mismatch_count: 2,
        return_rate: 0.6,
      },
      restrictions: store.restrictions || [],
      escalation_history: store.escalationHistory || [],
      decision: {
        recommended_action: 'require_prepaid',
      },
    }
  },

  async performMerchantAction({ customerId, action, notes, threshold_value, escalation_level }) {
    if (hasLiveApi()) {
      try {
        return await live(`/fraud/customers/${customerId}/action/`, {
          method: 'POST',
          body: { action, notes, threshold_value, escalation_level },
          role: 'merchant',
        })
      } catch (e) {
        console.warn('Live performMerchantAction fallback:', e)
      }
    }
    await delay(300)
    if (action === 'restrict_cod') {
      store.restrictions = store.restrictions || []
      store.restrictions.unshift({
        id: nextId('r', store.restrictions),
        customer_id: customerId,
        restriction_type: 'cod_suspended',
        reason: notes || 'COD restricted by merchant',
        status: 'active',
        start_date: new Date().toISOString(),
      })
    } else if (action === 'require_prepaid') {
      store.restrictions = store.restrictions || []
      store.restrictions.unshift({
        id: nextId('r', store.restrictions),
        customer_id: customerId,
        restriction_type: 'prepaid_only',
        reason: notes || 'Prepaid required by merchant',
        status: 'active',
        start_date: new Date().toISOString(),
      })
    } else if (action === 'increase_restriction') {
      store.escalationHistory = store.escalationHistory || []
      store.escalationHistory.unshift({
        id: nextId('esc', store.escalationHistory),
        customer_id: customerId,
        previous_level: 2,
        new_level: 3,
        trigger_event: notes || 'Manual merchant escalation',
        created_at: new Date().toISOString(),
      })
    } else if (action === 'suspend_account') {
      store.restrictions = store.restrictions || []
      store.restrictions.unshift({
        id: nextId('r', store.restrictions),
        customer_id: customerId,
        restriction_type: 'account_restricted',
        reason: notes || 'Account suspended by merchant',
        status: 'active',
        start_date: new Date().toISOString(),
      })
    } else if (action === 'set_escalation_level') {
      const lvl = escalation_level ?? threshold_value ?? 1
      store.escalationHistory = store.escalationHistory || []
      store.escalationHistory.unshift({
        id: nextId('esc', store.escalationHistory),
        customer_id: customerId,
        previous_level: 1,
        new_level: lvl,
        trigger_event: notes || `Direct manual switch to Step ${lvl}`,
        created_at: new Date().toISOString(),
      })
    }
    return { action, status: 'completed' }
  },

  async removeCustomerRestriction({ customerId, restrictionId }) {
    if (hasLiveApi()) {
      try {
        return await live(`/fraud/customers/${customerId}/action/`, {
          method: 'POST',
          body: { action: 'remove_restriction', restriction_id: restrictionId },
          role: 'merchant',
        })
      } catch (e) {
        console.warn('Live removeCustomerRestriction fallback:', e)
      }
    }
    await delay(300)
    if (store.restrictions) {
      store.restrictions = store.restrictions.filter((r) => r.id !== restrictionId)
    }
    return { restrictionId, status: 'removed' }
  },

  async getMerchantAuditLog() {
    if (hasLiveApi()) {
      try {
        const data = await live('/admin/audit-log/', { role: 'merchant' })
        if (Array.isArray(data) && data.length > 0) return data
      } catch (e) {
        console.warn('Live audit-log fetch fallback:', e)
      }
    }
    await delay(300)
    return clone(store.auditLog)
  },

  async getAnalytics() {
    if (hasLiveApi()) return live('/analytics/', { role: 'merchant' })
    await delay(600)
    return {
      weeklyTrend: clone(store.weeklyTrend),
      topFlaggedCustomers: clone(store.topFlaggedCustomers),
      categoryReturnRates: clone(store.categoryReturnRates),
      selfTuningSuggestions: clone(store.selfTuningSuggestions),
    }
  },

  async applySelfTuningSuggestion(suggestionId) {
    if (hasLiveApi()) {
      return live(`/admin/self-tuning/${suggestionId}/apply/`, { method: 'POST', role: 'merchant' })
    }
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
    if (hasLiveApi()) return live('/admin/delivery-agents/', { role: 'merchant' })
    await delay(500)
    return clone(store.deliveryAgents)
  },

  async updateOrderStatus({ orderId, deliveryStatus, status, notes = '' }) {
    if (hasLiveApi()) {
      return live(`/admin/orders/${orderId}/status/`, {
        method: 'POST',
        body: { delivery_status: deliveryStatus, status, notes },
        role: 'merchant',
      })
    }
    await delay(500)
    const order = store.orders.find((o) => o.id === orderId || o.order_number === orderId)
    if (!order) throw new Error('Order not found.')
    if (deliveryStatus) order.delivery_status = deliveryStatus
    if (status) order.status = status
    if (deliveryStatus === 'Delivered' && !order.delivered_at) {
      order.delivered_at = new Date().toISOString()
      if (!status) order.status = 'Delivered'
    }
    return clone(order)
  },

  async reviewReturn({ returnId, action, notes }) {
    if (hasLiveApi()) {
      try {
        const res = await live(`/admin/returns/${returnId}/review/`, {
          method: 'POST',
          body: { action, notes },
          role: 'merchant',
        })
        if (res) return res
      } catch (e) {
        console.warn('Live reviewReturn fallback:', e)
      }
    }
    await delay(300)
    const record = store.returns.find((r) => r.id === returnId || String(r.id) === String(returnId) || r.order_number?.includes(String(returnId))) || store.returns[0]
    if (!record) return { id: returnId, status: action, outcome: action }
    
    let label = 'Reviewed'
    if (action === 'approve') {
      record.status = 'approved'
      record.outcome = 'legitimate_return'
      label = 'Approved'
    } else if (action === 'reject') {
      record.status = 'rejected'
      record.outcome = 'confirmed_fraud'
      label = 'Rejected'
    } else if (action === 'product_returned' || action === 'mark_returned') {
      record.status = 'product_returned'
      record.outcome = 'product_returned'
      label = 'Product Returned'
    } else if (action === 'refund_processed' || action === 'process_refund') {
      record.status = 'refund_processed'
      record.outcome = 'refund_processed'
      label = 'Refund Processed'
    }

    record.reviewed_by = session.merchant?.email || 'admin@returnguard.in'
    record.reviewed_at = new Date().toISOString()
    record.timeline = [
      ...(record.timeline || []),
      { label, at: new Date().toISOString() },
    ]
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action,
      target: `Return ${record.order_number || returnId}`,
      timestamp: new Date().toISOString(),
      notes,
    })

    return clone(record)
  },

  async getCustomerRiskProfile(customerId) {
    if (hasLiveApi()) return live(`/admin/customers/${customerId}/`, { role: 'merchant' })
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
      const merchant = await live('/merchants/me/', { method: 'PATCH', body: patch, role: 'merchant' })
      persistMerchant(merchant)
      return merchant
    }
    await delay(500)
    Object.assign(store.merchant, patch)
    persistMerchant(store.merchant)
    return clone(store.merchant)
  },

  async getMerchantProducts({ categoryId, query, status } = {}) {
    if (hasLiveApi()) {
      const params = new URLSearchParams()
      if (categoryId && categoryId !== 'all') params.set('category_id', categoryId)
      if (query) params.set('query', query)
      if (status && status !== 'all') params.set('status', status)
      const qs = params.toString()
      return live(`/admin/products/${qs ? `?${qs}` : ''}`, { role: 'merchant' })
    }
    await delay(350)
    let list = clone(store.products)
    if (categoryId && categoryId !== 'all') {
      list = list.filter((p) => p.category_id === categoryId)
    }
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    }
    if (status === 'active') list = list.filter((p) => p.is_active !== false)
    else if (status === 'inactive') list = list.filter((p) => p.is_active === false)
    else if (status === 'out_of_stock') list = list.filter((p) => Number(p.stock) === 0)
    else if (status === 'low_stock') list = list.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5)
    return list
  },

  async createProduct(payload) {
    if (hasLiveApi()) {
      return live('/admin/products/', { method: 'POST', body: payload, role: 'merchant' })
    }
    await delay(400)
    const product = {
      id: nextId('prod', store.products),
      merchant_id: store.merchant?.id || 'merchant_1',
      category_id: payload.category_id || null,
      name: payload.name,
      price: Number(payload.price),
      stock: Number(payload.stock ?? 0),
      image: payload.image || '',
      description: payload.description || '',
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
    }
    store.products.unshift(product)
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: store.merchant?.id || 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action: 'created',
      target: `Product: ${product.name}`,
      timestamp: new Date().toISOString(),
      notes: `Added product with price ₹${product.price} and stock ${product.stock}.`,
    })
    return clone(product)
  },

  async bulkCreateMerchantProducts(productsList) {
    if (hasLiveApi()) {
      return live('/admin/products/bulk/', { method: 'POST', body: { products: productsList }, role: 'merchant' })
    }
    await delay(600)
    const created = []
    for (const item of productsList) {
      if (!item.name) continue
      let catId = item.category_id
      if (!catId && item.category) {
        const found = store.categories.find((c) => c.name.toLowerCase() === item.category.toLowerCase().trim())
        if (found) {
          catId = found.id
        } else {
          catId = `cat_${store.categories.length + 1}_${Date.now()}`
          store.categories.push({ id: catId, name: item.category, description: `${item.category} products` })
        }
      }
      const product = {
        id: nextId('prod', store.products),
        merchant_id: store.merchant?.id || 'merchant_1',
        category_id: catId || null,
        name: item.name,
        price: Number(item.price || 0),
        stock: Number(item.stock ?? 0),
        image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        description: item.description || '',
        is_active: item.is_active ?? true,
        created_at: new Date().toISOString(),
      }
      store.products.unshift(product)
      created.push(product)
    }
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: store.merchant?.id || 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action: 'bulk_imported',
      target: 'Products Bulk Import',
      timestamp: new Date().toISOString(),
      notes: `Imported ${created.length} products via CSV/Bulk Entry.`,
    })
    return { count: created.length, products: clone(created) }
  },

  async updateProduct(id, patch) {
    if (hasLiveApi()) {
      return live(`/admin/products/${id}/`, { method: 'PATCH', body: patch, role: 'merchant' })
    }
    await delay(350)
    const product = store.products.find((p) => p.id === id)
    if (!product) throw new Error('Product not found.')
    Object.assign(product, patch)
    if (patch.price !== undefined) product.price = Number(patch.price)
    if (patch.stock !== undefined) product.stock = Number(patch.stock)
    store.auditLog.unshift({
      id: nextId('audit', store.auditLog),
      merchant_id: store.merchant?.id || 'merchant_1',
      actor: session.merchant?.email || 'admin@returnguard.in',
      action: 'updated',
      target: `Product: ${product.name}`,
      timestamp: new Date().toISOString(),
      notes: 'Updated product details.',
    })
    return clone(product)
  },

  async deleteProduct(id) {
    if (hasLiveApi()) {
      return live(`/admin/products/${id}/`, { method: 'DELETE', role: 'merchant' })
    }
    await delay(300)
    const index = store.products.findIndex((p) => p.id === id)
    if (index !== -1) {
      const [removed] = store.products.splice(index, 1)
      store.auditLog.unshift({
        id: nextId('audit', store.auditLog),
        merchant_id: store.merchant?.id || 'merchant_1',
        actor: session.merchant?.email || 'admin@returnguard.in',
        action: 'deleted',
        target: `Product: ${removed.name}`,
        timestamp: new Date().toISOString(),
        notes: 'Deleted product from catalog.',
      })
    }
    return { deleted: true, id }
  },

  async uploadProductImages(files) {
    // files: File[] — from an <input type="file" multiple> or drag-drop
    if (hasLiveApi()) {
      const tokens = readTokens()
      const formData = new FormData()
      for (const file of files) {
        formData.append('images', file)
      }
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/admin/products/upload-image/`,
        {
          method: 'POST',
          headers: {
            ...(tokens.merchant?.access ? { Authorization: `Bearer ${tokens.merchant.access}` } : {}),
          },
          body: formData,
        }
      )
      if (!resp.ok) {
        let msg = 'Image upload failed.'
        try { const d = await resp.json(); msg = d?.error || d?.detail || msg } catch { /* */ }
        throw new Error(msg)
      }
      const data = await resp.json()
      return unwrap(data)
    }
    // Mock mode — create object URLs so previews work instantly without backend
    await delay(400)
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    return { urls, count: urls.length, errors: [] }
  },

  async getMerchantCategories() {
    if (hasLiveApi()) return live('/admin/categories/', { role: 'merchant' })
    await delay(250)
    return clone(store.categories)
  },

  async createCategory(payload) {
    if (hasLiveApi()) {
      return live('/admin/categories/', { method: 'POST', body: payload, role: 'merchant' })
    }
    await delay(350)
    const category = {
      id: nextId('cat', store.categories),
      name: payload.name,
      description: payload.description || '',
    }
    store.categories.push(category)
    return clone(category)
  },

  async getMerchantOnboarding() {
    if (hasLiveApi()) {
      const merchant = await live('/merchants/me/', { role: 'merchant' })
      persistMerchant(merchant)
      return merchant
    }
    await delay(300)
    if (session.merchant) {
      const email = session.merchant.email
      const name = session.merchant.name || email.split('@')[0]
      const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
      return {
        id: `merchant_${slug}`,
        business_name: `${name}'s Store`,
        store_slug: slug,
        admin_email: email,
        plan_tier: 'Pilot',
        created_at: new Date().toISOString(),
      }
    }
    return clone(store.merchant)
  },

  async registerMerchant({ businessName, storeSlug, adminEmail }) {
    const payload = {
      business_name: businessName,
      store_slug: storeSlug,
      admin_email: adminEmail,
    }
    if (hasLiveApi()) {
      const merchant = await live('/merchants/', { method: 'POST', body: payload, role: 'merchant' })
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

  async registerMerchantAccount({ name, email, password, businessName, storeSlug, address, city, state, pincode, phone, gstin }) {
    if (hasLiveApi()) {
      return live('/merchants/register/', {
        method: 'POST',
        body: {
          name,
          email,
          password,
          business_name: businessName,
          store_slug: storeSlug,
          address: address || '',
          city: city || '',
          state: state || '',
          pincode: pincode || '',
          phone: phone || '',
          gstin: gstin || '',
        },
      })
    }
    await delay(800)
    
    // Check if email already registered
    const list = store.merchantsList || [store.merchantAdmin]
    if (list.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered.')
    }
    
    // Generate unique merchant username
    const base = businessName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12) || 'MERCHANT'
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const merchant_username = `${base}${suffix}`
    
    const merchantAdmin = {
      id: 'admin_' + Date.now(),
      name,
      email,
      password,
      merchant_username,
      role: 'merchant_admin',
    }
    
    const merchant = {
      id: createMerchantId(storeSlug),
      merchant_username,
      business_name: businessName,
      store_slug: storeSlug,
      admin_email: email,
      plan_tier: 'Pilot',
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      phone: phone || '',
      gstin: gstin || '',
      created_at: new Date().toISOString(),
    }
    
    if (!store.merchantsList) store.merchantsList = [store.merchantAdmin]
    store.merchantsList.push(merchantAdmin)
    persistMerchant(merchant)
    
    return {
      merchant_username,
      email,
      name,
      business_name: businessName,
      store_slug: storeSlug,
      address,
      city,
      state,
      pincode,
      phone,
      gstin,
    }
  },

  async getFraudConfig() {
    if (hasLiveApi()) return live('/admin/fraud-config/', { role: 'merchant' })
    await delay(400)
    return clone(store.fraudConfig)
  },

  async updateFraudConfig(patch) {
    if (hasLiveApi()) return live('/admin/fraud-config/', { method: 'PATCH', body: patch, role: 'merchant' })
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
    if (hasLiveApi()) return live('/notifications/')
    await delay(350)
    const userId = session.shopper?.id || session.merchant?.id
    return clone(store.notifications.filter((n) => n.user_id === userId))
  },

  async markNotificationsRead() {
    if (hasLiveApi()) return live('/notifications/read/', { method: 'POST' })
    await delay(250)
    const userId = session.shopper?.id || session.merchant?.id
    store.notifications = store.notifications.map((n) => (n.user_id === userId ? { ...n, read: true } : n))
    return clone(store.notifications.filter((n) => n.user_id === userId))
  },

  // ---- Coupons (Merchant CRUD) ----
  async getMerchantCoupons() {
    await delay(300)
    return clone(store.coupons)
  },

  async createCoupon(data) {
    await delay(400)
    const coupon = {
      id: nextId('coupon', store.coupons),
      code: (data.code || '').trim().toUpperCase(),
      merchant_id: store.merchant?.id || 'merchant_1',
      discount_type: data.discount_type || 'percentage',
      discount_value: Number(data.discount_value) || 0,
      min_order_value: Number(data.min_order_value) || 0,
      applicable_product_ids: data.applicable_product_ids || [],
      applicable_category_ids: data.applicable_category_ids || [],
      max_uses: Number(data.max_uses) || 100,
      used_count: 0,
      is_active: data.is_active !== false,
      expires_at: data.expires_at || new Date(Date.now() + 90 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      description: data.description || '',
    }
    if (store.coupons.some((c) => c.code === coupon.code)) {
      throw new Error('A coupon with this code already exists.')
    }
    store.coupons.push(coupon)
    return clone(coupon)
  },

  async updateCoupon(id, data) {
    await delay(350)
    const idx = store.coupons.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Coupon not found.')
    const existing = store.coupons[idx]
    const newCode = (data.code || existing.code).trim().toUpperCase()
    if (newCode !== existing.code && store.coupons.some((c) => c.code === newCode && c.id !== id)) {
      throw new Error('A coupon with this code already exists.')
    }
    store.coupons[idx] = {
      ...existing,
      code: newCode,
      discount_type: data.discount_type ?? existing.discount_type,
      discount_value: data.discount_value !== undefined ? Number(data.discount_value) : existing.discount_value,
      min_order_value: data.min_order_value !== undefined ? Number(data.min_order_value) : existing.min_order_value,
      applicable_product_ids: data.applicable_product_ids ?? existing.applicable_product_ids,
      applicable_category_ids: data.applicable_category_ids ?? existing.applicable_category_ids,
      max_uses: data.max_uses !== undefined ? Number(data.max_uses) : existing.max_uses,
      is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
      expires_at: data.expires_at || existing.expires_at,
      description: data.description !== undefined ? data.description : existing.description,
    }
    return clone(store.coupons[idx])
  },

  async deleteCoupon(id) {
    await delay(300)
    const idx = store.coupons.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Coupon not found.')
    store.coupons.splice(idx, 1)
    return { success: true }
  },

  // ---- Coupons (Shopper-facing) ----
  async getCouponsForProduct(productId) {
    await delay(200)
    const product = store.products.find((p) => p.id === productId)
    if (!product) return []
    const now = new Date()
    return clone(
      store.coupons.filter((c) => {
        if (!c.is_active) return false
        if (new Date(c.expires_at) < now) return false
        if (c.used_count >= c.max_uses) return false
        const hasProductScope = c.applicable_product_ids && c.applicable_product_ids.length > 0
        const hasCategoryScope = c.applicable_category_ids && c.applicable_category_ids.length > 0
        if (!hasProductScope && !hasCategoryScope) return true
        if (hasProductScope && c.applicable_product_ids.includes(productId)) return true
        if (hasCategoryScope && c.applicable_category_ids.includes(product.category_id)) return true
        return false
      })
    )
  },

  async getAvailableCoupons() {
    if (hasLiveApi()) {
      try {
        return await live('/admin/coupons/', { role: 'merchant' })
      } catch {
        // Coupons endpoint may not exist or user may not have merchant role — fallback to mock
      }
    }
    await delay(200)
    const now = new Date()
    return clone(
      store.coupons.filter((c) => c.is_active && new Date(c.expires_at) >= now && c.used_count < c.max_uses)
    )
  },

  // ---- Payment Processing ----
  async processPayment({ paymentId, orderId, paymentMethod, paymentDetails }) {
    if (hasLiveApi()) {
      return live('/payments/process/', {
        method: 'POST',
        body: { payment_id: paymentId, payment_data: { order_id: orderId, payment_method: paymentMethod, ...paymentDetails } },
      })
    }
    await delay(1000)
    const order = store.orders.find((o) => o.id === orderId) || store.orders[0]
    let payment = findOrderPayment(orderId)
    if (!payment) {
      payment = {
        id: nextId('pay', store.payments),
        order_id: orderId,
        order_number: order?.order_number || '#1001',
        user_id: order?.user_id || 'user_1',
        amount: order?.total || 0,
      }
      store.payments.push(payment)
    }

    // Always succeed for demo checkout experience
    const isSuccess = true

    payment.payment_method = paymentMethod
    payment.payment_details = paymentDetails
    payment.is_demo_payment = true
    payment.updated_at = new Date().toISOString()

    if (isSuccess) {
      payment.status = 'Paid'
      payment.transaction_id = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
      payment.failure_reason = null
      order.status = order.risk_tier === 'High' ? 'Review' : 'Confirmed'
      order.delivery_status = order.risk_tier === 'High' ? 'Pending Review' : 'Processing'
      order.payment_status = 'Paid'

      // Generate invoice for successful payment
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

      return {
        success: true,
        payment: clone(payment),
        order: clone(order),
        invoice: clone(invoice),
      }
    } else {
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

      return {
        success: false,
        payment: clone(payment),
        order: clone(order),
        invoice: null,
      }
    }
  },

  async getPaymentStatus(paymentId) {
    if (hasLiveApi()) {
      return live(`/payments/${paymentId}/status/`)
    }
    await delay(300)
    const payment = store.payments.find((p) => p.id === paymentId)
    if (!payment) throw new Error('Payment not found.')
    return clone(payment)
  },

  async downloadInvoice(invoiceId) {
    if (hasLiveApi()) {
      // Authenticated PDF download
      const tokens = readTokens()
      const token = tokens.shopper?.access
      const API_BASE_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
      const url = `${API_BASE_URL}/invoices/${invoiceId}/download/`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to download invoice (${response.status})`)
      }
      
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `Invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      
      return { download_url: url, downloaded: true }
    }
    await delay(300)
    const invoice = store.invoices.find((inv) => inv.id === invoiceId)
    if (!invoice) throw new Error('Invoice not found.')
    return { download_url: invoice.invoice_url }
  },

  async getCustomerReview(customerId) {
    if (hasLiveApi()) {
      return live(`/fraud/customers/${customerId}/review/`, { role: 'merchant' })
    }
    await delay(300)
    const shopper = store.shoppers.find((s) => s.id === customerId || s.customer_id === customerId)
    if (!shopper) throw new Error('Customer not found')

    const scoring = clone(store.scoringEvents || []).filter(
      (e) => e.customer_id === shopper.id || e.customer_id === shopper.customer_id
    )
    const restrictions = clone(store.restrictions || []).filter(
      (r) => r.customer_id === shopper.id
    )
    const escalation_history = clone(store.escalationHistory || []).filter(
      (h) => h.customer_id === shopper.id
    )

    const behavior = {
      total_orders: shopper.total_orders || 0,
      total_returns: shopper.total_returns || 0,
      total_cod_refusals: shopper.total_cod_refusals || 0,
      successful_deliveries: shopper.successful_deliveries || 0,
      multiple_variant_orders: shopper.multiple_variant_orders || 0,
      high_value_cod_count: shopper.high_value_cod_count || 0,
      address_mismatch_count: shopper.address_mismatch_count || 0,
      return_rate: shopper.total_orders ? Number((shopper.total_returns / shopper.total_orders).toFixed(2)) : 0,
    }

    const level = shopper.escalation_level || 0
    let recommended_action = 'accept'
    let available_actions = ['accept']
    if (shopper.risk_tier === 'Medium') {
      recommended_action = 'verify'
      available_actions = ['accept', 'reject', 'verify', 'restrict_cod', 'restrict_high_value']
    } else if (shopper.risk_tier === 'High') {
      recommended_action = level >= 4 ? 'suspend_account' : level >= 3 ? 'require_prepaid' : 'manual_review'
      available_actions = [
        'accept', 'reject', 'verify', 'restrict_cod',
        'restrict_high_value', 'require_prepaid',
        'manual_review', 'increase_restriction', 'suspend_account'
      ]
    }

    return {
      profile: {
        id: shopper.id,
        customer_id: shopper.customer_id,
        customer_email: shopper.email,
        customer_name: shopper.name,
        risk_tier: shopper.risk_tier || 'Low',
        latest_score: shopper.risk_tier === 'High' ? 87 : shopper.risk_tier === 'Medium' ? 55 : 15,
        device_reuse_flag: shopper.device_reuse_flag || false,
        escalation_level: level,
        escalation_label: ['Normal', 'Warning / Verification', 'COD Restricted', 'Prepaid + Manual Review', 'Temporary Account Restriction', 'Merchant Final Review'][level] || 'Normal',
        confirmed_violations: shopper.confirmed_violations || 0,
        restriction_count: restrictions.filter((r) => r.status === 'active').length,
        created_at: shopper.joined_at,
      },
      behavior,
      scoring,
      restrictions,
      escalation_history,
      decision: {
        status: shopper.risk_tier === 'Low' ? 'approved' : 'manual_review',
        outcome: shopper.risk_tier === 'Low' ? 'auto_approved' : 'pending_review',
        requires_otp: shopper.risk_tier === 'Medium',
        recommended_action,
        available_actions,
        escalation_recommendation: shopper.risk_tier === 'High' ? 'increase_restriction' : null,
      },
    }
  },

  async performMerchantAction({ customerId, action, notes = '', threshold_value = null, restriction_id = null, escalation_level = null }) {
    if (hasLiveApi()) {
      const body = { action, notes }
      if (threshold_value !== null && threshold_value !== undefined) body.threshold_value = threshold_value
      if (restriction_id !== null && restriction_id !== undefined) body.restriction_id = restriction_id
      if (escalation_level !== null && escalation_level !== undefined) body.escalation_level = escalation_level
      return live(`/fraud/customers/${customerId}/action/`, {
        method: 'POST',
        body,
        role: 'merchant',
      })
    }
    await delay(300)
    const shopper = store.shoppers.find((s) => s.id === customerId || s.customer_id === customerId)
    if (!shopper) throw new Error('Customer not found')

    if (action === 'set_escalation_level') {
      const prevLevel = shopper.escalation_level || 0
      const newLvl = threshold_value !== null && threshold_value !== undefined ? Number(threshold_value) : 1
      shopper.escalation_level = Math.max(0, Math.min(5, newLvl))
      store.escalationHistory.unshift({
        id: `esc_${Date.now()}`,
        merchant_id: 'merchant_1',
        customer_id: shopper.id,
        previous_level: prevLevel,
        new_level: shopper.escalation_level,
        trigger_event: notes || `Direct manual switch to Level ${shopper.escalation_level}`,
        notes: notes,
        created_at: new Date().toISOString(),
      })
    } else if (action === 'increase_restriction' || action === 'suspend_account') {
      const prevLevel = shopper.escalation_level || 0
      shopper.escalation_level = Math.min(prevLevel + 1, 5)
      shopper.confirmed_violations = (shopper.confirmed_violations || 0) + 1
      store.escalationHistory.unshift({
        id: `esc_${Date.now()}`,
        merchant_id: 'merchant_1',
        customer_id: shopper.id,
        previous_level: prevLevel,
        new_level: shopper.escalation_level,
        trigger_event: notes || `Action: ${action}`,
        notes: notes,
        created_at: new Date().toISOString(),
      })
      if (action === 'suspend_account') {
        store.restrictions.unshift({
          id: `rest_${Date.now()}`,
          merchant_id: 'merchant_1',
          customer_id: shopper.id,
          restriction_type: 'account_restricted',
          reason: notes || 'Account suspended by merchant',
          status: 'active',
          threshold_value: null,
          start_date: new Date().toISOString(),
          end_date: null,
          applied_by: 'admin@merchant.com',
          removed_by: '',
          created_at: new Date().toISOString(),
        })
      }
    } else if (action === 'restrict_cod') {
      store.restrictions.unshift({
        id: `rest_${Date.now()}`,
        merchant_id: 'merchant_1',
        customer_id: shopper.id,
        restriction_type: 'cod_suspended',
        reason: notes || 'COD restricted by merchant',
        status: 'active',
        threshold_value: threshold_value,
        start_date: new Date().toISOString(),
        end_date: null,
        applied_by: 'admin@merchant.com',
        removed_by: '',
        created_at: new Date().toISOString(),
      })
    } else if (action === 'require_prepaid') {
      store.restrictions.unshift({
        id: `rest_${Date.now()}`,
        merchant_id: 'merchant_1',
        customer_id: shopper.id,
        restriction_type: 'prepaid_only',
        reason: notes || 'Prepaid required by merchant',
        status: 'active',
        threshold_value: null,
        start_date: new Date().toISOString(),
        end_date: null,
        applied_by: 'admin@merchant.com',
        removed_by: '',
        created_at: new Date().toISOString(),
      })
    } else if (action === 'restrict_high_value') {
      store.restrictions.unshift({
        id: `rest_${Date.now()}`,
        merchant_id: 'merchant_1',
        customer_id: shopper.id,
        restriction_type: 'high_value_restricted',
        reason: notes || 'High-value orders restricted',
        status: 'active',
        threshold_value: threshold_value || 5000,
        start_date: new Date().toISOString(),
        end_date: null,
        applied_by: 'admin@merchant.com',
        removed_by: '',
        created_at: new Date().toISOString(),
      })
    } else if (action === 'remove_restriction' && restriction_id) {
      const rest = store.restrictions.find((r) => r.id === restriction_id)
      if (rest) {
        rest.status = 'removed'
        rest.removed_by = 'admin@merchant.com'
        rest.end_date = new Date().toISOString()
      }
    }

    store.auditLog.unshift({
      id: `audit_${Date.now()}`,
      merchant_id: 'merchant_1',
      actor: 'admin@merchant.com',
      action: action,
      target: shopper.email,
      notes: notes || `Action: ${action}`,
      created_at: new Date().toISOString(),
    })

    return { action, status: 'completed' }
  },

  async getCustomerRestrictions(customerId) {
    if (hasLiveApi()) {
      return live(`/fraud/customers/${customerId}/restrictions/`, { role: 'merchant' })
    }
    await delay(200)
    return clone(store.restrictions || []).filter((r) => r.customer_id === customerId)
  },

  async getEscalationHistory(customerId) {
    if (hasLiveApi()) {
      return live(`/fraud/customers/${customerId}/escalation-history/`, { role: 'merchant' })
    }
    await delay(200)
    return clone(store.escalationHistory || []).filter((h) => h.customer_id === customerId)
  },

  async removeCustomerRestriction(restrictionId) {
    if (hasLiveApi()) {
      // Handled via action endpoint with remove_restriction
      return live(`/fraud/customers/0/action/`, {
        method: 'POST',
        body: { action: 'remove_restriction', restriction_id: restrictionId },
        role: 'merchant',
      })
    }
    await delay(200)
    const rest = store.restrictions.find((r) => r.id === restrictionId)
    if (rest) {
      rest.status = 'removed'
      rest.removed_by = 'admin@merchant.com'
      rest.end_date = new Date().toISOString()
    }
    return { status: 'removed' }
  },

  // ── VIP Whitelist & Blacklist Rules (Feature 2) ──
  async getListRules(type) {
    if (hasLiveApi()) {
      try {
        const q = type ? `?type=${type}` : ''
        const data = await live(`/fraud/rules/list/${q}`, { role: 'merchant' })
        if (Array.isArray(data) && data.length > 0) return data
      } catch (e) {
        console.warn('Live rules fetch fallback:', e)
      }
    }
    await delay(250)
    let list = clone(store.listRules || [])
    if (type) list = list.filter((r) => r.rule_type === type)
    return list
  },

  async createListRule(data) {
    if (hasLiveApi()) {
      return live(`/fraud/rules/list/`, {
        method: 'POST',
        body: data,
        role: 'merchant',
      })
    }
    await delay(300)
    const newRule = {
      id: `rule_${Date.now()}`,
      merchant_id: 'merchant_1',
      rule_type: data.rule_type || 'blacklist',
      entry_type: data.entry_type || 'email',
      value: data.value,
      reason: data.reason || '',
      created_by: 'admin@merchant.com',
      is_active: true,
      created_at: new Date().toISOString(),
    }
    store.listRules.unshift(newRule)
    return clone(newRule)
  },

  async deleteListRule(id) {
    if (hasLiveApi()) {
      return live(`/fraud/rules/list/${id}/`, {
        method: 'DELETE',
        role: 'merchant',
      })
    }
    await delay(200)
    store.listRules = store.listRules.filter((r) => r.id !== id)
    return { status: 'deleted' }
  },

  async toggleListRule(id) {
    if (hasLiveApi()) {
      return live(`/fraud/rules/list/${id}/`, {
        method: 'PATCH',
        role: 'merchant',
      })
    }
    await delay(200)
    const rule = store.listRules.find((r) => r.id === id)
    if (rule) rule.is_active = !rule.is_active
    return clone(rule)
  },

  // ── Loss Prevention ROI Analytics (Feature 4) ──
  async getLossPreventionROI() {
    if (hasLiveApi()) {
      return live(`/fraud/analytics/roi/`, { role: 'merchant' })
    }
    await delay(200)
    return clone(LOSS_PREVENTION_ROI)
  },

  // ── Doorstep Refusal Reporting (Feature 5) ──
  async reportDoorstepRefusal({ orderId, reason, refusal_type = 'customer_rejected', notes = '' }) {
    if (hasLiveApi()) {
      return live(`/orders/${orderId}/doorstep-refusal/`, {
        method: 'POST',
        body: { reason, refusal_type, notes },
        role: 'merchant',
      })
    }
    await delay(400)
    const order = store.orders.find((o) => o.id === orderId || o.order_number === orderId)
    if (!order) throw new Error('Order not found')
    order.delivery_status = 'Refused'
    order.is_cod_refused = true
    order.tracking_events = [
      ...(order.tracking_events || []),
      { label: `Doorstep Refused: ${reason}`, at: new Date().toISOString(), done: true },
    ]

    const shopper = store.shoppers.find((s) => s.id === order.user_id)
    if (shopper) {
      shopper.total_cod_refusals = (shopper.total_cod_refusals || 0) + 1
      const prevLvl = shopper.escalation_level || 0
      shopper.escalation_level = Math.min(5, prevLvl + 1)
      store.escalationHistory.unshift({
        id: `esc_${Date.now()}`,
        merchant_id: 'merchant_1',
        customer_id: shopper.id,
        previous_level: prevLvl,
        new_level: shopper.escalation_level,
        trigger_event: `Doorstep Refusal on Order ${order.order_number}: ${reason}`,
        notes,
        created_at: new Date().toISOString(),
      })
    }
    return { order_number: order.order_number, status: 'Refused', is_cod_refused: true }
  },

  // ── Return Proof Upload (Feature 3) ──
  async uploadReturnProof({ returnId, imageUrl }) {
    if (hasLiveApi()) {
      return live(`/returns/${returnId}/proof/`, {
        method: 'POST',
        body: { image_url: imageUrl },
        role: 'shopper',
      })
    }
    await delay(300)
    const ret = store.returns.find((r) => r.id === returnId)
    if (ret) {
      ret.proof_image_url = imageUrl
      ret.proof_verified = false
    }
    return { id: returnId, proof_image_url: imageUrl, proof_verified: false }
  },
}


