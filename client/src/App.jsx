import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AOS from 'aos';
import 'aos/dist/aos.css';
import Home from './pages/Home/Home'
import { useEffect } from 'react';
import Cart from './pages/Cart/Cart';
import Shop from './pages/Shop/Shop';
import Products from "./pages/Products/Products";
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import { CartProvider } from './context/CartContext';

const App = () => {
  useEffect(() => {
    AOS.init({ offset: 10, duration: 400, easing: "ease-in-sine", delay: 8 });
    AOS.refresh();
  }, []);

  return (
    <CartProvider>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/shop' element={<Shop />} />
        <Route path='/products' element={<Products />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Routes>
    </BrowserRouter>
    </CartProvider>
  )
}

export default App
