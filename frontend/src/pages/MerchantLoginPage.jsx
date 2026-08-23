import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, Check } from 'lucide-react'
import { api } from '../mock/api'
import { useApp } from '../context/AppContext'
import BrandLogo from '../components/BrandLogo'

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const { setMerchant } = useApp()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Clean captcha verification state
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)

  const handleCaptchaClick = () => {
    if (isVerified || isVerifying) return
    setIsVerifying(true)
    setError('')
    
    // Simulate verification check
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
    if (!cleanUser) {
      setError('Please enter your merchant username.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    if (!isVerified || !recaptchaToken) {
      setError('Please complete the verification check before logging in.')
      return
    }

    try {
      setSubmitting(true)
      const res = await api.merchantLogin({ 
        username: cleanUser, 
        password,
        recaptchaToken
      })
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

  const fillDemo = () => {
    setUsername('ARIAFASHION4827')
    setPassword('demo123')
    setIsVerified(true)
    setIsVerifying(false)
    setRecaptchaToken(`verified_token_demo_${Date.now()}`)
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
                  onChange={(e) => { setUsername(e.target.value.toUpperCase()); setError('') }}
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
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
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

            {/* Clean, Neat Captcha Box */}
            <div className="py-2">
              <div 
                onClick={handleCaptchaClick}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all select-none cursor-pointer ${
                  isVerified 
                    ? 'border-emerald-500/50 bg-[#0a1a1c]' 
                    : 'border-slate-700/80 bg-[#070b14] hover:border-slate-600 hover:bg-[#0a0f1d]'
                }`}
              >
                {/* Checkbox and Text */}
                <div className="flex items-center gap-3.5">
                  <div 
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                      isVerified
                        ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : isVerifying
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-slate-600 bg-[#0d1424] hover:border-slate-500'
                    }`}
                  >
                    {isVerified ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : isVerifying ? (
                      <svg className="h-4 w-4 animate-spin text-teal-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : null}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold tracking-wide ${isVerified ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isVerified ? "Verified: I'm not a robot" : isVerifying ? "Verifying..." : "I'm not a robot"}
                    </p>
                    <p className="text-[10px] text-slate-500">Security Verification</p>
                  </div>
                </div>

                {/* Right side Security Logo */}
                <div className="flex flex-col items-center justify-center border-l border-slate-800/80 pl-3.5 text-center">
                  <svg className="h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" strokeWidth="2" />
                  </svg>
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-0.5">reCAPTCHA</span>
                  <div className="flex items-center gap-1 text-[8px] text-slate-500">
                    <span>Privacy</span>
                    <span>•</span>
                    <span>Terms</span>
                  </div>
                </div>
              </div>
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
