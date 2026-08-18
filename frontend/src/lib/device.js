const KEY = 'returnguard_device_id'

export function getDeviceId() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = `dev_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
    localStorage.setItem(KEY, id)
  }
  return id
}

export function getDeviceContext() {
  return {
    device_token: getDeviceId(),
    user_agent: navigator.userAgent,
    captured_at: new Date().toISOString(),
  }
}
