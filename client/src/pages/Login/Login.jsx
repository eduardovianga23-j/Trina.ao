import { useState } from 'react';
import { faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../services/api';
import AuthField from '../../assets/components/ui/AuthField';
import GoogleButton from '../../assets/components/ui/GoogleButton';
import Logo from '../../assets/components/ui/Logo';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Entrar ou criar conta com o Google
  const handleGoogle = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      navigate(location.state?.from || (['admin', 'manager'].includes(user.role) ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(apiError(err, 'Não foi possível entrar com o Google.'));
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      // Volta à página de onde veio (ex.: /admin); senão, admin vai para o painel
      navigate(location.state?.from || (['admin', 'manager'].includes(user.role) ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(apiError(err, 'Não foi possível entrar.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg w-full min-h-screen items-center justify-center flex px-4 py-10' style={{backgroundColor:'#686464'}}>
      <form onSubmit={submit} className='bg-white w-full max-w-sm rounded-md p-5 sm:p-8' noValidate>
        <Link to="/" aria-label="Trina — página inicial" className="flex justify-center text-[#AA0001] mb-2">
          <Logo tagline className="h-24" />
        </Link>
        <h1 className='flex items-center justify-center p-3 text-lg font-extrabold'>Conecta-se</h1>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-[80px] h-[8px] bg-red-700 rounded-lg'></div>
        </div>
        <div className="flex flex-col gap-5 items-stretch">
          {error && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          <AuthField icon={faEnvelope} label="Email" type="email" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <AuthField icon={faLock} label="Senha" type="password" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button disabled={loading || !form.email || !form.password}
            className='w-full h-[50px] bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm rounded-md'>
            {loading ? 'A entrar...' : 'Iniciar sessão'}
          </button>
          <GoogleButton onCredential={handleGoogle} text="signin_with" disabled={loading} />
          <p className='text-sm text-center'>
            Não tens uma conta?<Link to="/register" state={location.state} className='font-bold ml-1 hover:underline'>Cadastra-te</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
export default Login;
