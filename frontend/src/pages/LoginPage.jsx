import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setShopper } = useApp()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState('')

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

  const googleSignIn = async () => {
    setError('')
    setSubmitting(true)
    try {
      const shopper = await api.googleSignIn()
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
          <p className="mt-1 text-sm text-slate-400">Use a demo account or sign in with Google.</p>

          {/* demo hint */}
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            Demo: <span className="font-semibold text-white">ananya@example.com</span> · any password
          </div>

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

          <motion.button
            onClick={googleSignIn}
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

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
