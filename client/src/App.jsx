import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AOS from 'aos';
import 'aos/dist/aos.css';
import Home from './Pages/Home/Home'
import { useEffect } from 'react';
import Cart from './Pages/Cart/Cart';
import Shop from './Pages/Shop/Shop';
import Products from "./Pages/Products/Products";
import Login from './Pages/Login/Login';
import Register from './Pages/Login/Register';

const App = () => {
  useEffect(() => {
    AOS.init({ offset: 10, duration: 400, easing: "ease-in-sine", delay: 8 });
    AOS.refresh();
  }, []);

  return (
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
  )
}

export default App
