import { useEffect, useState } from 'react';
import { orderAPI } from '../services/api';

// Textos e cores dos estados das encomendas (usados na conta, na página da encomenda e no admin)
export const ORDER_STATUS = {
  awaiting_payment: ['À espera de pagamento', 'bg-amber-100 text-amber-800'],
  processing: ['Em preparação', 'bg-blue-100 text-blue-800'],
  confirmed: ['Em preparação', 'bg-blue-100 text-blue-800'],
  shipped: ['A caminho', 'bg-indigo-100 text-indigo-800'],
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
  transferencia: 'Transferência',
};

export const orderNumber = (id) => String(id).slice(-6).toUpperCase();
export const fmtDate = (d) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Passos da entrega (para a linha do tempo)
export const deliverySteps = (order) => [
  { key: 'paid', label: 'Pagamento confirmado', date: order.paidAt },
  { key: 'shipped', label: 'A caminho', date: order.shippedAt },
  { key: 'delivered', label: 'Entregue', date: order.deliveredAt },
  { key: 'received', label: 'Recebida pelo cliente', date: order.receivedAt },
];

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

// Zona de envio pelo código postal (igual ao servidor): 9000-9499 Madeira · 9500-9999 Açores
export const ZONE_LABEL = { continente: 'Portugal continental', madeira: 'Madeira', acores: 'Açores' };
export const zoneFor = (postalCode = '') => {
  const m = /^(\d{4})/.exec(String(postalCode).trim());
  if (!m) return 'continente';
  const n = Number(m[1]);
  return n >= 9500 ? 'acores' : n >= 9000 ? 'madeira' : 'continente';
};
export const isIslands = (postalCode) => zoneFor(postalCode) !== 'continente';

// Regra de portes da zona: { cost, freeFrom }
export const shippingRule = (config, postalCode = '') =>
  !config || config.cost == null ? null : isIslands(postalCode) && config.islands ? config.islands : { cost: config.cost, freeFrom: config.freeFrom };

export const shippingFor = (config, subtotal, postalCode = '') => {
  const rule = shippingRule(config, postalCode);
  return !rule ? null : rule.freeFrom > 0 && subtotal >= rule.freeFrom ? 0 : rule.cost;
};
