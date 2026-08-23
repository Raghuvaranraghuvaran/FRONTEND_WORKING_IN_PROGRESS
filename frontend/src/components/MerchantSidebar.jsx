import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
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
  Ticket,
  X
} from 'lucide-react'

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function SidebarItem({ to, icon: Icon, label, active, onClick }) {
  const El = to ? Link : 'button'

  return (
    <El
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left cursor-pointer no-underline ${
        active
          ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {Icon && <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-teal-600' : 'text-slate-400'}`} />}
      <span className="truncate">{label}</span>
    </El>
  )
}

export default function MerchantSidebar({ onClose }) {
  const { merchant } = useApp()
  const location = useLocation()

  const handleNav = () => {
    if (onClose) onClose()
  }

  return (
    <div className="flex h-full w-full flex-col justify-between p-4 bg-white text-slate-700">
      <div className="flex-1 overflow-y-auto">
        {/* Mobile close button drawer header */}
        {onClose && (
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">Merchant Menu</p>
              <p className="text-xs text-slate-400 mt-0.5">Dashboard navigation</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Store Identifier Pill */}
        {merchant?.business_name && (
          <div className="mb-4 rounded-xl bg-teal-50 border border-teal-200/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-0.5">Store Context</p>
            <p className="text-sm font-bold text-teal-700 truncate">{merchant.business_name}</p>
          </div>
        )}

        {/* Nav items */}
        <nav className="space-y-0.5">
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
    </div>
  )
}
