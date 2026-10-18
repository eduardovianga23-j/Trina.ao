import { Link } from 'react-router-dom';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success('Adicionado ao carrinho!');
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <Link to={`/produtos/${product._id}`} className="group block">
      <div className="relative overflow-hidden bg-stone-100 aspect-[3/4]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">Sem imagem</div>
        )}
        {discount && (
          <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs px-2 py-1 font-body font-medium">
            -{discount}%
          </span>
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-0 left-0 right-0 bg-dark text-white py-3 text-xs font-body font-medium tracking-widest uppercase
                     translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingBag size={14} /> Adicionar
        </button>
      </div>
      <div className="mt-3">
        <p className="text-xs text-stone-400 font-body uppercase tracking-wider">{product.category}</p>
        <h3 className="font-body font-medium text-sm mt-1 text-dark truncate">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-body font-semibold text-dark">{product.price.toLocaleString('pt-AO')} Kz</span>
          {product.originalPrice && (
            <span className="text-xs text-stone-400 line-through">{product.originalPrice.toLocaleString('pt-AO')} Kz</span>
          )}
        </div>
        {product.numReviews > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="text-brand-500 fill-brand-500" />
            <span className="text-xs text-stone-500">{product.rating.toFixed(1)} ({product.numReviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
