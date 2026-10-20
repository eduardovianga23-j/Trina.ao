import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegHeart } from 'react-icons/fa';
import { ProductGrid } from '../../assets/components/shopCard/ShopDataCard';
import { useFavorites } from '../../context/FavoritesContext';
import { productAPI, apiError } from '../../services/api';

// Lista dos produtos favoritos (usada em /favoritos e em /conta/favoritos)
const FavoritesList = ({ limit }) => {
  const { ids, ready } = useFavorites();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wanted = limit ? [...ids].reverse().slice(0, limit) : [...ids].reverse(); // os mais recentes primeiro
  const key = wanted.join(',');

  useEffect(() => {
    if (!ready) return;
    if (!wanted.length) { setProducts([]); setLoading(false); return; }
    let cancel = false;
    setLoading(true);
    productAPI.getByIds(wanted)
      .then(({ data }) => !cancel && setProducts(data))
      .catch((err) => !cancel && setError(apiError(err)))
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, [key, ready]);

  // Ao tirar o coração, o produto desaparece logo da lista
  const visible = products.filter((p) => ids.includes(String(p._id)));

  if (!loading && !error && visible.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-xl border border-zinc-200">
        <FaRegHeart className="mx-auto text-4xl text-zinc-300" aria-hidden="true" />
        <p className="font-semibold mt-4">Ainda não tens favoritos</p>
        <p className="text-sm text-zinc-500 mt-1">Carrega no coração de um produto para o guardares aqui.</p>
        <Link to="/shop" className="inline-block mt-6 py-2.5 px-6 bg-black hover:bg-zinc-800 text-white text-sm font-semibold rounded-sm">Explorar a loja</Link>
      </div>
    );
  }
  return <ProductGrid products={visible} loading={loading || !ready} error={error} skeletons={Math.min(4, wanted.length || 4)} />;
};

export default FavoritesList;
