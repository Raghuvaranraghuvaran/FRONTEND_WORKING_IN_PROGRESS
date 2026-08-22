import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import React from 'react'

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
  const { shopper, setShopper, cart } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await api.logout('shopper')
    setShopper(null)
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  const wishlistCount = 0 // TODO: implement wishlist

  return (
    <aside style={{
      width: 240, background: '#fff', borderRight: '1px solid #e2e8f0',
      padding: '20px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0,
      minHeight: '100vh',
    }}>

      {/* Brand logo at top */}
      <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, textDecoration: 'none' }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10, background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: '#fff', fontSize: 16,
        }}>R</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>ReturnGuard</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Smart Returns. Happy Customers.</div>
        </div>
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SidebarItem to="/dashboard" icon="🏠" label="Dashboard" active={isActive('/dashboard')} />
        <SidebarItem to="/shop" icon="🛍️" label="Shop" active={isActive('/shop')} />
        <SidebarItem to="/orders" icon="📦" label="My Orders" active={isActive('/orders')} />
        <SidebarItem to="/orders" icon="🔄" label="Returns" active={isActive('/orders')} />
        <SidebarItem to="/orders" icon="🔍" label="Track Return" active={isActive('/orders')} />
        <SidebarItem icon="❤️" label="Wishlist" badge={wishlistCount || undefined} />
        <SidebarItem icon="💾" label="Saved Items" />
        <SidebarItem to="/cart" icon="💳" label="Cart" active={isActive('/cart')} badge={cart.length || undefined} />
        <SidebarItem to="/profile" icon="📍" label="Addresses" active={isActive('/profile')} />
        <SidebarItem icon="❓" label="Help & Support" />
      </nav>

      {/* Bottom CTA - removed, moved to page footer */}

      {/* Logout */}
      {shopper && (
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
          borderRadius: 10, border: 'none', background: 'transparent',
          color: '#dc2626', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          marginTop: 12, width: '100%', textAlign: 'left',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          <span>Logout</span>
        </button>
      )}
    </aside>
  )
}
