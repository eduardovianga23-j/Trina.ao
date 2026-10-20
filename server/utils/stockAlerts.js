import StockAlert from '../models/StockAlert.js';
import Product from '../models/Product.js';
import { emailBackInStock } from './emails.js';

/*
  Quando um tamanho/cor esgotado volta a ter stock, envia o aviso a quem pediu.
  É chamado quando o admin guarda o produto e quando peças reservadas voltam ao stock.
*/
export const notifyRestock = async (productId) => {
  try {
    const pending = await StockAlert.find({ product: productId, notifiedAt: null }).limit(500);
    if (!pending.length) return 0;
    const product = await Product.findById(productId).select('name slug images price trackStock variants active colors');
    if (!product || !product.active) return 0;
    let sent = 0;
    for (const alert of pending) {
      const v = product.trackStock ? product.variants.find((x) => x.size === alert.size && x.color === alert.color) : null;
      const back = !product.trackStock || (v && v.stock > 0);
      if (!back) continue;
      // Marca primeiro (assim, se correr duas vezes ao mesmo tempo, só um envia)
      const claimed = await StockAlert.findOneAndUpdate({ _id: alert._id, notifiedAt: null }, { notifiedAt: new Date() });
      if (!claimed) continue;
      emailBackInStock(alert, product);
      sent++;
    }
    if (sent) console.log(`🔔 ${sent} aviso(s) de stock enviados para "${product.name}"`);
    return sent;
  } catch (err) {
    console.error('Avisos de stock:', err.message);
    return 0;
  }
};

// Quantas pessoas estão à espera, por produto (para o painel)
export const waitingByProduct = async () => {
  const list = await StockAlert.find({ notifiedAt: null }).select('product');
  const out = {};
  list.forEach((a) => { out[String(a.product)] = (out[String(a.product)] || 0) + 1; });
  return out;
};
