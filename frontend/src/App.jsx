import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import StorefrontHeader from './components/StorefrontHeader'
import ShopperLayout from './components/ShopperLayout'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import ReturnRequestPage from './pages/ReturnRequestPage'
import ProfilePage from './pages/ProfilePage'
import WishlistPage from './pages/WishlistPage'
import HelpPage from './pages/HelpPage'
import MerchantLoginPage from './pages/MerchantLoginPage'
import MerchantLayout from './pages/merchant/MerchantLayout'
import MerchantDashboard from './pages/merchant/MerchantDashboard'
import MerchantProducts from './pages/merchant/MerchantProducts'
import MerchantOrders from './pages/merchant/MerchantOrders'
import MerchantCustomers from './pages/merchant/MerchantCustomers'
import MerchantFlaggedCases from './pages/merchant/MerchantFlaggedCases'
import MerchantAuditLog from './pages/merchant/MerchantAuditLog'
import MerchantAnalytics from './pages/merchant/MerchantAnalytics'
import MerchantSettings from './pages/merchant/MerchantSettings'
import MerchantOnboarding from './pages/merchant/MerchantOnboarding'
import MerchantFraudConfig from './pages/merchant/MerchantFraudConfig'
import MerchantDeliveryAgents from './pages/merchant/MerchantDeliveryAgents'

function StorefrontLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <StorefrontHeader />
      <Outlet />
    </div>
  )
}

function RequireShopper({ children }) {
  const { shopper } = useApp()
  return shopper ? children : <Navigate to="/login" replace />
}

function RequireMerchant({ children }) {
  const { merchant } = useApp()
  return merchant ? children : <Navigate to="/merchant/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Shopper pages - with sidebar layout */}
      <Route element={<RequireShopper><ShopperLayout /></RequireShopper>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId/return" element={<ReturnRequestPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/merchant/login" element={<MerchantLoginPage />} />
      <Route
        path="/merchant"
        element={
          <RequireMerchant>
            <MerchantLayout />
          </RequireMerchant>
        }
      >
        <Route index element={<MerchantDashboard />} />
        <Route path="products" element={<MerchantProducts />} />
        <Route path="orders" element={<MerchantOrders />} />
        <Route path="customers" element={<MerchantCustomers />} />
        <Route path="flagged-cases" element={<MerchantFlaggedCases />} />
        <Route path="audit-log" element={<MerchantAuditLog />} />
        <Route path="analytics" element={<MerchantAnalytics />} />
        <Route path="onboarding" element={<MerchantOnboarding />} />
        <Route path="fraud-config" element={<MerchantFraudConfig />} />
        <Route path="delivery-agents" element={<MerchantDeliveryAgents />} />
        <Route path="settings" element={<MerchantSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
