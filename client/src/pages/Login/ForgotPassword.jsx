import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FaCheckCircle } from 'react-icons/fa';
import AuthCard from './AuthCard';
import AuthField from '../../assets/components/ui/AuthField';
import { authAPI, apiError } from '../../services/api';

// /recuperar-senha — pede o email e envia um link para criar uma senha nova
const ForgotPassword = () => {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || '');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Recuperar a senha — Trina';
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Indica um email válido.');
    setLoading(true);
    try {
      const { data } = await authAPI.forgot(email.trim());
      setSent(data.message);
    } catch (err) {
      setError(apiError(err, 'Não foi possível enviar. Tenta de novo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Recuperar a senha">
      {sent ? (
        <div className="text-center" role="status">
          <FaCheckCircle className="mx-auto text-4xl text-green-600" aria-hidden="true" />
          <p className="mt-4 text-sm text-zinc-700">{sent}</p>
          <p className="mt-2 text-xs text-zinc-500">O link funciona durante 1 hora.</p>
          <button type="button" onClick={() => setSent('')} className="mt-5 text-sm font-semibold text-red-800 hover:underline">Não recebi o email</button>
          <p className="mt-6 text-sm"><Link to="/login" className="font-bold hover:underline">Voltar ao login</Link></p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <p className="text-sm text-zinc-600 text-center -mt-2">Escreve o email da tua conta. Vamos enviar-te um link para criares uma senha nova.</p>
          {error && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          <AuthField icon={faEnvelope} label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={loading || !email} className="w-full h-[50px] bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm rounded-md">
            {loading ? 'A enviar...' : 'Enviar link'}
          </button>
          <p className="text-sm text-center"><Link to="/login" className="font-bold hover:underline">Voltar ao login</Link></p>
        </form>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;
