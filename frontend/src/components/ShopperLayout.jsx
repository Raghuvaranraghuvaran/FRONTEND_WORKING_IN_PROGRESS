import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import ShopperSidebar from './ShopperSidebar'
import { useApp } from '../context/AppContext'
import { useState } from 'react'

// Top bar for shopper pages
function ShopperTopBar() {
  const { shopper } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #e2e8f0',
      padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        {/* Page title will be shown by each individual page */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* User profile card - clickable */}
        {shopper && (
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: 12, padding: '10px 14px', color: '#fff',
              cursor: 'pointer', transition: 'transform .15s',
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
              }}>
                {shopper.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Hi, {shopper.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: 10, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                  {shopper.email}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Bell - clickable */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: 40, height: 40, borderRadius: 10, border: '1px solid #e2e8f0',
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}>
            <span style={{ fontSize: 18 }}>🔔</span>
            <span style={{
              position: 'absolute', top: -2, right: -2, width: 18, height: 18,
              background: '#ef4444', borderRadius: '50%', fontSize: 10, fontWeight: 700,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>3</span>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute', top: 50, right: 0, width: 320,
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 50,
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Notifications</div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {[
                  { id: 1, text: 'Your order #1234 has been delivered', time: '2 hours ago' },
                  { id: 2, text: 'Return request approved', time: '1 day ago' },
                  { id: 3, text: 'New reward points added', time: '3 days ago' },
                ].map((notif) => (
                  <div key={notif.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, color: '#0f172a', marginBottom: 4 }}>{notif.text}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{notif.time}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                <button style={{
                  fontSize: 12, fontWeight: 600, color: '#6366f1',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShopperLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <ShopperSidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <ShopperTopBar />
          <div style={{ flex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Horizontal CTA banner at bottom - centered */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '1px solid #bae6fd', borderTop: '1px solid #bae6fd',
        padding: '16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, background: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            flexShrink: 0,
          }}>🛡️</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0c4a6e', lineHeight: 1.3, marginBottom: 2 }}>
              Shop with Confidence!
            </div>
            <p style={{ fontSize: 12, color: '#075985', margin: 0, lineHeight: 1.4 }}>
              Easy returns on every order.
            </p>
          </div>
        </div>
        <Link to="/shop" style={{
          display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 600,
          color: '#0369a1', textDecoration: 'none', whiteSpace: 'nowrap',
          padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.7)',
          border: '1px solid #7dd3fc',
        }}>
          Learn more →
        </Link>
      </div>
    </div>
  )
}
