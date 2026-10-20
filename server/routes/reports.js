import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, requirePerm } from '../middleware/auth.js';
import { ZONES } from '../utils/shipping.js';
import { vatRate } from '../utils/invoicing.js';

/*
  Estatísticas de vendas e exportação de encomendas.
    GET /api/reports/summary?from=2026-10-01&to=2026-10-31   (permissão "Estatísticas")
    GET /api/reports/orders.csv?from=...&to=...               (permissão "Encomendas") → abre no Excel
    GET /api/reports/accounting.csv?from=...&to=...           (permissão "Estatísticas") → para o contabilista,
                                                               só valores e faturas, sem dados pessoais dos clientes

  As datas são dias de Portugal (hora de Lisboa). Conta só encomendas pagas e não canceladas.
*/
const router = express.Router();
const TZ = 'Europe/Lisbon';
const DAY = 24 * 60 * 60 * 1000;

// "2026-10-20" do dia de Lisboa de uma data
const dayKey = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: TZ });

// Meia-noite de Lisboa de "2026-10-20", como data UTC
const lisbonMidnight = (key) => {
  const guess = new Date(`${key}T00:00:00Z`);
  const local = new Date(guess.toLocaleString('en-US', { timeZone: TZ }));
  const utc = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(guess.getTime() - (local - utc));
};

const validKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k || '') && !Number.isNaN(new Date(`${k}T00:00:00Z`));

// Lê ?from&to (por defeito, os últimos 30 dias). Máximo: 2 anos.
const readRange = (q) => {
  const today = dayKey(new Date());
  let to = validKey(q.to) ? q.to : today;
  let from = validKey(q.from) ? q.from : dayKey(Date.now() - 29 * DAY);
  if (from > to) [from, to] = [to, from];
  const start = lisbonMidnight(from);
  const nextDay = dayKey(new Date(`${to}T12:00:00Z`).getTime() + DAY);
  const end = lisbonMidnight(nextDay);
  if (end - start > 731 * DAY) return { error: 'Escolhe um período até 2 anos.' };
  return { from, to, start, end };
};

const PAID = { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } };
const paidIn = (start, end) => ({
  ...PAID,
  $or: [{ paidAt: { $gte: start, $lt: end } }, { paidAt: { $exists: false }, createdAt: { $gte: start, $lt: end } }],
});
const when = (o) => o.paidAt || o.createdAt;
const round2 = (n) => Math.round(n * 100) / 100;

const totals = (orders) => {
  const revenue = orders.reduce((a, o) => a + (o.total || 0), 0);
  return {
    revenue: round2(revenue),
    orders: orders.length,
    avgTicket: orders.length ? round2(revenue / orders.length) : 0,
    items: orders.reduce((a, o) => a + o.items.reduce((b, i) => b + i.quantity, 0), 0),
    discount: round2(orders.reduce((a, o) => a + (o.discount || 0), 0)),
    shipping: round2(orders.reduce((a, o) => a + (o.shippingCost || 0), 0)),
  };
};

// Dias (até 62 dias) ou meses (períodos maiores)
const buckets = (from, to) => {
  const days = Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / DAY) + 1;
  const keys = [];
  if (days <= 62) {
    for (let i = 0; i < days; i += 1) keys.push(new Date(new Date(`${from}T00:00:00Z`).getTime() + i * DAY).toISOString().slice(0, 10));
    return { unit: 'day', keys, keyOf: (d) => dayKey(d) };
  }
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return { unit: 'month', keys, keyOf: (d) => dayKey(d).slice(0, 7) };
};

