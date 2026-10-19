import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Só deixa entrar administradores. Sem sessão, vai para o login e volta aqui depois.
const AdminRoute = ({ children }) => {
  const { user, isAdmin, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">A verificar a sessão...</div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-xl font-bold">Acesso reservado a administradores</h1>
        <p className="text-sm text-zinc-500 mt-2">A tua conta não tem permissão para abrir esta página.</p>
        <Link to="/" className="mt-6 py-3 px-8 bg-black text-white text-sm font-semibold rounded-sm">Voltar à loja</Link>
      </div>
    );
  }
  return children;
};

export default AdminRoute;
