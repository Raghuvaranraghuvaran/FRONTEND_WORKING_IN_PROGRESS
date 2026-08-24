import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, Store, ChevronRight, ShieldCheck, X, User } from 'lucide-react'
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
                <Link to="/profile" className="max-w-[180px] truncate rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {shopper.email || shopper.name}
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

          {/* mobile menu / login trigger — md and below */}
          {!isLandingPage && (
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <User size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE / DESKTOP PORTAL DRAWER (DYNAMIC MOTION) ────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/75"
              onClick={() => setMenuOpen(false)}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.aside
                key="drawer"
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className="relative w-full max-w-[460px] flex flex-col overflow-hidden rounded-[26px] shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-5 sm:p-7 border border-blue-500/25"
                style={{
                  background: 'radial-gradient(circle at top, #17233a 0%, #0a0f1a 42%, #070a12 100%)',
                  color: '#fff',
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                }}
              >
                {/* Close Button with micro-interaction */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors z-10"
                  aria-label="Close menu"
                >
                  <X size={15} />
                </motion.button>

                {/* Brand Icon with smooth float animation */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: [0, -3, 0] }}
                  transition={{
                    scale: { duration: 0.4, ease: 'easeOut' },
                    opacity: { duration: 0.3 },
                    y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                  }}
                  className="mx-auto mb-3 grid place-items-center rounded-2xl text-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                  style={{
                    width: 52,
                    height: 52,
                    background: 'linear-gradient(145deg, #17253d, #0d1422)',
                    border: '1px solid rgba(74, 144, 255, 0.35)',
                  }}
                >
                  🛍️
                </motion.div>

                {/* Title & Subtitle with staggered entry */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                >
                  <h1 className="text-[20px] sm:text-[22px] font-bold text-white text-center m-0 leading-tight">
                    {shopper ? `Hello, ${shopper.email || shopper.name}` : 'Welcome Back'}
                  </h1>
                  <p className="text-[12.5px] text-[#9aa9bf] text-center mt-1.5 mb-5 font-normal">
                    {shopper ? 'Navigate your account & portal' : 'Choose your portal to continue'}
                  </p>
                </motion.div>

                {shopper ? (
                  /* Logged-in Shopper Navigation Links */
                  <nav className="space-y-2.5">
                    <NavLink to="/shop" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 bg-[rgba(19,28,45,0.82)] border border-white/10 hover:border-blue-500 hover:text-white transition-all text-[14px]" onClick={() => setMenuOpen(false)}>
                      <span>Shop Products</span>
                      <span className="text-[#60a5fa]">→</span>
                    </NavLink>
                    <NavLink to="/orders" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 bg-[rgba(19,28,45,0.82)] border border-white/10 hover:border-blue-500 hover:text-white transition-all text-[14px]" onClick={() => setMenuOpen(false)}>
                      <span>My Orders</span>
                      <span className="text-[#60a5fa]">→</span>
                    </NavLink>
                    <NavLink to="/cart" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 bg-[rgba(19,28,45,0.82)] border border-white/10 hover:border-blue-500 hover:text-white transition-all text-[14px]" onClick={() => setMenuOpen(false)}>
                      <span>Shopping Cart</span>
                      {cartCount > 0 ? (
                        <span className="rounded-full bg-blue-600 px-2 py-0.2 text-[10px] font-bold text-white">
                          {cartCount}
                        </span>
                      ) : (
                        <span className="text-[#60a5fa]">→</span>
                      )}
                    </NavLink>
                    <NavLink to="/profile" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-200 bg-[rgba(19,28,45,0.82)] border border-white/10 hover:border-blue-500 hover:text-white transition-all text-[14px]" onClick={() => setMenuOpen(false)}>
                      <span>Account</span>
                      <span className="text-[#60a5fa]">→</span>
                    </NavLink>
                  </nav>
                ) : (
                  /* Portal Cards with wide horizontal layout */
                  <div className="grid gap-3.5 w-full">
                    {/* Shopper Portal Card with spring hover */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14, duration: 0.35, ease: 'easeOut' }}
                      whileHover={{ scale: 1.015, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 text-left rounded-2xl text-white transition-all duration-300 border border-white/10 hover:border-[#3b82f6] bg-[rgba(19,28,45,0.85)] hover:bg-[rgba(27,42,68,0.95)] hover:shadow-[0_10px_30px_rgba(37,99,235,0.22)]"
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          className="grid place-items-center shrink-0 rounded-xl text-[20px] group-hover:scale-105 transition-transform duration-300"
                          style={{
                            width: 44,
                            height: 44,
                            background: 'rgba(59, 130, 246, 0.14)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                          }}
                        >
                          🛍
                        </div>

                        <div className="flex-1 min-w-0">
                          <h2 className="text-[15px] sm:text-[16px] font-bold text-white m-0 mb-0.5 leading-snug group-hover:text-blue-200 transition-colors">
                            Shopper Portal
                          </h2>
                          <p className="text-[11.5px] sm:text-[12px] text-[#9aa9bf] m-0 leading-normal font-normal">
                            Shop, track orders, manage returns and rewards.
                          </p>
                        </div>

                        <span className="text-[18px] text-[#60a5fa] font-light shrink-0 group-hover:translate-x-1 transition-transform duration-300">
                          →
                        </span>
                      </Link>
                    </motion.div>

                    {/* Merchant Portal Card with spring hover */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.35, ease: 'easeOut' }}
                      whileHover={{ scale: 1.015, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to="/merchant/login"
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 text-left rounded-2xl text-white transition-all duration-300 border border-white/10 hover:border-[#8b5cf6] bg-[rgba(19,28,45,0.85)] hover:bg-[rgba(27,42,68,0.95)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.22)]"
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          className="grid place-items-center shrink-0 rounded-xl text-[20px] group-hover:scale-105 transition-transform duration-300"
                          style={{
                            width: 44,
                            height: 44,
                            background: 'rgba(139, 92, 246, 0.14)',
                            border: '1px solid rgba(139, 92, 246, 0.28)',
                          }}
                        >
                          🏪
                        </div>

                        <div className="flex-1 min-w-0">
                          <h2 className="text-[15px] sm:text-[16px] font-bold text-white m-0 mb-0.5 leading-snug group-hover:text-purple-200 transition-colors">
                            Merchant Portal
                          </h2>
                          <p className="text-[11.5px] sm:text-[12px] text-[#9aa9bf] m-0 leading-normal font-normal">
                            Manage your store, products, orders and customers.
                          </p>
                        </div>

                        <span className="text-[18px] text-[#60a5fa] font-light shrink-0 group-hover:translate-x-1 transition-transform duration-300">
                          →
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                )}

                {/* Trust Footer / Signout with smooth fade */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32, duration: 0.4 }}
                  className="mt-8 sm:mt-11"
                >
                  {shopper ? (
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center rounded-2xl bg-[rgba(19,28,45,0.82)] border border-white/10 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Sign out
                    </button>
                  ) : (
                    <div className="flex justify-center items-center gap-2 sm:gap-2.5 text-[#93a4bb] text-[12.5px] sm:text-[14px] font-medium">
                      <span>🔒 Secure</span>
                      <span className="text-slate-600">•</span>
                      <span>Reliable</span>
                      <span className="text-slate-600">•</span>
                      <span>Trusted</span>
                    </div>
                  )}
                </motion.div>
              </motion.aside>
            </div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}


