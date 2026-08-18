import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../../mock/api'
import { useApp } from '../../context/AppContext'

const navItems = [
  { to: '/merchant', label: 'Dashboard', end: true },
  { to: '/merchant/orders', label: 'Orders' },
  { to: '/merchant/customers', label: 'Customers' },
  { to: '/merchant/flagged-cases', label: 'Flagged Cases' },
  { to: '/merchant/delivery-agents', label: 'Delivery Agents' },
  { to: '/merchant/analytics', label: 'Analytics' },
  { to: '/merchant/fraud-config', label: 'Fraud Config' },
  { to: '/merchant/audit-log', label: 'Audit Log' },
  { to: '/merchant/onboarding', label: 'Onboarding' },
  { to: '/merchant/settings', label: 'Settings' },
]

export default function MerchantLayout() {
  const navigate = useNavigate()
  const { merchant, setMerchant } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  const logout = async () => {
    await api.logout('merchant')
    setMerchant(null)
    navigate('/merchant/login')
  }

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4 lg:gap-8">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">RG</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">ReturnGuard Merchant</p>
                <p className="truncate text-xs text-slate-500">Aria Fashion House</p>
              </div>
            </div>
            <nav className="hidden items-center gap-1 xl:flex">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-slate-500 md:block">{merchant?.email}</span>
            <button onClick={logout} className="hidden rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block">
              Sign out
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 xl:hidden"
              aria-label="Toggle navigation"
            >
              Menu
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 xl:hidden">
            <nav className="grid grid-cols-2 gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={logout}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
