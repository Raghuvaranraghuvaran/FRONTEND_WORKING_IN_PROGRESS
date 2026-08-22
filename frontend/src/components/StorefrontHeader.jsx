import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Store, ChevronRight, ShieldCheck, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import NotificationBell from './NotificationBell'
import BrandLogo from './BrandLogo'

export default function StorefrontHeader() {
  const { shopper, setShopper, cart } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isLandingPage = location.pathname === '/'

  const handleLogout = async () => {
    await api.logout('shopper')
    setShopper(null)
    navigate('/')
    setMenuOpen(false)
  }

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900'
    }`

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between border-b border-slate-100 px-6 py-3.5 text-[15px] font-medium transition-colors ${
      isActive ? 'text-blue-600 bg-blue-50/50 font-semibold' : 'text-slate-800 hover:bg-slate-50 hover:text-blue-600'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* left: logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <BrandLogo compact className="sm:h-9 sm:w-[10rem]" />
          </Link>

          {!isLandingPage && (
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/shop" className={navLinkClass}>Shop</NavLink>
              {shopper && <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>}
            </nav>
          )}
        </div>

        {/* right: actions */}
        <div className="flex items-center gap-2">
          {shopper && !isLandingPage && <NotificationBell />}

          {shopper && !isAuthPage && !isLandingPage && (
            <Link
              to="/cart"
              className="relative rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* desktop: shopper name + sign out */}
          {shopper ? (
            <div className="hidden items-center gap-2 md:flex">
              {!isLandingPage && (
                <Link to="/profile" className="max-w-[120px] truncate rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {shopper.name}
                </Link>
              )}
              {!isLandingPage && (
                <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                  Sign out
                </button>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Shopper Login
              </Link>
              <Link
                to="/merchant/login"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Merchant Login
              </Link>
            </div>
          )}

          {/* hamburger — md and below */}
          {!isLandingPage && (
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE / DESKTOP PORTAL DRAWER (NO BLUR) ───────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setMenuOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col justify-between bg-white text-slate-900 shadow-2xl p-7 sm:p-8 overflow-y-auto rounded-l-[32px] sm:rounded-l-[36px]"
            >
              <div>
                {/* Pull handle for mobile & tablet + Close Button */}
                <div className="relative flex items-center justify-between mb-2">
                  <div className="mx-auto w-12 h-1 bg-slate-200/90 rounded-full" />
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={18} strokeWidth={2.2} />
                  </button>
                </div>

                {/* Main Header with Centered Icon */}
                <div className="flex flex-col items-center text-center mt-4 mb-8">
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-blue-50/90 text-blue-600 mb-4 border border-blue-100/70 shadow-sm">
                    <ShoppingBag size={30} strokeWidth={2} />
                  </div>
                  <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                    {shopper ? `Hello, ${shopper.name}` : <>Welcome Back <span className="text-xl sm:text-2xl">👋</span></>}
                  </h2>
                  <p className="text-[14px] text-slate-500 mt-1.5 font-medium">
                    {shopper ? 'Navigate your account & portal' : 'Select your portal to continue'}
                  </p>
                </div>

                {shopper ? (
                  /* Logged-in Shopper Navigation Links */
                  <nav className="space-y-2.5">
                    <NavLink to="/shop" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                      Shop Products
                    </NavLink>
                    <NavLink to="/orders" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                      My Orders
                    </NavLink>
                    <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                      <span>Shopping Cart</span>
                      {cartCount > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          {cartCount}
                        </span>
                      )}
                    </NavLink>
                    <NavLink to="/profile" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                      Account Profile
                    </NavLink>
                  </nav>
                ) : (
                  /* Portal Selection Cards: Shopper and Merchant with clean gap */
                  <div className="space-y-4 pt-1">
                    {/* Shopper Login Card */}
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="group relative flex items-center justify-between gap-4 rounded-[22px] bg-gradient-to-r from-[#1a66ff] to-[#2563eb] p-5 text-white shadow-xl shadow-blue-500/25 hover:from-[#1557e0] hover:to-[#1d4ed8] active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                          <ShoppingBag size={22} strokeWidth={2.2} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-[16px] font-bold text-white leading-tight">
                            Shopper Login
                          </h3>
                          <p className="text-[13px] text-blue-100/90 mt-0.5 font-normal leading-snug">
                            Access your orders,<br className="hidden sm:inline" /> returns and rewards.
                          </p>
                        </div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700/50 text-white group-hover:translate-x-0.5 transition-transform">
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </div>
                    </Link>

                    {/* Merchant Login Card */}
                    <Link
                      to="/merchant/login"
                      onClick={() => setMenuOpen(false)}
                      className="group relative flex items-center justify-between gap-4 rounded-[22px] bg-white border border-slate-200/90 p-5 text-slate-900 shadow-sm hover:border-slate-300 hover:shadow-md hover:bg-slate-50/50 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100/60">
                          <Store size={22} strokeWidth={2.2} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                            Merchant Login
                          </h3>
                          <p className="text-[13px] text-slate-500 mt-0.5 font-normal leading-snug">
                            Manage your store,<br className="hidden sm:inline" /> orders and customers.
                          </p>
                        </div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200/60 text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all">
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom Security Trust Badge / Signout */}
              <div className="mt-10 pt-6 border-t border-slate-100">
                {shopper ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <div className="flex items-start gap-3.5 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 mt-0.5">
                      <ShieldCheck size={19} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">
                        Secure. Reliable. Trusted.
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5 leading-normal">
                        Your data is protected with enterprise-grade security.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