router.get('/summary', protect, requirePerm('reports'), async (req, res) => {
  try {
    const range = readRange(req.query);
    if (range.error) return res.status(400).json({ message: range.error });
    const { from, to, start, end } = range;
    const length = end - start;

    const [orders, previous, toShip, awaiting, products] = await Promise.all([
      Order.find(paidIn(start, end)).select('items total subtotal discount shippingCost shippingZone paymentMethod paidAt createdAt user guestEmail').lean(),
      Order.find(paidIn(new Date(start - length), start)).select('items total discount shippingCost').lean(),
      Order.countDocuments({ paymentStatus: 'paid', orderStatus: { $in: ['processing', 'confirmed'] } }),
      Order.countDocuments({ paymentStatus: 'awaiting', orderStatus: { $ne: 'cancelled' } }),
      Product.find({}).select('name category images trackStock variants active').lean(),
    ]);
    const productById = new Map(products.map((p) => [String(p._id), p]));

    // Por dia / mês
    const b = buckets(from, to);
    const series = new Map(b.keys.map((k) => [k, { key: k, revenue: 0, orders: 0 }]));
    for (const o of orders) {
      const row = series.get(b.keyOf(when(o)));
      if (row) { row.revenue += o.total || 0; row.orders += 1; }
    }

    // Produtos, categorias, pagamentos e zonas
    const byProduct = new Map();
    const byCategory = new Map();
    const byMethod = new Map();
    const byZone = new Map();
    const customers = new Set();
    for (const o of orders) {
      customers.add(o.user ? String(o.user) : `g:${o.guestEmail}`);
      // O desconto é repartido pelas peças, para a faturação de cada produto bater certo
      const share = o.subtotal > 0 ? 1 - (o.discount || 0) / o.subtotal : 1;
      for (const i of o.items) {
        const id = String(i.product);
        const p = productById.get(id);
        const value = i.price * i.quantity * share;
        const row = byProduct.get(id) || { id, name: p?.name || i.name, image: p?.images?.[0] || i.image, quantity: 0, revenue: 0 };
        row.quantity += i.quantity;
        row.revenue += value;
        byProduct.set(id, row);
        const cat = p?.category || 'Outros';
        const c = byCategory.get(cat) || { name: cat, quantity: 0, revenue: 0 };
        c.quantity += i.quantity;
        c.revenue += value;
        byCategory.set(cat, c);
      }
      const method = o.paymentMethod || 'outro';
      const m = byMethod.get(method) || { method, orders: 0, revenue: 0 };
      m.orders += 1;
      m.revenue += o.total || 0;
      byMethod.set(method, m);
      const zone = o.shippingZone || 'continente';
      const z = byZone.get(zone) || { zone, label: ZONES[zone] || zone, orders: 0, revenue: 0 };
      z.orders += 1;
      z.revenue += o.total || 0;
      byZone.set(zone, z);
    }
    const sorted = (map, key = 'revenue') => [...map.values()]
      .map((r) => ({ ...r, revenue: round2(r.revenue) }))
      .sort((a, c) => c[key] - a[key]);

    // Peças com pouco stock (produtos visíveis na loja)
    const lowStock = [];
    for (const p of products) {
      if (!p.trackStock || p.active === false) continue;
      for (const v of p.variants || []) {
        if (v.stock <= 2) lowStock.push({ id: String(p._id), name: p.name, size: v.size, color: v.color, stock: v.stock });
      }
    }
    lowStock.sort((a, c) => a.stock - c.stock || a.name.localeCompare(c.name));

    res.json({
      from, to,
      unit: b.unit,
      kpis: { ...totals(orders), customers: customers.size },
      previous: totals(previous),
      series: [...series.values()].map((r) => ({ ...r, revenue: round2(r.revenue) })),
      topProducts: sorted(byProduct, 'quantity').slice(0, 8),
      categories: sorted(byCategory),
      payments: sorted(byMethod),
      zones: sorted(byZone),
      lowStock: lowStock.slice(0, 20),
      lowStockTotal: lowStock.length,
      pending: { toShip, awaiting },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ---------- Exportar para o Excel ----------

const STATUS = {
  awaiting_payment: 'A aguardar pagamento', processing: 'A preparar', confirmed: 'A preparar',
  shipped: 'A caminho', delivered: 'Entregue', cancelled: 'Cancelada',
};
const PAYMENT = { pending: 'Por pagar', awaiting: 'A aguardar Multibanco', paid: 'Pago', failed: 'Falhou', expired: 'Expirou' };
const METHOD = { card: 'Cartão', mb_way: 'MB WAY', multibanco: 'Multibanco', paypal: 'PayPal', klarna: 'Klarna', link: 'Link', revolut_pay: 'Revolut Pay', transferencia: 'Transferência' };

// O Excel português usa ";" entre colunas e vírgula nas casas decimais
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita que o Excel trate o texto como fórmula
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');
const dateTime = (d) => (d ? new Date(d).toLocaleString('pt-PT', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : '');

const VIEWS = {
  pagas: { paymentStatus: 'paid' },
  todas: { paymentStatus: { $in: ['awaiting', 'paid', 'failed'] } },
};

router.get('/orders.csv', protect, requirePerm('orders'), async (req, res) => {
  try {
    const range = readRange(req.query);
    if (range.error) return res.status(400).json({ message: range.error });
    const view = VIEWS[req.query.view] ? req.query.view : 'pagas';
    const orders = await Order.find({ ...VIEWS[view], createdAt: { $gte: range.start, $lt: range.end } })
      .select('-stripeSessionId -stripePaymentIntentId -guestToken')
      .populate('user', 'name email')
      .sort({ createdAt: 1 })
      .limit(20000)
      .lean();

    const header = ['Nº', 'Data', 'Estado', 'Pagamento', 'Método', 'Cliente', 'Email', 'Telefone', 'NIF', 'Morada', 'Código postal',
      'Localidade', 'Zona', 'Artigos', 'Peças', 'Subtotal (€)', 'Desconto (€)', 'Código de desconto', 'Portes (€)', 'Total (€)', 'Fatura', 'Nº de seguimento'];
    const rows = orders.map((o) => {
      const a = o.shippingAddress || {};
      const items = o.items.map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size}${i.color?.name ? `, ${i.color.name}` : ''})` : i.color?.name ? ` (${i.color.name})` : ''}`).join(' | ');
      return [
        String(o._id).slice(-6).toUpperCase(),
        dateTime(o.paidAt || o.createdAt),
        STATUS[o.orderStatus] || o.orderStatus,
        PAYMENT[o.paymentStatus] || o.paymentStatus,
        METHOD[o.paymentMethod] || o.paymentMethod || '',
        a.name || o.user?.name || '',
        o.user?.email || o.guestEmail || '',
        a.phone || '',
        o.nif || '',
        a.street || '',
        a.postalCode || '',
        a.city || '',
        ZONES[o.shippingZone || 'continente'],
        items,
        o.items.reduce((n, i) => n + i.quantity, 0),
        money(o.subtotal),
        money(o.discount),
        o.couponCode || '',
        money(o.shippingCost),
        money(o.total),
        o.invoice?.number || '',
        o.trackingNumber || '',
      ].map(cell).join(';');
    });
    // "﻿" no início: o Excel percebe os acentos (UTF-8)
    const csv = `﻿${[header.map(cell).join(';'), ...rows].join('\r\n')}\r\n`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="encomendas-${range.from}-a-${range.to}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ---------- Exportação para a contabilidade (sem dados pessoais) ----------
/*
  Uma linha por encomenda paga, com o valor sem IVA, o IVA e o total, e o número da fatura.
  Não leva nomes, emails, telefones, moradas nem NIF: o contabilista encontra tudo isso na fatura (InvoiceXpress).
  As encomendas canceladas depois de pagas aparecem como "Reembolsada" (confirmar a nota de crédito).
*/
router.get('/accounting.csv', protect, requirePerm('reports'), async (req, res) => {
  try {
    const range = readRange(req.query);
    if (range.error) return res.status(400).json({ message: range.error });
    const orders = await Order.find({
      paymentStatus: 'paid',
      $or: [{ paidAt: { $gte: range.start, $lt: range.end } }, { paidAt: { $exists: false }, createdAt: { $gte: range.start, $lt: range.end } }],
    })
      .select('items subtotal discount couponCode shippingCost shippingZone total paymentMethod paidAt createdAt orderStatus invoice')
      .sort({ paidAt: 1, createdAt: 1 })
      .limit(20000)
      .lean();

    const rate = vatRate();
    const cents = (n) => Math.round((Number(n) || 0) * 100);
    const header = ['Nº encomenda', 'Data do pagamento', 'Situação', 'Fatura', 'Método de pagamento', 'Zona', 'Peças',
      'Produtos (€)', 'Desconto (€)', 'Código de desconto', 'Portes (€)', `Valor sem IVA (€)`, `IVA ${rate}% (€)`, 'Total pago (€)'];
    const sum = { items: 0, products: 0, discount: 0, shipping: 0, base: 0, vat: 0, total: 0 };
    const rows = orders.map((o) => {
      const refunded = o.orderStatus === 'cancelled';
      const totalC = cents(o.total);
      const baseC = Math.round(totalC / (1 + rate / 100));
      const vatC = totalC - baseC;
      const items = o.items.reduce((n, i) => n + i.quantity, 0);
      if (!refunded) {
        sum.items += items; sum.products += cents(o.subtotal); sum.discount += cents(o.discount);
        sum.shipping += cents(o.shippingCost); sum.base += baseC; sum.vat += vatC; sum.total += totalC;
      }
      return [
        String(o._id).slice(-6).toUpperCase(),
        dateTime(o.paidAt || o.createdAt),
        refunded ? 'Reembolsada' : 'Paga',
        o.invoice?.number || (o.invoice?.status === 'failed' ? 'Falhou — ver painel' : 'Por emitir'),
        METHOD[o.paymentMethod] || o.paymentMethod || '',
        ZONES[o.shippingZone || 'continente'],
        items,
        money(o.subtotal),
        money(o.discount),
        o.couponCode || '',
        money(o.shippingCost),
        money(baseC / 100),
        money(vatC / 100),
        money(totalC / 100),
      ].map(cell).join(';');
    });
    const totalRow = ['TOTAL (sem reembolsadas)', '', `${orders.filter((o) => o.orderStatus !== 'cancelled').length} encomendas`, '', '', '', sum.items,
      money(sum.products / 100), money(sum.discount / 100), '', money(sum.shipping / 100), money(sum.base / 100), money(sum.vat / 100), money(sum.total / 100)]
      .map(cell).join(';');
    const note = cell(`Período: ${range.from} a ${range.to}. IVA calculado à taxa de ${rate}% sobre o total pago (portes incluídos). Os valores oficiais são os das faturas no InvoiceXpress.`);
    const csv = `\uFEFF${[header.map(cell).join(';'), ...rows, '', totalRow, '', note].join('\r\n')}\r\n`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="contabilidade-${range.from}-a-${range.to}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

export default router;
