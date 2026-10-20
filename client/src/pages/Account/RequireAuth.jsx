import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Páginas que precisam de sessão: sem sessão vai para o login e volta aqui depois
const RequireAuth = ({ children }) => {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">A verificar a sessão...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

export default RequireAuth;
