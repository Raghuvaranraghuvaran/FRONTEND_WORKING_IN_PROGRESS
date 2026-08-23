import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const recaptchaRef = useRef(null)
  const [recaptchaToken, setRecaptchaToken] = useState(null)

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (window.grecaptcha) {
      loadRecaptcha()
    } else {
      // Wait for reCAPTCHA script to load
      window.addEventListener('load', loadRecaptcha)
      return () => window.removeEventListener('load', loadRecaptcha)
    }
  }, [])

  const loadRecaptcha = () => {
    if (window.grecaptcha && window.grecaptcha.render && recaptchaRef.current) {
      try {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(null),
          'error-callback': () => setRecaptchaToken(null),
          theme: 'dark',
        })
      } catch (e) {
        console.error('reCAPTCHA render error:', e)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUser = username.trim().toUpperCase()
    if (!cleanUser) {
      setError('Please enter your merchant username.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    // Check reCAPTCHA in production mode
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost'
    if (isProduction && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.')
      return
    }

    try {
      setSubmitting(true)
      const res = await api.merchantLogin({ 
        username: cleanUser, 
        password,
        recaptchaToken: recaptchaToken || 'mock-token' // Use mock token in dev
      })
      setMerchant(res.admin)
      navigate('/merchant')
    } catch (err) {
      setError(err.message || 'Invalid username or password.')
      // Reset reCAPTCHA on error
      if (window.grecaptcha) {
        window.grecaptcha.reset()
        setRecaptchaToken(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = () => {
    setUsername('ARIAFASHION4827')
    setPassword('demo123')
    setError('')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-4 py-12 text-slate-100 relative">
      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <BrandLogo className="h-10 w-auto" />
          </Link>
          <p className="mt-2 text-xs font-medium text-slate-400 tracking-wide">
            Enterprise E-Commerce Return & Fraud Protection
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0d1424] p-8 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-800/80 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Portal</h1>
            <p className="mt-1 text-xs text-slate-400">
              Sign in with your generated merchant username and password.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Merchant Username */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Merchant Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. SAIFASHION4827"
                  autoComplete="username"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                The unique username generated when your merchant account was registered.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-[#070b14] pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center py-2">
              <div ref={recaptchaRef} className="g-recaptcha"></div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 uppercase tracking-wider hover:from-teal-400 hover:to-emerald-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Authenticating…' : 'Login to Dashboard'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="h-4 w-4 text-teal-400" /> Demo Store:
            </span>
            <button
              type="button"
              onClick={fillDemo}
              className="font-mono text-[11px] font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-lg px-2.5 py-1 transition-colors"
            >
              Fill Demo Credentials
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have a merchant account?{' '}
            <Link to="/merchant/register" className="font-semibold text-teal-400 hover:text-teal-300">
              Register business
            </Link>
          </p>

          {/* reCAPTCHA Privacy/Terms */}
          <div className="mt-3 text-center text-[10px] text-slate-600">
            🔒 Protected by reCAPTCHA •{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-500">
              Privacy
            </a>
            {' • '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-500">
              Terms
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300 transition-colors">
            ← Back to Storefront
          </Link>
        </p>
      </div>
    </main>
  )
}
