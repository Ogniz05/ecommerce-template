import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import CartSidebar from './components/Cart/CartSidebar';
import PageLoader from './components/UI/PageLoader';
import SmoothScroll from './components/UI/SmoothScroll';
import ScrollProgress from './components/UI/ScrollProgress';
import PageTransition from './components/UI/PageTransition';
import Preloader from './components/UI/Preloader';
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

// Pages with header/footer
const MainLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <CartSidebar />
  </div>
);

// Admin layout without main header/footer
const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">{children}</div>
);

export default function App() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <ScrollProgress />
      <PageTransition />
      {/* Film grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#D8125B', secondary: '#fff' },
            style: { border: '1px solid rgba(216,18,91,0.2)' }
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            style: { border: '1px solid rgba(239,68,68,0.2)' }
          }
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
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
        </AnimatePresence>
      </Suspense>
    </>
  );
}
