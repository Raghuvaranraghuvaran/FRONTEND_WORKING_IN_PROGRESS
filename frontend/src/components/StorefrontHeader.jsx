import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import NotificationBell from './NotificationBell'

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
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* left: logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">RG</span>
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">ReturnGuard</span>
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
            <Link
              to="/login"
              className="hidden rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 md:block"
            >
              Sign in
            </Link>
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

      {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 flex w-64 flex-col bg-white shadow-2xl"
            >
              {/* drawer header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">RG</span>
                  <span className="text-sm font-bold text-slate-900">ReturnGuard</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                <NavLink to="/shop" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Shop</NavLink>
                {shopper && (
                  <>
                    <NavLink to="/orders" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>Orders</NavLink>
                    <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                      Cart {cartCount > 0 && <span className="ml-1 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{cartCount}</span>}
                    </NavLink>
                    <NavLink to="/profile" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                      {shopper.name}
                    </NavLink>
                  </>
                )}
              </nav>

              {/* footer */}
              <div className="border-t border-slate-100 px-3 py-4">
                {shopper ? (
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full rounded-xl bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
