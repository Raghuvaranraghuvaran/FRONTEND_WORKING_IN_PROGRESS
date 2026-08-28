import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import StorefrontHeader from './components/StorefrontHeader'
import ShopperLayout from './components/ShopperLayout'
import AiShoppingAssistant from './components/AiShoppingAssistant'
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
import NotificationsPage from './pages/NotificationsPage'
import HelpPage from './pages/HelpPage'
import ReturnTrackingPage from './pages/ReturnTrackingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailurePage from './pages/PaymentFailurePage'
import MerchantLoginPage from './pages/MerchantLoginPage'
import MerchantRegisterPage from './pages/MerchantRegisterPage'
import MerchantLayout from './pages/merchant/MerchantLayout'
import MerchantDashboard from './pages/merchant/MerchantDashboard'
import MerchantProducts from './pages/merchant/MerchantProducts'
import MerchantOrders from './pages/merchant/MerchantOrders'
import MerchantCustomers from './pages/merchant/MerchantCustomers'
import MerchantFlaggedCases from './pages/merchant/MerchantFlaggedCases'
import MerchantFlaggedCaseDetail from './pages/merchant/MerchantFlaggedCaseDetail'
import MerchantAuditLog from './pages/merchant/MerchantAuditLog'
import MerchantAnalytics from './pages/merchant/MerchantAnalytics'
import MerchantSettings from './pages/merchant/MerchantSettings'
import MerchantOnboarding from './pages/merchant/MerchantOnboarding'
import MerchantFraudConfig from './pages/merchant/MerchantFraudConfig'
import MerchantDeliveryAgents from './pages/merchant/MerchantDeliveryAgents'
import MerchantCoupons from './pages/merchant/MerchantCoupons'

function StorefrontLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <StorefrontHeader />
      <Outlet />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        <span className="text-xs font-semibold text-slate-300">Loading ReturnGuard...</span>
      </div>
    </div>
  )
}

function RequireShopper({ children }) {
  const { shopper, authReady } = useApp()
  if (!authReady) return <LoadingFallback />
  return shopper ? children : <Navigate to="/login" replace />
}

function RequireMerchant({ children }) {
  const { merchant, authReady } = useApp()
  if (!authReady) return <LoadingFallback />
  return merchant ? children : <Navigate to="/merchant/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Shopper pages - with sidebar layout */}
      <Route element={<ShopperLayout />}>
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Authenticated / protected shopper pages */}
        <Route path="/dashboard" element={<RequireShopper><DashboardPage /></RequireShopper>} />
        <Route path="/orders" element={<RequireShopper><OrdersPage /></RequireShopper>} />
        <Route path="/returns" element={<RequireShopper><OrdersPage /></RequireShopper>} />
        <Route path="/track-return" element={<RequireShopper><OrdersPage /></RequireShopper>} />
        <Route path="/returns/:returnId/track" element={<RequireShopper><ReturnTrackingPage /></RequireShopper>} />
        <Route path="/orders/:orderId/return" element={<RequireShopper><ReturnRequestPage /></RequireShopper>} />
        <Route path="/notifications" element={<RequireShopper><NotificationsPage /></RequireShopper>} />
        <Route path="/profile" element={<RequireShopper><ProfilePage /></RequireShopper>} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Payment pages - no auth required to allow redirects from payment gateway */}
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/failure" element={<PaymentFailurePage />} />
      
      <Route path="/merchant/login" element={<MerchantLoginPage />} />
      <Route path="/merchant/register" element={<MerchantRegisterPage />} />
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
        <Route path="flagged-cases/:caseId" element={<MerchantFlaggedCaseDetail />} />
        <Route path="audit-log" element={<MerchantAuditLog />} />
        <Route path="analytics" element={<MerchantAnalytics />} />
        <Route path="onboarding" element={<MerchantOnboarding />} />
        <Route path="fraud-config" element={<MerchantFraudConfig />} />
        <Route path="delivery-agents" element={<MerchantDeliveryAgents />} />
        <Route path="coupons" element={<MerchantCoupons />} />
        <Route path="settings" element={<MerchantSettings />} />
      </Route>

      {/* Admin aliases */}
      <Route path="/admin" element={<Navigate to="/merchant" replace />} />
      <Route path="/admin/*" element={<Navigate to="/merchant" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <AiShoppingAssistant />
      </AppProvider>
    </BrowserRouter>
  )
}
