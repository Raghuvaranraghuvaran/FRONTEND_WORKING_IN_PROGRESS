const GOOGLE_CLIENT_ID = String(
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '604991077373-64vuiauji09psh9n09gh3d8uqid444io.apps.googleusercontent.com'
)

let scriptPromise = null

export function hasGoogleSignIn() {
  return Boolean(GOOGLE_CLIENT_ID)
}

export function getGoogleClientId() {
  return GOOGLE_CLIENT_ID
}

export function loadGoogleIdentityServices() {
  if (!GOOGLE_CLIENT_ID) return Promise.resolve(null)
  if (window.google?.accounts) return Promise.resolve(window.google.accounts)

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (existing) {
        existing.onload = () => resolve(window.google?.accounts || null)
        if (window.google?.accounts) return resolve(window.google.accounts)
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.google?.accounts || null)
      script.onerror = () => reject(new Error('Failed to load Google Sign-In.'))
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

export function initializeGoogleSignIn(containerId, onCredential) {
  const accounts = window.google?.accounts
  if (!accounts) return null

  accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential(response.credential),
    auto_select: false,
    cancel_on_tap_outside: true,
  })

  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = ''
    accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    })
  }

  // Also prompt one-tap popup for smooth account selection
  try {
    accounts.id.prompt()
  } catch (e) {
    // Ignore one-tap prompt errors
  }
}
