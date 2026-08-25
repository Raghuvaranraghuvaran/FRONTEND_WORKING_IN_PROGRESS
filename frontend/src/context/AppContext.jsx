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
  const [comparisonList, setComparisonList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('returnguard_comparison') || '[]')
    } catch {
      return []
    }
  })
  const [priceAlerts, setPriceAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('returnguard_price_alerts') || '{}')
    } catch {
      return {}
    }
  })
  const [preferences, setPreferences] = useState({
    default_size: 'M',
    fit_preference: 'Regular',
    budget_max: 5000,
    preferred_categories: ['cat_daily', 'cat_ethnic'],
    preferred_brands: ['Nike', 'Zara', 'H&M'],
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
    localStorage.setItem('returnguard_comparison', JSON.stringify(comparisonList))
  }, [comparisonList])

  useEffect(() => {
    localStorage.setItem('returnguard_price_alerts', JSON.stringify(priceAlerts))
  }, [priceAlerts])

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('returnguard_coupon', JSON.stringify(appliedCoupon))
    } else {
      localStorage.removeItem('returnguard_coupon')
    }
  }, [appliedCoupon])

  useEffect(() => {
    Promise.all([api.getCurrentShopper(), api.getCurrentMerchant(), api.getUserPreferences()])
      .then(([currentShopper, currentMerchant, userPrefs]) => {
        if (currentShopper) setShopper(currentShopper)
        if (currentMerchant) setMerchant(currentMerchant)
        if (userPrefs) setPreferences(userPrefs)
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
      comparisonList,
      setComparisonList,
      priceAlerts,
      setPriceAlerts,
      preferences,
      setPreferences,
      deviceReady,
      authReady,
      addToCart(product, qty = 1, selectedVariant = null) {
        if (!product) return
        const pId = product.id || product.product_id
        setCart((current) => {
          const list = Array.isArray(current) ? [...current] : []
          const key = selectedVariant ? `${pId}_${selectedVariant.size}` : String(pId)
          const index = list.findIndex((item) => String(item.cart_key || item.product_id) === String(key))
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
              cart_key: key,
              product_id: pId,
              variant_id: selectedVariant?.id || null,
              size: selectedVariant?.size || null,
              category_id: product.category_id,
              name: product.name,
              price: Number(product.price) + Number(selectedVariant?.extra_price_delta || 0),
              quantity: Number(qty) || 1,
              image: product.image,
              is_returnable: product.is_returnable ?? true,
            },
          ]
        })
      },
      removeFromCart(keyOrId) {
        setCart((current) =>
          (Array.isArray(current) ? current : []).filter(
            (item) => String(item.cart_key || item.product_id) !== String(keyOrId)
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
      toggleCompare(product) {
        if (!product) return
        const pId = product.id || product.product_id
        setComparisonList((current) => {
          const list = Array.isArray(current) ? [...current] : []
          const found = list.find((p) => String(p.id || p.product_id) === String(pId))
          if (found) {
            return list.filter((p) => String(p.id || p.product_id) !== String(pId))
          }
          if (list.length >= 4) {
            return [...list.slice(1), product]
          }
          return [...list, product]
        })
      },
      isComparing(productId) {
        return (Array.isArray(comparisonList) ? comparisonList : []).some(
          (p) => String(p.id || p.product_id) === String(productId)
        )
      },
      setPriceAlert(productId, targetPrice) {
        setPriceAlerts((prev) => ({
          ...prev,
          [String(productId)]: targetPrice,
        }))
        api.setPriceWatch({ productId, targetPrice }).catch(() => {})
      },
      updateCartItem(keyOrId, quantity) {
        setCart((current) => {
          const list = Array.isArray(current) ? [...current] : []
          const num = Number(quantity)
          if (num <= 0) {
            return list.filter((item) => String(item.cart_key || item.product_id) !== String(keyOrId))
          }
          return list.map((item) =>
            String(item.cart_key || item.product_id) === String(keyOrId) ? { ...item, quantity: num } : item
          )
        })
      },
      clearCart() {
        setCart([])
        setAppliedCoupon(null)
      },
    }),
    [shopper, merchant, cart, wishlist, appliedCoupon, comparisonList, priceAlerts, preferences, deviceReady, authReady],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
