import { Outlet, useNavigate } from 'react-router-dom'
import MerchantSidebar from '../../components/MerchantSidebar'
import { useApp } from '../../context/AppContext'
import { api } from '../../mock/api'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MerchantLayout() {
  const { merchant, setMerchant } = useApp()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    await api.logout('merchant')
    setMerchant(null)
    navigate('/')
  }

  const notifications = [
    { id: 1, text: '🔺 New High Risk Case detected', time: '2 mins ago' },
    { id: 2, text: '🔴 New High Case detected', time: '15 mins ago' },
    { id: 3, text: '✅ 3 Returns approved', time: '1 hour ago' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Left Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="search"
              placeholder="Search..."
              style={{
                width: 300,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}>
                🔔
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: '#ef4444',
                  borderRadius: '50%',
                }}></span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    onClick={() => setShowNotifications(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 10,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 320,
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    zIndex: 20,
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Notifications</h3>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.map(notif => (
                        <div 
                          key={notif.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <p style={{ fontSize: 13, color: '#0f172a', margin: 0, marginBottom: 4 }}>{notif.text}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                      <button style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366f1',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile with Dropdown */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  background: showProfileMenu ? '#f8fafc' : '#fff',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={(e) => { if (!showProfileMenu) e.currentTarget.style.background = '#fff' }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {merchant?.name?.charAt(0).toUpperCase() || 'H'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    Hi, {merchant?.name?.split(' ')[0] || 'Raghuvaran'}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {merchant?.email || 'merchant@example.com'}
                  </span>
                </div>
                <ChevronDown size={16} color="#94a3b8" />
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  <div 
                    onClick={() => setShowProfileMenu(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 10,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 200,
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        navigate('/merchant/settings')
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: 13,
                        color: '#0f172a',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        handleLogout()
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: 13,
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
