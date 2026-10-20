import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/components/ui/Logo';

export const ROLE_LABEL = { admin: 'Administrador principal', manager: 'Gestor', customer: 'Cliente' };

// Moldura do painel: barra de topo, separadores e conteúdo
const AdminLayout = ({ title, actions, children }) => {
  const { user, logout, isOwner, can, adminHome } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Separadores do painel: cada pessoa só vê os que pode usar
  const sections = [
    can('products') && { to: '/admin', label: 'Produtos', on: pathname === '/admin' || pathname.startsWith('/admin/novo') || pathname.startsWith('/admin/editar') },
    can('products') && { to: '/admin/descontos', label: 'Descontos', on: pathname.startsWith('/admin/descontos') },
    can('orders') && { to: '/admin/encomendas', label: 'Encomendas', on: pathname.startsWith('/admin/encomendas') },
    can('reviews') && { to: '/admin/avaliacoes', label: 'Avaliações', on: pathname.startsWith('/admin/avaliacoes') },
    isOwner && { to: '/admin/equipa', label: 'Equipa', on: pathname.startsWith('/admin/equipa') },
  ].filter(Boolean);
  const tab = (isActive) =>
    `px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
      isActive ? 'border-red-800 text-black' : 'border-transparent text-zinc-500 hover:text-black'
    }`;

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-40 bg-black text-white">
        <div className="container-site h-14 flex items-center justify-between gap-3">
          <Link to={adminHome || '/admin'} aria-label="Painel da loja">
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
        <nav className="container-site flex gap-2 overflow-x-auto [scrollbar-width:none]" aria-label="Secções do painel">
          {sections.map((t) => (
            <Link key={t.to} to={t.to} className={tab(t.on)} aria-current={t.on ? 'page' : undefined}>{t.label}</Link>
          ))}
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
