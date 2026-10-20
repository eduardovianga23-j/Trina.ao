import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { getStripe, stripeEnabled, stripeMessage } from '../utils/stripe.js';
import { shippingConfig, shippingFor, zoneFor } from '../utils/shipping.js';
import { can } from '../utils/permissions.js';
import Coupon from '../models/Coupon.js';
import { evaluateCoupon, couponLabel, normCode } from '../utils/coupons.js';
import { hit } from '../utils/rateLimit.js';
import { invoicingEnabled, autoInvoicing, issueInvoice, invoicePdfUrl } from '../utils/invoicing.js';
import { reserveStock, releaseOrderStock, lowStockFor } from '../utils/stock.js';
import {
  emailOrderPaid, emailMultibanco, emailShipped, emailDelivered, emailCancelled,
  emailAdminNewOrder, emailAdminReceived,
} from '../utils/emails.js';

/*
  Como funciona uma compra:
  1. O cliente preenche a morada em /checkout → POST /api/orders
  2. O servidor confirma os produtos e os preços na base de dados (nunca confia nos preços do navegador),
     cria a encomenda "por pagar" e uma página de pagamento no Stripe.
  3. O cliente paga no Stripe (MB WAY, Multibanco, cartão...) e volta para /encomenda/:id
  4. O estado do pagamento é confirmado diretamente com o Stripe (webhook, ao abrir a encomenda
     e de 5 em 5 minutos pelo próprio servidor).
  5. Entrega: Em preparação → A caminho (a loja envia) → Entregue (a loja confirma) → o cliente confirma
     que recebeu e pode avaliar os produtos.
  As peças saem do stock quando o cliente vai pagar e voltam se o pagamento não for feito.
*/

const cents = (eur) => Math.round(Number(eur) * 100);
const clean = (v, max = 120) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
const shortId = (id) => String(id).slice(-6).toUpperCase();

// Estados que contam como "encomenda feita" (os outros são pagamentos abandonados)
const REAL_ORDER = ['awaiting', 'paid', 'failed'];

// ---------- Quem pode ver uma encomenda ----------
// Com conta: o dono. Sem conta: quem tem o link com o código secreto (?t=...), que vai nos emails.
const tokenMatches = (order, t) => {
  if (!order?.guestToken || typeof t !== 'string' || t.length !== order.guestToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(t), Buffer.from(order.guestToken));
};
const isCustomer = (req, order) =>
  Boolean(order) && ((req.user && order.user && String(order.user._id || order.user) === String(req.user._id))
    || tokenMatches(order, req.query?.t || req.body?.t));
const canView = (req, order) => isCustomer(req, order) || (req.user && can(req.user, 'orders'));

// NIF português: 9 dígitos com dígito de controlo
const validNif = (nif) => {
  if (!/^\d{9}$/.test(nif)) return false;
  const sum = [...nif.slice(0, 8)].reduce((acc, d, i) => acc + Number(d) * (9 - i), 0);
  const check = 11 - (sum % 11);
  return (check >= 10 ? 0 : check) === Number(nif[8]);
};

const readAddress = (body = {}) => {
  const a = body.shippingAddress || {};
  const address = {
    name: clean(a.name, 80),
    phone: clean(a.phone, 20).replace(/[\s().-]/g, ''),
    street: clean(a.street, 150),
    postalCode: clean(a.postalCode, 8),
    city: clean(a.city, 60),
    country: 'Portugal',
  };
  const nif = clean(body.nif, 12).replace(/\s/g, '');
  if (address.name.length < 3) return { error: 'Indica o nome de quem vai receber a encomenda' };
  if (!/^\+?\d{9,15}$/.test(address.phone)) return { error: 'Indica um número de telemóvel válido' };
  if (address.street.length < 5) return { error: 'Indica a morada completa (rua, número, andar)' };
  if (!/^\d{4}-\d{3}$/.test(address.postalCode)) return { error: 'O código postal tem de ter o formato 1234-567' };
  if (address.city.length < 2) return { error: 'Indica a localidade' };
  if (nif && !validNif(nif)) return { error: 'O NIF não é válido (confirma os 9 dígitos)' };
  return { address, nif, notes: clean(body.notes, 500) };
};

