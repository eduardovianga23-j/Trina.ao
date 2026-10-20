import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockAlert from '../models/StockAlert.js';
import { rateLimit } from '../utils/rateLimit.js';

/*
  POST /api/stock-alerts  { productId, size, color, email }
  "Avisa-me quando voltar": guarda o pedido e envia um email quando houver stock.
*/
const router = express.Router();
const limit = rateLimit({ name: 'stock-alert-ip', windowMs: 60 * 60 * 1000, max: 20 });

router.post('/', limit, async (req, res) => {
  try {
    const { productId } = req.body || {};
    const size = String(req.body?.size || '').slice(0, 10);
    const color = String(req.body?.color || '').slice(0, 40);
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 120);
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: 'Produto inválido' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Indica um email válido' });

    const product = await Product.findOne({ _id: productId, active: true }).select('trackStock variants');
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    const variant = product.variants.find((v) => v.size === size && v.color === color);
    if (!product.trackStock || !variant) return res.status(400).json({ message: 'Escolhe o tamanho e a cor que queres' });
    if (variant.stock > 0) return res.status(400).json({ message: 'Boa notícia: esta opção já tem stock! Podes comprar já.' });

    let user;
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) user = jwt.verify(token, process.env.JWT_SECRET).id;
    } catch { /* sem sessão */ }

    const exists = await StockAlert.findOne({ product: productId, size, color, email, notifiedAt: null });
    if (!exists) await StockAlert.create({ product: productId, size, color, email, ...(user && { user }) });
    res.status(201).json({ message: `Combinado! Enviamos um email para ${email} assim que voltar.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

export default router;
