import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";
import { useCart } from "../../context/CartContext";
import { formatEUR } from "../../utils/format";
import { orderAPI } from "../../services/api";
import { useShipping, shippingFor } from "../../utils/orders";

const Cart = () => {
  const { items, count, total, updateQuantity, removeItem } = useCart();
  const shipping = useShipping();
  const envio = shippingFor(shipping, total);
  const faltaGratis = shipping?.freeFrom > 0 && envio > 0 ? shipping.freeFrom - total : 0;

  // Voltou da página de pagamento sem pagar: fecha esse pagamento e mostra um aviso
  const [params, setParams] = useSearchParams();
  const [cancelado, setCancelado] = useState(false);
  useEffect(() => {
    const id = params.get("cancelado");
    if (!id) return;
    setCancelado(true);
    orderAPI.cancel(id, params.get("t") || undefined).catch(() => {});
    setParams({}, { replace: true });
  }, []);

  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] min-h-[60vh] container-site py-8 md:py-12">
        {cancelado && (
          <p role="status" className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            O pagamento foi cancelado e nada foi cobrado. Os teus produtos continuam no carrinho.
          </p>
        )}
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <FontAwesomeIcon icon={faShoppingCart} className="text-5xl text-zinc-300 mb-6" />
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-700">O teu carrinho está vazio</h1>
            <p className="text-sm text-zinc-500 mt-2 mb-8">Adiciona alguns produtos para continuar.</p>
            <Link to="/shop" className="py-3 px-8 bg-black hover:bg-zinc-800 text-white text-sm font-semibold rounded-sm">
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-bold mb-6 md:mb-8">
              Carrinho <span className="text-zinc-400 font-semibold">({count} {count === 1 ? "produto" : "produtos"})</span>
            </h1>

            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              {/* Produtos */}
              <ul className="md:col-span-2 divide-y divide-zinc-200 border-y border-zinc-200">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3 sm:gap-4 py-4 sm:py-5">
                    <Link to={`/produto/${item.slug}${item.color ? `?cor=${encodeURIComponent(item.color.name)}` : ''}`} className="shrink-0"><img src={item.image} alt={item.name} className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-md bg-zinc-100" /></Link>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`/produto/${item.slug}${item.color ? `?cor=${encodeURIComponent(item.color.name)}` : ''}`} className="font-bold text-sm leading-snug hover:underline">{item.name}</Link>
                          <p className="text-xs text-zinc-500 mt-1 capitalize">
                            {item.size && `Tamanho ${item.size}`}
                            {item.size && item.color && " · "}
                            {item.color && (
                              <span className="inline-flex items-center gap-1 align-middle">
                                <span className="inline-block w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: item.color.hex }} />
                                {item.color.name}
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          aria-label={`Remover ${item.name}`}
                          className="w-9 h-9 -mt-2 -mr-2 flex items-center justify-center text-zinc-400 hover:text-red-700 shrink-0"
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                      </div>

                      <div className="flex items-end justify-between gap-2 mt-auto pt-3">
                        <div className="flex items-center border border-zinc-300 rounded-sm">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            aria-label="Diminuir quantidade"
                            className="w-9 h-9 flex items-center justify-center hover:bg-zinc-100"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            aria-label="Aumentar quantidade"
                            className="w-9 h-9 flex items-center justify-center hover:bg-zinc-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-zinc-500">{formatEUR(item.price)} cada</p>
                          )}
                          <p className="font-bold text-sm sm:text-base whitespace-nowrap">
                            {formatEUR(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Resumo */}
              <aside className="bg-white border border-zinc-200 rounded-md p-5 sm:p-6 h-fit md:sticky md:top-24">
                <h2 className="font-bold text-lg mb-5">Resumo</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="tabular-nums">{formatEUR(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Envio</span>
                    {envio === null ? (
                      <span className="text-zinc-500">Calculado no checkout</span>
                    ) : envio === 0 ? (
                      <span className="font-semibold text-green-700">Grátis</span>
                    ) : (
                      <span className="tabular-nums">{formatEUR(envio)}</span>
                    )}
                  </div>
                  {faltaGratis > 0 && (
                    <p className="text-xs text-zinc-600 bg-zinc-50 rounded px-3 py-2">
                      Faltam <strong>{formatEUR(faltaGratis)}</strong> para teres envio grátis.
                    </p>
                  )}
                  <div className="border-t border-zinc-200 pt-3 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-red-800 tabular-nums">{formatEUR(total + (envio || 0))}</span>
                  </div>
                </div>
                <Link to="/checkout" className="block text-center w-full mt-6 py-3 bg-red-800 hover:bg-red-900 text-white text-sm font-semibold rounded-sm">
                  Finalizar compra
                </Link>
                <Link to="/shop" className="block text-center text-sm text-zinc-500 hover:text-black mt-4">
                  Continuar a comprar
                </Link>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Cart;
