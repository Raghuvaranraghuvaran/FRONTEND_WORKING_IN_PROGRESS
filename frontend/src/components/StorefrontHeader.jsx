import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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

      {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-[82vw] max-w-[340px] flex-col justify-between bg-white text-slate-900 shadow-2xl"
            >
              <div>
                {/* drawer close header */}
                <div className="flex items-center justify-end px-5 pt-5 pb-3">
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    aria-label="Close menu"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* nav links with dividers */}
                <nav className="mt-1 flex flex-col">
                  <NavLink to="/" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                    Home
                  </NavLink>
                  <NavLink to="/shop" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                    Shop
                  </NavLink>
                  {shopper && (
                    <>
                      <NavLink to="/orders" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                        Orders
                      </NavLink>
                      <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                        <span>Cart</span>
                        {cartCount > 0 && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </NavLink>
                      <NavLink to="/profile" className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
                        Profile ({shopper.name})
                      </NavLink>
                    </>
                  )}
                </nav>
              </div>

              {/* footer buttons */}
              <div className="border-t border-slate-100 p-5 space-y-2.5">
                {shopper ? (
                  <>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center rounded-full bg-[#0055ff] py-3.5 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#0047d6] active:scale-[0.98] transition-all"
                    >
                      Sign out
                    </button>
                    <Link
                      to="/merchant/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-3 px-6 text-[14px] font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
                    >
                      Merchant Portal
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-full bg-[#0055ff] py-3.5 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-[#0047d6] active:scale-[0.98] transition-all"
                    >
                      Shopper Login
                    </Link>
                    <Link
                      to="/merchant/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-full border border-slate-200 bg-white py-3 px-6 text-[14px] font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
                    >
                      Merchant Login
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
