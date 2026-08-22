const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '')

let scriptPromise = null

export function hasGoogleSignIn() {
  return Boolean(GOOGLE_CLIENT_ID)
}

export function loadGoogleIdentityServices() {
  if (!GOOGLE_CLIENT_ID) return Promise.resolve(null)
  if (window.google?.accounts) return Promise.resolve(window.google.accounts)

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
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
  })
  accounts.id.renderButton(document.getElementById(containerId), {
    theme: 'outline',
    size: 'large',
    width: 320,
    text: 'continue_with',
  })
}
