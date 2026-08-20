const API_BASE_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function hasLiveApi() {
  return Boolean(API_BASE_URL)
}

export async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

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
}
