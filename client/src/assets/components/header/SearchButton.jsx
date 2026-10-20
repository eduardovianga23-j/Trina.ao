import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { productAPI } from '../../../services/api';
import { formatEUR } from '../../../utils/format';
import { imgUrl } from '../../../utils/img';

/*
  Lupa do cabeçalho: abre uma barra de pesquisa com sugestões enquanto escreves.
  Enter (ou "Ver todos") abre a loja com os resultados: /shop?search=...
*/
const SearchButton = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Sugestões (espera que pares de escrever 250 ms)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      productAPI.getAll({ search: term, limit: 5 })
        .then(({ data }) => setResults(data.products))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const close = () => { setOpen(false); setQ(''); setResults([]); };
  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    close();
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Pesquisar produtos" aria-expanded={open}
        className="nav-icons inline-flex items-center justify-center w-9 h-9">
        <FaSearch className="text-[0.85em]" />
      </button>

      {/* Fica por cima de tudo (fora do cabeçalho, para não ficar escondida atrás da barra preta do topo) */}
      {open && createPortal(
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Pesquisar produtos">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative bg-white shadow-xl search-drop">
            <form onSubmit={submit} role="search" className="container-site max-w-3xl flex items-center gap-3 py-4">
              <FaSearch className="text-zinc-400 shrink-0" aria-hidden="true" />
              <input ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60}
                placeholder="O que procuras?" aria-label="Pesquisar"
                className="flex-1 min-w-0 text-base sm:text-lg outline-none py-2 bg-transparent" />
              <button type="button" onClick={close} aria-label="Fechar pesquisa" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500">
                <FaTimes />
              </button>
            </form>
            {q.trim().length >= 2 && (
              <div className="container-site max-w-3xl pb-4">
                {loading && !results.length ? (
                  <p className="text-sm text-zinc-500 py-2">A procurar...</p>
                ) : results.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-2">Nenhum produto encontrado para "{q.trim()}".</p>
                ) : (
                  <>
                    <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                      {results.map((p) => (
                        <li key={p._id}>
                          <Link to={`/produto/${p.slug}`} onClick={close} className="flex items-center gap-3 py-2.5 hover:bg-zinc-50 -mx-2 px-2 rounded-md">
                            <img src={imgUrl(p.images[0], 120)} alt="" loading="lazy" className="w-11 h-12 object-cover rounded bg-zinc-100 shrink-0" />
                            <span className="flex-1 min-w-0 text-sm font-semibold truncate">{p.name}</span>
                            <span className="text-sm font-bold">{formatEUR(p.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button onClick={submit} className="mt-2 text-sm font-semibold text-red-800 hover:underline">Ver todos os resultados →</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchButton;
