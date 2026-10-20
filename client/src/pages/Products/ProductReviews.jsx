import { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { Stars } from '../../assets/components/ui/Stars';
import PhotoViewer from '../../assets/components/ui/PhotoViewer';
import { reviewAPI, apiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { fmtDate } from '../../utils/orders';

/*
  Avaliações na página do produto.
  Só quem comprou e confirmou que recebeu pode avaliar, por isso todas são "Compra verificada".
*/
const ProductReviews = ({ productId, onSummary }) => {
  const { isStaff } = useAuth();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewer, setViewer] = useState(null); // { photos, index }
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null); setReviews([]); setPage(1);
    reviewAPI.forProduct(productId)
      .then(({ data: d }) => { setData(d); setReviews(d.reviews); onSummary?.(d.summary); })
      .catch(() => setData({ summary: { count: 0, average: 0, dist: [0, 0, 0, 0, 0] }, pages: 1 }));
  }, [productId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data: d } = await reviewAPI.forProduct(productId, page + 1);
      setReviews((r) => [...r, ...d.reviews]);
      setPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await reviewAPI.remove(id);
      setReviews((r) => r.filter((x) => x._id !== id));
    } catch (err) {
      setError(apiError(err));
    }
  };

  if (!data) return null;
  const { summary } = data;

  return (
    <section id="avaliacoes" className="container-site mt-12 sm:mt-16 scroll-mt-28" aria-labelledby="avaliacoes-titulo">
      <h2 id="avaliacoes-titulo" className="text-lg sm:text-xl font-semibold">Avaliações de clientes</h2>

      {summary.count === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
          <Stars value={0} size={18} />
          <p className="mt-2 font-semibold text-sm">Ainda não há avaliações</p>
          <p className="text-xs text-zinc-500 mt-1">Só quem compra e recebe este produto pode avaliar. Todas as avaliações são de compras verificadas.</p>
        </div>
      ) : (
        <div className="mt-5 grid md:grid-cols-[260px_1fr] gap-6 md:gap-10 items-start">
          {/* Resumo */}
          <div className="rounded-xl border border-zinc-200 p-5">
            <p className="text-4xl font-bold">{summary.average.toFixed(1).replace('.', ',')}</p>
            <Stars value={summary.average} size={18} className="mt-1" />
            <p className="text-xs text-zinc-500 mt-1">{summary.count} {summary.count === 1 ? 'avaliação' : 'avaliações'}{summary.withPhotos ? ` · ${summary.withPhotos} com fotos` : ''}</p>
            <ul className="mt-4 grid gap-1.5">
              {[5, 4, 3, 2, 1].map((n, i) => {
                const pct = summary.count ? Math.round((summary.dist[i] / summary.count) * 100) : 0;
                return (
                  <li key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right">{n}</span>
                    <span className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden" aria-hidden="true">
                      <span className="block h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-8 text-zinc-500 tabular-nums">{summary.dist[i]}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Lista */}
          <div>
            {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
            <ul className="divide-y divide-zinc-200">
              {reviews.map((r) => (
                <li key={r._id} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                      <FaCheckCircle aria-hidden="true" /> Compra verificada
                    </span>
                    <span className="text-xs text-zinc-400 ml-auto">{fmtDate(r.createdAt)}</span>
                  </div>
                  {(r.size || r.color) && (
                    <p className="text-xs text-zinc-500 mt-1">Comprou: {[r.size && `tamanho ${r.size}`, r.color].filter(Boolean).join(' · ')}</p>
                  )}
                  {r.comment && <p className="text-sm text-zinc-800 mt-2 whitespace-pre-line">{r.comment}</p>}
                  {r.photos.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {r.photos.map((p, i) => (
                        <button key={p} type="button" onClick={() => setViewer({ photos: r.photos, index: i })}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden border border-zinc-200 hover:opacity-90" aria-label={`Ver foto ${i + 1} de ${r.name}`}>
                          <img src={p} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {isStaff && (
                    <button type="button" onClick={() => remove(r._id)} className="mt-2 text-xs font-semibold text-red-800 hover:underline">
                      Apagar avaliação (equipa)
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {page < data.pages && (
              <button type="button" onClick={loadMore} disabled={loadingMore}
                className="mt-2 py-2.5 px-5 border border-zinc-300 hover:border-black text-sm font-semibold rounded-sm disabled:opacity-50">
                {loadingMore ? 'A carregar...' : 'Ver mais avaliações'}
              </button>
            )}
          </div>
        </div>
      )}

      {viewer && (
        <PhotoViewer photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} onChange={(i) => setViewer((v) => ({ ...v, index: i }))} />
      )}
    </section>
  );
};

export const ReviewsBadge = ({ rating, count }) =>
  count > 0 ? (
    <a href="#avaliacoes" className="inline-flex items-center gap-1.5 text-sm hover:underline">
      <Stars value={rating} />
      <span className="font-semibold">{Number(rating).toFixed(1).replace('.', ',')}</span>
      <span className="text-zinc-500">({count})</span>
    </a>
  ) : null;

export default ProductReviews;
