import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Bem-vindo de volta!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-stone-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-3xl font-bold">
            Trina<span className="text-brand-600">.ao</span>
          </Link>
          <h2 className="font-display text-xl mt-4">Entrar na tua conta</h2>
        </div>
        <form onSubmit={handle} className="space-y-4 bg-white p-8 border border-stone-200">
          <div>
            <label className="text-xs font-body font-medium uppercase tracking-widest text-stone-500 block mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="text-xs font-body font-medium uppercase tracking-widest text-stone-500 block mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm font-body text-stone-500">
          Não tens conta?{' '}
          <Link to="/auth/register" className="text-brand-600 font-medium hover:underline">
            Registar
          </Link>
        </p>
      </div>
    </div>
  );
}
