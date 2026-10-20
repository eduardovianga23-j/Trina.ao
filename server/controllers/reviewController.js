import mongoose from 'mongoose';
import Review, { MAX_REVIEW_PHOTOS } from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { deleteImage } from '../utils/storage.js';

/*
  Avaliações com fotos.
  Só quem comprou o produto e confirmou que recebeu a encomenda pode avaliar ("compra verificada").
*/
const isId = (v) => mongoose.isValidObjectId(v);

// "Casimiro Vianga" -> "Casimiro V."
const publicName = (name) => {
  const parts = String(name || 'Cliente').trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

// Só aceita fotos enviadas para o nosso servidor ou para o nosso Cloudinary
const validPhoto = (url) => typeof url === 'string' && (/^\/uploads\/[\w.-]+$/.test(url) || /^https:\/\/res\.cloudinary\.com\//.test(url));

const refreshRating = async (productId) => {
  const ratings = (await Review.find({ product: productId }).select('rating')).map((r) => r.rating);
  const count = ratings.length;
  await Product.updateOne(
    { _id: productId },
    { rating: count ? Math.round((ratings.reduce((a, n) => a + n, 0) / count) * 10) / 10 : 0, numReviews: count }
  );
};

const PUBLIC_FIELDS = 'name rating comment photos size color createdAt';

// GET /api/reviews/product/:productId?page=1 — avaliações públicas de um produto
export const getProductReviews = async (req, res) => {
  try {
    if (!isId(req.params.productId)) return res.json({ reviews: [], summary: { average: 0, count: 0, dist: [0, 0, 0, 0, 0] } });
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const filter = { product: req.params.productId };
    const [reviews, all] = await Promise.all([
      Review.find(filter).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Review.find(filter).select('rating photos'),
    ]);
    const count = all.length;
    const dist = [5, 4, 3, 2, 1].map((n) => all.filter((r) => r.rating === n).length);
    const average = count ? Math.round((all.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : 0;
    res.json({
      reviews,
      page,
      pages: Math.max(1, Math.ceil(count / limit)),
      summary: { average, count, dist, withPhotos: all.filter((r) => r.photos.length).length },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// GET /api/reviews/order/:orderId — as avaliações que o cliente já fez nesta encomenda
export const getOrderReviews = async (req, res) => {
  try {
    if (!isId(req.params.orderId)) return res.json([]);
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id }).select('items');
    if (!order) return res.json([]);
    const reviews = await Review.find({ user: req.user._id, product: { $in: order.items.map((i) => i.product) } })
      .select(`${PUBLIC_FIELDS} product`);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// POST /api/reviews  { orderId, productId, rating, comment, photos } — cria ou atualiza
export const saveReview = async (req, res) => {
  try {
    const { orderId, productId } = req.body || {};
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim().slice(0, 1000);
    const photos = Array.isArray(req.body?.photos) ? req.body.photos.filter(validPhoto).slice(0, MAX_REVIEW_PHOTOS) : [];

    if (!isId(orderId) || !isId(productId)) return res.status(400).json({ message: 'Dados inválidos' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Escolhe de 1 a 5 estrelas' });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Encomenda não encontrada' });
    if (!order.receivedAt) return res.status(400).json({ message: 'Confirma primeiro que recebeste a encomenda' });
    const item = order.items.find((i) => String(i.product) === String(productId));
    if (!item) return res.status(400).json({ message: 'Este produto não faz parte da encomenda' });
    if (!(await Product.exists({ _id: productId }))) return res.status(404).json({ message: 'Este produto já não existe na loja' });

    const existing = await Review.findOne({ product: productId, user: req.user._id });
    const data = {
      order: order._id,
      name: publicName(req.user.name),
      rating,
      comment,
      photos,
      size: item.size || '',
      color: item.color?.name || '',
    };
    let review;
    if (existing) {
      const removed = existing.photos.filter((p) => !photos.includes(p));
      existing.set(data);
      review = await existing.save();
      await Promise.all(removed.map(deleteImage));
    } else {
      review = await Review.create({ ...data, product: productId, user: req.user._id });
    }
    await refreshRating(productId);
    res.status(existing ? 200 : 201).json(review);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors)[0].message });
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// DELETE /api/reviews/:id — o autor ou a equipa da loja
export const deleteReview = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Avaliação não encontrada' });
    const review = await Review.findById(req.params.id);
    const staff = ['admin', 'manager'].includes(req.user.role);
    if (!review || (!staff && String(review.user) !== String(req.user._id))) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    await review.deleteOne();
    await Promise.all(review.photos.map(deleteImage));
    await refreshRating(review.product);
    res.json({ message: 'Avaliação apagada' });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Só quem já recebeu alguma encomenda pode enviar fotos de avaliação
export const canUploadReviewPhotos = (userId) => Order.exists({ user: userId, receivedAt: { $exists: true, $ne: null } });
