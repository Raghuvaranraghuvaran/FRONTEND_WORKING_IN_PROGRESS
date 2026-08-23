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
  const [authReady, setAuthReady] = useState(false)

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
    Promise.all([api.getCurrentShopper(), api.getCurrentMerchant()])
      .then(([currentShopper, currentMerchant]) => {
        if (currentShopper) setShopper(currentShopper)
        if (currentMerchant) setMerchant(currentMerchant)
      })
      .catch(() => {})
      .finally(() => setAuthReady(true))
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
      authReady,
      addToCart(product, qty = 1) {
        if (!product) return
        const pId = product.id || product.product_id
        setCart((current) => {
          const list = Array.isArray(current) ? [...current] : []
          const index = list.findIndex((item) => String(item.product_id) === String(pId))
          if (index >= 0) {
            list[index] = {
              ...list[index],
              quantity: (Number(list[index].quantity) || 1) + (Number(qty) || 1),
            }
            return list
          }
          return [
            ...list,
            {
              product_id: pId,
              category_id: product.category_id,
              name: product.name,
              price: Number(product.price),
              quantity: Number(qty) || 1,
              image: product.image,
            },
          ]
        })
      },
      removeFromCart(productId) {
        setCart((current) =>
          (Array.isArray(current) ? current : []).filter(
            (item) => String(item.product_id) !== String(productId)
          )
        )
      },
      toggleWishlist(product) {
        if (!product) return
        const pId = product.id || product.product_id
        setWishlist((current) => {
          const list = Array.isArray(current) ? [...current] : []
          const found = list.find((item) => String(item.id || item.product_id) === String(pId))
          if (found) {
            return list.filter((item) => String(item.id || item.product_id) !== String(pId))
          } else {
            return [...list, product]
          }
        })
      },
      isInWishlist(productId) {
        return (Array.isArray(wishlist) ? wishlist : []).some(
          (item) => String(item.id || item.product_id) === String(productId)
        )
      },
      updateCartItem(productId, quantity) {
        setCart((current) => {
          const list = Array.isArray(current) ? [...current] : []
          const num = Number(quantity)
          if (num <= 0) {
            return list.filter((item) => String(item.product_id) !== String(productId))
          }
          return list.map((item) =>
            String(item.product_id) === String(productId) ? { ...item, quantity: num } : item
          )
        })
      },
      clearCart() {
        setCart([])
        setAppliedCoupon(null)
      },
    }),
    [shopper, merchant, cart, wishlist, appliedCoupon, deviceReady, authReady],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
