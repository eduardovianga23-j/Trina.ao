import { Link } from 'react-router-dom';
import { FaRegHeart } from 'react-icons/fa';
import { useFavorites } from '../../../context/FavoritesContext';

// Coração do cabeçalho: abre os favoritos e mostra quantos há
const FavoritesIcon = () => {
  const { count } = useFavorites();
  return (
    <Link to="/favoritos" aria-label={count ? `Favoritos (${count})` : 'Favoritos'} className="nav-icons relative inline-flex items-center justify-center w-9 h-9">
      <FaRegHeart />
      {count > 0 && (
        <span className="cart-badge absolute -top-1 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] leading-none font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
};

export default FavoritesIcon;
