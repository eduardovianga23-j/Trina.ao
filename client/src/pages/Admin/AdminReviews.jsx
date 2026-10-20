import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Stars } from '../../assets/components/ui/Stars';
import PhotoViewer from '../../assets/components/ui/PhotoViewer';
import { reviewAPI, apiError } from '../../services/api';
import { fmtDateTime } from '../../utils/orders';

/*
  /admin/avaliacoes — administrador principal e gestores com a permissão "Avaliações".
  Lista todas as avaliações (as mais recentes primeiro) e permite apagar as falsas ou ofensivas.
*/
const FILTERS = [['', 'Todas'], ['1', '1 ★'], ['2', '2 ★'], ['3', '3 ★'], ['4', '4 ★'], ['5', '5 ★']];

const AdminReviews = () => {
  const [stars, setStars] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewer, setViewer] = useState(null);

  const load = (p = page, s = stars) => {
    setError('');
    reviewAPI.adminList({ page: p, stars: s || undefined })
      .then(({ data: d }) => setData(d))
      .catch((err) => setError(apiError(err)));
  };
  useEffect(() => { setData(null); load(page, stars); }, [page, stars]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await reviewAPI.remove(toDelete._id);
      setToDelete(null);
      load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Avaliações">
      <div className="flex flex-wrap items-center gap-2 mb-5" role="group" aria-label="Filtrar por estrelas">
        {FILTERS.map(([v, label]) => (
          <button key={label} type="button" onClick={() => { setStars(v); setPage(1); }} aria-pressed={stars === v}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${stars === v ? 'bg-black text-white border-black' : 'bg-white border-zinc-300 hover:border-black'}`}>
            {label}
          </button>
        ))}
        {data && <span className="text-sm text-zinc-500 ml-1">{data.total} {data.total === 1 ? 'avaliação' : 'avaliações'}</span>}
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      {!data ? (
        <p className="text-sm text-zinc-500">A carregar...</p>
      ) : data.reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-500">Ainda não há avaliações{stars ? ' com estas estrelas' : ''}.</div>
      ) : (
        <ul className="grid gap-3">
          {data.reviews.map((r) => (
            <li key={r._id} className="bg-white rounded-xl border border-zinc-200 p-4 flex gap-4">
              {r.product ? (
                <Link to={`/produto/${r.product.slug}#avaliacoes`} className="shrink-0">
                  <img src={r.product.images?.[0]} alt="" className="w-14 h-16 object-cover rounded-md bg-zinc-100" />
                </Link>
              ) : <span className="w-14 h-16 rounded-md bg-zinc-100 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} />
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span className="text-xs text-zinc-500 truncate">{r.user?.email}</span>
                  <span className="text-xs text-zinc-400 ml-auto">{fmtDateTime(r.createdAt)}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {r.product ? <Link to={`/produto/${r.product.slug}#avaliacoes`} className="hover:underline">{r.product.name}</Link> : 'Produto apagado'}
                  {(r.size || r.color) && ` · ${[r.size, r.color].filter(Boolean).join(' · ')}`}
                </p>
                {r.comment && <p className="text-sm mt-2 whitespace-pre-line">{r.comment}</p>}
                {r.photos.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {r.photos.map((p, i) => (
                      <button key={p} type="button" onClick={() => setViewer({ photos: r.photos, index: i })} aria-label={`Ver foto ${i + 1}`}>
                        <img src={p} alt="" className="w-16 h-16 object-cover rounded-md border border-zinc-200" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setToDelete(r)} className="self-start py-1.5 px-3 text-xs font-semibold text-red-800 border border-red-200 rounded-md hover:bg-red-50 shrink-0">
                Apagar
              </button>
            </li>
          ))}
        </ul>
      )}

      {data?.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="py-2 px-4 text-sm font-semibold border border-zinc-300 rounded-md disabled:opacity-40">Anteriores</button>
          <span className="text-sm text-zinc-500">Página {page} de {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="py-2 px-4 text-sm font-semibold border border-zinc-300 rounded-md disabled:opacity-40">Seguintes</button>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="del-rev">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 id="del-rev" className="font-bold text-lg">Apagar avaliação?</h2>
            <p className="text-sm text-zinc-600 mt-2">A avaliação de <strong>{toDelete.name}</strong> e as suas fotos deixam de aparecer na loja. Isto não se pode desfazer.</p>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="py-2 px-4 text-sm font-semibold border border-zinc-300 rounded-md">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting} className="py-2 px-4 text-sm font-semibold text-white bg-red-800 hover:bg-red-900 rounded-md disabled:opacity-60">
                {deleting ? 'A apagar...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {viewer && <PhotoViewer photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} onChange={(i) => setViewer((v) => ({ ...v, index: i }))} />}
    </AdminLayout>
  );
};

export default AdminReviews;
