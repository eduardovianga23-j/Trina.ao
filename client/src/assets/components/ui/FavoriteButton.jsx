import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useFavorites } from '../../../context/FavoritesContext';

// Coração para marcar/desmarcar um produto como favorito
const FavoriteButton = ({ productId, name = 'produto', className = '', size = 'md' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const on = isFavorite(productId);
  const dim = size === 'lg' ? 'w-11 h-11 text-lg' : 'w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base';
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
      title={on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(productId); }}
      className={`${dim} flex items-center justify-center rounded-full bg-white shadow transition
                  hover:scale-110 active:scale-95 ${on ? 'text-red-700' : 'text-neutral-900 hover:text-red-700'} ${className}`}
    >
      {on ? <FaHeart className="fav-pop" /> : <FaRegHeart />}
    </button>
  );
};

export default FavoriteButton;
