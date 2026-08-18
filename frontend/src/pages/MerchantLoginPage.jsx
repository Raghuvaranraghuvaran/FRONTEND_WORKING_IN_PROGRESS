import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()
  const [form, setForm] = useState({ email: 'admin@returnguard.in', password: 'password' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">RG</span>
          <span className="text-lg font-bold text-white">ReturnGuard Merchant</span>
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white">Merchant sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Access the fraud review dashboard.</p>

          <div className="mt-5 rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
            Demo: <span className="font-semibold">admin@returnguard.in</span> / <span className="font-semibold">password</span>
          </div>

          {error && <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-300">← Back to storefront</Link>
        </p>
      </div>
    </main>
  )
}
