import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import CartSidebar from './components/Cart/CartSidebar';
import PageLoader from './components/UI/PageLoader';
import ScrollToTop from './components/UI/ScrollToTop';
import ErrorBoundary from './components/UI/ErrorBoundary';
import OfflineBanner from './components/UI/OfflineBanner';
import CookieConsent from './components/UI/CookieConsent';
import VerificationBanner from './components/UI/VerificationBanner';
import { useAuthStore } from './store/useStore';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'));
const SocialCallback = lazy(() => import('./pages/Auth/SocialCallback'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const About = lazy(() => import('./pages/Info/About'));
const Contact = lazy(() => import('./pages/Info/Contact'));
const FAQ = lazy(() => import('./pages/Info/FAQ'));
const Privacy = lazy(() => import('./pages/Info/Privacy'));
const Terms = lazy(() => import('./pages/Info/Terms'));
const Shipping = lazy(() => import('./pages/Info/Shipping'));
const GiftCards = lazy(() => import('./pages/GiftCards'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!['admin', 'moderator'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/profile" replace />;
};

// Pages with header/footer. The header is fixed and 64px tall, so the main
// column offsets by exactly that rather than each page guessing.
const MainLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    {/* Sits under the fixed header, above the page, so it is the first thing
        read after the nav rather than buried inside a settings screen. */}
    <div className="pt-16">
      <VerificationBanner />
    </div>
    <main className="flex-1">{children}</main>
    <Footer />
    <CartSidebar />
  </div>
);

// Admin layout without main header/footer
const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">{children}</div>
);

/**
 * Page-level crash containment.
 *
 * Keyed by pathname so navigating away clears a caught error: without the key
 * the boundary stays in its failed state and every subsequent route renders
 * the error screen, turning one broken page into a broken app.
 */
const RouteErrorBoundary = ({ children }) => {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname} name={location.pathname}>{children}</ErrorBoundary>;
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      <OfflineBanner />
      <CookieConsent />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'Instrument Sans', system-ui, sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: '#17171B',
            border: '1px solid #E5E5E9',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 14px rgba(23,23,27,0.08)',
            maxWidth: '420px',
          },
          success: { iconTheme: { primary: '#17171B', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />

      <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            } />

            {/* Public routes with layout */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/catalogo" element={<MainLayout><Catalog /></MainLayout>} />
            <Route path="/catalog" element={<MainLayout><Catalog /></MainLayout>} />
            <Route path="/prodotti/:slug" element={<MainLayout><ProductDetail /></MainLayout>} />
            <Route path="/products/:slug" element={<MainLayout><ProductDetail /></MainLayout>} />
            <Route path="/carrello" element={<MainLayout><Cart /></MainLayout>} />
            <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
            <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
            <Route path="/ordine-confermato/:id" element={<ProtectedRoute><MainLayout><OrderSuccess /></MainLayout></ProtectedRoute>} />
            <Route path="/order-success/:id" element={<ProtectedRoute><MainLayout><OrderSuccess /></MainLayout></ProtectedRoute>} />

            {/* Order detail (must precede /profilo/* so it isn't swallowed) */}
            <Route path="/profilo/ordini/:id" element={<ProtectedRoute><MainLayout><OrderDetail /></MainLayout></ProtectedRoute>} />
            <Route path="/profile/orders/:id" element={<ProtectedRoute><MainLayout><OrderDetail /></MainLayout></ProtectedRoute>} />

            {/* Profile */}
            <Route path="/profilo/*" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
            <Route path="/profile/*" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />

            {/* Auth */}
            <Route path="/auth/login" element={<PublicOnly><MainLayout><Login /></MainLayout></PublicOnly>} />
            <Route path="/auth/register" element={<PublicOnly><MainLayout><Register /></MainLayout></PublicOnly>} />
            <Route path="/auth/forgot-password" element={<PublicOnly><MainLayout><ForgotPassword /></MainLayout></PublicOnly>} />
            <Route path="/auth/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
            <Route path="/auth/verify-email" element={<MainLayout><VerifyEmail /></MainLayout>} />
            <Route path="/auth/social-callback" element={<SocialCallback />} />

            {/* Info Pages */}
            <Route path="/chi-siamo" element={<MainLayout><About /></MainLayout>} />
            <Route path="/about" element={<MainLayout><About /></MainLayout>} />
            <Route path="/contatti" element={<MainLayout><Contact /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
            <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
            <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
            <Route path="/termini" element={<MainLayout><Terms /></MainLayout>} />
            <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
            <Route path="/spedizioni" element={<MainLayout><Shipping /></MainLayout>} />
            <Route path="/shipping" element={<MainLayout><Shipping /></MainLayout>} />
            <Route path="/gift-card" element={<MainLayout><GiftCards /></MainLayout>} />
            <Route path="/buoni-regalo" element={<MainLayout><GiftCards /></MainLayout>} />

            {/* 404 */}
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
      </Suspense>
      </RouteErrorBoundary>
    </>
  );
}
