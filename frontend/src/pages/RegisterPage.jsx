import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setShopper } = useApp()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const shopper = await api.register(form)
      setShopper(shopper)
      navigate('/shop')
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
          <BrandLogo className="h-12 w-[14rem]" />
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-slate-400">Register to shop and track returns.</p>

          {error && <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Full name</label>
              <input
                required
                value={form.name}
                onChange={update('name')}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Phone</label>
              <input
                required
                value={form.phone}
                onChange={update('phone')}
                placeholder="+91 90000 00000"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={1}
                value={form.password}
                onChange={update('password')}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300">Delivery address</label>
              <textarea
                required
                value={form.address}
                onChange={update('address')}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-300">← Back to storefront</Link>
        </p>
      </div>
    </main>
  )
}
