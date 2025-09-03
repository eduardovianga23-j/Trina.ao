import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Header.css';
import fogo from '../../../img/icones/fogo.png';
import praia1 from '../../../img/icones/praia1.png';
import relogio from '../../../img/icones/relogio.png';
import { useEffect, useState } from 'react';
import { faAngleDown, faUserAlt, faLongArrowAltLeft, faUserLarge } from '@fortawesome/free-solid-svg-icons';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { HiMenuAlt3, HiMenuAlt1 } from "react-icons/hi";
import UserDataLogin from './UserDataLogin';
import calcaYour from '../../../img/TRINA/calcaYour.jpg';
import { useNavigate } from 'react-router-dom';


  const UserData = [
  { imgUser: calcaYour,
    nameUser: "Miquéias Eduardo",
  },
  ];

  const Header = ({ itemCount, setItemCount }) => {
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [color, setColor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /** Shop evento */
  const [isHovered, setIsHovered] = useState(false);

    /** Login evento */
  const [isHoverLogin, setIsHoverLogin] = useState(false);

  const changeColor = () => {
    if (window.scrollY >= 80) {
      setColor(true);
      setIsHeaderFixed(true);
    } else {
      setColor(false);
      setIsHeaderFixed(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", changeColor);
    return () => {
      window.removeEventListener("scroll", changeColor);
    };
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const navigateShop = useNavigate()
  const handleShop = ()=>{
    navigateShop("/Shop");
  };

  const navigateLogin = useNavigate()
  const handleLogin = ()=>{
    navigateLogin("/login");
  };
  
  return (
    <>
      {/* Inicio Header */}   
      <header
        className={`${color ? 'header header-bg' : 'header'} ${
          isHeaderFixed ? 'fixed-header' : ''} z-50`} >
        <div className="flex justify-between w-[80%] items-center">
          <a className="text-xl text-red-900" href="/"> Trina .</a>

           {/* Tablet views para Menu, Carrinho e favoritos */} 
          <div className="flex items-center gap-4 lg:hidden">
            <div className="relative">
              <a className="nav-icons" href="/shop"> <FontAwesomeIcon icon={faShoppingCart} /></a>
              <div className="nav-icons-bar absolute rounded-full shadow-md bg-red-900 min-h-5 min-w-5 bottom-5
               left-4 text-xs flex items-center text-white cursor-pointer font-semibold">{itemCount}</div>
            </div>
            <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faHeart} /></a>
            <button className="text-xl" onClick={toggleMenu}>
            <div className="lg:hidden block">
                {menuOpen ? (
                  <HiMenuAlt1
                    onClick={toggleMenu}
                    className="menu-c cursor-pointer transition-all"
                    size={30}
                  />
                ) : (
                  <HiMenuAlt3
                    onClick={toggleMenu}
                    className="menu-c cursor-pointer transition-all"
                    size={30}
                  />
                )}
              </div>
            </button>
          </div>

          <nav className="hidden lg:flex gap-6">
             {/* Aqui está o menu suspenso que aparece ao passar o mouse sobre "Shop" */}
            <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>

              <button className="nav-shop-text text-sm font-bold black">Shop<FontAwesomeIcon icon={faAngleDown} /></button>
              {/* div com os links */}
              {isHovered && (
                <div className="nav-shop-bar fixed left-52 top-100 flex w-8/12 h-5/6 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.9)] transition-opacity duration-300">
                  <div className="grid grid-cols-3 gap-6 h-full p-12">
                    <ul className='h-full'>
                      <li className="font-bold mb-2 text-sm">Malhas</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Casacos</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Coletes</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Blazzers</li>

                      <li className="font-bold mb-2 mt-8 text-sm">Calças</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Calças de Ganga</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Calçôes</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Bernudas</li>
                    
                      <li className="font-bold mb-2 mt-8 text-sm cursor-pointer">Calçados</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Ténis</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Chinelos</li>
                      <li onClick={handleShop} className="text-sm cursor-pointer">Saltos</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Sapatília</li>
                    </ul>

                    <ul className='h-full'>
                    <li onClick={handleShop} className="font-bold mb-2 text-sm">Camisas e Blusas</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>T-shirts</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Camisolas</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Blusas</li>

                    <li onClick={handleShop} className="font-bold mb-2 mt-8 text-sm">Saias</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Curtas</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Midi</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Comprida</li>

                    <li onClick={handleShop} className="font-bold mb-2 mt-8 flex -ml-20 text-sm ">PRAIA<img className='-mt-1 ml-1 w-5' src={praia1}/></li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Biquinis</li>
                    <li onClick={handleShop} className='text-sm cursor-pointer'>Fatos de banho</li>
                    <li onClick={handleShop} className="text-sm cursor-pointer">Tops e bodies</li>
                    </ul>

                    <ul className='h-full'>
                      <li onClick={handleShop} className="font-bold mb-2 text-sm">Vestidos</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Vestidos Curtos</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Vestidos Midi</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Vestidos Compridos</li>

                      <li onClick={handleShop} className="font-bold mb-2 mt-8 cursor-pointer text-sm">Conjuntos e Macacões</li>
                      <li onClick={handleShop} className="font-bold mb-2 mt-7 text-sm cursor-pointer">Roupa desportiva</li>

                      <li onClick={handleShop} className="font-bold mb-2 -ml-14 flex mt-8 text-sm">Acessórios <img className='- ml-1 w-5' src={relogio}/></li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Relógios</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Anéis</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Brincos</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Mascotes</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Fio de pescoço</li>
                      <li onClick={handleShop} className='text-sm cursor-pointer'>Óculos</li>
                    </ul>
                  </div>

                  <div className='bg-shop h-full w-4/12'></div>
                </div>
              )}
            </div>
                <a className="nav-links" href="/#"> Ofertas</a>
                <a className="nav-links" href="/">Sobre nós</a>
                <a className="nav-links" href="/">Contacte-nos</a>
                 <a className="nav-links" href="/">Contacte-nos</a>
                  <a className="nav-links" href="/">Contacte-nos</a>
                <a className="nav-links flex" href="/#">NOVIDADES 
                <img className='-mt-1 ml-1 w-4' src={fogo}/></a>
          </nav>



          <div className="hidden lg:flex items-center gap-5">
            
            <div className="relative">
              <a className="nav-icons" href="/shop"> <FontAwesomeIcon icon={faShoppingCart}  /></a>
              <div className="nav-icons-bar absolute rounded-full shadow-md bg-red-900 min-h-5 min-w-5 bottom-5
               left-3 text-xs flex items-center text-white cursor-pointer font-semibold">{itemCount}</div>
            </div>
            <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faHeart} /> </a>

            <div className="relative" onMouseEnter={() => setIsHoverLogin(true)} onMouseLeave={() => setIsHoverLogin(false)}>
            <a className="nav-icons flex max-h-32 gap-1" onClick={handleLogin}  href="/login">
              <FontAwesomeIcon icon={faUserAlt} />
              {isHoverLogin && (
                <div className='nav-icons-login w-36 h-20 fixed top-20 gap-6 right-5 rounded  bg-slate-50 shadow-[0_-4px_10px_rgba(0,0,0,0.6)] transition-opacity duration-300'>
                    <ul className="w-40 h-20 flex-col items-center p-3">
                        <li className="text-black text-sm font-bold cursor-pointer">Login<FontAwesomeIcon className='ml-2' icon={faUserLarge} /></li>
                        <li className="text-black text-sm font-bold cursor-pointer">Meus pedidos<FontAwesomeIcon className='ml-1' icon={faShoppingCart} /></li>
                        <li className="text-black text-sm font-bold cursor-pointer">Sair<FontAwesomeIcon className='ml-2' icon={faLongArrowAltLeft} /></li>
                    </ul>
                </div>
              )}
            </a>
            </div>
            
          </div>
        </div>
      </header>


            {menuOpen && (
          <div
            className={`${
              menuOpen ? "left-0" : "-left-[100%]"
            } fixed bottom-0 top-0 z-20 flex h-screen w-[75%] sm:w-[50%] flex-col justify-between 
            bg-zinc-200 dark:bg-gray-900 dark:text-white px-8 pb-6 pt-16
            transition-all duration-700 ease-in-out transform lg:hidden rounded-r-xl shadow-md`}>

            {/* Botão "X" para fechar o menu */}
            <span 
              className="absolute top-4 right-4 text-red-900  px-3 py-2 
              rounded-full cursor-pointer transition-all duration-300 text-2xl"
              onClick={toggleMenu}
            >
              ✖
            </span>

            <div className="card w-60 mr-10 sm:w-64 sm:mr-20">
              {UserData.map((item, index) => (
                <UserDataLogin key={index} {...item} />
              ))}
              <nav className="l-6 flex w-44 md:w-64 lg:w-56 flex-col space-y-4 items-center gap-2 mt-12">
                <a className="mr-24 text-xl md:mr-44 md:text-2xl font-semibold cursor-pointer text-red-900" href="/" onClick={() => setMenuOpen(false)}>Home</a>
                <a className="mr-28 ml-2 text-xl md:mr-48 md:text-2xl font-semibold cursor-pointer text-red-900" href="/#" onClick={() => setMenuOpen(false)}>Shop</a>
                <a className="mr-20 text-xl md:mr-44 md:text-2xl font-semibold cursor-pointer text-red-900" href="/#" onClick={() => setMenuOpen(false)}>Ofertas</a>
                <a className="mr-14 text-xl md:mr-32 md:text-2xl font-semibold cursor-pointer text-red-900" href="/#" onClick={() => setMenuOpen(false)}>Sobre nós</a>
                <a className="mr-4 text-xl sm:mr-20 sm:text-2xl font-semibold cursor-pointer text-red-900" href="/#" onClick={() => setMenuOpen(false)}>Contacte-nos</a>
                <a className="mr-8 text-xl sm:mr-20 sm:text-2xl font-semibold cursor-pointer text-red-900" href="/#" onClick={() => setMenuOpen(false)}>#novidades</a>
                <a className="mr-14 text-xl sm:mr-20 sm:text-2xl font-semibold cursor-pointer text-red-900" href="/#" onClick={() => setMenuOpen(false)}>Meu perfíl</a>
              </nav>
            </div>
          </div>
        )}
    </>
  );
};

export default Header;
