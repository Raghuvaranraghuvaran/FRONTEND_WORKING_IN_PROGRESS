import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, User, ArrowRight, Sparkles } from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'

const A = '#6f5cf0'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setShopper } = useApp()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '', altPhone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState('')

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (error) setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Please enter your full name.'); return }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (!form.phone.trim()) { setError('Please enter your mobile phone number.'); return }
    if (!form.password || form.password.length < 4) { setError('Password must be at least 4 characters.'); return }

    setSubmitting(true)
    try {
      const shopper = await api.register(form)
      setShopper(shopper)
      navigate('/shop')
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes rg-spin { to { transform: rotate(360deg); } }
        .rg-field {
          width: 100% !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          border: 1.5px solid rgba(0,0,0,0.14) !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 14px !important;
          height: 46px !important;
          margin-bottom: 14px !important;
          transition: border-color .15s, box-shadow .15s !important;
        }
        .rg-field:focus-within {
          border-color: ${A} !important;
          box-shadow: 0 0 0 3px ${A}22 !important;
        }
        .rg-textarea-field {
          width: 100% !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
          border: 1.5px solid rgba(0,0,0,0.14) !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: flex-start !important;
          padding: 10px 14px !important;
          margin-bottom: 14px !important;
          transition: border-color .15s, box-shadow .15s !important;
        }
        .rg-textarea-field:focus-within {
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
          padding: 0 0 0 10px !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          font-family: inherit !important;
        }
        .rg-textarea {
          width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #0f172a !important;
          padding: 0 0 0 10px !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          font-family: inherit !important;
          resize: none !important;
        }
        .rg-input::placeholder, .rg-textarea::placeholder {
          color: #9ca3af !important;
        }
      `}</style>

      {/* Full-screen background image */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1445205170230-053b83016050?fm=jpg&q=80&w=1600&auto=format&fit=crop')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(30,27,60,0.60) 0%, rgba(111,92,240,0.25) 60%, rgba(240,235,255,0.15) 100%)',
        backdropFilter: 'blur(1.5px)',
      }} />

      {/* Main container */}
      <main style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Brand bar */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 20, textDecoration: 'none' }}>
            <BrandLogo className="h-11 w-auto" />
          </Link>

          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.98)',
            boxShadow: '0 8px 48px rgba(30,27,60,0.28), 0 2px 12px rgba(0,0,0,0.15)',
            padding: '28px 28px 24px',
          }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${A}18, ${A}35)`,
                border: `1.5px solid ${A}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/returnguard-icon.svg" style={{ width: 22, height: 22 }} alt="ReturnGuard" />
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b3a', margin: 0, lineHeight: 1.2 }}>Create Shopper Account</h1>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Join to shop and enjoy verified returns.</p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
                background: `${A}18`, color: A,
                padding: '3px 10px', borderRadius: 20, border: `1px solid ${A}33`,
                letterSpacing: '0.04em',
              }}>Shopper</span>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{
                margin: '12px 0 16px', padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 13, color: '#dc2626', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit} style={{ marginTop: 14 }}>
              {/* Full name */}
              <label style={lbl}>Full Name *</label>
              <div className="rg-field">
                <User style={{ width: 16, height: 16, flexShrink: 0, color: '#6b7280' }} />
                <input
                  className="rg-input"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={update('name')}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <label style={lbl}>Email Address *</label>
              <div className="rg-field">
                <Mail style={{ width: 16, height: 16, flexShrink: 0, color: '#6b7280' }} />
                <input
                  className="rg-input"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <label style={lbl}>Mobile Number *</label>
              <div className="rg-field">
                <Phone style={{ width: 16, height: 16, flexShrink: 0, color: '#6b7280' }} />
                <input
                  className="rg-input"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={update('phone')}
                  autoComplete="tel"
                />
              </div>

              {/* Password */}
              <label style={lbl}>Password *</label>
              <div className="rg-field">
                <Lock style={{ width: 16, height: 16, flexShrink: 0, color: '#6b7280' }} />
                <input
                  className="rg-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  placeholder="Create a password (min 4 chars)"
                  value={form.password}
                  onChange={update('password')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>

              {/* Delivery Address */}
              <label style={lbl}>Delivery Address *</label>
              <div className="rg-textarea-field">
                <MapPin style={{ width: 16, height: 16, flexShrink: 0, color: '#6b7280', marginTop: 2 }} />
                <textarea
                  className="rg-textarea"
                  rows={2}
                  required
                  placeholder="Flat / House No, Street, Landmark, City, PIN"
                  value={form.address}
                  onChange={update('address')}
                  autoComplete="street-address"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', border: 'none', padding: '12px 0', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                  background: A, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 6, marginBottom: 14, boxShadow: `0 4px 14px ${A}55`,
                  opacity: submitting ? 0.7 : 1, transition: 'all .15s',
                }}
              >
                {submitting ? 'Creating account…' : 'Create Account'}
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 14, marginBottom: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: A, fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to Storefront
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

const lbl = { display: 'block', fontSize: 12.5, marginBottom: 5, color: '#374151', fontWeight: 600 }

