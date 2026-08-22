import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import React from 'react'
import BrandLogo from './BrandLogo'

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
        background: active ? '#6366f1' : isHovering ? '#6366f1' : 'transparent',
        color: active || isHovering ? '#fff' : '#475569',
        fontSize: 14, fontWeight: active ? 600 : 500,
        cursor: 'pointer', transition: 'all .15s', width: '100%',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          background: active || isHovering ? 'rgba(255,255,255,0.25)' : '#ef4444',
          color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
        }}>
          {badge}
        </span>
      )}
    </El>
  )
}

export default function ShopperSidebar() {
  const { shopper, setShopper, cart, wishlist } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await api.logout('shopper')
    setShopper(null)
    navigate('/')
  }

  const wishlistCount = wishlist?.length || 0

  return (
    <aside style={{
      width: 240, background: '#fff', borderRight: '1px solid #e2e8f0',
      padding: '20px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0,
      minHeight: '100vh',
    }}>

      {/* Brand logo at top */}
      <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 24, textDecoration: 'none' }}>
        <BrandLogo className="h-10 w-auto" />
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SidebarItem to="/dashboard" icon="🏠" label="Dashboard" active={location.pathname === '/dashboard'} />
        <SidebarItem to="/shop" icon="🛍️" label="Shop" active={location.pathname === '/shop' || location.pathname.startsWith('/products/')} />
        <SidebarItem to="/orders" icon="📦" label="My Orders" active={location.pathname === '/orders' || location.pathname.startsWith('/orders/')} />
        <SidebarItem icon="🔄" label="Returns" />
        <SidebarItem icon="🔍" label="Track Return" />
        <SidebarItem to="/wishlist" icon="❤️" label="Wishlist" active={location.pathname === '/wishlist'} badge={wishlistCount || undefined} />
        <SidebarItem to="/cart" icon="💳" label="Cart" active={location.pathname === '/cart'} badge={cart.length || undefined} />
        <SidebarItem to="/profile" icon="📍" label="Addresses" active={location.pathname === '/profile'} />
        <SidebarItem to="/help" icon="❓" label="Help & Support" active={location.pathname === '/help'} />
      </nav>
    </aside>
  )
}
