import { faHeart } from "@fortawesome/free-regular-svg-icons/faHeart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { formatEUR, discountPercent, categoryLabel } from "../../../utils/format";

/*
  Cartão de produto único, usado em todo o site (Home, Shop e "Você também pode comprar").
  Recebe um produto vindo da base de dados:  <ShopDataCard product={produto} />
  - Telemóvel: 2 por linha, imagem proporcional, botão "Confira" a toda a largura.
  - Tablet/Desktop: preço e botão lado a lado.
*/
const NOVO_DIAS = 30;

const ShopDataCard = ({ product }) => {
  const { slug, name, images = [], price, originalPrice, category, createdAt } = product;
  const desconto = discountPercent(price, originalPrice);
  const novo = createdAt && Date.now() - new Date(createdAt).getTime() < NOVO_DIAS * 864e5;

  return (
    <Link
      to={`/produto/${slug}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group flex flex-col shadow-md hover:shadow-lg rounded-lg bg-white relative overflow-hidden transition-shadow"
    >
      <button
        type="button"
        aria-label="Adicionar aos favoritos"
        onClick={(e) => e.preventDefault()}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center
                   bg-white text-neutral-900 rounded-full shadow transition duration-300 hover:bg-yellow-400"
      >
        <FontAwesomeIcon icon={faHeart} className="text-sm sm:text-base" />
      </button>

      <div className="relative overflow-hidden aspect-[4/5] bg-zinc-100">
        {images[0] && (
          <img
            src={images[0]}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover sm:transition sm:duration-700 sm:group-hover:scale-110"
          />
        )}
        <div className="absolute top-2 left-0 sm:top-4 flex flex-col items-start gap-1">
          {desconto !== 0 && (
            <>
              <span className="text-[10px] sm:text-sm text-red-700 px-1 bg-white">
                SUPER<span className="font-bold">PREÇO</span>
              </span>
              <span className="text-[10px] sm:text-xs text-black px-2 py-0.5 sm:py-1 bg-yellow-400">{desconto}%</span>
            </>
          )}
          {novo && <span className="text-[10px] sm:text-xs text-white px-1 py-0.5 sm:py-1 bg-black">NOVIDADE</span>}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-2 sm:p-3">
        <h3 className="line-clamp-1 font-bold text-xs sm:text-sm text-black">{name}</h3>
        <p className="line-clamp-1 text-[11px] sm:text-xs text-zinc-600 mt-1">{categoryLabel(category)}</p>

        <div className="mt-auto pt-2 sm:pt-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-t-2 pt-2 sm:pt-3">
            <div>
              {desconto !== 0 && (
                <p className="text-[11px] sm:text-xs line-through text-red-900 font-bold">{formatEUR(originalPrice)}</p>
              )}
              <p className="text-sm sm:text-base font-bold text-black whitespace-nowrap">{formatEUR(price)}</p>
            </div>
            <span className="text-center py-2 px-4 lg:px-6 bg-black text-xs text-white rounded-sm transition duration-75 group-hover:bg-zinc-800">
              Confira
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Esqueleto enquanto os produtos carregam
export const ProductCardSkeleton = () => (
  <div className="rounded-lg bg-white shadow-md overflow-hidden animate-pulse" aria-hidden="true">
    <div className="aspect-[4/5] bg-zinc-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-zinc-200 rounded w-3/4" />
      <div className="h-3 bg-zinc-200 rounded w-1/2" />
      <div className="h-8 bg-zinc-200 rounded mt-4" />
    </div>
  </div>
);

// Grelha de produtos com estados de carregamento, erro e vazio
export const ProductGrid = ({ products, loading, error, skeletons = 4, empty = "Ainda não há produtos aqui.", className = "" }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 ${className}`}>
    {loading
      ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
      : error
      ? <p className="col-span-full text-center text-sm text-red-700 py-10">{error}</p>
      : products.length === 0
      ? <p className="col-span-full text-center text-sm text-zinc-500 py-10">{empty}</p>
      : products.map((p) => <ShopDataCard key={p._id} product={p} />)}
  </div>
);

export default ShopDataCard;