// Confirma cada produto do carrinho na base de dados
const readItems = async (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { error: 'O carrinho está vazio' };
  if (rawItems.length > 30) return { error: 'Demasiados produtos numa só encomenda' };

  const ids = [...new Set(rawItems.map((i) => String(i?.product)))];
  if (ids.some((id) => !mongoose.isValidObjectId(id))) return { error: 'Há um produto inválido no carrinho' };
  const products = await Product.find({ _id: { $in: ids }, active: true }).select('name images price sizes hasColors colors trackStock variants');
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const raw of rawItems) {
    const p = byId.get(String(raw.product));
    if (!p) return { error: 'Um dos produtos do carrinho já não está à venda. Remove-o e tenta novamente.' };
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return { error: `Quantidade inválida para "${p.name}" (máximo 20)` };

    const size = clean(raw.size, 10);
    if (p.sizes.length ? !p.sizes.includes(size) : size) {
      return { error: `O tamanho de "${p.name}" já não está disponível. Remove-o do carrinho e escolhe outra vez.` };
    }
    let color = null;
    if (p.hasColors) {
      color = p.colors.find((c) => c.name === clean(raw.color?.name, 40));
      if (!color) return { error: `A cor de "${p.name}" já não está disponível. Remove-o do carrinho e escolhe outra vez.` };
    }
    items.push({
      product: p._id,
      name: p.name,
      image: color?.image || p.images[0] || '',
      price: p.price,
      quantity,
      size,
      color: color ? { name: color.name, hex: color.hex } : undefined,
    });
  }
  return { items, productsById: byId };
};

