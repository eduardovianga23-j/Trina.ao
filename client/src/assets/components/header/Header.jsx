import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Header.css';
import { useEffect, useState } from 'react';
import { faAngleDown, faUserAlt, faLongArrowAltLeft, faUserLarge } from '@fortawesome/free-solid-svg-icons';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { HiMenuAlt3, HiMenuAlt1 } from "react-icons/hi";
import { useNavigate } from 'react-router-dom';
import CartIcon from './CartIcon';

const Header = () => {
  const [color, setColor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverLogin, setIsHoverLogin] = useState(false);

  const changeColor = () => {
    setColor(window.scrollY >= 80);
  };

  useEffect(() => {
    changeColor();
    window.addEventListener("scroll", changeColor, { passive: true });
    return () => window.removeEventListener("scroll", changeColor);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Com o menu aberto: bloqueia o scroll da página e fecha com a tecla Esc
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [menuOpen]);
  const navigate = useNavigate();

  return (
    <>
      <header className={`${color ? 'header header-bg' : 'header'} z-50`}>
        <div className="flex justify-between w-[92%] lg:w-[80%] items-center">
          <a className="text-xl text-red-900" href="/"> Trina .</a>
          <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
            <CartIcon />
            <a className="nav-icons" href="/shop"><FontAwesomeIcon icon={faHeart} /></a>
            <button onClick={toggleMenu} aria-label="Abrir menu" aria-expanded={menuOpen} className="p-1 -mr-1">
              {menuOpen ? <HiMenuAlt1 className="menu-c cursor-pointer" size={30}/> : <HiMenuAlt3 className="menu-c cursor-pointer" size={30}/>}
            </button>
          </div>

          <nav className="hidden lg:flex gap-6">
            <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              <button className="nav-shop-text text-sm font-bold">Comprar<FontAwesomeIcon icon={faAngleDown} className="ml-1"/></button>
              {isHovered && (
                <div className={`nav-shop-bar fixed left-1/2 -translate-x-1/2 ${color ? "top-[70px]" : "top-[110px]"} flex w-[90%] xl:w-8/12 max-h-[calc(100vh-130px)] h-5/6 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.9)] z-50`}>
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
            <CartIcon />
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

      {/* Menu de telemóvel: fica sempre montado e desliza da esquerda ao abrir */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        {/* Fundo escuro: aparece suavemente; toca fora para fechar */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 bottom-0 left-0 w-[80%] max-w-xs flex flex-col bg-zinc-100 shadow-xl rounded-r-xl overflow-y-auto
                      transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-6 h-[70px] border-b border-zinc-300 shrink-0">
            <a className="text-xl text-red-900" href="/">Trina .</a>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              tabIndex={menuOpen ? 0 : -1}
              className="w-10 h-10 -mr-2 flex items-center justify-center text-red-900 text-2xl"
            >
              ✖
            </button>
          </div>
          <nav className="flex flex-col px-6 py-4">
            {[["Home","/"],["Shop","/shop"],["Ofertas","/#"],["Sobre nós","/#"],["Contate-nos","/#"],["#novidades","/#"]].map(([label,href], i)=>(
              <a
                key={label}
                href={href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={()=>setMenuOpen(false)}
                style={{ transitionDelay: menuOpen ? `${120 + i * 50}ms` : "0ms" }}
                className={`py-3 text-lg font-semibold text-red-900 border-b border-zinc-200 transition-all duration-300
                            ${menuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-auto px-6 pb-8 pt-4 flex flex-col gap-3">
            <a href="/login" tabIndex={menuOpen ? 0 : -1} className="w-full py-3 text-center text-sm font-bold text-white bg-red-800 hover:bg-red-900 rounded-md">Iniciar sessão</a>
            <a href="/register" tabIndex={menuOpen ? 0 : -1} className="w-full py-3 text-center text-sm font-bold text-red-900 border-2 border-red-800 rounded-md">Criar conta</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
