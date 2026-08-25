import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import React from 'react'
import { X } from 'lucide-react'

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function SidebarItem({ to, icon, label, active, badge, onClick }) {
  const El = to ? Link : 'button'

  return (
    <El
      to={to}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 16px',
        borderRadius: 12, textDecoration: 'none', border: 'none',
        background: active
          ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
          : 'transparent',
        color: active ? '#fff' : '#475569',
        fontSize: 14, fontWeight: active ? 600 : 500,
        cursor: 'pointer', transition: 'all .15s', width: '100%',
        textAlign: 'left', boxSizing: 'border-box',
        boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
          e.currentTarget.style.color = '#4f46e5'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#475569'
        }
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.25)' : '#6366f1',
          color: '#fff', fontSize: 11, fontWeight: 700,
          padding: '2px 8px', borderRadius: 20, minWidth: 22, textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </El>
  )
}

export default function ShopperSidebar({ onClose }) {
  const { wishlist } = useApp()
  const location = useLocation()
  const wishlistCount = wishlist?.length || 0

  const handleNav = () => {
    if (onClose) onClose()
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', padding: 0,
    }}>
      {/* ── Drawer header (mobile only) ─────────────────────────────────── */}
      {onClose && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Navigation</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Shopper menu</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#64748b', cursor: 'pointer',
            }}
            aria-label="Close sidebar"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
      )}

      {/* ── Desktop header (when no onClose) ──────────────────────────── */}
      {!onClose && (
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick Navigation
          </p>
        </div>
      )}

      {/* ── Nav Items ────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <SidebarItem
          to="/dashboard" icon="🏠" label="Dashboard"
          active={location.pathname === '/dashboard'} onClick={handleNav}
        />
        <SidebarItem
          to="/shop" icon="🛍️" label="Shop"
          active={location.pathname === '/shop' || location.pathname.startsWith('/products/')} onClick={handleNav}
        />
        <SidebarItem
          to="/orders" icon="📦" label="My Orders"
          active={location.pathname === '/orders' || location.pathname.startsWith('/orders/')} onClick={handleNav}
        />
        <SidebarItem
          to="/wishlist" icon="❤️" label="Wishlist"
          active={location.pathname === '/wishlist'}
          badge={wishlistCount}
          onClick={handleNav}
        />
        <SidebarItem
          to="/profile" icon="👤" label="Account"
          active={location.pathname === '/profile'} onClick={handleNav}
        />
      </nav>

      {/* ── Footer area ──────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid #f1f5f9',
        background: '#fafbfc',
      }}>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
          🛡️ ReturnGuard Verified Storefront
        </p>
      </div>
    </div>
  )
}
