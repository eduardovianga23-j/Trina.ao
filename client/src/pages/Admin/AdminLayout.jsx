import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Moldura simples do painel: barra de topo + conteúdo
const AdminLayout = ({ title, actions, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-40 bg-black text-white">
        <div className="container-site h-14 flex items-center justify-between gap-3">
          <Link to="/admin" className="text-lg">
            <span className="text-red-500">Trina .</span> <span className="text-xs text-zinc-400 ml-1">admin</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm">
            <Link to="/" className="px-2 py-2 hover:text-zinc-300">Ver loja</Link>
            <span className="hidden sm:inline text-zinc-500">|</span>
            <span className="hidden sm:inline text-zinc-300 truncate max-w-[160px]">{user?.name}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="px-2 py-2 hover:text-zinc-300">Sair</button>
          </nav>
        </div>
      </header>
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
