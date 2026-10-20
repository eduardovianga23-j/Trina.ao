import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/*
  Protege as páginas do painel.
  - Por defeito: entram o administrador principal e os gestores.
  - ownerOnly: só o administrador principal (ex.: página Equipa).
  - perm: precisa dessa permissão ('products', 'orders' ou 'reviews'). Sem ela, vai para a primeira secção a que tem acesso.
  Sem sessão, vai para o login e volta aqui depois.
*/
const Blocked = ({ title, text, to = '/', label = 'Voltar à loja' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-xl font-bold">{title}</h1>
    <p className="text-sm text-zinc-500 mt-2 max-w-sm">{text}</p>
    <Link to={to} className="mt-6 py-3 px-8 bg-black text-white text-sm font-semibold rounded-sm">{label}</Link>
  </div>
);

const AdminRoute = ({ children, ownerOnly = false, perm }) => {
  const { user, isStaff, isOwner, checking, can, adminHome } = useAuth();
  const location = useLocation();

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">A verificar a sessão...</div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isStaff) {
    return <Blocked title="Acesso reservado à equipa da loja" text="A tua conta não tem permissão para abrir esta página." />;
  }
  if (ownerOnly && !isOwner) {
    return <Blocked title="Só o administrador principal" text="Esta página só está disponível para o administrador principal da loja." to={adminHome || '/'} label="Voltar ao painel" />;
  }
  if (perm && !can(perm)) {
    if (adminHome && adminHome !== location.pathname) return <Navigate to={adminHome} replace />;
    return <Blocked title="Sem permissão" text="A tua conta de gestor não tem acesso a esta secção. Fala com o administrador principal." />;
  }
  return children;
};

export default AdminRoute;
