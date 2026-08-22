import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../mock/api'
import { getDeviceContext } from '../lib/device'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [shopper, setShopper] = useState(null)
  const [merchant, setMerchant] = useState(null)
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('returnguard_cart') || '[]')
    } catch {
      return []
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
    const existing = api.getSession()
    setShopper(existing.shopper)
    setMerchant(existing.merchant)
  }, [])

  const value = useMemo(
    () => ({
      shopper,
      setShopper,
      merchant,
      setMerchant,
      cart,
      setCart,
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
            name: product.name, 
            price: Number(product.price), 
            quantity: 1,
            image: product.image // Add product image
          }]
        })
        return isNew
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
      },
    }),
    [shopper, merchant, cart, deviceReady],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
