import { useEffect, useState } from 'react';
import AdminLayout, { ROLE_LABEL } from './AdminLayout';
import { teamAPI, apiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/*
  /admin/equipa — só o administrador principal.
  Adiciona gestores (pelo email de uma conta já registada no site) e retira-lhes o acesso.
  Os gestores só podem criar, editar e apagar produtos.
*/
const AdminTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    teamAPI.list().then(({ data }) => setTeam(data)).catch((err) => setError(apiError(err))).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      const { data } = await teamAPI.add(email.trim());
      setTeam((prev) => [...prev, data]);
      setNotice(`${data.name} passou a ser gestor(a). Deve sair e voltar a entrar no site para ver o painel.`);
      setEmail('');
    } catch (err) {
      setError(apiError(err, 'Não foi possível adicionar.'));
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    setError('');
    setRemoving(true);
    try {
      const { data } = await teamAPI.remove(toRemove._id);
      setTeam((prev) => prev.filter((m) => m._id !== toRemove._id));
      setNotice(data.message);
      setToRemove(null);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setRemoving(false);
    }
  };

  const managers = team.filter((m) => m.role === 'manager');

  return (
    <AdminLayout title="Equipa">
      {notice && <p role="status" className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{notice}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] items-start">
        <section className="bg-white rounded-lg border border-zinc-200 p-4 sm:p-6">
          <h2 className="font-bold">Quem tem acesso ao painel</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Os <strong>gestores</strong> podem criar, editar e apagar produtos. Só o <strong>administrador principal</strong> gere a equipa.
          </p>

          {loading ? (
            <p className="text-sm text-zinc-500 mt-4">A carregar...</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100">
              {team.map((m) => {
                const isMe = m._id === user?._id || m.email === user?.email;
                return (
                  <li key={m._id} className="flex items-center gap-3 py-3">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      m.role === 'admin' ? 'bg-red-800 text-white' : 'bg-zinc-200 text-zinc-700'}`} aria-hidden="true">
                      {m.name?.[0]?.toUpperCase() || '?'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{m.name}{isMe && <span className="text-zinc-400 font-normal"> (tu)</span>}</p>
                      <p className="text-xs text-zinc-500 truncate">{m.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded shrink-0 ${
                      m.role === 'admin' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'}`}>
                      {ROLE_LABEL[m.role]}
                    </span>
                    {m.role === 'manager' && (
                      <button onClick={() => setToRemove(m)} className="py-1.5 px-3 text-xs font-semibold text-red-800 border border-red-200 rounded-md hover:bg-red-50 shrink-0">
                        Remover
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && managers.length === 0 && (
            <p className="text-sm text-zinc-500 mt-2">Ainda não tens gestores.</p>
          )}
        </section>

        <section className="bg-white rounded-lg border border-zinc-200 p-4 sm:p-6 lg:sticky lg:top-20">
          <h2 className="font-bold">Adicionar gestor</h2>
          <ol className="text-xs text-zinc-600 mt-2 space-y-1 list-decimal pl-4">
            <li>A pessoa cria uma conta no site, em <strong>Criar conta</strong>, com a password dela.</li>
            <li>Escreves aqui o email dessa conta.</li>
            <li>Ela sai e volta a entrar, e passa a ver o painel.</li>
          </ol>
          <form onSubmit={add} className="mt-4 grid gap-2">
            <label htmlFor="team-email" className="text-sm font-semibold">Email da conta</label>
            <input id="team-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@exemplo.com" autoComplete="off"
              className="w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm bg-white outline-none focus:border-black" />
            <button disabled={adding || !email.trim()} className="py-2.5 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
              {adding ? 'A adicionar...' : 'Tornar gestor'}
            </button>
          </form>
        </section>
      </div>

      {toRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="rm-title">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 id="rm-title" className="font-bold text-lg">Remover gestor?</h2>
            <p className="text-sm text-zinc-600 mt-2">
              <strong>{toRemove.name}</strong> deixa de ter acesso ao painel. A conta continua a existir, como cliente, e os produtos que criou mantêm-se.
            </p>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setToRemove(null)} disabled={removing} className="py-2 px-4 text-sm font-semibold border border-zinc-300 rounded-md">Cancelar</button>
              <button onClick={remove} disabled={removing} className="py-2 px-4 text-sm font-semibold text-white bg-red-800 hover:bg-red-900 rounded-md disabled:opacity-60">
                {removing ? 'A remover...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTeam;
