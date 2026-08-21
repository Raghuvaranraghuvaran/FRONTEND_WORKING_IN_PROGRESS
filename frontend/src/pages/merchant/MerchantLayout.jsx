import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../mock/api'
import { useApp } from '../../context/AppContext'
import BrandLogo from '../../components/BrandLogo'

const navItems = [
  { to: '/merchant', label: 'Dashboard', end: true },
  { to: '/merchant/products', label: 'Products' },
  { to: '/merchant/orders', label: 'Orders' },
  { to: '/merchant/customers', label: 'Customers' },
  { to: '/merchant/flagged-cases', label: 'Flagged' },
  { to: '/merchant/delivery-agents', label: 'Agents' },
  { to: '/merchant/analytics', label: 'Analytics' },
  { to: '/merchant/fraud-config', label: 'Fraud' },
  { to: '/merchant/audit-log', label: 'Audit' },
  { to: '/merchant/onboarding', label: 'Setup' },
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
    `shrink-0 rounded-md px-2.5 py-1.5 text-[13px] font-medium leading-none transition-colors ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  const drawerLink = ({ isActive }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-3 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <BrandLogo compact className="h-8 w-[8.75rem]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900">ReturnGuard</p>
              <p className="hidden truncate text-[11px] leading-tight text-slate-500 sm:block">Aria Fashion House</p>
            </div>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={desktopLink}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[160px] truncate text-xs text-slate-400 xl:block">{merchant?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 whitespace-nowrap transition-colors hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <BrandLogo compact className="h-8 w-[8.75rem]" />
                  <div>
                    <p className="text-sm font-bold leading-tight text-slate-900">ReturnGuard</p>
                    <p className="text-xs leading-tight text-slate-500">Aria Fashion House</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Close navigation"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
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

              <div className="space-y-2 border-t border-slate-100 px-3 py-4">
                {merchant?.email && (
                  <p className="truncate px-4 text-xs text-slate-400">{merchant.email}</p>
                )}
                <button
                  onClick={() => { setDrawerOpen(false); logout() }}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
