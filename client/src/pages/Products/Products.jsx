import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FaExpand, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { ProductGrid } from "../../assets/components/shopCard/ShopDataCard";
import FavoriteButton from "../../assets/components/ui/FavoriteButton";
import { useCart } from "../../context/CartContext";
import { productAPI, apiError } from "../../services/api";
import { formatEUR, discountPercent, categoryLabel } from "../../utils/format";
import ProductReviews, { ReviewsBadge } from "./ProductReviews";

// Página de um produto:  /produto/:slug
const Products = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { addItem, items: cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

  // Carrega o produto e as sugestões sempre que o endereço muda
  useEffect(() => {
    let cancel = false;
    setLoading(true); setError(""); setProduct(null);
    setSelectedImageIndex(0); setSize(""); setQuantity(1); setSizeError(false); setAdded(false);
    setRelated([]); setRelatedLoading(true);

    productAPI
      .getBySlug(slug)
      .then(({ data }) => {
        if (cancel) return;
        setProduct(data);
        // Começa na cor da foto principal (se houver), senão na primeira cor
        const cores = data.hasColors ? data.colors : [];
        // ?cor=Preto (vindo do carrinho) abre já nessa cor e na foto dela
        const pedida = cores.find((c) => c.name === searchParams.get("cor"));
        const inicial = pedida || cores.find((c) => c.image === data.images[0]) || cores[0] || null;
        setColor(inicial);
        const idx = inicial?.image ? data.images.indexOf(inicial.image) : -1;
        if (idx > 0) setSelectedImageIndex(idx);
        document.title = `${data.name} — Trina.ao`;
        return productAPI.getRelated(data._id).then(({ data: rel }) => !cancel && setRelated(rel));
      })
      .catch((err) => !cancel && setError(err.response?.status === 404 ? "Este produto já não está disponível." : apiError(err)))
      .finally(() => { if (!cancel) { setLoading(false); setRelatedLoading(false); } });

    return () => { cancel = true; document.title = "Trina.ao — Liberta a tua essência"; };
  }, [slug]);

  const hasSizes = product?.sizes?.length > 0;
  const images = product?.images || [];

  // ---------- Stock ----------
  const tracked = Boolean(product?.trackStock);
  const colorName = color?.name || "";
  const stockFor = (s, c = colorName) =>
    !tracked ? Infinity : product.variants.find((v) => v.size === s && v.color === c)?.stock ?? 0;
  const colorSoldOut = (c) => tracked && (hasSizes ? product.sizes : [""]).every((s) => stockFor(s, c) === 0);
  const soldOut = tracked && product.stock === 0;
  // Quantas ainda pode juntar (tira o que já está no carrinho)
  const chosenSize = hasSizes ? size : "";
  const inCart = cartItems.find((i) => i.key === [product?._id, chosenSize, colorName].join("|"))?.quantity || 0;
  const available = hasSizes && !size ? Infinity : stockFor(chosenSize) - inCart;
  const maxQty = Math.max(0, Math.min(99, available));
  const variantSoldOut = (!hasSizes || size) && stockFor(chosenSize) === 0;

  // Mudar de cor pode deixar o tamanho escolhido sem stock: limpa a escolha e acerta a quantidade
  useEffect(() => {
    if (size && tracked && stockFor(size) === 0) setSize("");
  }, [colorName]);
  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) setQuantity(maxQty);
  }, [maxQty]);

  // Escolher uma cor mostra a foto dessa cor
  const pickColor = (c) => {
    setColor(c);
    const idx = c.image ? images.indexOf(c.image) : -1;
    if (idx >= 0) setSelectedImageIndex(idx);
  };
  // Ver uma foto que pertence a uma cor seleciona essa cor
  const pickImage = (index) => {
    setSelectedImageIndex(index);
    const c = product?.hasColors && product.colors.find((col) => col.image === images[index]);
    if (c) setColor(c);
  };

  const handleAddToCart = () => {
    if (hasSizes && !size) { setSizeError(true); return; }
    if (maxQty < 1) return;
    addItem(product, {
      size,
      color: color ? { name: color.name, hex: color.hex } : null,
      image: color?.image || images[0], // o carrinho mostra a foto da cor escolhida
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const desconto = product ? discountPercent(product.price, product.originalPrice) : 0;

  return (
    <>
      <TopHeader />
      <Header />
      <div className="container-site mt-[110px] pt-4 sm:pt-8 mb-10 min-h-[60vh]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse" aria-label="A carregar">
            <div className="aspect-[4/5] bg-zinc-200 rounded-lg" />
            <div className="space-y-4"><div className="h-8 bg-zinc-200 rounded w-2/3" /><div className="h-4 bg-zinc-200 rounded w-full" /><div className="h-4 bg-zinc-200 rounded w-5/6" /><div className="h-12 bg-zinc-200 rounded w-1/2 mt-8" /></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-zinc-700">{error}</p>
            <Link to="/shop" className="inline-block mt-6 py-3 px-8 bg-black text-white text-sm font-semibold rounded-sm">Ver outros produtos</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[60%_40%] gap-8 md:gap-8 lg:gap-0">
            {/* Galeria: no telemóvel a imagem principal fica em cima e as miniaturas por baixo */}
            <div className="w-full flex flex-col-reverse sm:flex-row items-start gap-3 lg:pr-10">
              <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-20 lg:w-[110px] shrink-0 overflow-x-auto">
                {images.map((image, index) => (
                  <button key={image} onClick={() => pickImage(index)} aria-label={`Ver foto ${index + 1}`} className="shrink-0">
                    <img
                      src={image}
                      alt=""
                      className={`w-16 h-20 sm:w-full sm:h-auto sm:aspect-[4/5] object-cover rounded-md border-2 ${selectedImageIndex === index ? "border-black" : "border-zinc-200"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="relative w-full flex-1">
                <img src={images[selectedImageIndex]} alt={product.name} className="w-full aspect-[4/5] max-h-[560px] object-cover rounded-lg shadow-lg bg-zinc-100" />
                <button aria-label="Ampliar imagem" className="absolute top-3 left-3 bg-white w-10 h-10 flex items-center justify-center rounded-full shadow" onClick={() => setIsExpanded(true)}>
                  <FaExpand className="text-gray-700"/>
                </button>
              </div>
            </div>

            <div className="w-full">
              <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="text-xs uppercase tracking-wider text-zinc-500 hover:text-black">
                {categoryLabel(product.category)}
              </Link>
              <div className="flex items-start justify-between gap-3 mt-1">
                <h1 className="text-2xl sm:text-3xl font-semibold">{product.name}</h1>
                <FavoriteButton productId={product._id} name={product.name} size="lg" className="shrink-0 border border-zinc-200" />
              </div>
              <div className="mt-1"><ReviewsBadge rating={product.rating} count={product.numReviews} /></div>
              <p className="text-sm mt-3 leading-relaxed whitespace-pre-line text-zinc-700">{product.description}</p>

              {hasSizes ? (
                <>
                  <div className="mt-5"><span className="text-xs font-semibold"><FontAwesomeIcon className="mr-1" icon={faAngleRight}/>Recomendamos o teu tamanho habitual</span></div>
                  <fieldset className="mt-3">
                    <legend className="font-semibold text-sm">Tamanho</legend>
                    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-invalid={sizeError}>
                      {product.sizes.map((s) => {
                        const out = stockFor(s) === 0;
                        return (
                          <button
                            key={s}
                            role="radio"
                            aria-checked={size === s}
                            disabled={out}
                            aria-label={out ? `${s} (esgotado)` : s}
                            title={out ? "Esgotado" : undefined}
                            onClick={() => { setSize(s); setSizeError(false); }}
                            className={`relative min-w-[44px] h-10 px-3 border text-sm rounded-sm transition-colors ${
                              out ? "border-zinc-200 text-zinc-300 line-through cursor-not-allowed bg-zinc-50"
                              : size === s ? "bg-black text-white border-black" : sizeError ? "border-red-700" : "border-zinc-300 hover:border-black"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    {sizeError && <p className="text-xs text-red-700 font-semibold mt-1.5">Escolhe um tamanho primeiro.</p>}
                  </fieldset>
                </>
              ) : (
                <p className="mt-5 text-sm text-zinc-600">Tamanho único</p>
              )}

              {/* As cores só aparecem quando o produto tem várias cores */}
              {product.hasColors && product.colors.length > 0 && (
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">Cor: <span className="font-normal capitalize">{color?.name}</span></legend>
                  <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
                    {product.colors.map((c) => {
                      const out = colorSoldOut(c.name);
                      return (
                        <button
                          key={c.name}
                          role="radio"
                          aria-checked={color?.name === c.name}
                          onClick={() => pickColor(c)}
                          aria-label={out ? `${c.name} (esgotado)` : c.name}
                          title={out ? `${c.name} — esgotado` : c.name}
                          className={`relative w-9 h-9 rounded-full border-2 p-0.5 ${color?.name === c.name ? "border-black" : "border-transparent"}`}
                        >
                          <span className={`block w-full h-full rounded-full border border-black/10 ${out ? "opacity-40" : ""}`} style={{ backgroundColor: c.hex }} />
                          {out && <span aria-hidden="true" className="absolute left-1/2 top-1/2 w-[120%] h-0.5 bg-zinc-500 -translate-x-1/2 -translate-y-1/2 -rotate-45" />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="mt-5">
                <span className="text-sm font-semibold">Quantidade</span>
                <div className="flex items-center mt-2">
                  <button aria-label="Diminuir" className="w-10 h-10 bg-black text-white rounded-sm text-lg" onClick={() => setQuantity(p => Math.max(1, p-1))}>-</button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button aria-label="Aumentar" disabled={quantity >= maxQty} className="w-10 h-10 bg-black text-white rounded-sm text-lg disabled:opacity-30" onClick={() => setQuantity(p => Math.min(maxQty, p+1))}>+</button>
                </div>
                {tracked && !variantSoldOut && Number.isFinite(available) && available > 0 && available <= 3 && (
                  <p className="text-xs font-semibold text-amber-700 mt-2">{available === 1 ? "Só resta 1 unidade!" : `Só restam ${available} unidades!`}</p>
                )}
                {tracked && Number.isFinite(available) && available <= 0 && inCart > 0 && stockFor(chosenSize) > 0 && (
                  <p className="text-xs text-zinc-600 mt-2">Já tens no carrinho todas as unidades disponíveis.</p>
                )}
              </div>

              <div className="mt-6">
                {desconto !== 0 && <p className="text-base sm:text-lg line-through text-red-900 font-bold">{formatEUR(product.originalPrice)}</p>}
                <div className="flex items-center gap-4">
                  <p className="text-2xl font-bold">{formatEUR(product.price)}</p>
                  {desconto !== 0 && <span className="text-sm bg-yellow-400 px-1.5 rounded-sm">{desconto}%</span>}
                </div>
                <p className="text-xs text-zinc-500 mt-1">IVA incluído</p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={soldOut || variantSoldOut || (Number.isFinite(available) && available <= 0)}
                  className={`w-full sm:w-auto py-3 px-10 text-white text-sm font-semibold rounded-sm transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed ${added ? "bg-green-700" : "bg-black hover:bg-zinc-800"}`}
                >
                  {soldOut ? "Esgotado"
                    : variantSoldOut ? (product.hasColors ? `Esgotado em ${colorName}` : "Esgotado")
                    : added ? "✓ Adicionado ao carrinho" : "Adicionar ao carrinho"}
                </button>
                {added && (
                  <Link to="/cart" className="text-center text-sm font-semibold underline underline-offset-4 hover:text-red-800">Ver carrinho</Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {product && <ProductReviews productId={product._id} />}

      {!error && (relatedLoading || related.length > 0) && (
        <section className="w-full mt-12 sm:mt-20 mb-16 sm:mb-20">
          <h2 className="font-semibold text-black text-lg sm:text-xl text-center px-4">Você também pode comprar</h2>
          <section className="flex items-center justify-center my-6">
            <ProductGrid className="container-site" products={related} loading={relatedLoading} error="" />
          </section>
        </section>
      )}

      {isExpanded && product && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-[70]" onClick={() => setIsExpanded(false)}>
          <button aria-label="Fechar" className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-white text-2xl"><FaTimes/></button>
          <button aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i-1+images.length)%images.length); }} className="absolute left-1 sm:left-10 w-11 h-11 flex items-center justify-center text-white text-3xl sm:text-4xl z-10"><FaChevronLeft/></button>
          <img src={images[selectedImageIndex]} alt={product.name} onClick={(e) => e.stopPropagation()} className="max-w-[90%] max-h-[85vh] object-contain rounded-lg"/>
          <button aria-label="Seguinte" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i => (i+1)%images.length); }} className="absolute right-1 sm:right-10 w-11 h-11 flex items-center justify-center text-white text-3xl sm:text-4xl z-10"><FaChevronRight/></button>
        </div>
      )}
      <Footer />
    </>
  );
};
export default Products;
