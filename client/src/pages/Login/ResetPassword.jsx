import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import AuthCard from './AuthCard';
import AuthField from '../../assets/components/ui/AuthField';
import PasswordStrength, { MIN_PASSWORD } from '../../assets/components/ui/PasswordStrength';
import { authAPI, apiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// /nova-senha?token=... — o link do email abre aqui para escolher a senha nova
const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { startSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Senha nova — Trina';
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) return setError(`A senha tem de ter pelo menos ${MIN_PASSWORD} caracteres.`);
    if (password !== confirm) return setError('As duas senhas não são iguais.');
    setLoading(true);
    try {
      const { data } = await authAPI.reset(token, password);
      startSession(data);
      navigate('/conta', { replace: true, state: { notice: 'Senha alterada. Já tens sessão iniciada.' } });
    } catch (err) {
      setError(apiError(err, 'Não foi possível alterar a senha.'));
      setLoading(false);
    }
  };

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return (
      <AuthCard title="Link inválido">
        <p className="text-sm text-zinc-600 text-center">Este link não está completo. Abre de novo o link do email ou pede um novo.</p>
        <Link to="/recuperar-senha" className="mt-6 block text-center w-full py-3 bg-red-800 hover:bg-red-900 text-white text-sm rounded-md">Pedir um link novo</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Criar senha nova">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}{/expirou|não é válido/.test(error) && <> <Link to="/recuperar-senha" className="font-bold underline">Pedir um link novo</Link></>}
          </p>
        )}
        <AuthField icon={FaLock} label="Senha nova" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordStrength password={password} />
        <AuthField icon={FaLock} label="Repetir a senha nova" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {confirm && password !== confirm && <p className="text-xs text-red-700 -mt-3">As senhas ainda não são iguais.</p>}
        <button disabled={loading || !password || !confirm} className="w-full h-[50px] bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm rounded-md">
          {loading ? 'A guardar...' : 'Guardar senha nova'}
        </button>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
