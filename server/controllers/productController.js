import mongoose from 'mongoose';
import Product, { MAX_RELATED } from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import StockAlert from '../models/StockAlert.js';
import { notifyRestock, waitingByProduct } from '../utils/stockAlerts.js';
import { deleteImage } from '../utils/storage.js';

const isId = (v) => mongoose.isValidObjectId(v);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Só estes campos podem ser enviados pelo admin (evita alterar rating, vendas, etc.)
const pickProductFields = (body) => {
  const out = {};
  for (const k of ['name', 'description', 'category', 'images', 'sizes', 'hasColors', 'colors', 'related', 'trackStock', 'variants', 'sizeGuide', 'fitNote', 'featured', 'active']) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  if (body.price !== undefined) out.price = Number(body.price);
  if (body.originalPrice !== undefined) {
    out.originalPrice = body.originalPrice === '' || body.originalPrice === null ? undefined : Number(body.originalPrice);
  }
  if (out.variants !== undefined) {
    out.variants = Array.isArray(out.variants)
      ? out.variants.slice(0, 300).map((v) => ({ size: String(v?.size ?? ''), color: String(v?.color ?? ''), stock: Number(v?.stock) || 0 }))
      : [];
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
  rating: { rating: -1, numReviews: -1 },
  best: { sold: -1, createdAt: -1 },
};

/*
  Filtros da loja (todos opcionais):
  ?search=vestido  ?category=roupas  ?minPrice=10&maxPrice=50  ?size=M  ?color=Preto
  ?inStock=1 (só com stock)  ?promo=1 (só em promoção)  ?sort=newest|price_asc|price_desc|rating|best
*/
const buildFilter = (q) => {
  const and = [{ active: true }];
  if (q.category) and.push({ category: String(q.category) });
  if (q.search) {
    const rx = { $regex: escapeRegex(String(q.search).trim().slice(0, 60)), $options: 'i' };
    and.push({ $or: [{ name: rx }, { description: rx }, { 'colors.name': rx }] });
  }
  const min = parseFloat(q.minPrice);
  const max = parseFloat(q.maxPrice);
  if (min >= 0 || max >= 0) {
    and.push({ price: { ...(min >= 0 && { $gte: min }), ...(max >= 0 && { $lte: max }) } });
  }
  if (q.size) {
    const size = String(q.size).slice(0, 10);
    // Tem o tamanho; se o stock for controlado, tem de haver peças desse tamanho
    and.push({ sizes: size });
    if (q.inStock === '1') and.push({ $or: [{ trackStock: { $ne: true } }, { variants: { $elemMatch: { size, stock: { $gt: 0 } } } }] });
  }
  if (q.color) and.push({ hasColors: true, 'colors.name': String(q.color).slice(0, 40) });
  if (q.inStock === '1') and.push({ $or: [{ trackStock: { $ne: true } }, { stock: { $gt: 0 } }] });
  if (q.promo === '1') and.push({ originalPrice: { $gt: 0 } });
  return { $and: and };
};

// GET /api/products  (público: só produtos ativos)
export const getProducts = async (req, res) => {
  try {
    const { sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const query = buildFilter(req.query);

    const [products, total] = await Promise.all([
      Product.find(query).select('-reviews').sort(SORTS[sort] || SORTS.newest).limit(limit).skip((page - 1) * limit),
      Product.countDocuments(query),
    ]);
    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    sendError(res, err);
  }
};

// GET /api/products/filters — opções para os filtros da loja (tamanhos, cores e preços que existem)
export const getFilterOptions = async (req, res) => {
  try {
    const products = await Product.find({ active: true }).select('sizes colors hasColors price');
    const sizes = [...new Set(products.flatMap((p) => p.sizes))];
    // Ordem natural: XS, S, M, L, XL, XXL e depois números
    const ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    sizes.sort((a, b) => {
      const ia = ORDER.indexOf(a.toUpperCase()), ib = ORDER.indexOf(b.toUpperCase());
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b);
    });
    const colors = new Map();
    products.filter((p) => p.hasColors).flatMap((p) => p.colors).forEach((c) => { if (!colors.has(c.name)) colors.set(c.name, c.hex); });
    const prices = products.map((p) => p.price);
    res.json({
      sizes,
      colors: [...colors].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, 'pt')),
      price: { min: prices.length ? Math.floor(Math.min(...prices)) : 0, max: prices.length ? Math.ceil(Math.max(...prices)) : 0 },
    });
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
    const product = await Product.findOne({ slug: String(req.params.slug), active: true }).select('-reviews');
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
    const [products, waiting] = await Promise.all([Product.find().select('-reviews').sort({ updatedAt: -1 }), waitingByProduct()]);
    // waiting = quantas pessoas pediram aviso de stock
    res.json(products.map((p) => ({ ...p.toObject(), waiting: waiting[String(p._id)] || 0 })));
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

    // Repôs stock? Avisa quem estava à espera
    notifyRestock(product._id);

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
    // Apaga as avaliações do produto e as suas fotos
    const reviews = await Review.find({ product: product._id }).select('photos');
    await Review.deleteMany({ product: product._id });
    await StockAlert.deleteMany({ product: product._id });
    await Promise.all(reviews.flatMap((r) => r.photos).map(deleteImage));
    await deleteUnusedImages(product.images, product._id);
    res.json({ message: 'Produto eliminado' });
  } catch (err) {
    sendError(res, err);
  }
};
