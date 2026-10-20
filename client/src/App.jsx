import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import './App.css'
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Suspense, lazy, useEffect } from 'react';
import Home from './pages/Home/Home'
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import RequireAuth from './pages/Account/RequireAuth';
import AdminRoute from './pages/Admin/AdminRoute';
import ScrollToTop from './assets/components/ScrollToTop';

// As páginas abrem à medida que são precisas (o site carrega mais depressa)
const Cart = lazy(() => import('./pages/Cart/Cart'));
const Shop = lazy(() => import('./pages/Shop/Shop'));
const Products = lazy(() => import('./pages/Products/Products'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Login/Register'));
const ForgotPassword = lazy(() => import('./pages/Login/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Login/ResetPassword'));
const Account = lazy(() => import('./pages/Account/Account'));
const Favorites = lazy(() => import('./pages/Account/Favorites'));
const AdminProducts = lazy(() => import('./pages/Admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/Admin/AdminProductForm'));
const AdminTeam = lazy(() => import('./pages/Admin/AdminTeam'));
const Privacidade = lazy(() => import('./pages/Legal/Privacidade'));
const Termos = lazy(() => import('./pages/Legal/Termos'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const Envios = lazy(() => import('./pages/Info/Envios'));
const Contactos = lazy(() => import('./pages/Info/Contactos'));
const OrderPage = lazy(() => import('./pages/Order/OrderPage'));
const AdminOrders = lazy(() => import('./pages/Admin/AdminOrders'));
const AdminReviews = lazy(() => import('./pages/Admin/AdminReviews'));
const AdminCoupons = lazy(() => import('./pages/Admin/AdminCoupons'));
const AdminStats = lazy(() => import('./pages/Admin/AdminStats'));

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <p className="text-5xl font-bold text-red-900">404</p>
    <h1 className="text-xl font-semibold mt-3">Página não encontrada</h1>
    <Link to="/" className="mt-6 py-3 px-8 bg-black text-white text-sm font-semibold rounded-sm">Voltar à loja</Link>
  </div>
);

// Enquanto a página abre (só a primeira vez: depois fica guardada no navegador)
const PageLoading = () => (
  <div className="min-h-[70vh] flex items-center justify-center" role="status" aria-label="A carregar">
    <span className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-red-800 animate-spin" />
  </div>
);

const App = () => {
  useEffect(() => {
    AOS.init({ offset: 10, duration: 400, easing: "ease-in-sine", delay: 8 });
    AOS.refresh();
  }, []);

  return (
    <AuthProvider>
    <FavoritesProvider>
    <CartProvider>
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/shop' element={<Shop />} />
        <Route path='/produto/:slug' element={<Products />} />
        {/* endereço antigo da página de produto */}
        <Route path='/products' element={<Navigate to="/shop" replace />} />
        <Route path='/cart' element={<Cart />} />
        {/* Pode comprar com ou sem conta */}
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/encomenda/:id' element={<RequireAuth allowGuestToken><OrderPage /></RequireAuth>} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/recuperar-senha' element={<ForgotPassword />} />
        <Route path='/nova-senha' element={<ResetPassword />} />
        <Route path='/favoritos' element={<Favorites />} />
        <Route path='/conta' element={<RequireAuth><Account /></RequireAuth>} />
        <Route path='/conta/:tab' element={<RequireAuth><Account /></RequireAuth>} />
        <Route path='/privacidade' element={<Privacidade />} />
        <Route path='/termos' element={<Termos />} />
        <Route path='/envios-devolucoes' element={<Envios />} />
        <Route path='/contactos' element={<Contactos />} />
        {/* Área de administração (só admins) */}
        <Route path='/admin' element={<AdminRoute perm="products"><AdminProducts /></AdminRoute>} />
        <Route path='/admin/novo' element={<AdminRoute perm="products"><AdminProductForm /></AdminRoute>} />
        <Route path='/admin/editar/:id' element={<AdminRoute perm="products"><AdminProductForm /></AdminRoute>} />
        <Route path='/admin/descontos' element={<AdminRoute perm="products"><AdminCoupons /></AdminRoute>} />
        <Route path='/admin/encomendas' element={<AdminRoute perm="orders"><AdminOrders /></AdminRoute>} />
        <Route path='/admin/estatisticas' element={<AdminRoute perm="reports"><AdminStats /></AdminRoute>} />
        <Route path='/admin/avaliacoes' element={<AdminRoute perm="reviews"><AdminReviews /></AdminRoute>} />
        <Route path='/admin/equipa' element={<AdminRoute ownerOnly><AdminTeam /></AdminRoute>} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </CartProvider>
    </FavoritesProvider>
    </AuthProvider>
  )
}

export default App
