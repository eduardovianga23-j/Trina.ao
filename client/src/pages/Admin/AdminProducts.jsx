import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { productAPI, apiError } from '../../services/api';
import { formatEUR, categoryLabel } from '../../utils/format';

// /admin — lista de todos os produtos (incluindo os escondidos)
const AdminProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice || '');

  const load = () => {
    setLoading(true);
    productAPI
      .getAllAdmin()
      .then(({ data }) => setProducts(data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // limpa a mensagem de sucesso do histórico para não reaparecer ao recarregar
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q) || categoryLabel(p.category).toLowerCase().includes(q)) : products;
  }, [products, search]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await productAPI.delete(toDelete._id);
      setProducts((prev) => prev.filter((p) => p._id !== toDelete._id));
      setNotice(`"${toDelete.name}" foi apagado.`);
      setToDelete(null);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Produtos"
      actions={
        <Link to="/admin/novo" className="py-2.5 px-5 bg-red-800 hover:bg-red-900 text-white text-sm font-semibold rounded-md">
          + Novo produto
        </Link>
      }
    >
      {notice && <p role="status" className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{notice}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar por nome ou categoria..."
          aria-label="Procurar produtos"
          className="flex-1 min-w-[200px] max-w-md border border-zinc-300 rounded-md px-3 py-2 text-base sm:text-sm bg-white outline-none focus:border-black"
        />
        <p className="text-sm text-zinc-500">{loading ? 'A carregar...' : `${filtered.length} de ${products.length} produtos`}</p>
      </div>

      {!loading && products.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-zinc-200 p-10 text-center">
          <p className="font-semibold">Ainda não tens produtos.</p>
          <p className="text-sm text-zinc-500 mt-1">Começa por criar o primeiro.</p>
          <Link to="/admin/novo" className="inline-block mt-5 py-2.5 px-5 bg-black text-white text-sm font-semibold rounded-md">Criar produto</Link>
        </div>
      )}

      <ul className="grid gap-3">
        {filtered.map((p) => (
          <li key={p._id} className="bg-white rounded-lg border border-zinc-200 p-3 flex items-center gap-3 sm:gap-4">
            <img src={p.images[0]} alt="" className="w-14 h-16 sm:w-16 sm:h-20 object-cover rounded-md bg-zinc-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {categoryLabel(p.category)} · {formatEUR(p.price)}
                {p.originalPrice ? <span className="line-through ml-1">{formatEUR(p.originalPrice)}</span> : null}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {!p.active && <span className="text-[10px] font-bold uppercase bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded">Escondido</span>}
                {p.featured && <span className="text-[10px] font-bold uppercase bg-yellow-300 text-black px-1.5 py-0.5 rounded">Destaque</span>}
                {p.originalPrice > p.price && (
                  <span className="text-[10px] font-bold bg-red-800 text-white px-1.5 py-0.5 rounded">
                    Promoção -{Math.round((1 - p.price / p.originalPrice) * 100)}%
                  </span>
                )}
                <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">{p.images.length} fotos</span>
                {p.hasColors && <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200">{p.colors.length} cores</span>}
                {p.waiting > 0 && (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded" title="Pessoas que pediram para ser avisadas quando houver stock">
                    🔔 {p.waiting} à espera
                  </span>
                )}
                {p.trackStock && (() => {
                  const out = p.variants.filter((v) => v.stock === 0).length;
                  return p.stock === 0
                    ? <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Esgotado</span>
                    : <span className={`text-[10px] px-1.5 py-0.5 rounded border ${p.stock <= 3 || out ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-zinc-200 text-zinc-500'}`}>
                        Stock {p.stock}{out ? ` · ${out} esgotado${out > 1 ? 's' : ''}` : ''}
                      </span>;
                })()}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link to={`/admin/editar/${p._id}`} className="py-2 px-4 text-xs sm:text-sm font-semibold border border-zinc-300 rounded-md hover:border-black text-center">
                Editar
              </Link>
              <button onClick={() => setToDelete(p)} className="py-2 px-4 text-xs sm:text-sm font-semibold text-red-800 border border-red-200 rounded-md hover:bg-red-50">
                Apagar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="del-title">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 id="del-title" className="font-bold text-lg">Apagar produto?</h2>
            <p className="text-sm text-zinc-600 mt-2">
              <strong>{toDelete.name}</strong> e as suas fotos vão ser apagados. Isto não se pode desfazer.
            </p>
            <p className="text-xs text-zinc-500 mt-2">Se só quiseres tirá-lo da loja por agora, edita-o e desliga "Visível na loja".</p>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="py-2 px-4 text-sm font-semibold border border-zinc-300 rounded-md">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting} className="py-2 px-4 text-sm font-semibold text-white bg-red-800 hover:bg-red-900 rounded-md disabled:opacity-60">
                {deleting ? 'A apagar...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
