import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../mock/api'
import { INR } from '../lib/format'
import { useApp } from '../context/AppContext'

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconSearch() {
  return (
    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}
function IconHeart({ filled }) {
  return filled ? (
    <svg style={{ width: 20, height: 20 }} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ) : (
    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function IconCart() {
  return (
    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

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
      background: '#fff', borderRadius: 14, padding: '16px 18px',
      border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 26, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        className={colors[color]}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{value}</div>
        {subtext && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtext}</div>}
      </div>
    </div>
  )
}

export default function ShopPage() {
  const { shopper, toggleWishlist, isInWishlist, addToCart, wishlist } = useApp()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const activeCategory = searchParams.get('category') || 'all'
  const query = searchParams.get('q') || ''

  useEffect(() => {
    api.getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    api.getProducts({ categoryId: activeCategory, query }).then((data) => {
      setProducts(data)
      setLoading(false)
    })
  }, [activeCategory, query])

  const handleAddToCart = (product) => {
    const added = addToCart(product)
    if (!added) {
      alert('Already in cart!')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams({ category: activeCategory, q: searchInput })
  }

  const rewardPoints = 350

  return (
    <div>
      {/* Stats */}
      {shopper && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <StatCard icon="📦" label="My Orders" value={shopper.total_orders || 0} subtext="+3 this month" color="purple" />
            <StatCard icon="🔄" label="Active Returns" value={2} subtext="In progress" color="green" />
            <StatCard icon="❤️" label="Wishlist" value={wishlist.length} subtext="Saved items" color="red" />
            <StatCard icon="⭐" label="Reward Points" value={rewardPoints} subtext="Available points" color="amber" />
          </div>
        </div>
      )}

      {/* Products area */}
      <div style={{ padding: '28px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>All products</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Find something you'll love. Quality products, easy returns.</p>
        </div>

        {/* Search + Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 280, display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
              padding: '9px 14px',
            }}>
              <IconSearch />
              <input
                type="text" placeholder="Search for products, categories, brands..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#1e293b',
                  background: 'transparent',
                }}
              />
            </div>
            <button type="submit" style={{
              background: '#0f172a', color: '#fff', padding: '0 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Sort by:</span>
            <select style={{
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8,
              padding: '6px 12px', fontSize: 13, color: '#1e293b', cursor: 'pointer', fontWeight: 500,
            }}>
              <option>Popular</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSearchParams({ q: query }); setSearchInput(query) }}
              style={{
                padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: 'all .15s',
                background: activeCategory === 'all' ? '#6366f1' : '#fff',
                color: activeCategory === 'all' ? '#fff' : '#475569',
                borderColor: activeCategory === 'all' ? '#6366f1' : '#e2e8f0',
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSearchParams({ category: cat.id, q: query }); setSearchInput(query) }}
                style={{
                  padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer', transition: 'all .15s',
                  background: activeCategory === cat.id ? '#6366f1' : '#fff',
                  color: activeCategory === cat.id ? '#fff' : '#475569',
                  borderColor: activeCategory === cat.id ? '#6366f1' : '#e2e8f0',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 340, background: '#e2e8f0', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 14,
            padding: '64px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No products found</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>Try a different category or search term.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              Showing 1-{products.length} of {products.length} products
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {products.map((product) => {
                const categoryName = categories.find((c) => c.id === product.category_id)?.name || 'Uncategorized'
                return (
                  <div key={product.id} style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid #e2e8f0', position: 'relative',
                    transition: 'all .2s', cursor: 'pointer',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <Link to={`/products/${product.id}`}>
                      <div style={{ position: 'relative', aspectRatio: '1', background: '#f1f5f9', overflow: 'hidden' }}>
                        <img src={product.image} alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    </Link>

                    <button
                      onClick={() => toggleWishlist(product)}
                      style={{
                        position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
                        background: isInWishlist(product.id) ? '#fecdd3' : 'rgba(255,255,255,0.95)',
                        border: '1px solid', borderColor: isInWishlist(product.id) ? '#fb7185' : '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all .2s',
                        color: isInWishlist(product.id) ? '#e11d48' : '#64748b',
                      }}
                    >
                      <IconHeart filled={isInWishlist(product.id)} />
                    </button>

                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        {categoryName}
                      </div>
                      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{
                          fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.4,
                          marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {product.name}
                        </h3>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                          {INR.format(product.price)}
                        </div>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          style={{
                            background: '#6366f1', color: '#fff', width: 34, height: 34, borderRadius: 8,
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0,
                          }}>
                          <IconCart />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 32 }}>
              <button style={{
                width: 34, height: 34, border: '1.5px solid #e2e8f0', background: '#fff',
                borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#64748b',
              }}>←</button>
              {[1, 2, 3, 4].map((n) => (
                <button key={n} style={{
                  width: 34, height: 34, border: '1.5px solid', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: n === 1 ? '#6366f1' : '#fff',
                  color: n === 1 ? '#fff' : '#475569',
                  borderColor: n === 1 ? '#6366f1' : '#e2e8f0',
                }}>
                  {n}
                </button>
              ))}
              <button style={{
                width: 34, height: 34, border: '1.5px solid #e2e8f0', background: '#fff',
                borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#64748b',
              }}>→</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
