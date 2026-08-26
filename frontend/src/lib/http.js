const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api'
  }
  return 'https://frontend-working-in-progress.onrender.com/api'
})()

export function hasLiveApi() {
  return Boolean(API_BASE_URL)
}

export async function request(path, { method = 'GET', body, token, timeoutMs = 45000 } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = data?.error
      const message = error?.message || data?.detail || data?.message || `Request failed (${response.status})`
      const err = new Error(message)
      err.status = response.status
      err.data = data
      throw err
    }
    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Request to ${path} timed out after ${timeoutMs}ms`)
      timeoutErr.status = 408
      throw timeoutErr
    }
    throw err
  }
}