const createCheckoutSession = async (order, email) => {
  const describe = (it) => [it.size && `Tamanho ${it.size}`, it.color?.name && `Cor ${it.color.name}`].filter(Boolean).join(' · ');
  const stripe = getStripe();
  // Código de desconto: um "cupão" do Stripe só para este pagamento, com o valor já calculado aqui
  let discounts;
  if (order.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: cents(order.discount),
      currency: 'eur',
      duration: 'once',
      max_redemptions: 1,
      name: `Código ${order.couponCode}`.slice(0, 40),
      metadata: { orderId: String(order._id) },
    });
    discounts = [{ coupon: coupon.id }];
  }
  return stripe.checkout.sessions.create({
    ...(discounts && { discounts }),
    mode: 'payment',
    locale: 'pt',
    customer_email: email,
    client_reference_id: String(order._id),
    metadata: { orderId: String(order._id) },
    payment_intent_data: {
      description: `Encomenda #${shortId(order._id)}`,
      metadata: { orderId: String(order._id) },
    },
    line_items: order.items.map((it) => ({
      quantity: it.quantity,
      price_data: {
        currency: 'eur',
        unit_amount: cents(it.price),
        product_data: {
          name: it.name,
          ...(describe(it) ? { description: describe(it) } : {}),
          // O Stripe só aceita fotos com endereço público (https)
          ...(/^https:\/\//.test(it.image) ? { images: [it.image] } : {}),
        },
      },
    })),
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: order.shippingCost ? 'Envio para Portugal' : 'Envio grátis',
        fixed_amount: { amount: cents(order.shippingCost), currency: 'eur' },
      },
    }],
    // A página de pagamento fecha ao fim de 31 minutos (as peças reservadas voltam ao stock)
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${clientUrl()}/encomenda/${order._id}?pago=1${order.guestToken ? `&t=${order.guestToken}` : ''}`,
    cancel_url: `${clientUrl()}/cart?cancelado=${order._id}${order.guestToken ? `&t=${order.guestToken}` : ''}`,
  });
};

// ---------- Estado do pagamento (vem sempre do Stripe) ----------

const markPaid = async (order, method, piId) => {
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' } },
    {
      paymentStatus: 'paid',
      paidAt: new Date(),
      orderStatus: 'processing',
      ...(method && { paymentMethod: method }),
      ...(piId && { stripePaymentIntentId: piId }),
    },
    { new: true }
  );
  // Só a primeira confirmação conta as vendas e envia os emails (o webhook e a página podem chegar ao mesmo tempo)
  if (updated) {
    await Product.bulkWrite(updated.items.map((i) => ({
      updateOne: { filter: { _id: i.product }, update: { $inc: { sold: i.quantity } } },
    })));
    if (updated.couponCode) await Coupon.updateOne({ code: updated.couponCode }, { $inc: { usedCount: 1 } });
    await updated.populate('user', 'name email');
    emailOrderPaid(updated);
    lowStockFor(updated.items).then((low) => emailAdminNewOrder(updated, low)).catch(() => emailAdminNewOrder(updated));
    if (autoInvoicing()) createInvoiceFor(updated._id); // fatura certificada (InvoiceXpress ligado e pagamentos reais)
  }
  return updated || Order.findById(order._id);
};

// ---------- Fatura (InvoiceXpress) ----------
// Emite a fatura-recibo de uma encomenda paga (uma só vez; se falhar, pode tentar outra vez)
export const createInvoiceFor = async (orderId) => {
  if (!invoicingEnabled()) return null;
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' }, $or: [{ invoice: { $exists: false } }, { 'invoice.status': 'failed' }] },
    { $set: { 'invoice.status': 'creating', 'invoice.updatedAt': new Date() }, $inc: { 'invoice.attempts': 1 } },
    { new: true }
  ).populate('user', 'name email');
  if (!order) return null;
  try {
    const inv = await issueInvoice(order);
    console.log(`🧾 Fatura ${inv.number} emitida para a encomenda ${order._id}`);
    return Order.findByIdAndUpdate(order._id, {
      $set: { 'invoice.status': 'issued', 'invoice.id': inv.id, 'invoice.number': inv.number, 'invoice.permalink': inv.permalink, 'invoice.updatedAt': new Date() },
      $unset: { 'invoice.error': 1 },
    }, { new: true });
  } catch (err) {
    console.error(`🧾 Não foi possível emitir a fatura da encomenda ${order._id}:`, err.message);
    return Order.findByIdAndUpdate(order._id, {
      $set: { 'invoice.status': 'failed', 'invoice.error': String(err.message).slice(0, 300), 'invoice.updatedAt': new Date() },
    }, { new: true });
  }
};

// Atualiza a encomenda a partir da sessão do Stripe (com o payment_intent expandido)
export const applySession = async (order, session) => {
  if (!order || session.id !== order.stripeSessionId) return order;
  const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
  const method = pi?.payment_method?.type || '';

  if (session.payment_status === 'paid') {
    if (session.amount_total !== cents(order.total) || session.currency !== 'eur') {
      console.error(`⚠️  Encomenda ${order._id}: o valor pago no Stripe não corresponde ao total. Verifica no painel do Stripe.`);
      return order;
    }
    return markPaid(order, method, pi?.id);
  }

  if (session.status === 'expired') {
    const expired = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'pending' },
      { paymentStatus: 'expired', orderStatus: 'cancelled' },
      { new: true }
    );
    if (expired) await releaseOrderStock(order._id);
    return expired || order;
  }

  // Pagamento diferido (Multibanco): a sessão terminou mas o dinheiro ainda não chegou
  if (session.status === 'complete' && session.payment_status === 'unpaid') {
    if (pi && ['canceled', 'requires_payment_method'].includes(pi.status)) {
      const failed = await Order.findOneAndUpdate(
        { _id: order._id, paymentStatus: { $in: ['pending', 'awaiting'] } },
        { paymentStatus: 'failed', orderStatus: 'cancelled' },
        { new: true }
      ).populate('user', 'name email');
      if (failed) {
        await releaseOrderStock(order._id);
        emailCancelled(failed, 'O prazo para pagar a referência Multibanco terminou.');
      }
      return failed || order;
    }
    const mb = pi?.next_action?.multibanco_display_details;
    const changes = {
      paymentStatus: 'awaiting',
      ...(method && { paymentMethod: method }),
      ...(pi?.id && { stripePaymentIntentId: pi.id }),
      ...(mb && {
        multibanco: {
          entity: mb.entity,
          reference: mb.reference,
          expiresAt: mb.expires_at ? new Date(mb.expires_at * 1000) : undefined,
          voucherUrl: mb.hosted_voucher_url,
        },
      }),
    };
    // Primeira vez (pending → awaiting): envia os dados de pagamento por email
    let awaiting = await Order.findOneAndUpdate({ _id: order._id, paymentStatus: 'pending' }, changes, { new: true }).populate('user', 'name email');
    if (awaiting?.multibanco?.reference) emailMultibanco(awaiting);
    if (!awaiting) awaiting = await Order.findOneAndUpdate({ _id: order._id, paymentStatus: 'awaiting' }, changes, { new: true });
    return awaiting || order;
  }
  return order;
};

// Pergunta ao Stripe o estado atual (lança erro se o Stripe falhar)
const syncOrder = async (order) => {
  const stripe = getStripe();
  if (!stripe || !order?.stripeSessionId || !['pending', 'awaiting'].includes(order.paymentStatus)) return order;
  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, { expand: ['payment_intent.payment_method'] });
  return applySession(order, session);
};

const trySync = async (order) => {
  try {
    return await syncOrder(order);
  } catch (err) {
    console.error('Stripe (consultar pagamento):', err.message);
    return order;
  }
};

// Não envia ao navegador os identificadores internos do Stripe
const publicOrder = (order) => {
  const o = order.toObject ? order.toObject() : { ...order };
  delete o.stripeSessionId;
  delete o.stripePaymentIntentId;
  delete o.guestToken;
  return o;
};

// ---------- Rotas ----------

// GET /api/orders/shipping — portes e se os pagamentos estão ativos
export const getShipping = (req, res) => res.json({ ...shippingConfig(), payments: stripeEnabled() });

// Subtotal, desconto, portes e total (em cêntimos) — sempre calculados aqui, nunca no navegador
const priceOrder = async (items, couponCode, userId, email, postalCode = '') => {
  const subtotalC = items.reduce((acc, i) => acc + cents(i.price) * i.quantity, 0);
  let coupon = null;
  let discountC = 0;
  let freeShipping = false;
  if (couponCode) {
    const r = await evaluateCoupon(couponCode, { userId, email, subtotalC });
    if (r.error) return { error: r.error };
    ({ coupon, discountC, freeShipping } = r);
  }
  const shippingC = freeShipping ? 0 : cents(shippingFor((subtotalC - discountC) / 100, postalCode));
  return { subtotalC, discountC, shippingC, totalC: subtotalC - discountC + shippingC, coupon };
};

// POST /api/orders/quote  { items, couponCode } — resumo de preços para a página de checkout
export const quote = async (req, res) => {
  try {
    const { items, error } = await readItems(req.body?.items);
    if (error) return res.status(400).json({ message: error });
    const code = normCode(req.body?.couponCode);
    const postalCode = String(req.body?.postalCode || '').trim().slice(0, 8);
    const p = await priceOrder(items, code, req.user?._id, req.user?.email || String(req.body?.email || '').trim().toLowerCase(), postalCode);
    if (p.error) return res.status(400).json({ message: p.error, field: 'coupon' });
    res.json({
      subtotal: p.subtotalC / 100,
      discount: p.discountC / 100,
      shipping: p.shippingC / 100,
      zone: zoneFor(postalCode),
      total: p.totalC / 100,
      coupon: p.coupon ? { code: p.coupon.code, label: couponLabel(p.coupon) } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// POST /api/orders — cria a encomenda e devolve o endereço da página de pagamento
export const checkout = async (req, res) => {
  if (!stripeEnabled()) {
    return res.status(503).json({ message: 'Os pagamentos ainda não estão ativos na loja. Tenta mais tarde.' });
  }
  try {
    // Compra sem conta: precisa do email (para a confirmação, a fatura e o link da encomenda)
    let guestEmail = null;
    if (!req.user) {
      guestEmail = String(req.body?.email || '').trim().toLowerCase().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) return res.status(400).json({ message: 'Indica o teu email para receberes a confirmação', field: 'email' });
      if (hit('guest-checkout', req.ip, 60 * 60 * 1000).count > 20) return res.status(429).json({ message: 'Demasiadas tentativas seguidas. Tenta mais tarde.' });
    }
    const addr = readAddress(req.body);
    if (addr.error) return res.status(400).json({ message: addr.error });
    const { items, productsById, error } = await readItems(req.body?.items);
    if (error) return res.status(400).json({ message: error });

    const couponCode = normCode(req.body?.couponCode);
    const price = await priceOrder(items, couponCode, req.user?._id, req.user?.email || guestEmail, addr.address.postalCode);
    if (price.error) return res.status(400).json({ message: price.error, field: 'coupon' });
    const { subtotalC, discountC, shippingC, totalC } = price;
    if (totalC < 50) return res.status(400).json({ message: 'O valor mínimo de uma encomenda é 0,50 €' });

    // Reserva as peças (o stock desce já; volta se o pagamento não for feito)
    const stock = await reserveStock(items, productsById);
    if (stock.error) return res.status(409).json({ message: stock.error });

    const order = await Order.create({
      ...(req.user ? { user: req.user._id } : { guestEmail, guestToken: crypto.randomBytes(24).toString('hex') }),
      items,
      stockReserved: stock.reservedAny,
      shippingAddress: addr.address,
      nif: addr.nif,
      notes: addr.notes,
      subtotal: subtotalC / 100,
      shippingCost: shippingC / 100,
      shippingZone: zoneFor(addr.address.postalCode),
      ...(price.coupon && { couponCode: price.coupon.code, discount: discountC / 100 }),
      total: totalC / 100,
    });

    try {
      const session = await createCheckoutSession(order, req.user?.email || guestEmail);
      order.stripeSessionId = session.id;
      await order.save();
      res.status(201).json({ orderId: order._id, url: session.url, ...(order.guestToken && { token: order.guestToken }) });
    } catch (err) {
      await releaseOrderStock(order._id);
      await Order.deleteOne({ _id: order._id });
      console.error('Stripe (criar pagamento):', err.message);
      res.status(502).json({ message: stripeMessage(err) });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// POST /api/orders/:id/cancel — o cliente desistiu na página de pagamento
export const cancelPendingOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    let order = await Order.findById(req.params.id);
    if (!isCustomer(req, order)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    if (order.paymentStatus === 'pending' && order.stripeSessionId) {
      // Fecha a página de pagamento para não poder ser paga mais tarde
      await getStripe()?.checkout.sessions.expire(order.stripeSessionId).catch(() => {});
      order = await trySync(order);
    }
    res.json(publicOrder(order));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// GET /api/orders/my-orders — histórico de compras (sem pagamentos abandonados)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, paymentStatus: { $in: REAL_ORDER } })
      .select('-stripeSessionId -stripePaymentIntentId')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// GET /api/orders/:id — o dono da encomenda (ou o administrador principal)
export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    let order = await Order.findById(req.params.id);
    if (!canView(req, order)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    order = await trySync(order);
    await order.populate('user', 'name email');
    res.json(publicOrder(order));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// POST /api/orders/:id/received — o cliente confirma que recebeu a encomenda
export const confirmReceived = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    const order = await Order.findById(req.params.id);
    if (!isCustomer(req, order)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    if (order.receivedAt) return res.json(publicOrder(order));
    if (order.paymentStatus !== 'paid' || !['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Só podes confirmar depois de a encomenda ser enviada' });
    }
    order.receivedAt = new Date();
    order.orderStatus = 'delivered';
    if (!order.deliveredAt) order.deliveredAt = order.receivedAt;
    await order.save();
    await order.populate('user', 'name email');
    emailAdminReceived(order);
    res.json(publicOrder(order));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// GET /api/orders/:id/invoice — endereço do PDF da fatura (dono da encomenda ou equipa das encomendas)
export const getInvoicePdf = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    const order = await Order.findById(req.params.id).select('user invoice guestToken');
    if (!canView(req, order)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    if (order.invoice?.status !== 'issued' || !order.invoice.id) return res.status(404).json({ message: 'A fatura ainda não está disponível' });
    if (!invoicingEnabled()) return res.status(503).json({ message: 'A faturação não está ligada' });
    res.json({ url: await invoicePdfUrl(order.invoice.id), number: order.invoice.number });
  } catch (err) {
    console.error('🧾', err.message);
    res.status(502).json({ message: 'Não foi possível obter a fatura agora. Tenta daqui a pouco.' });
  }
};

// POST /api/orders/:id/invoice — tentar emitir de novo uma fatura que falhou (equipa das encomendas)
export const retryInvoice = async (req, res) => {
  try {
    if (!invoicingEnabled()) return res.status(503).json({ message: 'A faturação não está ligada. Vê o guia no ficheiro server/.env.example.' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    const order = (await createInvoiceFor(req.params.id)) || (await Order.findById(req.params.id));
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada' });
    await order.populate('user', 'name email');
    res.json(publicOrder(order));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// ---------- Administração ----------

const ADMIN_VIEWS = {
  enviar: { paymentStatus: 'paid', orderStatus: { $in: ['processing', 'confirmed'] } },
  aguardar: { paymentStatus: 'awaiting', orderStatus: { $ne: 'cancelled' } },
  caminho: { paymentStatus: 'paid', orderStatus: 'shipped' },
  entregues: { paymentStatus: 'paid', orderStatus: 'delivered' },
  todas: { paymentStatus: { $in: REAL_ORDER } },
};

// GET /api/orders?view=enviar|aguardar|caminho|entregues|todas
export const getAllOrders = async (req, res) => {
  try {
    const view = ADMIN_VIEWS[req.query.view] ? req.query.view : 'enviar';
    const [orders, ...counts] = await Promise.all([
      Order.find(ADMIN_VIEWS[view])
        .select('-stripeSessionId -stripePaymentIntentId -guestToken')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(200),
      ...Object.values(ADMIN_VIEWS).map((f) => Order.countDocuments(f)),
    ]);
    res.json({ view, orders, invoicing: invoicingEnabled(), autoInvoicing: autoInvoicing(), counts: Object.fromEntries(Object.keys(ADMIN_VIEWS).map((k, i) => [k, counts[i]])) });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

/*
  PUT /api/orders/:id/status  { orderStatus, trackingNumber }
  - shipped:   a encomenda saiu (a caminho)  → email ao cliente com o n.º de seguimento
  - delivered: a loja confirma a entrega     → email a pedir confirmação e avaliação
  - cancelled: as peças voltam ao stock      → email ao cliente
*/
export const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Encomenda não encontrada' });
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order || !REAL_ORDER.includes(order.paymentStatus)) return res.status(404).json({ message: 'Encomenda não encontrada' });

    if (req.body?.trackingNumber !== undefined) order.trackingNumber = clean(req.body.trackingNumber, 60);
    const { orderStatus } = req.body || {};
    let email = null;

    if (orderStatus !== undefined && orderStatus !== order.orderStatus) {
      if (orderStatus === 'shipped') {
        if (order.paymentStatus !== 'paid' || !['processing', 'confirmed'].includes(order.orderStatus)) {
          return res.status(400).json({ message: 'Só podes enviar encomendas pagas que ainda estão em preparação' });
        }
        order.shippedAt = new Date();
        email = emailShipped;
      } else if (orderStatus === 'delivered') {
        if (order.orderStatus !== 'shipped') return res.status(400).json({ message: 'Primeiro marca a encomenda como enviada' });
        order.deliveredAt = new Date();
        email = emailDelivered;
      } else if (orderStatus === 'cancelled') {
        // Cancelar pode implicar devolver dinheiro: só o administrador principal
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Só o administrador principal pode cancelar encomendas.' });
        if (order.orderStatus === 'delivered') return res.status(400).json({ message: 'Uma encomenda entregue já não pode ser cancelada' });
        // Referência Multibanco por pagar: anula-a no Stripe
        if (order.paymentStatus === 'awaiting' && order.stripePaymentIntentId) {
          try {
            await getStripe()?.paymentIntents.cancel(order.stripePaymentIntentId);
          } catch (err) {
            console.error('Stripe (cancelar referência):', err.message);
            return res.status(502).json({ message: 'Não foi possível anular a referência Multibanco. Tenta novamente.' });
          }
          order.paymentStatus = 'failed';
        }
        email = emailCancelled;
      } else {
        return res.status(400).json({ message: 'Estado inválido' });
      }
      order.orderStatus = orderStatus;
    }

    await order.save();
    if (order.orderStatus === 'cancelled') await releaseOrderStock(order._id);
    if (email) email(order);
    res.json(publicOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

/*
  Verificação automática (de 5 em 5 minutos):
  - pagamentos abandonados há mais de 32 minutos: fecha-os e devolve as peças ao stock;
  - referências Multibanco por pagar: confirma se já foram pagas.
  Assim tudo funciona mesmo sem o webhook do Stripe (ex.: no teu PC).
*/
export const sweepOrders = async () => {
  try {
    const old = new Date(Date.now() - 32 * 60 * 1000);
    // Encomendas que nunca chegaram a ter página de pagamento
    const orphans = await Order.find({ paymentStatus: 'pending', stripeSessionId: { $exists: false }, createdAt: { $lt: old } }).limit(50);
    for (const o of orphans) {
      await Order.updateOne({ _id: o._id, paymentStatus: 'pending' }, { paymentStatus: 'expired', orderStatus: 'cancelled' });
      await releaseOrderStock(o._id);
    }
    if (!stripeEnabled()) return;
    const toCheck = await Order.find({
      stripeSessionId: { $exists: true },
      $or: [{ paymentStatus: 'pending', createdAt: { $lt: old } }, { paymentStatus: 'awaiting' }],
    }).sort({ createdAt: 1 }).limit(50);
    for (const o of toCheck) await trySync(o);

    // Faturas que falharam (ex.: InvoiceXpress em baixo): tenta de novo até 3 vezes
    if (autoInvoicing()) {
      const stuck = new Date(Date.now() - 10 * 60 * 1000);
      const retry = await Order.find({
        paymentStatus: 'paid',
        $or: [
          { 'invoice.status': 'failed', 'invoice.attempts': { $lt: 3 } },
          { 'invoice.status': 'creating', 'invoice.updatedAt': { $lt: stuck } },
        ],
      }).select('_id').limit(20);
      for (const o of retry) {
        await Order.updateOne({ _id: o._id, 'invoice.status': 'creating' }, { $set: { 'invoice.status': 'failed' } });
        await createInvoiceFor(o._id);
      }
    }
  } catch (err) {
    console.error('Verificação automática das encomendas:', err.message);
  }
};

// ---------- Webhook do Stripe ----------
// O Stripe avisa o servidor quando um pagamento é concluído, falha ou expira.
export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return res.status(503).json({ message: 'Webhook do Stripe não configurado' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
  } catch {
    return res.status(400).json({ message: 'Assinatura inválida' });
  }

  if (event.type.startsWith('checkout.session.')) {
    const orderId = event.data.object?.metadata?.orderId;
    if (orderId && mongoose.isValidObjectId(orderId)) {
      try {
        const order = await Order.findById(orderId);
        if (order) await syncOrder(order);
      } catch (err) {
        console.error('Stripe (webhook):', err.message);
        return res.status(500).json({ message: 'Erro ao processar' }); // o Stripe volta a tentar
      }
    }
  }
  res.json({ received: true });
};
