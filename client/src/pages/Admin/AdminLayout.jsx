import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/components/ui/Logo';

export const ROLE_LABEL = { admin: 'Administrador principal', manager: 'Gestor', customer: 'Cliente' };

// Moldura do painel: barra de topo, separadores e conteúdo
const AdminLayout = ({ title, actions, children }) => {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onTeam = pathname.startsWith('/admin/equipa');
  const onOrders = pathname.startsWith('/admin/encomendas');
  const onProducts = !onTeam && !onOrders;
  const tab = (isActive) =>
    `px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
      isActive ? 'border-red-800 text-black' : 'border-transparent text-zinc-500 hover:text-black'
    }`;

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-40 bg-black text-white">
        <div className="container-site h-14 flex items-center justify-between gap-3">
          <Link to="/admin" aria-label="Painel da loja">
            <span className="flex items-end gap-2"><Logo className="h-7 text-white" /> <span className="text-xs text-zinc-400 pb-0.5">admin</span></span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm">
            <Link to="/" className="px-2 py-2 hover:text-zinc-300">Ver loja</Link>
            <span className="hidden sm:inline text-zinc-500">|</span>
            <span className="hidden sm:flex flex-col items-end leading-tight max-w-[180px]">
              <span className="text-zinc-200 truncate max-w-full">{user?.name}</span>
              <span className="text-[10px] text-zinc-400">{ROLE_LABEL[user?.role]}</span>
            </span>
            <button onClick={() => { logout(); navigate('/'); }} className="px-2 py-2 hover:text-zinc-300">Sair</button>
          </nav>
        </div>
      </header>

      <div className="bg-white border-b border-zinc-200">
        <nav className="container-site flex gap-2" aria-label="Secções do painel">
          <Link to="/admin" className={tab(onProducts)} aria-current={onProducts ? "page" : undefined}>Produtos</Link>
          {/* Encomendas e equipa só aparecem para o administrador principal */}
          {isOwner && <Link to="/admin/encomendas" className={tab(onOrders)} aria-current={onOrders ? "page" : undefined}>Encomendas</Link>}
          {isOwner && <Link to="/admin/equipa" className={tab(onTeam)} aria-current={onTeam ? "page" : undefined}>Equipa</Link>}
        </nav>
      </div>

      <main className="container-site py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
