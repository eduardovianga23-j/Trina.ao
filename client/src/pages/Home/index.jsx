import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productAPI } from '../../services/api';
import ProductCard from '../../components/ui/ProductCard';

const CATEGORIES = [
  { label: 'Roupas', value: 'roupas', emoji: '👗' },
  { label: 'Sapatos', value: 'sapatos', emoji: '👠' },
  { label: 'Acessórios', value: 'acessórios', emoji: '💍' },
  { label: 'Bolsas', value: 'bolsas', emoji: '👜' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getFeatured()
      .then(({ data }) => setFeatured(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-dark text-white min-h-[85vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #e35918 0%, transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto px-6 py-24 relative">
          <p className="font-body text-brand-400 tracking-[0.3em] text-xs uppercase mb-6">Nova Colecção 2026</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] max-w-3xl">
            Estilo que conta a tua história
          </h1>
          <p className="font-body text-stone-400 text-lg mt-6 max-w-xl leading-relaxed">
            Moda angolana moderna. Peças únicas para cada momento da tua vida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link to="/produtos" className="btn-primary inline-flex items-center gap-2">
              Ver Colecção <ArrowRight size={16} />
            </Link>
            <Link to="/produtos?category=roupas" className="btn-outline inline-flex items-center gap-2 border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white">
              Explorar Roupas
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold mb-10">Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              to={`/produtos?category=${cat.value}`}
              className="border border-stone-200 p-8 text-center hover:border-brand-600 hover:bg-brand-50 transition-all group"
            >
              <span className="text-4xl">{cat.emoji}</span>
              <p className="font-body font-medium mt-3 text-sm group-hover:text-brand-600 transition-colors">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display text-3xl font-bold">Em Destaque</h2>
          <Link to="/produtos" className="text-sm font-body font-medium text-brand-600 hover:underline flex items-center gap-1">
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-stone-200 aspect-[3/4]" />
                <div className="h-4 bg-stone-200 mt-3 w-3/4" />
                <div className="h-4 bg-stone-200 mt-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-stone-400 font-body">
            <p>Nenhum produto em destaque ainda.</p>
            <Link to="/produtos" className="text-brand-600 font-medium mt-2 inline-block">Ver todos os produtos</Link>
          </div>
        )}
      </section>

      {/* Banner */}
      <section className="bg-brand-600 text-white py-16 text-center">
        <h2 className="font-display text-3xl font-bold">Envio grátis acima de 5.000 Kz</h2>
        <p className="font-body text-brand-100 mt-3">Para toda Luanda e províncias seleccionadas</p>
        <Link to="/produtos" className="mt-8 inline-flex items-center gap-2 btn-outline border-white text-white hover:bg-white hover:text-brand-600">
          Comprar Agora <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
