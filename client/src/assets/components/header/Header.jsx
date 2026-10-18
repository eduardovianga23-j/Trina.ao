import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Header.css';
import { useEffect, useState } from 'react';
import { faAngleDown, faUserAlt, faLongArrowAltLeft, faUserLarge } from '@fortawesome/free-solid-svg-icons';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { HiMenuAlt3, HiMenuAlt1 } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';

const Header = ({ itemCount = 0 }) => {
  const [color, setColor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverLogin, setIsHoverLogin] = useState(false);

  const changeColor = () => {
    if (window.scrollY >= 80) setColor(true);
    else setColor(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", changeColor);
    return () => window.removeEventListener("scroll", changeColor);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const navigate = useNavigate();

  return (
    <>
      <header className={`${color ? 'header header-bg' : 'header'} z-50`}>
        <div className="flex justify-between w-[80%] items-center">
          <a className="text-xl text-red-900" href="/"> Trina .</a>
          <div className="flex items-center gap-4 lg:hidden">
            <div className="relative">
              <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faShoppingCart} /></a>
              <div className="nav-icons-bar absolute rounded-full shadow-md min-h-5 min-w-5 bottom-5 left-4 text-xs flex items-center text-white cursor-pointer font-semibold">{itemCount}</div>
            </div>
            <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faHeart} /></a>
            <button onClick={toggleMenu}>
              {menuOpen ? <HiMenuAlt1 className="menu-c cursor-pointer" size={30}/> : <HiMenuAlt3 className="menu-c cursor-pointer" size={30}/>}
            </button>
          </div>

          <nav className="hidden lg:flex gap-6">
            <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              <button className="nav-shop-text text-sm font-bold">Comprar<FontAwesomeIcon icon={faAngleDown} className="ml-1"/></button>
              {isHovered && (
                <div className="nav-shop-bar fixed left-52 top-[100px] flex w-8/12 h-5/6 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.9)] z-50">
                  <div className="grid grid-cols-3 gap-6 h-full p-12">
                    <ul>
                      <li className="font-bold mb-2 text-sm">Malhas</li>
                      {["Casacos","Coletes","Blazzers"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Calças</li>
                      {["Calças de Ganga","Calçôes","Bermudas"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Calçados</li>
                      {["Ténis","Chinelos","Saltos","Sapatília"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                    </ul>
                    <ul>
                      <li className="font-bold mb-2 text-sm">Camisas e Blusas</li>
                      {["T-shirts","Camisolas","Blusas"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Saias</li>
                      {["Curtas","Midi","Comprida"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">PRAIA 🏖️</li>
                      {["Biquinis","Fatos de banho","Tops e bodies"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                    </ul>
                    <ul>
                      <li className="font-bold mb-2 text-sm">Vestidos</li>
                      {["Vestidos Curtos","Vestidos Midi","Vestidos Compridos"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Conjuntos e Macacões</li>
                      <li className="font-bold mb-2 mt-4 text-sm">Roupa desportiva</li>
                      <li className="font-bold mb-2 mt-8 text-sm">Acessórios ⌚</li>
                      {["Relógios","Anéis","Brincos","Fio de pescoço","Óculos"].map(i=><li key={i} onClick={()=>navigate("/shop")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                    </ul>
                  </div>
                  <div className='bg-shop h-full w-4/12'></div>
                </div>
              )}
            </div>
            <a className="nav-links" href="/#">Ofertas</a>
            <a className="nav-links" href="/">Sobre nós</a>
            <a className="nav-links" href="/">Contate-nos</a>
            <a className="nav-links" href="/#">NOVIDADES 🔥</a>
          </nav>

          <div className="hidden lg:flex items-center gap-5">
            <div className="relative">
              <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faShoppingCart}/></a>
              <div className="nav-icons-bar absolute rounded-full min-h-5 min-w-5 bottom-5 left-3 text-xs flex items-center text-white font-semibold">{itemCount}</div>
            </div>
            <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faHeart}/></a>
            <div className="relative" onMouseEnter={()=>setIsHoverLogin(true)} onMouseLeave={()=>setIsHoverLogin(false)}>
              <a className="nav-icons" onClick={()=>navigate("/login")} href="/login"><FontAwesomeIcon icon={faUserAlt}/>
                {isHoverLogin && (
                  <div className='nav-icons-login w-36 h-20 fixed top-20 right-5 rounded bg-slate-50 shadow-[0_-4px_10px_rgba(0,0,0,0.6)] z-50'>
                    <ul className="p-3 flex flex-col gap-1">
                      <li className="text-black text-sm font-bold cursor-pointer">Login <FontAwesomeIcon icon={faUserLarge}/></li>
                      <li className="text-black text-sm font-bold cursor-pointer">Meus pedidos <FontAwesomeIcon icon={faShoppingCart}/></li>
                      <li className="text-black text-sm font-bold cursor-pointer">Sair <FontAwesomeIcon icon={faLongArrowAltLeft}/></li>
                    </ul>
                  </div>
                )}
              </a>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed bottom-0 top-0 left-0 z-20 flex h-screen w-[75%] flex-col bg-zinc-200 px-8 pb-6 pt-16 transition-all duration-700 lg:hidden rounded-r-xl shadow-md">
          <span className="absolute top-4 right-4 text-red-900 px-3 py-2 cursor-pointer text-2xl" onClick={toggleMenu}>✖</span>
          <nav className="flex flex-col space-y-4 mt-12">
            {[["Home","/"],["Shop","/shop"],["Ofertas","/#"],["Sobre nós","/#"],["Contate-nos","/#"],["#novidades","/#"],["Login","/login"]].map(([label,href])=>(
              <a key={label} className="text-xl font-semibold text-red-900" href={href} onClick={()=>setMenuOpen(false)}>{label}</a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
