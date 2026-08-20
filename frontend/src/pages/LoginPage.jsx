import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import {
  hasGoogleSignIn,
  initializeGoogleSignIn,
  loadGoogleIdentityServices,
} from '../lib/google'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setShopper } = useApp()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState('')
  const googleButtonRef = useRef(null)

  useEffect(() => {
    if (!hasGoogleSignIn()) return
    loadGoogleIdentityServices().then(() => {
      if (googleButtonRef.current) {
        initializeGoogleSignIn('google-signin', async (credential) => {
          setError('')
          setSubmitting(true)
          try {
            const shopper = await api.googleSignIn(credential)
            setShopper(shopper)
            navigate('/shop')
          } catch (err) {
            setError(err.message)
          } finally {
            setSubmitting(false)
          }
        })
      }
    })
  }, [navigate, setShopper])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const shopper = await api.login(form)
      setShopper(shopper)
      navigate('/shop')
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
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/40">RG</span>
          <span className="text-lg font-bold text-white">ReturnGuard</span>
        </Link>

        {/* card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          {/* header row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Shopper sign in</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-600/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Shopper</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Sign in with Google or your account email.</p>

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

          {/* divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {hasGoogleSignIn() ? (
            <div id="google-signin" ref={googleButtonRef} className="flex justify-center" />
          ) : (
            <p className="text-center text-xs text-slate-500">
              Google Sign-In is not configured. Set <code className="text-slate-300">VITE_GOOGLE_CLIENT_ID</code> to enable it.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="transition hover:text-slate-300">← Back to storefront</Link>
        </p>
      </div>
    </main>
  )
}
