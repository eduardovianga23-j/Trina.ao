import FavoriteButton from "../ui/FavoriteButton";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { formatEUR, discountPercent, categoryLabel } from "../../../utils/format";
import { imgUrl, imgSrcSet } from '../../../utils/img';

/*
  Cartão de produto único, usado em todo o site (Home, Shop e "Você também pode comprar").
  Recebe um produto vindo da base de dados:  <ShopDataCard product={produto} />
  - Telemóvel: 2 por linha, imagem proporcional, botão "Confira" a toda a largura.
  - Tablet/Desktop: preço e botão lado a lado.
*/
const NOVO_DIAS = 30;

const ShopDataCard = ({ product }) => {
  const { slug, name, images = [], price, originalPrice, category, createdAt, rating, numReviews } = product;
  const esgotado = product.trackStock && product.stock === 0;
  const desconto = discountPercent(price, originalPrice);
  const novo = createdAt && Date.now() - new Date(createdAt).getTime() < NOVO_DIAS * 864e5;

  return (
    <Link
      to={`/produto/${slug}`}
      onClick={() => window.scrollTo(0, 0)}
      className="group flex flex-col shadow-md hover:shadow-lg rounded-lg bg-white relative overflow-hidden transition-shadow"
    >
      <FavoriteButton productId={product._id} name={name} className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10" />

      <div className="relative overflow-hidden aspect-[4/5] bg-zinc-100">
        {images[0] && (
          <img
            src={imgUrl(images[0], 600)}
            srcSet={imgSrcSet(images[0])}
            sizes="(min-width: 1024px) 25vw, 50vw"
            alt={name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover sm:transition sm:duration-700 sm:group-hover:scale-110 ${esgotado ? "opacity-60 grayscale-[40%]" : ""}`}
          />
        )}
        {esgotado && (
          <span className="absolute bottom-2 left-2 text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-black/80 text-white px-2 py-1 rounded-sm">Esgotado</span>
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
        <p className="line-clamp-1 text-[11px] sm:text-xs text-zinc-600 mt-1 flex items-center gap-1.5">
          {categoryLabel(category)}
          {numReviews > 0 && (
            <span className="inline-flex items-center gap-0.5 text-zinc-700" aria-label={`${rating} de 5 estrelas, ${numReviews} avaliações`}>
              · <FaStar className="text-amber-500" aria-hidden="true" /> {Number(rating).toFixed(1).replace(".", ",")} <span className="text-zinc-400">({numReviews})</span>
            </span>
          )}
        </p>

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
