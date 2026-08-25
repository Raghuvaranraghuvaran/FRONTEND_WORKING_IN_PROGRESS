import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, ChevronDown, Bell, LogOut, Search } from 'lucide-react'
import MerchantSidebar from '../../components/MerchantSidebar'
import { useApp } from '../../context/AppContext'
import { api } from '../../mock/api'
import BrandLogo from '../../components/BrandLogo'

export default function MerchantLayout() {
  const { merchant, setMerchant } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)


  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleNotifications = () => {
    setShowNotifications(prev => {
      if (!prev) setShowProfileMenu(false)
      return !prev
    })
  }

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => {
      if (!prev) setShowNotifications(false)
      return !prev
    })
  }

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ── Mobile & Desktop Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Mobile Hamburger button & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                placeholder="Search orders, customers, SKUs…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Notification & Merchant Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  3
                </span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <span className="text-xs font-bold text-slate-900">Risk Alerts</span>
                    <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200">Live</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition cursor-pointer">
                        <p className="text-xs font-medium text-slate-800">{n.text}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Merchant User Badge */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={toggleProfileMenu}
                className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200/80 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100/70 transition cursor-pointer shadow-2xs"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                  🏪
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate font-bold">
                  {merchant?.business_name || 'Merchant Admin'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-teal-600 opacity-80" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{merchant?.business_name || 'Store'}</p>
                    <p className="text-[10px] font-mono text-teal-600 font-semibold truncate">{merchant?.merchant_username || 'ADMIN'}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/merchant"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/merchant/orders"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      📦 Manage Orders
                    </Link>
                    <Link
                      to="/merchant/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      ⚙️ Store Settings
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
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
        <aside className="hidden lg:block w-60 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)]">
          <MerchantSidebar />
        </aside>

        {/* Mobile Slide-Out Drawer with Backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />
            {/* Drawer */}
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col border-r border-slate-200">
              <MerchantSidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
