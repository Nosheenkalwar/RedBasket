import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Listing from './pages/Listing';
import ProductPage from './pages/ProductPage';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import Checkout from './pages/Checkout';
import OrderPlaced from './pages/OrderPlaced';
import Legal from './pages/Legal';
import OrdersPage from './admin/OrdersPage';
import { AdminLayout, AdminLogin } from './admin/AdminShell';
import Dashboard from './admin/Dashboard';
import StaffPage from './admin/StaffPage';
import ActivityPage from './admin/ActivityPage';
import CategoriesPage from './admin/CategoriesPage';
import ProductsPage from './admin/ProductsPage';
import InventoryPage from './admin/InventoryPage';

// every new page opens at the top, e.g. after clicking a footer link (pages with a #section handle their own scroll)
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function Store() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <main><Outlet /></main>
      <Footer />
      <CartDrawer />
      <AuthModal />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Store />}>
        <Route path="/" element={<Home />} />
        <Route path="/c/:id" element={<Listing />} />
        <Route path="/search" element={<Listing />} />
        <Route path="/p/:id" element={<ProductPage />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/addresses" element={<Account />} />
        <Route path="/account/orders" element={<Account />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-placed/:number" element={<OrderPlaced />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="/shipping" element={<Legal />} />
        <Route path="*" element={<div className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="display text-4xl">Page not found</h1></div>} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
      </Route>
    </Routes>
  );
}
