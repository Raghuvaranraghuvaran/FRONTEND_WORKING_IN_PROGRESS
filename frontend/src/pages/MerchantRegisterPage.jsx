import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Copy, Eye, EyeOff, Store, ShieldCheck, ArrowRight, Mail, Lock, User, Tag, MapPin, Phone, Building } from 'lucide-react'
import { api } from '../mock/api'
import BrandLogo from '../components/BrandLogo'

export default function MerchantRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    storeSlug: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    gstin: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Success Modal state
  const [successData, setSuccessData] = useState(null)
  const [showModalPassword, setShowModalPassword] = useState(false)
  const [copiedUsername, setCopiedUsername] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const update = (field) => (e) => {
    const val = e.target.value
    if (field === 'storeSlug') {
      setForm({ ...form, storeSlug: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })
    } else if (field === 'phone') {
      setForm({ ...form, phone: val.replace(/\D/g, '').slice(0, 10) })
    } else if (field === 'pincode') {
      setForm({ ...form, pincode: val.replace(/\D/g, '').slice(0, 6) })
    } else {
      setForm({ ...form, [field]: val })
    }
  }

  const handleCopy = (text, type) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (type === 'username') {
      setCopiedUsername(true)
      setTimeout(() => setCopiedUsername(false), 2000)
    } else if (type === 'password') {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validations
    if (!form.name.trim()) {
      setError('Your Name is required.')
      return
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!form.businessName.trim()) {
      setError('Business Name is required.')
      return
    }
    if (!form.storeSlug.trim() || !/^[a-z0-9-]+$/.test(form.storeSlug.trim())) {
      setError('Store Slug can only contain lowercase letters, numbers, and hyphens.')
      return
    }
    if (!form.address.trim()) {
      setError('Store Street Address is required.')
      return
    }
    if (!form.city.trim()) {
      setError('City is required.')
      return
    }
    const cleanPin = form.pincode.replace(/\D/g, '')
    if (!cleanPin || cleanPin.length !== 6) {
      setError('PIN Code must be a valid 6-digit number.')
      return
    }
    const cleanPhone = form.phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Phone number must be a valid 10-digit mobile number.')
      return
    }

    try {
      setSubmitting(true)
      const res = await api.registerMerchantAccount({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        businessName: form.businessName.trim(),
        storeSlug: form.storeSlug.trim().toLowerCase(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: cleanPin,
        phone: cleanPhone,
        gstin: form.gstin.trim(),
      })

      // Store created credentials for the modal
      setSuccessData({
        email: form.email.trim().toLowerCase(),
        merchant_username: res.merchant_username,
        password: form.password,
        business_name: form.businessName.trim(),
        phone: cleanPhone,
        address: `${form.address.trim()}, ${form.city.trim()}${form.state.trim() ? ', ' + form.state.trim() : ''} - ${cleanPin}`,
      })
    } catch (err) {
      setError(err.message || 'Failed to create merchant account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        .mr-input, .mr-textarea {
          width: 100% !important;
          box-sizing: border-box !important;
          background: rgba(15, 23, 42, 0.75) !important;
          border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 12px !important;
          font-size: 13.5px !important;
          font-weight: 500 !important;
          color: #ffffff !important;
          outline: none !important;
          transition: border-color .15s, box-shadow .15s, background .15s !important;
        }
        .mr-input:focus, .mr-textarea:focus {
          border-color: #14b8a6 !important;
          background: rgba(15, 23, 42, 0.95) !important;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25) !important;
        }
        .mr-input::placeholder, .mr-textarea::placeholder {
          color: #94a3b8 !important;
        }
      `}</style>
      {/* Background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, background:'linear-gradient(135deg, #0f172a 0%, #134e4a 40%, #0f172a 100%)' }} />
      <div style={{ position:'fixed', inset:0, zIndex:1, backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2314b8a6' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      <div style={{ position:'fixed', inset:0, zIndex:2, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,184,166,0.18) 0%, transparent 70%)' }} />

      <main style={{ position:'relative', zIndex:3, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 16px', fontFamily:"'Segoe UI', Roboto, Arial, sans-serif" }}>
      <div className="w-full max-w-xl">
        {/* Brand Logo Header */}
        <div style={{ marginBottom:24, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <Link to="/" style={{ display:'inline-block', textDecoration:'none' }}>
            <BrandLogo className="h-11 w-auto" />
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(20,184,166,0.15)', border:'1px solid rgba(20,184,166,0.35)', borderRadius:20, padding:'4px 12px' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#2dd4bf', flexShrink:0, boxShadow:'0 0 6px #2dd4bf' }} />
            <span style={{ fontSize:11, fontWeight:600, color:'#5eead4', letterSpacing:'0.06em' }}>MERCHANT ONBOARDING</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(32px) saturate(1.5)', WebkitBackdropFilter:'blur(32px) saturate(1.5)', borderRadius:24, border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)', padding:'32px 28px 28px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, #14b8a6, #0d9488, transparent)' }} />
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#f8fafc', margin:'0 0 4px', letterSpacing:'-0.02em' }}>Create Merchant Account</h1>
            <p style={{ fontSize:12.5, color:'rgba(148,163,184,0.9)', margin:0 }}>
              Register your business, store details & address to begin automated risk intelligence.
            </p>
          </div>

          {error && (
            <div style={{ marginBottom:16, borderRadius:10, padding:'10px 14px', fontSize:12.5, fontWeight:600, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#fca5a5' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {/* Personal Information */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#5eead4' }}>
                1. Account & Admin Credentials
              </div>

              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Your Name *</label>
                <div style={{ position:'relative' }}>
                  <User style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#475569' }} />
                  <input
                    className="mr-input"
                    type="text" required value={form.name} onChange={update('name')}
                    style={{ paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                    placeholder="e.g. Sai Kumar"
                  />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Your Email *</label>
                <div style={{ position:'relative' }}>
                  <Mail style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#475569' }} />
                  <input
                    className="mr-input"
                    type="email" required value={form.email} onChange={update('email')}
                    style={{ paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                    placeholder="merchant@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Password *</label>
                <div style={{ position:'relative' }}>
                  <Lock style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#475569' }} />
                  <input
                    className="mr-input"
                    type={showPassword ? 'text' : 'password'} required minLength={6} value={form.password} onChange={update('password')}
                    style={{ paddingLeft:38, paddingRight:42, paddingTop:11, paddingBottom:11 }}
                    placeholder="Minimum 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:0, display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff style={{ width:15, height:15 }} /> : <Eye style={{ width:15, height:15 }} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#5eead4' }}>
                2. Business Identity
              </div>

              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Business Name *</label>
                <div style={{ position:'relative' }}>
                  <Store style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#475569' }} />
                  <input
                    className="mr-input"
                    type="text" required value={form.businessName} onChange={update('businessName')}
                    style={{ paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                    placeholder="e.g. Aria Fashion House"
                  />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Store Slug *</label>
                <div style={{ position:'relative' }}>
                  <Tag style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#475569' }} />
                  <input
                    className="mr-input"
                    type="text" required value={form.storeSlug} onChange={update('storeSlug')}
                    style={{ paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11, fontFamily:'monospace' }}
                    placeholder="aria-fashion-house"
                  />
                </div>
              </div>
            </div>

            {/* Store Address & Location */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#5eead4' }}>
                3. Business Location & Address
              </div>

              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Street Address / Building *</label>
                <div style={{ position:'relative' }}>
                  <MapPin style={{ position:'absolute', left:13, top:13, width:15, height:15, color:'#475569' }} />
                  <textarea
                    className="mr-textarea"
                    rows={2} required value={form.address} onChange={update('address')}
                    style={{ paddingLeft:38, paddingRight:14, paddingTop:10, paddingBottom:10, resize:'none' }}
                    placeholder="e.g. 42 MG Road, Indiranagar, 2nd Floor"
                  />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>City *</label>
                  <input
                    className="mr-input"
                    type="text" required value={form.city} onChange={update('city')}
                    style={{ paddingLeft:14, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                    placeholder="e.g. Bengaluru"
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>State</label>
                  <input
                    className="mr-input"
                    type="text" value={form.state} onChange={update('state')}
                    style={{ paddingLeft:14, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                    placeholder="e.g. Karnataka"
                  />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>PIN Code (6 Digits) *</label>
                  <input
                    className="mr-input"
                    type="text" required maxLength={6} value={form.pincode} onChange={update('pincode')}
                    style={{ paddingLeft:14, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                    placeholder="e.g. 560038"
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11.5, fontWeight:600, color:'#94a3b8', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Phone (10 Digits) *</label>
                  <div style={{ position:'relative' }}>
                    <Phone style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#475569' }} />
                    <input
                      className="mr-input"
                      type="tel" required maxLength={10} value={form.phone} onChange={update('phone')}
                      style={{ paddingLeft:38, paddingRight:14, paddingTop:11, paddingBottom:11 }}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              style={{ width:'100%', border:'none', padding:'14px 0', borderRadius:12, fontSize:13, fontWeight:700, color:'#fff', cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? 'rgba(13,148,136,0.5)' : 'linear-gradient(135deg, #0d9488, #0f766e)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: submitting ? 'none' : '0 4px 20px rgba(13,148,136,0.45)', letterSpacing:'0.04em', textTransform:'uppercase', transition:'all .15s', opacity: submitting ? 0.7 : 1, marginTop:8 }}
            >
              {submitting ? 'Registering Merchant Account…' : 'Register Merchant Account →'}
            </button>
          </form>

          <p style={{ marginTop:20, textAlign:'center', fontSize:12.5, color:'#64748b' }}>
            Already registered?{' '}
            <Link to="/merchant/login" style={{ color:'#2dd4bf', fontWeight:600, textDecoration:'none' }}>
              Sign in with username
            </Link>
          </p>
        </div>

        <p style={{ textAlign:'center', marginTop:20 }}>
          <Link to="/" style={{ fontSize:12.5, color:'rgba(148,163,184,0.7)', textDecoration:'none', fontWeight:500 }}>
            ← Back to Storefront
          </Link>
        </p>
      </div>

      {/* Success Popup Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-200">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Merchant Account Created Successfully</h3>
                <p className="text-xs text-slate-500">Your store, address & phone details are saved.</p>
              </div>
            </div>

            {/* Credentials box */}
            <div className="my-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {/* Store & Email */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Store Name</span>
                  <span className="font-semibold text-slate-800 truncate block">{successData.business_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{successData.email}</span>
                </div>
              </div>

              {/* Phone and Address */}
              {successData.phone && (
                <div className="border-t border-slate-200/80 pt-2.5 flex justify-between text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile Phone:</span>
                  <span className="font-semibold text-slate-800">+91 {successData.phone}</span>
                </div>
              )}

              {/* Registered Address */}
              {successData.address && (
                <div className="border-t border-slate-200/80 pt-2.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Store Address</span>
                  <span className="text-xs text-slate-700 font-medium leading-relaxed block mt-0.5">{successData.address}</span>
                </div>
              )}

              {/* Merchant Username */}
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Merchant Username
                  </span>
                  <span className="font-mono text-sm font-bold text-teal-700 tracking-wider">
                    {successData.merchant_username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(successData.merchant_username, 'username')}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {copiedUsername ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy Username
                    </>
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-3">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Password
                  </span>
                  <span className="font-mono text-xs text-slate-800">
                    {showModalPassword ? successData.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    title={showModalPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showModalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(successData.password, 'password')}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-800 flex items-start gap-2">
              <Mail className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
              <span>Your merchant credentials have been sent to your registered email.</span>
            </div>

            {/* Continue to Login Action */}
            <div className="mt-5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/merchant/login', {
                  state: {
                    username: successData.merchant_username,
                    password: successData.password,
                  }
                })}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 py-3 text-xs font-bold text-white uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Continue to Login <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  )
}
