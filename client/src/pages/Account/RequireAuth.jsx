import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Páginas que precisam de sessão: sem sessão vai para o login e volta aqui depois
// allowGuestToken: a página também abre sem sessão com o link secreto (?t=...) das compras sem conta
const RequireAuth = ({ children, allowGuestToken = false }) => {
  const { user, checking } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  if (allowGuestToken && params.get('t')) return children;
  if (checking) return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">A verificar a sessão...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

export default RequireAuth;
