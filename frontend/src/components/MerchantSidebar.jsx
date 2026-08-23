import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import React from 'react'
import BrandLogo from './BrandLogo'
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
  LogOut,
  Ticket,
  X
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
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer no-underline ${
        active 
          ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-400 border border-teal-500/30' 
          : isHovering 
          ? 'bg-slate-800/60 text-slate-100' 
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-teal-400' : 'text-slate-400'}`} />}
      <span className="truncate">{label}</span>
    </El>
  )
}

export default function MerchantSidebar({ onClose }) {
  const { merchant, setMerchant } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    if (onClose) onClose()
    await api.logout('merchant')
    setMerchant(null)
    navigate('/merchant/login')
  }

  const handleNav = () => {
    if (onClose) onClose()
  }

  return (
    <div className="flex h-full w-full flex-col justify-between p-4 bg-[#0d1424] text-slate-200 border-r border-slate-800/80">
      <div className="flex-1 overflow-y-auto">
        {/* Brand logo at top + mobile close button */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link to="/merchant" onClick={handleNav} className="inline-flex items-center">
            <BrandLogo className="h-8 sm:h-9 w-auto" />
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Store Identifier Pill */}
        {merchant?.business_name && (
          <div className="mb-4 rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 px-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Store Context</p>
            <p className="text-xs font-bold text-teal-400 truncate">{merchant.business_name}</p>
          </div>
        )}

        {/* Nav items */}
        <nav className="space-y-1">
          <SidebarItem 
            to="/merchant" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={location.pathname === '/merchant'} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/products" 
            icon={Package} 
            label="Products" 
            active={location.pathname.startsWith('/merchant/products')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/orders" 
            icon={ShoppingCart} 
            label="Orders" 
            active={location.pathname.startsWith('/merchant/orders')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/coupons" 
            icon={Ticket} 
            label="Coupons" 
            active={location.pathname.startsWith('/merchant/coupons')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/customers" 
            icon={Users} 
            label="Customers" 
            active={location.pathname.startsWith('/merchant/customers')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/flagged-cases" 
            icon={AlertTriangle} 
            label="Flagged Cases" 
            active={location.pathname.startsWith('/merchant/flagged-cases')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/delivery-agents" 
            icon={Truck} 
            label="Delivery Agents" 
            active={location.pathname.startsWith('/merchant/delivery-agents')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/analytics" 
            icon={BarChart3} 
            label="Analytics" 
            active={location.pathname.startsWith('/merchant/analytics')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/fraud-config" 
            icon={Shield} 
            label="Fraud Rules" 
            active={location.pathname.startsWith('/merchant/fraud-config')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/audit-log" 
            icon={FileText} 
            label="Audit Log" 
            active={location.pathname.startsWith('/merchant/audit-log')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/onboarding" 
            icon={Wrench} 
            label="Setup & API" 
            active={location.pathname.startsWith('/merchant/onboarding')} 
            onClick={handleNav}
          />
          <SidebarItem 
            to="/merchant/settings" 
            icon={Settings} 
            label="Store Settings" 
            active={location.pathname.startsWith('/merchant/settings')} 
            onClick={handleNav}
          />
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="pt-3 mt-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Portal</span>
        </button>
      </div>
    </div>
  )
}
