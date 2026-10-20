import express from 'express';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import { protect, requirePerm } from '../middleware/auth.js';
import { normCode } from '../utils/coupons.js';

/*
  Códigos de desconto — gestão no painel (permissão "Produtos").
  GET /api/coupons · POST /api/coupons · PUT /api/coupons/:id · DELETE /api/coupons/:id
*/
const router = express.Router();
router.use(protect, requirePerm('products'));

const FIELDS = ['description', 'type', 'value', 'minSubtotal', 'startsAt', 'expiresAt', 'maxUses', 'onePerCustomer', 'firstOrderOnly', 'active'];
const pick = (body = {}) => {
  const out = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k] === '' ? undefined : body[k];
  if (body.code !== undefined) out.code = normCode(body.code);
  for (const k of ['value', 'minSubtotal']) if (out[k] !== undefined) out[k] = Number(String(out[k]).replace(',', '.'));
  if (out.maxUses !== undefined) out.maxUses = out.maxUses === null ? undefined : parseInt(out.maxUses, 10) || undefined;
  return out;
};

const sendError = (res, err) => {
  if (err.code === 11000) return res.status(400).json({ message: 'Já existe um código com esse nome' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors)[0].message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Dados inválidos' });
  console.error(err);
  return res.status(500).json({ message: 'Erro no servidor' });
};

router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    // Total descontado com cada código (encomendas pagas)
    const orders = await Order.find({ couponCode: { $in: coupons.map((c) => c.code) }, paymentStatus: 'paid' }).select('couponCode discount');
    const saved = {};
    orders.forEach((o) => { saved[o.couponCode] = (saved[o.couponCode] || 0) + (o.discount || 0); });
    res.json(coupons.map((c) => ({ ...c, totalDiscount: Math.round((saved[c.code] || 0) * 100) / 100 })));
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/', async (req, res) => {
  try {
    res.status(201).json(await Coupon.create(pick(req.body)));
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Código não encontrado' });
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Código não encontrado' });
    const data = pick(req.body);
    delete data.code; // o código não muda depois de criado (as encomendas guardam-no)
    for (const k of FIELDS) if (k in req.body && data[k] === undefined) coupon.set(k, undefined);
    coupon.set(data);
    res.json(await coupon.save());
  } catch (err) {
    sendError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Código não encontrado' });
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Código não encontrado' });
    res.json({ message: `Código ${coupon.code} apagado` });
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
