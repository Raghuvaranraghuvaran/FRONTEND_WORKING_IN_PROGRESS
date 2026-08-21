import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'
import { hasGoogleSignIn, initializeGoogleSignIn, loadGoogleIdentityServices } from '../lib/google'

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()
  const [form, setForm] = useState({ email: 'admin@returnguard.in', password: 'password' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState('')
  const [otpMode, setOtpMode] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpChallengeId, setOtpChallengeId] = useState(null)
  const googleButtonRef = useRef(null)

  useEffect(() => {
    if (!hasGoogleSignIn()) return
    loadGoogleIdentityServices().then(() => {
      if (googleButtonRef.current) {
        initializeGoogleSignIn('merchant-google-signin', async (credential) => {
          setError('')
          setSubmitting(true)
          try {
            const session = await api.merchantGoogleSignIn(credential)
            setMerchant(session.admin)
            navigate('/merchant')
          } catch (err) {
            setError(err.message)
          } finally {
            setSubmitting(false)
          }
        })
      }
    })
  }, [navigate, setMerchant])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await api.merchantLogin(form)
      setMerchant(session.admin)
      navigate('/merchant')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const sendOTP = async () => {
    setError('')
    setSubmitting(true)
    try {
      const result = await api.requestLoginOTP(form.email, 'merchant')
      if (result.challenge_id) setOtpChallengeId(result.challenge_id)
      setOtpMode(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const verifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await api.verifyLoginOTP({ email: form.email, challengeId: otpChallengeId, code: otpCode }, 'merchant')
      setMerchant(session.admin)
      navigate('/merchant')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* logo */}
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <BrandLogo className="h-12 w-[14rem]" alt="ReturnGuard Merchant" />
        </Link>

        {/* card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          {/* header row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Merchant sign in</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-600/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Merchant</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Access the fraud review dashboard.</p>

          {/* error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* form */}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider transition-colors ${focused === 'email' ? 'text-indigo-400' : 'text-slate-400'}`}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider transition-colors ${focused === 'password' ? 'text-indigo-400' : 'text-slate-400'}`}>
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Signing in…</>
              ) : 'Sign in'}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" /><span className="text-xs text-slate-500">or</span><div className="h-px flex-1 bg-slate-700" />
          </div>
          {hasGoogleSignIn() ? (
            <div id="merchant-google-signin" ref={googleButtonRef} className="flex justify-center" />
          ) : (
            <p className="text-center text-xs text-slate-500">Google Sign-In is not configured.</p>
          )}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" /><span className="text-xs text-slate-500">or</span><div className="h-px flex-1 bg-slate-700" />
          </div>
          {otpMode ? (
            <form onSubmit={verifyOTP} className="space-y-3">
              <input inputMode="numeric" pattern="\\d{6}" maxLength={6} required value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\\D/g, ''))} placeholder="6-digit code" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50">{submitting ? 'Verifying…' : 'Verify code'}</button>
              <button type="button" onClick={sendOTP} disabled={submitting} className="w-full text-xs text-indigo-400 hover:text-indigo-300">Resend code</button>
            </form>
          ) : (
            <button type="button" onClick={sendOTP} disabled={submitting || !form.email} className="w-full rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50">Sign in with email OTP</button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="transition hover:text-slate-300">← Back to storefront</Link>
        </p>
      </div>
    </main>
  )
}
