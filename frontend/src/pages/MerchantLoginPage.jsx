import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, Check } from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'

// accent colour (teal for merchant)
const A = '#0d9488'

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)
  const [focusedField, setFocusedField] = useState('')

  const handleCaptchaClick = () => {
    if (isVerified || isVerifying) return
    setIsVerifying(true)
    setError('')
    setTimeout(() => {
      setIsVerifying(false)
      setIsVerified(true)
      setRecaptchaToken(`verified_token_${Date.now()}`)
    }, 500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cleanUser = username.trim().toUpperCase()
    if (!cleanUser) { setError('Please enter your merchant username.'); return }
    if (!password) { setError('Please enter your password.'); return }
    if (!isVerified || !recaptchaToken) {
      setError('Please complete the verification check before logging in.')
      return
    }
    try {
      setSubmitting(true)
      const res = await api.merchantLogin({ username: cleanUser, password, recaptchaToken })
      setMerchant(res.admin)
      navigate('/merchant')
    } catch (err) {
      setError(err.message || 'Invalid username or password.')
      setIsVerified(false)
      setRecaptchaToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes rg-spin { to { transform: rotate(360deg); } }
        .ml-field:focus-within { border-color: ${A} !important; box-shadow: 0 0 0 3px ${A}22; }
        .ml-input { border: none !important; outline: none !important; box-shadow: none !important; background: transparent !important; background-image: none !important; background-repeat: no-repeat !important; }
        .ml-input:focus, .ml-input:active, .ml-input:focus-visible { border: none !important; outline: none !important; box-shadow: none !important; background-image: none !important; }
        .ml-input::placeholder { color: #9ca3af; }
        .ml-field, .ml-field * { background-image: none !important; }
      `}</style>

      {/* ── Full-screen background photo ─────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?fm=jpg&q=80&w=1600&auto=format&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      {/* overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(7,11,20,0.65) 0%, rgba(13,60,55,0.50) 60%, rgba(7,11,20,0.60) 100%)',
        backdropFilter: 'blur(1.5px)',
      }} />

      {/* ── Page container ────────────────────────────────────────────────── */}
      <main style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* ── Brand bar ─────────────────────────────────────────────────── */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 20, textDecoration: 'none' }}>
            <BrandLogo className="h-11 w-auto" />
          </Link>

          {/* ── White card (same style as shopper) ───────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.98)',
            boxShadow: '0 8px 48px rgba(7,11,20,0.30), 0 2px 12px rgba(0,0,0,0.15)',
            padding: '28px 28px 24px',
          }}>

            {/* card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${A}18, ${A}35)`,
                border: `1.5px solid ${A}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                🏪
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b3a', margin: 0, lineHeight: 1.2 }}>Merchant Sign In</h1>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Access your merchant dashboard.</p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
                background: `${A}18`, color: A,
                padding: '3px 10px', borderRadius: 20, border: `1px solid ${A}33`,
                letterSpacing: '0.04em',
              }}>Merchant</span>
            </div>

            {/* error */}
            {error && (
              <div style={{
                margin: '14px 0', padding: '9px 12px', borderRadius: 9,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13, color: '#dc2626',
              }}>
                {error}
              </div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>

              {/* Username */}
              <label style={lbl}>Merchant Username</label>
              <div className="ml-field" style={{ ...field, borderColor: focusedField === 'user' ? A : 'rgba(0,0,0,0.12)' }}>
                <User style={{ width: 15, height: 15, flexShrink: 0, color: '#6b7280' }} />
                <input
                  className="ml-input"
                  type="text"
                  required
                  placeholder="e.g. SAIFASHION4827"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value.toUpperCase()); setError('') }}
                  onFocus={() => setFocusedField('user')}
                  onBlur={() => setFocusedField('')}
                  autoComplete="username"
                  style={{ ...inp, letterSpacing: '0.07em', fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
              <p style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14, marginTop: -8 }}>
                The unique username generated when your account was registered.
              </p>

              {/* Password */}
              <label style={lbl}>Password</label>
              <div className="ml-field" style={{ ...field, borderColor: focusedField === 'pw' ? A : 'rgba(0,0,0,0.12)' }}>
                <Lock style={{ width: 15, height: 15, flexShrink: 0, color: '#6b7280' }} />
                <input
                  className="ml-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('pw')}
                  onBlur={() => setFocusedField('')}
                  autoComplete="current-password"
                  style={inp}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 15, height: 15 }} />
                    : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>

              {/* CAPTCHA */}
              <div
                onClick={handleCaptchaClick}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderRadius: 10, padding: '11px 13px', marginBottom: 16,
                  cursor: 'pointer', userSelect: 'none', transition: 'all .15s',
                  background: isVerified ? 'rgba(16,185,129,0.06)' : '#f9fafb',
                  border: isVerified ? '1.5px solid rgba(16,185,129,0.35)' : '1.5px solid rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                    background: isVerified ? '#10b981' : '#fff',
                    border: isVerified ? '1.5px solid #10b981' : '1.5px solid #d1d5db',
                  }}>
                    {isVerified ? (
                      <Check style={{ width: 14, height: 14, color: '#fff', strokeWidth: 3 }} />
                    ) : isVerifying ? (
                      <svg style={{ width: 13, height: 13, animation: 'rg-spin 0.7s linear infinite', color: A }} fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" opacity="0.75" />
                      </svg>
                    ) : null}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: isVerified ? '#059669' : '#374151', margin: 0 }}>
                      {isVerified ? "Verified: I'm not a robot" : isVerifying ? 'Verifying…' : "I'm not a robot"}
                    </p>
                    <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>Security Verification</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #e5e7eb', paddingLeft: 12 }}>
                  <svg style={{ width: 22, height: 22, color: '#9ca3af' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" strokeWidth="2" />
                  </svg>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginTop: 2 }}>reCAPTCHA</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{ ...btn(A), marginBottom: 0 }}
              >
                {submitting ? 'Authenticating…' : 'Login to Dashboard'}
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </form>



            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280', marginTop: 14, marginBottom: 0 }}>
              Don't have an account?{' '}
              <Link to="/merchant/register" style={{ color: A, fontWeight: 600, textDecoration: 'none' }}>
                Register business
              </Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to Storefront
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

// ── Shared style objects (same as shopper login) ──────────────────────────────
const lbl = { display: 'block', fontSize: 12.5, marginBottom: 6, color: '#374151', fontWeight: 500 }
const field = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(0,0,0,0.12)',
  borderRadius: 9, padding: '10px 12px', marginBottom: 14,
  transition: 'border-color .15s, box-shadow .15s',
}
const inp = {
  background: 'transparent', border: 'none', outline: 'none',
  color: '#111827', fontSize: 13.5, width: '100%',
}
const btn = (bg) => ({
  width: '100%', border: 'none', padding: '12px 0', borderRadius: 10,
  fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  marginBottom: 14, boxShadow: `0 4px 14px ${bg}55`,
})
