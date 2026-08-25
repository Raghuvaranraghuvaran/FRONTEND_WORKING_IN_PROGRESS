import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'
import {
  hasGoogleSignIn,
  initializeGoogleSignIn,
  loadGoogleIdentityServices,
} from '../lib/google'


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

// accent colour
const A = '#6f5cf0'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setShopper } = useApp()

  const [activeTab, setActiveTab] = useState('pw')
  const [form, setForm] = useState({ email: 'demo@shopper.com', password: 'demo123' })
  const [otpEmail, setOtpEmail] = useState('demo@shopper.com')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpChallengeId, setOtpChallengeId] = useState(null)
  const [focusedField, setFocusedField] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotStep, setForgotStep] = useState('request')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetChallengeId, setResetChallengeId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const googleButtonRef = useRef(null)

  useEffect(() => {
    if (!hasGoogleSignIn() || activeTab !== 'pw') return
    loadGoogleIdentityServices().then(() => {
      if (googleButtonRef.current) {
        initializeGoogleSignIn('shopper-google-signin', async (credential) => {
          setError(''); setSubmitting(true)
          try { const s = await api.googleSignIn(credential); setShopper(s); navigate('/shop') }
          catch (e) { setError(e.message) }
          finally { setSubmitting(false) }
        })
      }
    })
  }, [navigate, setShopper, activeTab])

  const submitPassword = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try { const s = await api.login(form); setShopper(s); navigate('/shop') }
    catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const sendOTP = async () => {
    setError(''); setSubmitting(true)
    try {
      const clean = otpEmail.trim()
      if (!clean) { setError('Please enter your email address.'); setSubmitting(false); return }
      const r = await api.requestLoginOTP(clean)
      if (r?.challenge_id) setOtpChallengeId(r.challenge_id)
      setOtpCode('')
      setOtpSent(true)
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const verifyOTP = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const clean = otpEmail.trim()
      const s = await api.verifyLoginOTP({ email: clean, challengeId: otpChallengeId, code: otpCode })
      setShopper(s); navigate('/shop')
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const switchTab = (t) => {
    setActiveTab(t); setError(''); setOtpSent(false); setOtpCode(''); setOtpChallengeId(null); setOtpEmail('')
  }

  const openForgot = () => {
    setForgotMode(true); setForgotStep('request'); setError('')
    setResetEmail(form.email || ''); setResetCode(''); setResetChallengeId(null)
    setNewPassword(''); setNewPasswordConfirm('')
  }

  const closeForgot = () => {
    setForgotMode(false); setError('')
  }

  const requestResetCode = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const r = await api.requestPasswordReset(resetEmail)
      setResetChallengeId(r?.challenge_id || null)
      setForgotStep('code')
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const submitNewPassword = async (e) => {
    e.preventDefault(); setError('')
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== newPasswordConfirm) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    try {
      await api.resetPassword({ email: resetEmail, challengeId: resetChallengeId, code: resetCode, newPassword })
      const shopper = await api.login({ email: resetEmail, password: newPassword })
      setShopper(shopper); navigate('/shop')
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <>
      <style>{`
        @keyframes rg-spin { to { transform: rotate(360deg); } }
        .rg-field {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          height: 46px !important;
          padding: 0 14px !important;
          background: #ffffff !important;
          border: 1.5px solid rgba(0,0,0,0.14) !important;
          border-radius: 10px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          margin-bottom: 16px !important;
          position: relative !important;
          overflow: hidden !important;
          transition: border-color .15s, box-shadow .15s !important;
        }
        .rg-field:focus-within {
          border-color: ${A} !important;
          box-shadow: 0 0 0 3px ${A}22 !important;
        }
        .rg-input {
          width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
          height: 100% !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #0f172a !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          font-family: inherit !important;
        }
        .rg-input::placeholder { color: #9ca3af !important; }
        .rg-tab-btn:hover { background: rgba(111,92,240,0.12) !important; }
        .rg-field, .rg-field * { background-image: none !important; }
        .rg-field > *:not(input):not(button):not(svg) { display: none !important; visibility: hidden !important; }
      `}</style>

      {/* ── Full-screen background image ──────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1445205170230-053b83016050?fm=jpg&q=80&w=1600&auto=format&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      {/* rich gradient overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(30,27,60,0.55) 0%, rgba(111,92,240,0.22) 60%, rgba(240,235,255,0.15) 100%)',
        backdropFilter: 'blur(1px)',
      }} />

      {/* ── Page scroll container ────────────────────────────────────── */}
      <main style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* ── Brand bar ────────────────────────────────────────────────── */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 20, textDecoration: 'none' }}>
            <BrandLogo className="h-11 w-auto" />
          </Link>

          {/* ── Glass card ───────────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.98)',
            boxShadow: '0 8px 48px rgba(30,27,60,0.28), 0 2px 12px rgba(0,0,0,0.15)',
            padding: '28px 28px 24px',
          }}>

            {/* card header */}
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
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b3a', margin: 0, lineHeight: 1.2 }}>Shopper Sign In</h2>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Welcome back! Choose how to sign in.</p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
                background: `${A}18`, color: A,
                padding: '3px 10px', borderRadius: 20, border: `1px solid ${A}33`,
                letterSpacing: '0.04em',
              }}>Shopper</span>
            </div>

            {/* ── Forgot password ─────────────────────────────────────── */}
            {forgotMode ? (
              <div>
                <button type="button" onClick={closeForgot}
                  style={{ background: 'none', border: 'none', color: A, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, padding: 0, marginBottom: 14 }}>
                  ← Back to sign in
                </button>

                {forgotStep === 'request' ? (
                  <form onSubmit={requestResetCode}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1e1b3a' }}>Reset your password</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                      Enter your account email and we'll send a 6-digit reset code.
                    </p>
                    <label style={lbl}>Email Address</label>
                    <div className="rg-field" style={{ ...field, borderColor: 'rgba(0,0,0,0.12)', marginBottom: 18 }}>
                      <input
                        className="rg-input"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        style={inp}
                      />
                    </div>
                    <motion.button type="submit" disabled={submitting || !resetEmail}
                      whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ ...btn(A), opacity: (!resetEmail || submitting) ? 0.6 : 1, marginBottom: 0 }}>
                      {submitting ? <><Spinner /> Sending code…</> : 'Send reset code'}
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={submitNewPassword}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1e1b3a' }}>Enter reset code</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                      A 6-digit code was sent to <strong style={{ color: '#0f172a' }}>{resetEmail}</strong>.
                    </p>
                    <label style={lbl}>6-Digit Code</label>
                    <div className="rg-field" style={{ ...field, borderColor: 'rgba(0,0,0,0.12)', marginBottom: 14 }}>
                      <input
                        className="rg-input"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                        placeholder="• • • • • •"
                        value={resetCode}
                        onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                        style={{ ...inp, letterSpacing: '0.35em', textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                      />
                    </div>
                    <label style={lbl}>New Password</label>
                    <div className="rg-field" style={{ ...field, borderColor: 'rgba(0,0,0,0.12)', marginBottom: 14 }}>
                      <IconLock />
                      <input
                        className="rg-input"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={inp}
                      />
                    </div>
                    <label style={lbl}>Confirm New Password</label>
                    <div className="rg-field" style={{ ...field, borderColor: 'rgba(0,0,0,0.12)', marginBottom: 18 }}>
                      <IconLock />
                      <input
                        className="rg-input"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        placeholder="Re-enter new password"
                        value={newPasswordConfirm}
                        onChange={e => setNewPasswordConfirm(e.target.value)}
                        style={inp}
                      />
                    </div>
                    <motion.button type="submit" disabled={submitting || resetCode.length < 6}
                      whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ ...btn(A), marginBottom: 0, opacity: (resetCode.length < 6 || submitting) ? 0.6 : 1 }}>
                      {submitting ? <><Spinner /> Resetting…</> : 'Reset password'}
                    </motion.button>
                  </form>
                )}
              </div>
            ) : (
              <>
            {/* Demo indicator & quick refill */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(111,92,240,0.08)', border: '1px solid rgba(111,92,240,0.2)',
              borderRadius: 8, padding: '7px 11px', marginTop: 14, marginBottom: -6,
              fontSize: 12, color: '#4c1d95',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                ⚡ Demo credentials loaded
              </span>
              <button
                type="button"
                onClick={() => {
                  setForm({ email: 'demo@shopper.com', password: 'demo123' })
                  setOtpEmail('demo@shopper.com')
                  setError('')
                }}
                style={{
                  background: A, color: '#fff', border: 'none', borderRadius: 5,
                  padding: '3px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Refill Demo
              </button>
            </div>

            {/* tabs */}
            <div style={{
              display: 'flex', background: 'rgba(111,92,240,0.07)',
              borderRadius: 10, padding: 4, margin: '18px 0 20px',
              border: '1px solid rgba(111,92,240,0.12)',
            }}>
              {[['pw', 'Email & Password'], ['otp', 'Email OTP']].map(([t, label]) => (
                <button key={t} className="rg-tab-btn" onClick={() => switchTab(t)} style={{
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



            {/* ── Password tab ─────────────────────────────────────────── */}
            {activeTab === 'pw' && (
              <form onSubmit={submitPassword}>
                <label style={lbl}>Email Address</label>
                <div className="rg-field" style={{ borderColor: focusedField === 'email' ? A : 'rgba(0,0,0,0.14)', boxShadow: focusedField === 'email' ? `0 0 0 3px ${A}22` : 'none' }}>
                  <input
                    className="rg-input"
                    type="email"
                    name="auth_user_login"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-tempmail-ignore="true"
                    data-bwignore="true"
                    data-disable-tempmail="true"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...lbl, margin: 0 }}>Password</label>
                  <a href="#" onClick={(e) => { e.preventDefault(); openForgot() }} style={{ fontSize: 12, color: A, textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                </div>
                <div className="rg-field" style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  background: '#ffffff',
                  border: `1.5px solid ${focusedField === 'pw' ? A : 'rgba(0,0,0,0.14)'}`,
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  boxShadow: focusedField === 'pw' ? `0 0 0 3px ${A}22` : 'none',
                  transition: 'border-color .15s, box-shadow .15s',
                }}>
                  <IconLock />
                  <input
                    className="rg-input"
                    type="password"
                    name="auth_user_secret"
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocusedField('pw')}
                    onBlur={() => setFocusedField('')}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontWeight: 500,
                      width: '100%',
                      padding: 0,
                    }}
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

            {/* ── OTP tab ──────────────────────────────────────────────── */}
            {activeTab === 'otp' && (!otpSent ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Email Address</label>
                  <span style={{ fontSize: 11.5, color: '#6b7280' }}>Passwordless login</span>
                </div>
                <div className="rg-field" style={{ borderColor: focusedField === 'otp_email' ? A : 'rgba(0,0,0,0.14)', boxShadow: focusedField === 'otp_email' ? `0 0 0 3px ${A}22` : 'none', marginBottom: 18 }}>
                  <input
                    className="rg-input"
                    type="text"
                    inputMode="email"
                    name="rg_clean_otp_email"
                    id="rg_clean_otp_email"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    data-tempmail-ignore="true"
                    data-dashlane-ignore="true"
                    data-bwignore="true"
                    data-disable-tempmail="true"
                    required
                    placeholder="Enter your email address"
                    value={otpEmail}
                    onChange={e => setOtpEmail(e.target.value)}
                    onFocus={() => setFocusedField('otp_email')}
                    onBlur={() => setFocusedField('')}
                  />
                </div>
                <motion.button type="button" disabled={submitting || !otpEmail.trim()} onClick={sendOTP}
                  whileHover={{ scale: submitting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ ...btn(A), opacity: (!otpEmail.trim() || submitting) ? 0.6 : 1, marginBottom: 0 }}>
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
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', margin: '0 0 16px', fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                  ✉️ 6-digit verification code sent to <strong style={{ color: '#0f172a' }}>{otpEmail}</strong>.
                </div>
                <div className="rg-field" style={{
                  width: '100%',
                  height: '46px',
                  background: '#ffffff',
                  border: '1.5px solid rgba(0,0,0,0.14)',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  overflow: 'hidden',
                }}>
                  <input
                    className="rg-input"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    name="auth_otp_code"
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
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      letterSpacing: '0.35em',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      width: '100%',
                      padding: 0,
                    }}
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

            {/* Google sign-in only on Email & Password tab */}
            {activeTab === 'pw' && (
              <>
                {/* divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
                </div>

                {hasGoogleSignIn() ? (
                  <div id="shopper-google-signin" ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 40 }} />
                ) : (
                  <button type="button" disabled style={{ ...googleButton, opacity: 0.5, cursor: 'not-allowed' }}>
                    <IconGoogle /> Google Sign-In unavailable
                  </button>
                )}
              </>
            )}

            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#6b7280', marginTop: 16, marginBottom: 0 }}>
              New here?{' '}
              <Link to="/register" style={{ color: A, fontWeight: 600, textDecoration: 'none' }}>Create an account</Link>
            </p>
              </>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/" style={{ fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
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
  background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.14)',
  borderRadius: 10, padding: '0 14px', marginBottom: 14,
  height: 46, boxSizing: 'border-box',
  position: 'relative', overflow: 'hidden',
  transition: 'border-color .15s, box-shadow .15s',
}
const inp = {
  background: 'transparent', border: 'none', outline: 'none',
  color: '#0f172a', fontSize: 14, width: '100%',
}
const btn = (bg) => ({
  width: '100%', height: 46, border: 'none', padding: '0', borderRadius: 10,
  fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  marginBottom: 14, boxShadow: `0 4px 14px ${bg}55`, boxSizing: 'border-box',
})
const googleButton = {
  width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(0,0,0,0.14)',
  borderRadius: 10, color: '#374151', fontSize: 13, boxSizing: 'border-box',
  cursor: 'pointer', fontWeight: 500,
}
