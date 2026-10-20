import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { getStripe, stripeEnabled, stripeMessage } from '../utils/stripe.js';
import { shippingConfig, shippingFor } from '../utils/shipping.js';
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

const createCheckoutSession = (order, user) => {
  const describe = (it) => [it.size && `Tamanho ${it.size}`, it.color?.name && `Cor ${it.color.name}`].filter(Boolean).join(' · ');
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'pt',
    customer_email: user.email,
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
    success_url: `${clientUrl()}/encomenda/${order._id}?pago=1`,
    cancel_url: `${clientUrl()}/cart?cancelado=${order._id}`,
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
    await updated.populate('user', 'name email');
    emailOrderPaid(updated);
    lowStockFor(updated.items).then((low) => emailAdminNewOrder(updated, low)).catch(() => emailAdminNewOrder(updated));
  }
  return updated || Order.findById(order._id);
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
  return o;
};

// ---------- Rotas ----------

// GET /api/orders/shipping — portes e se os pagamentos estão ativos
export const getShipping = (req, res) => res.json({ ...shippingConfig(), payments: stripeEnabled() });

// POST /api/orders — cria a encomenda e devolve o endereço da página de pagamento
export const checkout = async (req, res) => {
  if (!stripeEnabled()) {
    return res.status(503).json({ message: 'Os pagamentos ainda não estão ativos na loja. Tenta mais tarde.' });
  }
  try {
    const addr = readAddress(req.body);
    if (addr.error) return res.status(400).json({ message: addr.error });
    const { items, productsById, error } = await readItems(req.body?.items);
    if (error) return res.status(400).json({ message: error });

    const subtotalC = items.reduce((acc, i) => acc + cents(i.price) * i.quantity, 0);
    const shippingC = cents(shippingFor(subtotalC / 100));
    if (subtotalC + shippingC < 50) return res.status(400).json({ message: 'O valor mínimo de uma encomenda é 0,50 €' });

    // Reserva as peças (o stock desce já; volta se o pagamento não for feito)
    const stock = await reserveStock(items, productsById);
    if (stock.error) return res.status(409).json({ message: stock.error });

    const order = await Order.create({
      user: req.user._id,
      items,
      stockReserved: stock.reservedAny,
      shippingAddress: addr.address,
      nif: addr.nif,
      notes: addr.notes,
      subtotal: subtotalC / 100,
      shippingCost: shippingC / 100,
      total: (subtotalC + shippingC) / 100,
    });

    try {
      const session = await createCheckoutSession(order, req.user);
      order.stripeSessionId = session.id;
      await order.save();
      res.status(201).json({ orderId: order._id, url: session.url });
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
    let order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada' });
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
    const isOwner = order && String(order.user) === String(req.user._id);
    if (!order || (!isOwner && req.user.role !== 'admin')) return res.status(404).json({ message: 'Encomenda não encontrada' });
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
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada' });
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
        .select('-stripeSessionId -stripePaymentIntentId')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(200),
      ...Object.values(ADMIN_VIEWS).map((f) => Order.countDocuments(f)),
    ]);
    res.json({ view, orders, counts: Object.fromEntries(Object.keys(ADMIN_VIEWS).map((k, i) => [k, counts[i]])) });
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
