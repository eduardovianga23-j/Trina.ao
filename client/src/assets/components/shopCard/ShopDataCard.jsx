import { faHeart } from "@fortawesome/free-regular-svg-icons/faHeart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

/*
  Cartão de produto único, usado em todo o site (Home/Promo, Shop e "Você também pode comprar").
  - Telemóvel: 2 por linha, imagem proporcional, botão "Confira" a toda a largura.
  - Tablet/Desktop: preço e botão lado a lado.
*/
const ShopDataCard = ({
  img,
  nomeProduto,
  percentagem,
  detalhesProduto1,
  detalhesProduto,
  detalhesProduto2,
  tamanhos,
  precoAnterior,
  precoActual,
  etiqueta = "NOVIDADE EM",
}) => {
  const navigate = useNavigate();
  const detalhe = detalhesProduto1 || detalhesProduto;

  const handleProducts = () => {
    navigate("/products", {
      state: { img, nomeProduto, percentagem, detalhesProduto1: detalhe, detalhesProduto2, tamanhos, precoAnterior, precoActual },
    });
    window.scrollTo(0, 0);
  };

  return (
    <div
      onClick={handleProducts}
      className="group flex flex-col shadow-md hover:shadow-lg rounded-lg bg-white cursor-pointer relative overflow-hidden transition-shadow"
    >
      <button
        type="button"
        aria-label="Adicionar aos favoritos"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center
                   bg-white text-neutral-900 rounded-full shadow transition duration-300 hover:bg-yellow-400"
      >
        <FontAwesomeIcon icon={faHeart} className="text-sm sm:text-base" />
      </button>

      <div className="relative overflow-hidden aspect-[4/5] bg-zinc-100">
        <img
          src={img}
          alt={nomeProduto}
          loading="lazy"
          className="w-full h-full object-cover sm:transition sm:duration-700 sm:group-hover:scale-110"
        />
        <div className="absolute top-2 left-0 sm:top-4 flex flex-col items-start gap-1">
          <span className="text-[10px] sm:text-sm text-red-700 px-1 bg-white">
            SUPER<span className="font-bold">PREÇO</span>
          </span>
          {percentagem !== undefined && percentagem !== 0 && (
            <span className="text-[10px] sm:text-xs text-black px-2 py-0.5 sm:py-1 bg-yellow-400">{percentagem}%</span>
          )}
          <span className="text-[10px] sm:text-xs text-white px-1 py-0.5 sm:py-1 bg-black">{etiqueta}</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-2 sm:p-3">
        <h3 className="line-clamp-1 font-bold text-xs sm:text-sm text-black">{nomeProduto}</h3>
        {detalhe && <p className="line-clamp-1 text-[11px] sm:text-xs text-zinc-600 mt-1">{detalhe}</p>}

        <div className="mt-auto pt-2 sm:pt-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-t-2 pt-2 sm:pt-3">
            <div>
              {precoAnterior && (
                <p className="text-[11px] sm:text-xs line-through text-red-900 font-bold">{precoAnterior} Akz</p>
              )}
              <p className="text-sm sm:text-base font-bold text-black whitespace-nowrap">{precoActual} Akz</p>
            </div>
            <span className="text-center py-2 px-4 lg:px-6 bg-black text-xs text-white rounded-sm transition duration-75 hover:bg-zinc-800">
              Confira
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDataCard;
