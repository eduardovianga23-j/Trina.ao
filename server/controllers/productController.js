import mongoose from 'mongoose';
import Product, { MAX_RELATED } from '../models/Product.js';
import User from '../models/User.js';
import { deleteImage } from '../utils/storage.js';

const isId = (v) => mongoose.isValidObjectId(v);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Só estes campos podem ser enviados pelo admin (evita alterar rating, vendas, etc.)
const pickProductFields = (body) => {
  const out = {};
  for (const k of ['name', 'description', 'category', 'images', 'sizes', 'hasColors', 'colors', 'related', 'stock', 'featured', 'active']) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (body.price !== undefined) out.price = Number(body.price);
  if (body.originalPrice !== undefined) {
    out.originalPrice = body.originalPrice === '' || body.originalPrice === null ? undefined : Number(body.originalPrice);
  }
  if (out.related) out.related = [...new Set(out.related.map(String))].filter(isId).slice(0, MAX_RELATED);
  return out;
};

// Mensagens de validação legíveis
const sendError = (res, err) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages[0], errors: messages });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Dados inválidos' });
  console.error(err);
  return res.status(500).json({ message: 'Erro no servidor' });
};

// Apaga só as fotos que mais nenhum produto usa
const deleteUnusedImages = async (urls, exceptId) => {
  for (const url of urls) {
    const inUse = await Product.exists({ images: url, _id: { $ne: exceptId } });
    if (!inUse) await deleteImage(url);
  }
};

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1 },
};

// GET /api/products  (público: só produtos ativos)
export const getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

    const query = { active: true };
    if (category) query.category = String(category);
    if (search) query.name = { $regex: escapeRegex(String(search).slice(0, 60)), $options: 'i' };

    const [products, total] = await Promise.all([
      Product.find(query).select('-reviews').sort(SORTS[sort] || SORTS.newest).limit(limit).skip((page - 1) * limit),
      Product.countDocuments(query),
    ]);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    sendError(res, err);
  }
};

// GET /api/products/by-ids?ids=a,b,c  (público: ex. a lista de favoritos de quem não tem sessão)
export const getProductsByIds = async (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').filter(isId).slice(0, 100);
    if (!ids.length) return res.json([]);
    const products = await Product.find({ _id: { $in: ids }, active: true }).select('-reviews');
    // mantém a ordem pedida
    res.json(ids.map((id) => products.find((p) => String(p._id) === id)).filter(Boolean));
  } catch (err) {
    sendError(res, err);
  }
};

// GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    let products = await Product.find({ active: true, featured: true }).select('-reviews').sort({ updatedAt: -1 }).limit(8);
    // Sem destaques marcados, mostra os mais recentes
    if (products.length === 0) products = await Product.find({ active: true }).select('-reviews').sort(SORTS.newest).limit(8);
    res.json(products);
  } catch (err) {
    sendError(res, err);
  }
};

// GET /api/products/slug/:slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: String(req.params.slug), active: true });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    sendError(res, err);
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Produto não encontrado' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    sendError(res, err);
  }
};

/*
  GET /api/products/:id/related
  "Você também pode comprar": primeiro os produtos que o admin escolheu como "combina com",
  depois completa com produtos da mesma categoria. Devolve no máximo 4.
*/
export const getRelatedProducts = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.json([]);
    const product = await Product.findById(req.params.id).select('related category');
    if (!product) return res.json([]);

    const chosen = await Product.find({ _id: { $in: product.related }, active: true }).select('-reviews');
    // mantém a ordem escolhida pelo admin
    const ordered = product.related.map((id) => chosen.find((p) => String(p._id) === String(id))).filter(Boolean);

    const missing = MAX_RELATED - ordered.length;
    let sameCategory = [];
    if (missing > 0) {
      sameCategory = await Product.find({
        _id: { $nin: [product._id, ...ordered.map((p) => p._id)] },
        category: product.category,
        active: true,
      })
        .select('-reviews')
        .sort({ featured: -1, createdAt: -1 })
        .limit(missing);
    }
    res.json([...ordered, ...sameCategory]);
  } catch (err) {
    sendError(res, err);
  }
};

// ---------- Admin ----------

// GET /api/products/admin/all  (inclui produtos escondidos)
export const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().select('-reviews').sort({ updatedAt: -1 });
    res.json(products);
  } catch (err) {
    sendError(res, err);
  }
};

const checkRelatedExist = async (ids) => {
  if (!ids?.length) return true;
  return (await Product.countDocuments({ _id: { $in: ids } })) === ids.length;
};

// POST /api/products
export const createProduct = async (req, res) => {
  try {
    const data = pickProductFields(req.body);
    if (!(await checkRelatedExist(data.related))) return res.status(400).json({ message: 'Um dos produtos sugeridos não existe' });
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    sendError(res, err);
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Produto não encontrado' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    const data = pickProductFields(req.body);
    if (!(await checkRelatedExist(data.related))) return res.status(400).json({ message: 'Um dos produtos sugeridos não existe' });

    const oldImages = [...product.images];
    if ('originalPrice' in data && data.originalPrice === undefined) product.originalPrice = undefined;
    product.set(data);
    await product.save();

    // Apaga do disco/Cloudinary as fotos que foram removidas
    const removed = oldImages.filter((url) => !product.images.includes(url));
    await deleteUnusedImages(removed, product._id);

    res.json(product);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: 'Produto não encontrado' });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    await Product.updateMany({ related: product._id }, { $pull: { related: product._id } });
    await User.updateMany({ favorites: product._id }, { $pull: { favorites: product._id } });
    await deleteUnusedImages(product.images, product._id);
    res.json({ message: 'Produto eliminado' });
  } catch (err) {
    sendError(res, err);
  }
};

// POST /api/products/:id/reviews
export const addReview = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();
    if (!(rating >= 1 && rating <= 5) || !comment) return res.status(400).json({ message: 'Avaliação inválida' });

    if (!isId(req.params.id)) return res.status(404).json({ message: 'Produto não encontrado' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });

    if (product.reviews.some((r) => String(r.user) === String(req.user._id))) {
      return res.status(400).json({ message: 'Já avaliaste este produto' });
    }
    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment: comment.slice(0, 1000) });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Avaliação adicionada' });
  } catch (err) {
    sendError(res, err);
  }
};
