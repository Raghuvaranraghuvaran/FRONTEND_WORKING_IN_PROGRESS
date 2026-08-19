import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../mock/api'
import { useApp } from '../../context/AppContext'

const navItems = [
  { to: '/merchant', label: 'Dashboard', end: true },
  { to: '/merchant/orders', label: 'Orders' },
  { to: '/merchant/customers', label: 'Customers' },
  { to: '/merchant/flagged-cases', label: 'Flagged' },
  { to: '/merchant/delivery-agents', label: 'Delivery' },
  { to: '/merchant/analytics', label: 'Analytics' },
  { to: '/merchant/fraud-config', label: 'Fraud' },
  { to: '/merchant/audit-log', label: 'Audit' },
  { to: '/merchant/onboarding', label: 'Onboarding' },
  { to: '/merchant/settings', label: 'Settings' },
]

export default function MerchantLayout() {
  const navigate = useNavigate()
  const { merchant, setMerchant } = useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const logout = async () => {
    await api.logout('merchant')
    setMerchant(null)
    navigate('/')
  }

  const desktopLink = ({ isActive }) =>
    `whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors flex-1 text-center ${
      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`

  const drawerLink = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        {/* row 1: logo + sign out */}
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">RG</span>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">ReturnGuard Merchant</p>
              <p className="hidden text-xs text-slate-500 leading-tight sm:block">Aria Fashion House</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-xs text-slate-400 md:block">{merchant?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* row 2: nav — full width, all items always visible */}
        <div className="border-t border-slate-100 bg-white">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={desktopLink}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            {/* drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl lg:hidden"
            >
              {/* drawer header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">RG</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">ReturnGuard</p>
                    <p className="text-xs text-slate-500 leading-tight">Aria Fashion House</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Close navigation"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={drawerLink}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {/* drawer footer */}
              <div className="border-t border-slate-100 px-3 py-4 space-y-2">
                {merchant?.email && (
                  <p className="truncate px-4 text-xs text-slate-400">{merchant.email}</p>
                )}
                <button
                  onClick={() => { setDrawerOpen(false); logout() }}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN ───────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
