import { useEffect, useState } from 'react';
import { orderAPI } from '../services/api';

// Textos e cores dos estados das encomendas (usados na conta, na página da encomenda e no admin)
export const ORDER_STATUS = {
  awaiting_payment: ['À espera de pagamento', 'bg-amber-100 text-amber-800'],
  processing: ['Em preparação', 'bg-blue-100 text-blue-800'],
  confirmed: ['Em preparação', 'bg-blue-100 text-blue-800'],
  shipped: ['Enviada', 'bg-indigo-100 text-indigo-800'],
  delivered: ['Entregue', 'bg-green-100 text-green-800'],
  cancelled: ['Cancelada', 'bg-zinc-200 text-zinc-700'],
};

export const PAYMENT_STATUS = {
  pending: 'Por pagar',
  awaiting: 'À espera do pagamento Multibanco',
  paid: 'Pago',
  failed: 'Pagamento não concluído',
  expired: 'Pagamento cancelado',
};

export const PAYMENT_METHOD = {
  card: 'Cartão',
  mb_way: 'MB WAY',
  multibanco: 'Multibanco',
  paypal: 'PayPal',
  klarna: 'Klarna',
  link: 'Link',
  revolut_pay: 'Revolut Pay',
};

export const orderNumber = (id) => String(id).slice(-6).toUpperCase();
export const fmtDate = (d) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Estado da encomenda com cor
export const statusBadge = (order) => ORDER_STATUS[order.orderStatus] || [order.orderStatus, 'bg-zinc-100 text-zinc-700'];

// Portes de envio definidos no servidor (pedido feito uma só vez)
let shippingCache = null;
export const useShipping = () => {
  const [config, setConfig] = useState(shippingCache);
  useEffect(() => {
    if (shippingCache) return;
    orderAPI.shipping()
      .then(({ data }) => { shippingCache = data; setConfig(data); })
      .catch(() => setConfig({ cost: null, freeFrom: 0, payments: false, offline: true }));
  }, []);
  return config;
};

export const shippingFor = (config, subtotal) =>
  !config || config.cost == null ? null : config.freeFrom > 0 && subtotal >= config.freeFrom ? 0 : config.cost;
