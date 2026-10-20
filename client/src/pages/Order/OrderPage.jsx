import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaTimesCircle, FaTruck, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import Header from '../../assets/components/header/Header';
import TopHeader from '../../assets/components/topheader/TopHeader';
import Footer from '../../assets/components/footer/footer';
import { useCart } from '../../context/CartContext';
import { orderAPI, reviewAPI, apiError } from '../../services/api';
import DeliveryTimeline from '../../assets/components/ui/DeliveryTimeline';
import ReviewForm from './ReviewForm';
import { formatEUR } from '../../utils/format';
import { PAYMENT_METHOD, fmtDate, fmtDateTime, orderNumber, statusBadge } from '../../utils/orders';

// Copiar a referência Multibanco com um toque
const CopyValue = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(String(value).replace(/\s/g, '')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="font-mono font-bold text-base sm:text-lg tracking-wider">{value}</span>
        <button type="button" onClick={copy} className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-black" aria-label={`Copiar ${label}`}>
          {copied ? <span className="text-[11px] font-semibold text-green-700">Copiado</span> : <FaCopy aria-hidden="true" />}
        </button>
      </dd>
    </div>
  );
};

const Banner = ({ order, justPaid }) => {
  const { paymentStatus, orderStatus } = order;
  if (paymentStatus === 'paid') {
    const shipped = ['shipped', 'delivered'].includes(orderStatus);
    const cancelled = orderStatus === 'cancelled';
    return (
      <div className={`rounded-xl p-5 sm:p-6 flex gap-4 ${cancelled ? 'bg-zinc-100' : 'bg-green-50 border border-green-200'}`}>
        {cancelled ? <FaTimesCircle className="text-2xl text-zinc-500 shrink-0 mt-0.5" /> : shipped && !order.receivedAt ? <FaTruck className="text-2xl text-green-700 shrink-0 mt-0.5" /> : <FaCheckCircle className="text-2xl text-green-700 shrink-0 mt-0.5" />}
        <div>
          <h1 className="text-lg sm:text-xl font-bold">
            {cancelled ? 'Encomenda cancelada'
              : order.receivedAt ? 'Encomenda recebida'
              : orderStatus === 'delivered' ? 'Encomenda entregue'
              : shipped ? 'A tua encomenda está a caminho'
              : justPaid ? 'Obrigado pela tua compra!' : 'Pagamento confirmado'}
          </h1>
          <p className="text-sm text-zinc-700 mt-1">
            {cancelled
              ? 'Esta encomenda foi cancelada. Se já pagaste, o reembolso é feito pelo mesmo meio de pagamento.'
              : order.receivedAt
              ? 'Obrigado por confirmares! Esperamos que gostes. 💛'
              : orderStatus === 'delivered'
              ? 'A transportadora entregou a tua encomenda. Confirma abaixo que a recebeste.'
              : shipped
              ? 'Já enviámos a tua encomenda. Quando a receberes, confirma aqui.'
              : 'Recebemos o pagamento e vamos preparar a tua encomenda. Avisamos-te por email quando for enviada.'}
          </p>
        </div>
      </div>
    );
  }
  if (paymentStatus === 'awaiting') {
    return (
      <div className="rounded-xl p-5 sm:p-6 flex gap-4 bg-amber-50 border border-amber-200">
        <FaClock className="text-2xl text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold">Falta só pagar no Multibanco</h1>
          <p className="text-sm text-zinc-700 mt-1">Paga com os dados abaixo no multibanco ou no homebanking. Assim que o pagamento chegar, preparamos a tua encomenda.</p>
        </div>
      </div>
    );
  }
  if (paymentStatus === 'pending') {
    return (
      <div className="rounded-xl p-5 sm:p-6 flex gap-4 bg-amber-50 border border-amber-200">
        <FaClock className="text-2xl text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold">{justPaid ? 'A confirmar o pagamento...' : 'Pagamento por concluir'}</h1>
          <p className="text-sm text-zinc-700 mt-1">
            {justPaid ? 'Isto demora só alguns segundos.' : 'Ainda não recebemos o pagamento desta encomenda.'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-5 sm:p-6 flex gap-4 bg-zinc-100">
      <FaTimesCircle className="text-2xl text-zinc-500 shrink-0 mt-0.5" />
      <div>
        <h1 className="text-lg sm:text-xl font-bold">O pagamento não foi concluído</h1>
        <p className="text-sm text-zinc-700 mt-1">
          {paymentStatus === 'failed' ? 'O prazo para pagar terminou ou o pagamento foi recusado.' : 'Desististe do pagamento.'} Nada foi cobrado.
          Podes voltar a encomendar quando quiseres.
        </p>
      </div>
    </div>
  );
};

const OrderPage = () => {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [justPaid] = useState(() => params.get('pago') === '1');
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const tries = useRef(0);
  const [reviews, setReviews] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const openInvoice = async () => {
    setInvoiceBusy(true);
    setInvoiceError('');
    try {
      const { data } = await orderAPI.invoice(order._id);
      window.location.href = data.url; // abre o PDF da fatura
    } catch (err) {
      setInvoiceError(apiError(err));
    } finally {
      setInvoiceBusy(false);
    }
  };

  const load = useCallback(() =>
    orderAPI.getById(id)
      .then(({ data }) => { setOrder(data); return data; })
      .catch((err) => { setError(apiError(err, 'Não foi possível carregar a encomenda.')); return null; }), [id]);

  useEffect(() => {
    document.title = 'A tua encomenda — Trina';
    // Voltou do Stripe com o pagamento feito: o carrinho fica vazio
    if (justPaid) {
      clearCart();
      setParams({}, { replace: true }); // recarregar a página já não volta a esvaziar o carrinho
    }
    load();
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, [id]);

  // Logo depois de pagar, o Stripe pode demorar uns segundos a confirmar: volta a perguntar
  useEffect(() => {
    if (!justPaid || order?.paymentStatus !== 'pending' || tries.current >= 6) return;
    const t = setTimeout(() => { tries.current += 1; load(); }, 2500);
    return () => clearTimeout(t);
  }, [order, justPaid, load]);

  // Avaliações já feitas (só depois de confirmar a receção)
  useEffect(() => {
    if (order?.receivedAt) reviewAPI.forOrder(order._id).then(({ data }) => setReviews(data)).catch(() => {});
  }, [order?._id, order?.receivedAt]);

  // Vindo do email "Confirmar e avaliar": desce até às avaliações
  useEffect(() => {
    if (order && window.location.hash === '#avaliar') {
      setTimeout(() => document.getElementById('avaliar')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [Boolean(order)]);

  const confirmReceived = async () => {
    setConfirming(true);
    setConfirmError('');
    try {
      const { data } = await orderAPI.confirmReceived(order._id);
      setOrder(data);
      setTimeout(() => document.getElementById('avaliar')?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (err) {
      setConfirmError(apiError(err));
    } finally {
      setConfirming(false);
    }
  };

  // Um formulário por produto (o mesmo produto em cores diferentes conta uma vez)
  const toReview = order ? order.items.filter((it, i, all) => all.findIndex((x) => String(x.product) === String(it.product)) === i) : [];
  const canConfirm = order?.paymentStatus === 'paid' && ['shipped', 'delivered'].includes(order.orderStatus) && !order.receivedAt;

  const [label, cls] = order ? statusBadge(order) : [];
  const mb = order?.multibanco;

  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] bg-zinc-50 min-h-[70vh]">
        <div className="container-site py-6 sm:py-10 max-w-3xl">
          {error ? (
            <div className="text-center py-16">
              <p className="font-semibold">{error}</p>
              <Link to="/conta/encomendas" className="inline-block mt-6 py-2.5 px-6 bg-black text-white text-sm font-semibold rounded-sm">As minhas encomendas</Link>
            </div>
          ) : !order ? (
            <div className="animate-pulse space-y-4" aria-label="A carregar">
              <div className="h-24 bg-zinc-200 rounded-xl" /><div className="h-48 bg-zinc-200 rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-5">
              <Banner order={order} justPaid={justPaid} />

              {order.paymentStatus === 'paid' && order.orderStatus !== 'cancelled' && (
                <section className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
                  <h2 className="font-bold mb-4">Acompanhar a entrega</h2>
                  <DeliveryTimeline order={order} />
                  {order.trackingNumber && (
                    <p className="mt-1 text-sm bg-indigo-50 text-indigo-900 rounded-md px-3 py-2">
                      Número de seguimento: <strong className="font-mono">{order.trackingNumber}</strong>
                    </p>
                  )}
                  {canConfirm && (
                    <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
                      <p className="text-sm font-semibold">Já recebeste a encomenda?</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Confirma para sabermos que chegou bem. Depois podes avaliar os produtos.</p>
                      <button type="button" onClick={confirmReceived} disabled={confirming}
                        className="mt-3 py-2.5 px-5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
                        {confirming ? 'A confirmar...' : 'Sim, recebi a encomenda'}
                      </button>
                      {confirmError && <p role="alert" className="mt-2 text-sm text-red-700">{confirmError}</p>}
                    </div>
                  )}
                </section>
              )}

              {order.receivedAt && (
                <section id="avaliar" className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 scroll-mt-28">
                  <h2 className="font-bold">Avalia os teus produtos</h2>
                  <p className="text-xs text-zinc-500 mt-1">A tua opinião aparece na página do produto como "Compra verificada" e ajuda outras pessoas a escolher.</p>
                  <div className="mt-4 grid gap-3">
                    {toReview.map((it) => (
                      <ReviewForm key={String(it.product)} order={order} item={it}
                        review={reviews.find((r) => String(r.product) === String(it.product))}
                        onSaved={(r) => setReviews((all) => [...all.filter((x) => String(x.product) !== String(r.product)), r])} />
                    ))}
                  </div>
                </section>
              )}

              {order.paymentStatus === 'awaiting' && mb?.reference && (
                <section className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
                  <h2 className="font-bold">Pagamento por Multibanco</h2>
                  <dl className="mt-2 divide-y divide-zinc-100">
                    <CopyValue label="Entidade" value={mb.entity} />
                    <CopyValue label="Referência" value={mb.reference} />
                    <div className="flex items-center justify-between gap-3 py-2">
                      <dt className="text-sm text-zinc-600">Montante</dt>
                      <dd className="font-bold text-base sm:text-lg">{formatEUR(order.total)}</dd>
                    </div>
                  </dl>
                  {mb.expiresAt && <p className="text-xs text-zinc-500 mt-3">Paga até {fmtDateTime(mb.expiresAt)}. Depois desta data a referência deixa de funcionar.</p>}
                  {mb.voucherUrl && (
                    <a href={mb.voucherUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-red-800 hover:underline">
                      Ver o talão de pagamento <FaExternalLinkAlt className="text-xs" aria-hidden="true" />
                    </a>
                  )}
                </section>
              )}

              <section className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold">Encomenda #{orderNumber(order._id)}</h2>
                    <p className="text-xs text-zinc-500">{fmtDate(order.createdAt)}{order.paymentMethod && ` · ${PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod}`}</p>
                  </div>
                  {['awaiting', 'paid'].includes(order.paymentStatus) && <span className={`text-xs font-bold px-2 py-1 rounded ${cls}`}>{label}</span>}
                </div>


                <ul className="mt-4 divide-y divide-zinc-100">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex gap-3 py-3">
                      <img src={it.image} alt="" className="w-14 h-16 object-cover rounded-md bg-zinc-100 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold">{it.name}</span>
                        <span className="block text-xs text-zinc-500">
                          {[it.size && `Tamanho ${it.size}`, it.color?.name, `${it.quantity} × ${formatEUR(it.price)}`].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{formatEUR(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-2 border-t border-zinc-200 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-zinc-600">Subtotal</dt><dd className="tabular-nums">{formatEUR(order.subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-600">Envio</dt><dd className="tabular-nums">{order.shippingCost ? formatEUR(order.shippingCost) : 'Grátis'}</dd></div>
                  <div className="flex justify-between font-bold text-base pt-1"><dt>Total</dt><dd className="tabular-nums">{formatEUR(order.total)}</dd></div>
                </dl>
              </section>

              {order.shippingAddress?.street && (
                <section className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 text-sm">
                  <h2 className="font-bold mb-2">Entrega</h2>
                  <address className="not-italic text-zinc-700 leading-relaxed">
                    {order.shippingAddress.name}<br />
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.postalCode} {order.shippingAddress.city}, {order.shippingAddress.country}<br />
                    {order.shippingAddress.phone}
                  </address>
                  {order.nif && <p className="mt-2 text-zinc-600">NIF: {order.nif}</p>}
                </section>
              )}

              {order.paymentStatus === 'paid' && order.invoice?.status && (
                <section className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 text-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold">Fatura</h2>
                    <p className="text-zinc-600">
                      {order.invoice.status === 'issued' ? `Fatura-recibo ${order.invoice.number || ''} · também enviada para o teu email` : 'A fatura está a ser emitida e chega ao teu email em breve.'}
                    </p>
                    {invoiceError && <p role="alert" className="text-red-700 mt-1">{invoiceError}</p>}
                  </div>
                  {order.invoice.status === 'issued' && (
                    <button type="button" onClick={openInvoice} disabled={invoiceBusy}
                      className="py-2.5 px-5 border border-zinc-300 hover:border-black text-sm font-semibold rounded-sm disabled:opacity-60">
                      {invoiceBusy ? 'A abrir...' : 'Descarregar fatura (PDF)'}
                    </button>
                  )}
                </section>
              )}

              <div className="flex flex-wrap gap-3">
                <Link to="/conta/encomendas" className="py-2.5 px-5 bg-black hover:bg-zinc-800 text-white text-sm font-semibold rounded-sm">As minhas encomendas</Link>
                <Link to="/shop" className="py-2.5 px-5 border border-zinc-300 hover:border-black text-sm font-semibold rounded-sm">Continuar a comprar</Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderPage;
