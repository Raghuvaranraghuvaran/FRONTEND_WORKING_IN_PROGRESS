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

      {/* ── MOBILE PORTAL DRAWER (NO BLUR) ──────────────────────── */}
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
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[410px] flex-col justify-between bg-white text-slate-900 shadow-2xl p-6 sm:p-7 overflow-y-auto"
            >
              <div>
                {/* drawer close header */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={19} strokeWidth={2.2} />
                  </button>
                </div>

                {/* Main Header with Centered Icon */}
                <div className="flex flex-col items-center text-center mt-3 mb-7">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-blue-50 to-blue-100/60 text-blue-600 mb-3.5 border border-blue-100 shadow-sm">
                    <ShoppingBag size={28} strokeWidth={2} />
                  </div>
                  <h2 className="text-[25px] font-bold text-slate-900 tracking-tight leading-tight">
                    {shopper ? `Hello, ${shopper.name}` : 'Welcome Back'}
                  </h2>
                  <p className="text-[13.5px] text-slate-500 mt-1 font-normal">
                    {shopper ? 'Navigate your account & portal' : 'Select your portal to continue.'}
                  </p>
                </div>

                {shopper ? (
                  /* Logged-in Shopper Navigation Links */
                  <nav className="space-y-2">
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
                      className="group flex items-center justify-between gap-4 rounded-2xl bg-[#0055ff] p-5 text-white shadow-lg shadow-blue-500/20 hover:bg-[#0047d6] active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                          <ShoppingBag size={21} strokeWidth={2} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-[15.5px] font-bold text-white leading-tight">
                            Shopper Login
                          </h3>
                          <p className="text-[12.5px] text-blue-100 mt-0.5 font-normal leading-snug">
                            Access your orders, returns and rewards.
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-white/80 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    {/* Merchant Login Card */}
                    <Link
                      to="/merchant/login"
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 p-5 text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50/70 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50/90 text-blue-600 border border-blue-100/60">
                          <Store size={21} strokeWidth={2} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-[15.5px] font-bold text-slate-900 leading-tight">
                            Merchant Login
                          </h3>
                          <p className="text-[12.5px] text-slate-500 mt-0.5 font-normal leading-snug">
                            Manage your store, orders and customers.
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-400 shrink-0 group-hover:translate-x-0.5 group-hover:text-slate-600 transition-all" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom Security Trust Badge / Signout */}
              <div className="mt-8 pt-5 border-t border-slate-100">
                {shopper ? (
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <div className="flex items-start gap-3 text-left">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-slate-800">
                        Secure. Reliable. Trusted.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                        Your data is protected with enterprise grade security.
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
