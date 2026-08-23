import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, ChevronDown, Bell, LogOut, Search } from 'lucide-react'
import MerchantSidebar from '../../components/MerchantSidebar'
import { useApp } from '../../context/AppContext'
import { api } from '../../mock/api'
import BrandLogo from '../../components/BrandLogo'

export default function MerchantLayout() {
  const { merchant, setMerchant } = useApp()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    await api.logout('merchant')
    setMerchant(null)
    setShowProfileMenu(false)
    setMobileMenuOpen(false)
    navigate('/merchant/login')
  }

  const notifications = [
    { id: 1, text: '🔺 High Risk COD order flagged for review', time: '5 mins ago' },
    { id: 2, text: '📦 Return Request #RET-1049 approved', time: '30 mins ago' },
    { id: 3, text: '📈 Risk model score calibrated successfully', time: '2 hours ago' },
  ]

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* ── Mobile & Desktop Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0d1424]/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Mobile Hamburger button & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#070b14] text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Open merchant navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/merchant" className="flex items-center gap-2">
              <BrandLogo className="h-8 sm:h-9 w-auto" />
            </Link>
          </div>

          {/* Center / Search bar (hidden on mobile, visible on tablet/desktop) */}
          <div className="hidden sm:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="search"
                placeholder="Search orders, customers, SKUs…"
                className="w-full rounded-xl border border-slate-800 bg-[#070b14] pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Notification & Merchant Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#070b14] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  3
                </span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800 bg-[#0d1424] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                    <span className="text-xs font-bold text-white">Risk Alerts</span>
                    <span className="text-[10px] font-semibold text-teal-400">Live</span>
                  </div>
                  <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-1 hover:bg-slate-800/40 rounded-lg transition cursor-pointer">
                        <p className="text-xs text-slate-200">{n.text}</p>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Merchant User Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border border-teal-500/30 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:border-teal-500/50 transition cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-400">
                  🏪
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate">
                  {merchant?.business_name || 'Merchant Admin'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-teal-400 opacity-80" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-[#0d1424] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{merchant?.business_name || 'Store'}</p>
                    <p className="text-[10px] font-mono text-teal-400 truncate">{merchant?.merchant_username || 'ADMIN'}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/merchant"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/merchant/orders"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    >
                      📦 Manage Orders
                    </Link>
                    <Link
                      to="/merchant/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    >
                      ⚙️ Store Settings
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Container: Sidebar + Content ───────────────────────────────── */}
      <div className="flex flex-1 relative">
        
        {/* Desktop Fixed Left Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-800/80 bg-[#0d1424] min-h-[calc(100vh-4rem)]">
          <MerchantSidebar />
        </aside>

        {/* Mobile Slide-Out Drawer with Backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
            />
            {/* Drawer */}
            <div className="relative w-4/5 max-w-xs bg-[#0d1424] h-full shadow-2xl z-10 flex flex-col border-r border-slate-800">
              <MerchantSidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#070b14] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
