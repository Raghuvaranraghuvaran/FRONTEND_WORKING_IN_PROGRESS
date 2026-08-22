import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'
import { hasGoogleSignIn, initializeGoogleSignIn, loadGoogleIdentityServices } from '../lib/google'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconMail() {
  return (
    <svg style={{ width: 15, height: 15, flexShrink: 0, color: '#6b7280' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg style={{ width: 15, height: 15, flexShrink: 0, color: '#6b7280' }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
function IconGoogle() {
  return (
    <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
function Spinner() {
  return (
    <span style={{
      width: 15, height: 15, borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
      animation: 'rg-spin 0.7s linear infinite', flexShrink: 0, display: 'inline-block',
    }} />
  )
}

// accent colour — teal
const A = '#1c9c86'

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()

  const [activeTab, setActiveTab] = useState('pw')
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpChallengeId, setOtpChallengeId] = useState(null)
  const [focusedField, setFocusedField] = useState('')
  const googleButtonRef = useRef(null)

  useEffect(() => {
    if (!hasGoogleSignIn() || otpSent) return
    loadGoogleIdentityServices().then(() => {
      if (googleButtonRef.current) {
        initializeGoogleSignIn('merchant-google-signin', async (credential) => {
          setError(''); setSubmitting(true)
          try { const s = await api.merchantGoogleSignIn(credential); setMerchant(s.admin); navigate('/merchant') }
          catch (e) { setError(e.message) }
          finally { setSubmitting(false) }
        })
      }
    })
  }, [navigate, setMerchant, activeTab, otpSent])

  const submitPassword = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try { const s = await api.merchantLogin(form); setMerchant(s.admin); navigate('/merchant') }
    catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const sendOTP = async () => {
    setError(''); setSubmitting(true)
    try {
      const r = await api.requestLoginOTP(form.email, 'merchant')
      if (r.challenge_id) setOtpChallengeId(r.challenge_id)
      setOtpSent(true)
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const verifyOTP = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const s = await api.verifyLoginOTP({ email: form.email, challengeId: otpChallengeId, code: otpCode }, 'merchant')
      setMerchant(s.admin); navigate('/merchant')
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const switchTab = (t) => {
    setActiveTab(t); setError(''); setOtpSent(false); setOtpCode(''); setOtpChallengeId(null)
  }

  return (
    <>
      <style>{`
        @keyframes rg-spin { to { transform: rotate(360deg); } }
        .rg-m-field:focus-within { border-color: ${A} !important; box-shadow: 0 0 0 3px ${A}22; }
        .rg-m-input { border: none !important; outline: none !important; box-shadow: none !important; background: transparent !important; }
        .rg-m-input:focus, .rg-m-input:active, .rg-m-input:focus-visible { border: none !important; outline: none !important; box-shadow: none !important; }
        .rg-m-input::placeholder { color: #9ca3af; }
        .rg-m-tab:hover { background: rgba(28,156,134,0.1) !important; }
      `}</style>

      {/* ── Full-screen background image ───────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?fm=jpg&q=80&w=1600&auto=format&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(1.1) saturate(1.05)',
      }} />
      {/* light frosted overlay — warm white / mint tint for merchant */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.32) 0%, rgba(230,248,245,0.4) 100%)',
        backdropFilter: 'blur(1.5px)',
      }} />

      {/* ── Page ──────────────────────────────────────────────────────────── */}
      <main style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* brand bar */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 20, textDecoration: 'none' }}>
            <BrandLogo className="h-11 w-auto" />
          </Link>

          {/* glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.95)',
            boxShadow: `0 8px 48px ${A}28, 0 2px 12px rgba(0,0,0,0.12)`,
            padding: '28px 28px 24px',
          }}>

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${A}15, ${A}30)`,
                border: `1.5px solid ${A}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/returnguard-icon.svg" style={{ width: 22, height: 22 }} alt="ReturnGuard" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f2922', margin: 0, lineHeight: 1.2 }}>Merchant Sign In</h2>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Access the portal. Choose how to sign in.</p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
                background: `${A}18`, color: A,
                padding: '3px 10px', borderRadius: 20, border: `1px solid ${A}33`,
                letterSpacing: '0.04em',
              }}>Merchant</span>
            </div>

            {/* tabs */}
            <div style={{
              display: 'flex', background: `${A}0f`,
              borderRadius: 10, padding: 4, margin: '18px 0 20px',
              border: `1px solid ${A}22`,
            }}>
              {[['pw', 'Email & Password'], ['otp', 'Email OTP']].map(([t, label]) => (
                <button key={t} className="rg-m-tab" onClick={() => switchTab(t)} style={{
                  flex: 1, padding: '8px 6px', fontSize: 13, borderRadius: 7,
                  cursor: 'pointer', border: 'none', outline: 'none', transition: 'all .15s',
                  background: activeTab === t ? A : 'transparent',
                  color: activeTab === t ? '#fff' : '#6b7280',
                  fontWeight: activeTab === t ? 600 : 400,
                  boxShadow: activeTab === t ? `0 2px 8px ${A}44` : 'none',
                }}>{label}</button>
              ))}
            </div>

            {/* error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{
                    marginBottom: 14, padding: '9px 12px', borderRadius: 9,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 13, color: '#dc2626',
                  }}
                >{error}</motion.div>
              )}
            </AnimatePresence>

            {/* password tab */}
            {activeTab === 'pw' && (
              <form onSubmit={submitPassword}>
                <label style={lbl}>Email Address</label>
                <div className="rg-m-field" style={{ ...field, borderColor: focusedField === 'email' ? A : 'rgba(0,0,0,0.12)' }}>
                  <IconMail />
                  <input
                    className="rg-m-input"
                    type="text"
                    inputMode="email"
                    name="auth_merchant_login"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-tempmail-ignore="true"
                    data-disable-tempmail="true"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    style={inp}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...lbl, margin: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: 12, color: A, textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                </div>
                <div className="rg-m-field" style={{ ...field, borderColor: focusedField === 'pw' ? A : 'rgba(0,0,0,0.12)' }}>
                  <IconLock />
                  <input
                    className="rg-m-input"
                    type="password"
                    name="auth_merchant_secret"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField('pw')}
                    onBlur={() => setFocusedField('')}
                    style={inp}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#6b7280', marginBottom: 18, cursor: 'pointer' }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: A }} />
                  Remember me
                </label>

                <motion.button type="submit" disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: submitting ? 1 : 0.97 }}
                  style={{ ...btn(A), marginBottom: 0 }}>
                  {submitting ? <><Spinner /> Signing in…</> : 'Sign in securely'}
                </motion.button>
              </form>
            )}

            {/* otp tab */}
            {activeTab === 'otp' && (!otpSent ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Merchant Email</label>
                  <span style={{ fontSize: 11.5, color: '#6b7280' }}>Passwordless login</span>
                </div>
                <div className="rg-m-field" style={{ ...field, borderColor: 'rgba(0,0,0,0.12)', marginBottom: 18 }}>
                  <IconMail />
                  <input
                    className="rg-m-input"
                    type="text"
                    inputMode="email"
                    name="auth_merchant_otp_recipient"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-tempmail-ignore="true"
                    data-disable-tempmail="true"
                    required
                    placeholder="Enter your store email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inp}
                  />
                </div>
                <motion.button type="button" disabled={submitting || !form.email} onClick={sendOTP}
                  whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ ...btn(A), opacity: (!form.email || submitting) ? 0.6 : 1, marginBottom: 0 }}>
                  {submitting ? <><Spinner /> Sending code…</> : 'Send one-time code'}
                </motion.button>
              </div>
            ) : (
              <form onSubmit={verifyOTP}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>6-Digit Verification Code</label>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    style={{ background: 'none', border: 'none', color: A, cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: 0 }}
                  >
                    Change email
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>
                  Sent to <strong style={{ color: '#111827' }}>{form.email}</strong>
                </p>
                <div className="rg-m-field" style={{ ...field, borderColor: 'rgba(0,0,0,0.12)', marginBottom: 16 }}>
                  <input
                    className="rg-m-input"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    name="auth_merchant_otp_code"
                    autoComplete="one-time-code"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-tempmail-ignore="true"
                    data-disable-tempmail="true"
                    required
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ ...inp, letterSpacing: '0.35em', textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                  />
                </div>
                <motion.button type="submit" disabled={submitting || otpCode.length < 6}
                  whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ ...btn(A), marginBottom: 10, opacity: (otpCode.length < 6 || submitting) ? 0.6 : 1 }}>
                  {submitting ? <><Spinner /> Verifying…</> : 'Verify & Continue'}
                </motion.button>
                <button type="button" onClick={sendOTP} disabled={submitting}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: A, padding: '4px 0', fontWeight: 500 }}>
                  Resend code
                </button>
              </form>
            ))}

            {/* Google sign-in available across both tabs */}
            {!otpSent && (
              <>
                {/* divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                </div>

                {hasGoogleSignIn() ? (
                  <div id="merchant-google-signin" ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 40 }} />
                ) : (
                  <button type="button" disabled={submitting} style={googleButton} onClick={async () => {
                    setError(''); setSubmitting(true)
                    try { const s = await api.merchantGoogleSignIn('mock-credential'); setMerchant(s.admin); navigate('/merchant') }
                    catch (e) { setError(e.message) }
                    finally { setSubmitting(false) }
                  }}>
                    {submitting ? <><Spinner /> Signing in…</> : <><IconGoogle /> Continue with Google</>}
                  </button>
                )}
              </>
            )}

            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280', marginTop: 16, marginBottom: 0 }}>
              New here?{' '}
              <Link to="/merchant/register" style={{ color: A, fontWeight: 600, textDecoration: 'none' }}>Create an account</Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/" style={{ fontSize: 13, color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to storefront
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

// ── Shared style objects ──────────────────────────────────────────────────────
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
const googleButton = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(0,0,0,0.12)',
  padding: '10px 0', borderRadius: 10, color: '#374151', fontSize: 13,
  cursor: 'pointer', fontWeight: 500,
}
