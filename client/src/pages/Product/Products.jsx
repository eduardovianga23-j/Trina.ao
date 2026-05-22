import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../../services/api';
import ProductCard from '../../components/ui/ProductCard';
import { SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['roupas', 'sapatos', 'acessórios', 'bolsas', 'joias', 'outros'];
const SORTS = [
  { label: 'Mais Recentes', value: 'newest' },
  { label: 'Preço: Menor', value: 'price_asc' },
  { label: 'Preço: Maior', value: 'price_desc' },
  { label: 'Melhor Avaliados', value: 'rating' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    setLoading(true);
    productAPI.getAll({ category, search, sort, page, limit: 12 })
      .then(({ data }) => { setProducts(data.products); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, sort, page]);

  const update = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="md:w-56 shrink-0">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filtros
          </h2>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-3 font-body">Categoria</p>
            <button
              onClick={() => update('category', '')}
              className={`block text-sm font-body py-1 ${!category ? 'text-brand-600 font-medium' : 'text-stone-600 hover:text-dark'}`}
            >
              Todos
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => update('category', c)}
                className={`block text-sm font-body py-1 capitalize ${category === c ? 'text-brand-600 font-medium' : 'text-stone-600 hover:text-dark'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-3 font-body">Ordenar</p>
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => update('sort', s.value)}
                className={`block text-sm font-body py-1 ${sort === s.value ? 'text-brand-600 font-medium' : 'text-stone-600 hover:text-dark'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-stone-500 font-body">{total} produtos encontrados</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 aspect-[3/4]" />
                  <div className="h-4 bg-stone-200 mt-3 w-3/4" />
                  <div className="h-4 bg-stone-200 mt-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-stone-400 font-body">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
