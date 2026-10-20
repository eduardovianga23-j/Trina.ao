import Product from '../models/Product.js';
import Order from '../models/Order.js';

/*
  Stock por tamanho e cor.
  Quando o cliente vai pagar, as peças ficam reservadas (o stock desce logo).
  Se o pagamento não for feito (desistiu, expirou, referência Multibanco não paga)
  ou a encomenda for cancelada, as peças voltam ao stock.
*/

const variantOf = (item) => ({ size: item.size || '', color: item.color?.name || '' });

const describe = (item) => {
  const parts = [item.size && `tamanho ${item.size}`, item.color?.name].filter(Boolean).join(', ');
  return `"${item.name}"${parts ? ` (${parts})` : ''}`;
};

/*
  Muda o stock de uma combinação tamanho/cor de forma segura (atómica):
  só altera se a linha ainda for a mesma e, ao tirar, se houver unidades suficientes.
  Tenta de novo se o admin mexeu no produto entretanto.
*/
const changeVariantStock = async (item, delta) => {
  const { size, color } = variantOf(item);
  for (let attempt = 0; attempt < 3; attempt++) {
    const product = await Product.findById(item.product).select('trackStock variants');
    const i = product?.variants.findIndex((v) => v.size === size && v.color === color) ?? -1;
    if (i < 0) return false;
    const filter = { _id: item.product, [`variants.${i}.size`]: size, [`variants.${i}.color`]: color };
    if (delta < 0) Object.assign(filter, { trackStock: true, [`variants.${i}.stock`]: { $gte: -delta } });
    const r = await Product.updateOne(filter, { $inc: { [`variants.${i}.stock`]: delta, stock: delta } });
    if (r.modifiedCount === 1) return true;
    if (delta < 0 && product.variants[i].stock < -delta) return false; // não há unidades suficientes
  }
  return false;
};

const releaseItem = (item) => changeVariantStock(item, item.quantity);

// Quantas unidades há de um produto num tamanho/cor (Infinity = stock não controlado)
export const availableStock = (product, size = '', color = '') => {
  if (!product?.trackStock) return Infinity;
  return product.variants.find((v) => v.size === size && v.color === color)?.stock ?? 0;
};

// Reserva as peças. Se faltar alguma, desfaz tudo e devolve uma mensagem para o cliente.
export const reserveStock = async (items, productsById) => {
  const reserved = [];
  for (const item of items) {
    if (!productsById.get(String(item.product))?.trackStock) continue;
    if (!(await changeVariantStock(item, -item.quantity))) {
      await Promise.all(reserved.map(releaseItem));
      reserved.forEach((i) => { i.reserved = false; });
      const fresh = await Product.findById(item.product).select('trackStock variants');
      const left = availableStock(fresh, variantOf(item).size, variantOf(item).color);
      return {
        error: left > 0
          ? `Só ${left === 1 ? 'resta 1 unidade' : `restam ${left} unidades`} de ${describe(item)}. Ajusta a quantidade no carrinho.`
          : `${describe(item)} esgotou. Remove-o do carrinho para continuar.`,
      };
    }
    item.reserved = true;
    reserved.push(item);
  }
  return { reservedAny: reserved.length > 0 };
};

// Devolve ao stock as peças de uma encomenda (só uma vez, mesmo se for chamado várias vezes)
export const releaseOrderStock = async (orderId) => {
  const order = await Order.findOneAndUpdate({ _id: orderId, stockReserved: true }, { stockReserved: false });
  if (!order) return false;
  await Promise.all(order.items.filter((i) => i.reserved).map(releaseItem));
  return true;
};

// Peças com pouco stock depois de uma venda (para avisar o admin)
export const lowStockFor = async (items, limit = 2) => {
  const ids = [...new Set(items.map((i) => String(i.product)))];
  const products = await Product.find({ _id: { $in: ids }, trackStock: true }).select('name trackStock variants');
  const out = [];
  for (const item of items) {
    const p = products.find((x) => String(x._id) === String(item.product));
    if (!p) continue;
    const left = availableStock(p, variantOf(item).size, variantOf(item).color);
    if (left <= limit) out.push({ name: p.name, size: item.size, color: item.color?.name, left });
  }
  return out;
};
