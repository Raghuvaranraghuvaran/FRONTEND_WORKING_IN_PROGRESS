import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../mock/api'
import { getDeviceContext } from '../lib/device'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [shopper, setShopper] = useState(() => {
    try {
      const sess = api.getSession()
      if (sess?.shopper) return sess.shopper
      const stored = JSON.parse(localStorage.getItem('returnguard_session') || 'null')
      return stored?.shopper || null
    } catch {
      return null
    }
  })
  const [merchant, setMerchant] = useState(() => {
    try {
      const sess = api.getSession()
      if (sess?.merchant) return sess.merchant
      const stored = JSON.parse(localStorage.getItem('returnguard_session') || 'null')
      return stored?.merchant || null
    } catch {
      return null
    }
  })
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('returnguard_cart') || '[]')
    } catch {
      return []
    }
  })
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('returnguard_wishlist') || '[]')
    } catch {
      return []
    }
  })
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('returnguard_coupon') || 'null')
    } catch {
      return null
    }
  })
  const [deviceReady, setDeviceReady] = useState(false)

  useEffect(() => {
    const context = getDeviceContext()
    api.getDeviceSession().then(() => setDeviceReady(true))
    localStorage.setItem('returnguard_device_context', JSON.stringify(context))
  }, [])

  useEffect(() => {
    localStorage.setItem('returnguard_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('returnguard_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('returnguard_coupon', JSON.stringify(appliedCoupon))
    } else {
      localStorage.removeItem('returnguard_coupon')
    }
  }, [appliedCoupon])

  useEffect(() => {
    api.getCurrentShopper()
      .then((currentShopper) => {
        if (currentShopper) setShopper(currentShopper)
      })
      .catch(() => {
        // Keep locally restored session
      })
  }, [])

  const value = useMemo(
    () => ({
      shopper,
      setShopper,
      merchant,
      setMerchant,
      cart,
      setCart,
      wishlist,
      setWishlist,
      appliedCoupon,
      setAppliedCoupon,
      deviceReady,
      addToCart(product) {
        let isNew = false
        setCart((current) => {
          const found = current.find((item) => item.product_id === product.id)
          if (found) {
            // Product is already in cart, do not duplicate
            return current
          }
          isNew = true
          return [...current, { 
            product_id: product.id, 
            category_id: product.category_id,
            name: product.name, 
            price: Number(product.price), 
            quantity: 1,
            image: product.image // Add product image
          }]
        })
        return isNew
      },
      toggleWishlist(product) {
        setWishlist((current) => {
          const found = current.find((item) => item.id === product.id)
          if (found) {
            // Remove from wishlist
            return current.filter((item) => item.id !== product.id)
          } else {
            // Add to wishlist
            return [...current, product]
          }
        })
      },
      isInWishlist(productId) {
        return wishlist.some((item) => item.id === productId)
      },
      updateCartItem(productId, quantity) {
        setCart((current) =>
          quantity <= 0
            ? current.filter((item) => item.product_id !== productId)
            : current.map((item) => (item.product_id === productId ? { ...item, quantity } : item)),
        )
      },
      clearCart() {
        setCart([])
        setAppliedCoupon(null)
      },
    }),
    [shopper, merchant, cart, wishlist, appliedCoupon, deviceReady],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
