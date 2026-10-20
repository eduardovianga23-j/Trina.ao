import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Header.css';
import { useEffect, useState } from 'react';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FaUserCog, FaBoxOpen, FaHeart, FaTools, FaChevronRight } from 'react-icons/fa';
import { HiMenuAlt3, HiMenuAlt1 } from "react-icons/hi";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import CartIcon from './CartIcon';
import FavoritesIcon from './FavoritesIcon';
import AccountMenu from './AccountMenu';
import UserAvatar from '../ui/UserAvatar';
import { useFavorites } from '../../../context/FavoritesContext';
import Logo from '../ui/Logo';

const Header = () => {
  const [color, setColor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  const { user, isStaff, logout } = useAuth();
  const { count: favCount } = useFavorites();
  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };

  return (
    <>
      <header className={`${color ? 'header header-bg' : 'header'} z-50`}>
        <div className="flex justify-between w-[92%] lg:w-[80%] items-center">
          <Link to="/" aria-label="Trina — página inicial" className="logo-trina shrink-0 flex items-center">
            <Logo tagline className="h-10 sm:h-14" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
            <CartIcon />
            <FavoritesIcon />
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
                      {["Casacos","Coletes","Blazzers"].map(i=><li key={i} onClick={()=>navigate("/shop?category=roupas")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Calças</li>
                      {["Calças de Ganga","Calçôes","Bermudas"].map(i=><li key={i} onClick={()=>navigate("/shop?category=roupas")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Calçados</li>
                      {["Ténis","Chinelos","Saltos","Sapatília"].map(i=><li key={i} onClick={()=>navigate("/shop?category=sapatos")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                    </ul>
                    <ul>
                      <li className="font-bold mb-2 text-sm">Camisas e Blusas</li>
                      {["T-shirts","Camisolas","Blusas"].map(i=><li key={i} onClick={()=>navigate("/shop?category=roupas")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Saias</li>
                      {["Curtas","Midi","Comprida"].map(i=><li key={i} onClick={()=>navigate("/shop?category=roupas")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">PRAIA 🏖️</li>
                      {["Biquinis","Fatos de banho","Tops e bodies"].map(i=><li key={i} onClick={()=>navigate("/shop?category=praia")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                    </ul>
                    <ul>
                      <li className="font-bold mb-2 text-sm">Vestidos</li>
                      {["Vestidos Curtos","Vestidos Midi","Vestidos Compridos"].map(i=><li key={i} onClick={()=>navigate("/shop?category=roupas")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
                      <li className="font-bold mb-2 mt-8 text-sm">Conjuntos e Macacões</li>
                      <li className="font-bold mb-2 mt-4 text-sm">Roupa desportiva</li>
                      <li className="font-bold mb-2 mt-8 text-sm">Acessórios ⌚</li>
                      {["Relógios","Anéis","Brincos","Fio de pescoço","Óculos"].map(i=><li key={i} onClick={()=>navigate("/shop?category=acessórios")} className="text-sm cursor-pointer hover:text-red-800">{i}</li>)}
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

          <div className="hidden lg:flex items-center gap-4">
            <CartIcon />
            <FavoritesIcon />
            <AccountMenu />
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
            <Link to="/" onClick={() => setMenuOpen(false)} aria-label="Trina — página inicial" className="flex items-center text-[#AA0001]">
              <Logo tagline className="h-9" />
            </Link>
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
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-white border border-zinc-200 p-3">
                  <UserAvatar user={user} size={44} />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-600">Olá, <span className="font-bold text-black">{user.name}</span></p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <nav className="rounded-xl bg-white border border-zinc-200 divide-y divide-zinc-100 overflow-hidden" aria-label="A minha conta">
                  {[
                    ['/conta', 'Minha conta', FaUserCog],
                    ['/conta/encomendas', 'As minhas encomendas', FaBoxOpen],
                    ['/conta/favoritos', `Favoritos${favCount ? ` (${favCount})` : ''}`, FaHeart],
                    ...(isStaff ? [['/admin', 'Painel de administração', FaTools]] : []),
                  ].map(([to, label, Icon]) => (
                    <Link key={to} to={to} onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">
                      <Icon className="text-red-800" aria-hidden="true" /> {label}
                      <FaChevronRight className="ml-auto text-xs text-zinc-400" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
                <button onClick={handleLogout} tabIndex={menuOpen ? 0 : -1} className="w-full py-3 text-center text-sm font-bold text-red-900 border-2 border-red-800 rounded-md">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1} className="w-full py-3 text-center text-sm font-bold text-white bg-red-800 hover:bg-red-900 rounded-md">Iniciar sessão</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1} className="w-full py-3 text-center text-sm font-bold text-red-900 border-2 border-red-800 rounded-md">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
