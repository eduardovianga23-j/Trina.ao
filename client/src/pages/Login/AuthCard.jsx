import { Link } from 'react-router-dom';
import Logo from '../../assets/components/ui/Logo';

// Moldura das páginas de conta (recuperar senha, senha nova): igual ao login
const AuthCard = ({ title, children }) => (
  <div className="bg w-full min-h-screen items-center justify-center flex px-4 py-10" style={{ backgroundColor: '#686464' }}>
    <div className="bg-white w-full max-w-sm rounded-md p-5 sm:p-8">
      <Link to="/" aria-label="Trina — página inicial" className="flex justify-center text-[#AA0001] mb-2">
        <Logo tagline className="h-24" />
      </Link>
      <h1 className="flex items-center justify-center p-3 text-lg font-extrabold text-center">{title}</h1>
      <div className="flex items-center justify-center mb-6">
        <div className="w-[80px] h-[8px] bg-red-700 rounded-lg" />
      </div>
      {children}
    </div>
  </div>
);

export default AuthCard;
