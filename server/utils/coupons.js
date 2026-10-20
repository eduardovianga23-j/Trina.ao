import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';

const eur = (n) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
export const normCode = (code) => String(code || '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 20);

// Texto curto do desconto (ex.: "10% de desconto", "5,00 € de desconto", "Envio grátis")
export const couponLabel = (c) =>
  c.type === 'percent' ? `${c.value}% de desconto` : c.type === 'fixed' ? `${eur(c.value)} de desconto` : 'Envio grátis';

/*
  Confirma um código para um cliente e um subtotal (em cêntimos).
  Devolve { coupon, discountC, freeShipping } ou { error }.
*/
export const evaluateCoupon = async (rawCode, { userId, email, subtotalC }) => {
  const code = normCode(rawCode);
  if (!code) return { error: 'Escreve o código de desconto' };
  const coupon = await Coupon.findOne({ code });
  const now = new Date();
  if (!coupon || !coupon.active) return { error: `O código "${code}" não existe ou já não está ativo` };
  if (coupon.startsAt && now < coupon.startsAt) return { error: `O código "${code}" ainda não está ativo` };
  if (coupon.expiresAt && now > coupon.expiresAt) return { error: `O código "${code}" já expirou` };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { error: `O código "${code}" já foi usado o número máximo de vezes` };
  if (coupon.minSubtotal && subtotalC < Math.round(coupon.minSubtotal * 100)) {
    return { error: `O código "${code}" é válido em compras a partir de ${eur(coupon.minSubtotal)}` };
  }
  // Compras anteriores desta pessoa (pela conta ou pelo email, para quem compra sem conta)
  const who = [userId && { user: userId }, email && { guestEmail: String(email).toLowerCase() }].filter(Boolean);
  const real = { $or: who.length ? who : [{ _id: null }], paymentStatus: { $in: ['paid', 'awaiting'] } };
  if (coupon.firstOrderOnly && (await Order.exists(real))) return { error: `O código "${code}" é só para a primeira compra` };
  if (coupon.onePerCustomer && (await Order.exists({ ...real, couponCode: code }))) return { error: `Já usaste o código "${code}"` };

  let discountC = 0;
  if (coupon.type === 'percent') discountC = Math.round((subtotalC * coupon.value) / 100);
  if (coupon.type === 'fixed') discountC = Math.round(coupon.value * 100);
  // O total dos produtos nunca pode ficar abaixo de 0,50 € (mínimo do pagamento)
  discountC = Math.max(0, Math.min(discountC, subtotalC - 50));
  return { coupon, discountC, freeShipping: coupon.type === 'shipping' };
};
