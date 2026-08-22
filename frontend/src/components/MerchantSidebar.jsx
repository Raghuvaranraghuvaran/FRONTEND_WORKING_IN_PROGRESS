import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import React from 'react'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  Truck, 
  BarChart3, 
  Shield, 
  FileText, 
  Wrench, 
  Settings,
  LogOut
} from 'lucide-react'

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function SidebarItem({ to, icon: Icon, label, active, onClick }) {
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
      {Icon && <Icon size={18} />}
      <span style={{ flex: 1 }}>{label}</span>
    </El>
  )
}

export default function MerchantSidebar() {
  const { merchant, setMerchant } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await api.logout('merchant')
    setMerchant(null)
    navigate('/')
  }

  return (
    <aside style={{
      width: 240, background: '#fff', borderRight: '1px solid #e2e8f0',
      padding: '20px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0,
      minHeight: '100vh',
    }}>

      {/* Brand logo at top */}
      <Link to="/merchant" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, textDecoration: 'none' }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10, background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: '#fff', fontSize: 16,
        }}>R</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Return Guard</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Merchant Portal</div>
        </div>
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SidebarItem 
          to="/merchant" 
          icon={LayoutDashboard} 
          label="Dashboard" 
          active={location.pathname === '/merchant'} 
        />
        <SidebarItem 
          to="/merchant/products" 
          icon={Package} 
          label="Products" 
          active={location.pathname.startsWith('/merchant/products')} 
        />
        <SidebarItem 
          to="/merchant/orders" 
          icon={ShoppingCart} 
          label="Orders" 
          active={location.pathname.startsWith('/merchant/orders')} 
        />
        <SidebarItem 
          to="/merchant/customers" 
          icon={Users} 
          label="Customers" 
          active={location.pathname.startsWith('/merchant/customers')} 
        />
        <SidebarItem 
          to="/merchant/flagged-cases" 
          icon={AlertTriangle} 
          label="Flagged" 
          active={location.pathname.startsWith('/merchant/flagged-cases')} 
        />
        <SidebarItem 
          to="/merchant/delivery-agents" 
          icon={Truck} 
          label="Agents" 
          active={location.pathname.startsWith('/merchant/delivery-agents')} 
        />
        <SidebarItem 
          to="/merchant/analytics" 
          icon={BarChart3} 
          label="Analytics" 
          active={location.pathname.startsWith('/merchant/analytics')} 
        />
        <SidebarItem 
          to="/merchant/fraud-config" 
          icon={Shield} 
          label="Fraud" 
          active={location.pathname.startsWith('/merchant/fraud-config')} 
        />
        <SidebarItem 
          to="/merchant/audit-log" 
          icon={FileText} 
          label="Audit" 
          active={location.pathname.startsWith('/merchant/audit-log')} 
        />
        <SidebarItem 
          to="/merchant/onboarding" 
          icon={Wrench} 
          label="Setup" 
          active={location.pathname.startsWith('/merchant/onboarding')} 
        />
        <SidebarItem 
          to="/merchant/settings" 
          icon={Settings} 
          label="Settings" 
          active={location.pathname.startsWith('/merchant/settings')} 
        />
      </nav>
    </aside>
  )
}
