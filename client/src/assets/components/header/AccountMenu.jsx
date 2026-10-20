import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaBoxOpen, FaHeart, FaUserCog, FaSignOutAlt, FaTools } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { useFavorites } from '../../../context/FavoritesContext';
import UserAvatar from '../ui/UserAvatar';
import { roleTitle } from '../../../utils/permissions';

/*
  Conta no cabeçalho (computador).
  - Sem sessão: botão "Entrar".
  - Com sessão: foto do Google (ou iniciais). Ao clicar abre o menu: Minha conta, Encomendas, Favoritos, Sair.
*/
const AccountMenu = () => {
  const { user, isStaff, logout } = useAuth();
  const { count } = useFavorites();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Fecha ao mudar de página, ao clicar fora ou com Esc
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    // 'capture' para funcionar mesmo em zonas que bloqueiam o clique (ex.: o slider da página inicial)
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className="account-login inline-flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-full border text-sm font-semibold transition-colors">
        <FaUserCircle className="text-xl" aria-hidden="true" />
        Entrar
      </Link>
    );
  }

  const item = 'flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-100 text-sm text-zinc-800';
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Conta de ${user.name}`}
        className={`account-avatar rounded-full p-0.5 border-2 transition-colors ${open ? 'border-red-700' : 'border-transparent hover:border-zinc-300'}`}
      >
        <UserAvatar user={user} size={34} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-3 w-64 rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-zinc-100 p-2 z-[70] text-left">
          <div className="flex items-center gap-3 px-3 py-3 border-b border-zinc-100 mb-1">
            <UserAvatar user={user} size={42} />
            <div className="min-w-0">
              <p className="font-bold text-sm text-black truncate">{user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              {isStaff && <p className="text-[11px] font-semibold text-red-800 truncate mt-0.5">{roleTitle(user)}</p>}
            </div>
          </div>
          <Link role="menuitem" to="/conta" className={item}><FaUserCog className="text-zinc-500" /> Minha conta</Link>
          <Link role="menuitem" to="/conta/encomendas" className={item}><FaBoxOpen className="text-zinc-500" /> As minhas encomendas</Link>
          <Link role="menuitem" to="/conta/favoritos" className={item}>
            <FaHeart className="text-zinc-500" /> Favoritos
            {count > 0 && <span className="ml-auto text-xs font-bold text-red-800">{count}</span>}
          </Link>
          {isStaff && <Link role="menuitem" to="/admin" className={item}><FaTools className="text-zinc-500" /> Painel de administração</Link>}
          <div className="border-t border-zinc-100 mt-1 pt-1">
            <button role="menuitem" onClick={() => { logout(); navigate('/'); }} className={`${item} w-full text-red-800`}>
              <FaSignOutAlt /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
