import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import './App.css'
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart';
import Shop from './pages/Shop/Shop';
import Products from "./pages/Products/Products";
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Account from './pages/Account/Account';
import Favorites from './pages/Account/Favorites';
import RequireAuth from './pages/Account/RequireAuth';
import AdminRoute from './pages/Admin/AdminRoute';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminProductForm from './pages/Admin/AdminProductForm';
import AdminTeam from './pages/Admin/AdminTeam';
import Privacidade from './pages/Legal/Privacidade';
import Termos from './pages/Legal/Termos';
import Checkout from './pages/Checkout/Checkout';
import Envios from './pages/Info/Envios';
import Contactos from './pages/Info/Contactos';
import OrderPage from './pages/Order/OrderPage';
import AdminOrders from './pages/Admin/AdminOrders';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <p className="text-5xl font-bold text-red-900">404</p>
    <h1 className="text-xl font-semibold mt-3">Página não encontrada</h1>
    <Link to="/" className="mt-6 py-3 px-8 bg-black text-white text-sm font-semibold rounded-sm">Voltar à loja</Link>
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
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/shop' element={<Shop />} />
        <Route path='/produto/:slug' element={<Products />} />
        {/* endereço antigo da página de produto */}
        <Route path='/products' element={<Navigate to="/shop" replace />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout' element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path='/encomenda/:id' element={<RequireAuth><OrderPage /></RequireAuth>} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/favoritos' element={<Favorites />} />
        <Route path='/conta' element={<RequireAuth><Account /></RequireAuth>} />
        <Route path='/conta/:tab' element={<RequireAuth><Account /></RequireAuth>} />
        <Route path='/privacidade' element={<Privacidade />} />
        <Route path='/termos' element={<Termos />} />
        <Route path='/envios-devolucoes' element={<Envios />} />
        <Route path='/contactos' element={<Contactos />} />
        {/* Área de administração (só admins) */}
        <Route path='/admin' element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path='/admin/novo' element={<AdminRoute><AdminProductForm /></AdminRoute>} />
        <Route path='/admin/editar/:id' element={<AdminRoute><AdminProductForm /></AdminRoute>} />
        <Route path='/admin/encomendas' element={<AdminRoute ownerOnly><AdminOrders /></AdminRoute>} />
        <Route path='/admin/equipa' element={<AdminRoute ownerOnly><AdminTeam /></AdminRoute>} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </CartProvider>
    </FavoritesProvider>
    </AuthProvider>
  )
}

export default App
