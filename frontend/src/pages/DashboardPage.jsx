import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../mock/api'
import { INR } from '../lib/format'

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, subtext, color = 'purple' }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '20px',
      border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 32, width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
        className={colors[color]}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        {subtext && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{subtext}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { shopper } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const rewardPoints = 350

  useEffect(() => {
    if (shopper) {
      api.getShopperOrders().then((data) => {
        setOrders(data.slice(0, 5)) // Show only recent 5 orders
        setLoading(false)
      })
    }
  }, [shopper])

  return (
    <div style={{ padding: '28px' }}>
      {/* Welcome section */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          Welcome back, {shopper?.name.split(' ')[0]}! 👋
        </h1>
        <p style={{ fontSize: 15, color: '#64748b' }}>Here's what's happening with your account today.</p>
      </div>

      {/* Stats cards */}
      {shopper && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
          <StatCard icon="📦" label="Total Orders" value={shopper.total_orders || 0} subtext="+3 this month" color="purple" />
          <StatCard icon="🔄" label="Active Returns" value={2} subtext="In progress" color="green" />
          <StatCard icon="❤️" label="Wishlist Items" value={8} subtext="Saved items" color="red" />
          <StatCard icon="⭐" label="Reward Points" value={rewardPoints} subtext="Available to redeem" color="amber" />
        </div>
      )}

      {/* Recent orders */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Recent Orders</h2>
          <Link to="/orders" style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b' }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No orders yet</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Start shopping to see your orders here</p>
            <Link to="/shop" style={{
              display: 'inline-block', background: '#6366f1', color: '#fff',
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
            }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={order.id} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: '#6366f1' }}>
                      #{order.order_number}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                        background: order.status === 'Confirmed' ? '#dcfce7' : order.status === 'Review' ? '#fef3c7' : '#f1f5f9',
                        color: order.status === 'Confirmed' ? '#15803d' : order.status === 'Review' ? '#a16207' : '#475569',
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {INR.format(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <Link to="/shop" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0',
            textDecoration: 'none', transition: 'all .2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 32 }}>🛍️</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Browse Shop</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Discover new products</div>
            </div>
          </Link>

          <Link to="/orders" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0',
            textDecoration: 'none', transition: 'all .2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 32 }}>📋</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>My Orders</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Track your purchases</div>
            </div>
          </Link>

          <Link to="/profile" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0',
            textDecoration: 'none', transition: 'all .2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 32 }}>👤</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Profile</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Manage your account</div>
            </div>
          </Link>

          <Link to="/cart" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0',
            textDecoration: 'none', transition: 'all .2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 32 }}>🛒</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Cart</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Complete your order</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
