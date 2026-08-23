import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import React from 'react'
import BrandLogo from './BrandLogo'
import { X, LogOut } from 'lucide-react'

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function SidebarItem({ to, icon, label, active, badge, onClick }) {
  const El = to ? Link : 'button'
  const [isHovering, setIsHovering] = React.useState(false)

  return (
    <El
      to={to}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
        borderRadius: 10, textDecoration: 'none', border: 'none',
        background: active ? '#6366f1' : isHovering ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
        color: active ? '#fff' : isHovering ? '#4f46e5' : '#475569',
        fontSize: 14, fontWeight: active ? 600 : 500,
        cursor: 'pointer', transition: 'all .15s', width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.25)' : '#6366f1',
          color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
        }}>
          {badge}
        </span>
      )}
    </El>
  )
}

export default function ShopperSidebar({ onClose }) {
  const { shopper, setShopper, cart, wishlist } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    if (onClose) onClose()
    await api.logout('shopper')
    setShopper(null)
    navigate('/')
  }

  const wishlistCount = wishlist?.length || 0
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleNav = () => {
    if (onClose) onClose()
  }

  return (
    <div className="flex h-full w-full flex-col justify-between p-5 bg-white">
      <div>
        {/* Brand logo & Mobile Close button */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/shop" onClick={handleNav} className="inline-flex items-center">
            <BrandLogo className="h-9 w-auto" />
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          <SidebarItem to="/dashboard" icon="🏠" label="Dashboard" active={location.pathname === '/dashboard'} onClick={handleNav} />
          <SidebarItem to="/shop" icon="🛍️" label="Shop" active={location.pathname === '/shop' || location.pathname.startsWith('/products/')} onClick={handleNav} />
          <SidebarItem to="/orders" icon="📦" label="My Orders" active={location.pathname === '/orders' || location.pathname.startsWith('/orders/')} onClick={handleNav} />
          <SidebarItem to="/returns" icon="🔄" label="Returns" active={location.pathname === '/returns'} onClick={handleNav} />
          <SidebarItem to="/wishlist" icon="❤️" label="Wishlist" active={location.pathname === '/wishlist'} badge={wishlistCount || undefined} onClick={handleNav} />
          <SidebarItem to="/cart" icon="💳" label="Cart" active={location.pathname === '/cart'} badge={cartCount || undefined} onClick={handleNav} />
          <SidebarItem to="/profile" icon="📍" label="Addresses" active={location.pathname === '/profile'} onClick={handleNav} />
        </nav>
      </div>

      {/* Shopper info / Sign out footer */}
      {shopper && (
        <div className="pt-4 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}
