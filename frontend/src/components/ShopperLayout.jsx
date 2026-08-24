import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Menu, ChevronDown, LogOut, ShoppingBag, Heart } from 'lucide-react'
import ShopperSidebar from './ShopperSidebar'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import BrandLogo from './BrandLogo'

export default function ShopperLayout() {
  const { shopper, setShopper, cart, wishlist } = useApp()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const profileRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => !prev)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlist?.length || 0

  const handleLogout = async () => {
    await api.logout('shopper')
    setShopper(null)
    setShowProfileMenu(false)
    setMobileMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top Bar / Mobile Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Left: Mobile Hamburger button & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/shop" className="flex items-center gap-2">
              <BrandLogo className="h-8 sm:h-9 w-auto" />
            </Link>
          </div>

          {/* Right: Quick actions (Wishlist, Cart, Profile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Wishlist */}
            <Link
              to="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
              title="Wishlist"
            >
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Quick Cart */}
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
              title="Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User profile dropdown */}
            {shopper ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-violet-500 transition cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold uppercase">
                    {(shopper.email || shopper.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block max-w-[130px] truncate">
                    {shopper.email || shopper.name || 'Account'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{shopper.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        🏠 Dashboard
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        📦 My Orders & Invoices
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        👤 Account
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container: Sidebar + Content ───────────────────────────────── */}
      <div className="flex flex-1 relative">
        
        {/* Desktop Fixed Left Sidebar */}
        <aside className="hidden md:block w-60 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)]">
          <ShopperSidebar />
        </aside>

        {/* Mobile Slide-Out Drawer with Backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />
            {/* Drawer */}
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col">
              <ShopperSidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Horizontal Bottom Confidence Banner ────────────────────────────── */}
      <footer className="border-t border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50/50 py-3.5 px-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base shadow-sm">
              🛡️
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">ReturnGuard Verified Storefront</p>
              <p className="text-[11px] text-slate-500">Official tax invoices, authentic products, and automated returns.</p>
            </div>
          </div>
          <Link
            to="/shop"
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-indigo-600 hover:bg-white transition shadow-2xs"
          >
            Explore Catalog →
          </Link>
        </div>
      </footer>
    </div>
  )
}



