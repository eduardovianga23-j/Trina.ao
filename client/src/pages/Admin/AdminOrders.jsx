import { useEffect, useState } from 'react';
import { FaChevronDown, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import AdminLayout from './AdminLayout';
import { orderAPI, apiError } from '../../services/api';
import { formatEUR } from '../../utils/format';
import { PAYMENT_METHOD, PAYMENT_STATUS, fmtDateTime, orderNumber, statusBadge } from '../../utils/orders';
import DeliveryTimeline from '../../assets/components/ui/DeliveryTimeline';

/*
  /admin/encomendas — só o administrador principal.
  Vê as encomendas pagas, a morada de entrega e marca-as como enviadas ou entregues.
  Os reembolsos fazem-se no painel do Stripe.
*/
const VIEWS = [
  ['enviar', 'Para enviar'],
  ['aguardar', 'À espera de Multibanco'],
  ['caminho', 'A caminho'],
  ['entregues', 'Entregues'],
  ['todas', 'Todas'],
];

const OrderRow = ({ order, onChange }) => {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [label, cls] = order.paymentStatus === 'awaiting' && order.orderStatus !== 'cancelled'
    ? ['Por pagar (Multibanco)', 'bg-amber-100 text-amber-800']
    : order.paymentStatus === 'failed' ? ['Não paga', 'bg-zinc-200 text-zinc-700']
    : order.receivedAt ? ['Recebida pelo cliente ✓', 'bg-green-100 text-green-800'] : statusBadge(order);
  const a = order.shippingAddress || {};
  const qty = order.items.reduce((acc, i) => acc + i.quantity, 0);

  const update = async (data) => {
    setBusy(true);
    setError('');
    try {
      const { data: updated } = await orderAPI.updateStatus(order._id, data);
      onChange(updated);
      setConfirmCancel(false);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const btn = 'py-2 px-4 text-sm font-semibold rounded-md disabled:opacity-50';
  return (
    <li className="bg-white rounded-xl border border-zinc-200">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full text-left p-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">#{orderNumber(order._id)} · {a.name || order.user?.name}</span>
          <span className="block text-xs text-zinc-500">{fmtDateTime(order.createdAt)} · {qty} {qty === 1 ? 'artigo' : 'artigos'}{order.paymentMethod && ` · ${PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod}`}</span>
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded ${cls}`}>{label}</span>
        <span className="font-bold text-sm tabular-nums w-20 text-right">{formatEUR(order.total)}</span>
        <FaChevronDown className={`text-zinc-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="border-t border-zinc-100 p-4 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Produtos</h3>
            <ul className="divide-y divide-zinc-100">
              {order.items.map((it, i) => (
                <li key={i} className="flex gap-3 py-2">
                  <img src={it.image} alt="" className="w-12 h-14 object-cover rounded bg-zinc-100 shrink-0" />
                  <span className="flex-1 min-w-0 text-sm">
                    <span className="block font-semibold">{it.name}</span>
                    <span className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-600">
                      {it.size && <span>Tamanho <strong>{it.size}</strong></span>}
                      {it.color?.name && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: it.color.hex }} />
                          <strong>{it.color.name}</strong>
                        </span>
                      )}
                      <span>Quantidade <strong>{it.quantity}</strong></span>
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">{formatEUR(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500 mt-2">
              Subtotal {formatEUR(order.subtotal)} · Envio {order.shippingCost ? formatEUR(order.shippingCost) : 'grátis'} · {PAYMENT_STATUS[order.paymentStatus]}
            </p>
          </div>

          <div className="text-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Enviar para</h3>
            <address className="not-italic leading-relaxed select-all">
              {a.name}<br />{a.street}<br />{a.postalCode} {a.city}<br />{a.country}
            </address>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-zinc-700">
              {a.phone && <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 hover:underline"><FaPhoneAlt className="text-xs" />{a.phone}</a>}
              {order.user?.email && <a href={`mailto:${order.user.email}`} className="inline-flex items-center gap-1.5 hover:underline"><FaEnvelope className="text-xs" />{order.user.email}</a>}
            </p>
            {order.nif && <p className="mt-1">NIF: <strong>{order.nif}</strong></p>}
            {order.notes && <p className="mt-2 bg-amber-50 rounded px-3 py-2"><strong>Nota:</strong> {order.notes}</p>}

            {order.paymentStatus === 'paid' && order.orderStatus !== 'cancelled' && (
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Entrega</h3>
                <DeliveryTimeline order={order} compact />
                {order.orderStatus === 'delivered' && !order.receivedAt && (
                  <p className="text-xs text-amber-800 bg-amber-50 rounded px-3 py-2">À espera de o cliente confirmar que recebeu. Já lhe enviámos um email a pedir.</p>
                )}
              </div>
            )}

            {order.paymentStatus === 'paid' && ['processing', 'confirmed', 'shipped'].includes(order.orderStatus) && (
              <div className="mt-5 grid gap-3">
                <div>
                  <label htmlFor={`trk-${order._id}`} className="block text-xs font-semibold mb-1">Número de seguimento (opcional)</label>
                  <input id={`trk-${order._id}`} value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={60}
                    placeholder="Ex.: código dos CTT"
                    className="w-full border border-zinc-300 rounded-md px-3 py-2 text-base sm:text-sm outline-none focus:border-black" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['processing', 'confirmed'].includes(order.orderStatus) && (
                    <button disabled={busy} onClick={() => update({ orderStatus: 'shipped', trackingNumber: tracking })} className={`${btn} bg-black hover:bg-zinc-800 text-white`}>
                      Marcar como enviada
                    </button>
                  )}
                  {order.orderStatus === 'shipped' && (
                    <>
                      <button disabled={busy} onClick={() => update({ orderStatus: 'delivered' })} className={`${btn} bg-green-700 hover:bg-green-800 text-white`}>Confirmar entrega feita</button>
                      {tracking !== (order.trackingNumber || '') && (
                        <button disabled={busy} onClick={() => update({ trackingNumber: tracking })} className={`${btn} border border-zinc-300`}>Guardar n.º de seguimento</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {['awaiting', 'paid'].includes(order.paymentStatus) && !['cancelled', 'delivered'].includes(order.orderStatus) && (
              <div className="mt-4">
                {!confirmCancel ? (
                  <button onClick={() => setConfirmCancel(true)} className="text-sm font-semibold text-red-800 hover:underline">Cancelar encomenda</button>
                ) : (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm">
                      {order.paymentStatus === 'paid'
                        ? 'Cancelar? Depois faz o reembolso no painel do Stripe (Pagamentos → escolhe o pagamento → Reembolsar).'
                        : 'Cancelar? A referência Multibanco deixa de funcionar.'}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button disabled={busy} onClick={() => update({ orderStatus: 'cancelled' })} className={`${btn} bg-red-800 hover:bg-red-900 text-white`}>Sim, cancelar</button>
                      <button onClick={() => setConfirmCancel(false)} className={`${btn} border border-zinc-300`}>Não</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </li>
  );
};

const AdminOrders = () => {
  const [view, setView] = useState('enviar');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData((d) => (d ? { ...d, orders: null } : d));
    setError('');
    orderAPI.getAll(view).then(({ data }) => setData(data)).catch((err) => setError(apiError(err)));
  }, [view]);

  const replace = (updated) => {
    setData((d) => ({ ...d, orders: d.orders.map((o) => (o._id === updated._id ? updated : o)) }));
    // Atualiza os números dos separadores
    orderAPI.getAll(view).then(({ data: fresh }) => setData((d) => ({ ...d, counts: fresh.counts }))).catch(() => {});
  };

  return (
    <AdminLayout title="Encomendas">
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 [scrollbar-width:none]" role="tablist">
        {VIEWS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={view === key} onClick={() => setView(key)}
            className={`shrink-0 px-3 py-2 rounded-full text-sm font-semibold border ${view === key ? 'bg-black text-white border-black' : 'bg-white border-zinc-300 hover:border-black'}`}>
            {label}{data?.counts && <span className={`ml-1.5 ${view === key ? 'text-zinc-300' : 'text-zinc-500'}`}>{data.counts[key]}</span>}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : !data?.orders ? (
        <p className="text-sm text-zinc-500">A carregar...</p>
      ) : data.orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center text-sm text-zinc-500">
          {view === 'enviar' ? 'Não há encomendas para enviar. 🎉' : 'Não há encomendas aqui.'}
        </div>
      ) : (
        <ul className="grid gap-3">
          {data.orders.map((o) => <OrderRow key={o._id} order={o} onChange={replace} />)}
        </ul>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
