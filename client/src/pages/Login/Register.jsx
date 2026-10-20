import { useState } from 'react';
import { FaLock, FaEnvelope, FaUser } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiError } from '../../services/api';
import AuthField from '../../assets/components/ui/AuthField';
import GoogleButton from '../../assets/components/ui/GoogleButton';
import Logo from '../../assets/components/ui/Logo';
import PasswordStrength, { MIN_PASSWORD } from '../../assets/components/ui/PasswordStrength';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    if (form.password.length < MIN_PASSWORD) return setError(`A senha tem de ter pelo menos ${MIN_PASSWORD} caracteres.`);
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Não foi possível criar a conta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full min-h-screen items-center justify-center flex px-4 py-10' style={{backgroundColor:'#686464'}}>
      <form onSubmit={submit} className='bg-white w-full max-w-sm rounded-md p-5 sm:p-8' noValidate>
        <Link to="/" aria-label="Trina — página inicial" className="flex justify-center text-[#AA0001] mb-2">
          <Logo tagline className="h-24" />
        </Link>
        <h1 className='flex items-center justify-center p-3 text-lg font-extrabold'>Cadastra-se</h1>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-[80px] h-[8px] bg-red-700 rounded-lg'></div>
        </div>
        <div className="flex flex-col gap-5 items-stretch">
          {error && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          <AuthField icon={FaUser} label="Nome" type="text" autoComplete="name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <AuthField icon={FaEnvelope} label="Email" type="email" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <AuthField icon={FaLock} label="Senha (mínimo 8 caracteres)" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <PasswordStrength password={form.password} />
          <button disabled={loading || !form.name || !form.email || !form.password}
            className='w-full h-[50px] bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm rounded-md'>
            {loading ? 'A criar conta...' : 'Registar'}
          </button>
          <GoogleButton onCredential={handleGoogle} text="signup_with" disabled={loading} />
          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            Ao criar conta, aceitas os <Link to="/termos" className="underline hover:text-black">Termos e Condições</Link> e
            confirmas que leste a <Link to="/privacidade" className="underline hover:text-black">Política de Privacidade</Link>.
          </p>
          <p className='text-sm text-center'>
            Já tens uma conta?<Link to="/login" state={location.state} className='font-bold ml-1 hover:underline'>Iniciar sessão</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
export default Register;
