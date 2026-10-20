import mongoose from 'mongoose';

export const CATEGORIES = ['roupas', 'sapatos', 'acessórios', 'bolsas', 'joias', 'praia', 'desporto', 'outros'];
export const MIN_IMAGES = 2;
export const MAX_IMAGES = 4;
export const MAX_RELATED = 4;

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Cada cor precisa de um nome'], trim: true, maxlength: 40 },
    hex: {
      type: String,
      required: true,
      match: [/^#[0-9a-fA-F]{6}$/, 'Cor inválida (use o formato #RRGGBB)'],
    },
    // Foto que mostra o produto nesta cor (tem de ser uma das fotos do produto)
    image: { type: String, trim: true },
  },
  { _id: false }
);

// "Vestido Capulana Luanda" -> "vestido-capulana-luanda"
export const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'produto';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'O nome é obrigatório'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: [true, 'A descrição é obrigatória'], trim: true, maxlength: 3000 },

    // Preços em euros (ex.: 24.99)
    price: { type: Number, required: [true, 'O preço é obrigatório'], min: [0.01, 'O preço tem de ser maior que 0'] },
    originalPrice: {
      type: Number,
      min: 0,
      validate: {
        validator(v) { return v == null || v > this.price; },
        message: 'O preço anterior tem de ser maior que o preço atual',
      },
    },

    category: {
      type: String,
      required: [true, 'A categoria é obrigatória'],
      enum: { values: CATEGORIES, message: 'Categoria inválida' },
    },

    // Fotos: mínimo 2, máximo 4. A primeira é a foto principal.
    images: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= MIN_IMAGES && arr.length <= MAX_IMAGES,
        message: `O produto tem de ter entre ${MIN_IMAGES} e ${MAX_IMAGES} fotos`,
      },
    },

    // Tamanhos disponíveis (ex.: ["S","M","L"] ou ["36","37"]). Vazio = tamanho único.
    sizes: { type: [{ type: String, trim: true, maxlength: 10 }], default: [] },

    // Guia de tamanhos na página do produto: auto = pela categoria (sapatos → calçado, o resto → roupa)
    sizeGuide: { type: String, enum: ['auto', 'roupa', 'calcado', 'nenhum'], default: 'auto' },
    // Nota sobre o tamanho (ex.: "Veste grande: recomendamos um tamanho abaixo")
    fitNote: { type: String, trim: true, maxlength: 200, default: '' },

    // Cores: só existem se hasColors = true
    hasColors: { type: Boolean, default: false },
    colors: { type: [colorSchema], default: [] },

    // "Combina com": produtos escolhidos pelo admin para sugerir
    related: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= MAX_RELATED,
        message: `No máximo ${MAX_RELATED} produtos sugeridos`,
      },
    },

    /*
      Stock por tamanho e cor. Só é controlado se trackStock = true
      (sem controlo, o produto pode ser sempre comprado).
      variants: uma linha por combinação, ex.: { size: 'M', color: 'Preto', stock: 3 }
      ('' quando o produto não tem tamanhos ou cores). stock = total de todas as linhas.
    */
    trackStock: { type: Boolean, default: false },
    variants: {
      type: [new mongoose.Schema({
        size: { type: String, default: '' },
        color: { type: String, default: '' },
        stock: { type: Number, default: 0, min: [0, 'O stock não pode ser negativo'] },
      }, { _id: false })],
      default: [],
    },
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }, // false = escondido da loja

    sold: { type: Number, default: 0 },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('validate', async function (next) {
  // Sem várias cores, não guarda nenhuma cor
  if (!this.hasColors) this.colors = [];
  else if (this.colors.length === 0) {
    this.invalidate('colors', 'Indica pelo menos uma cor, ou desliga "várias cores"');
  }

  // Cada cor só pode apontar para uma foto deste produto, e cada foto só para uma cor
  const used = new Set();
  for (const c of this.colors) {
    if (c.image && (!this.images.includes(c.image) || used.has(c.image))) c.image = undefined;
    if (c.image) used.add(c.image);
  }

  // Remove tamanhos repetidos ou vazios
  this.sizes = [...new Set((this.sizes || []).map((s) => String(s).trim()).filter(Boolean))];

  // Stock: uma linha para cada combinação de tamanho e cor (mantém as quantidades já escritas)
  if (this.trackStock) {
    const sizes = this.sizes.length ? this.sizes : [''];
    const colors = this.hasColors && this.colors.length ? this.colors.map((c) => c.name) : [''];
    const old = new Map((this.variants || []).map((v) => [`${v.size}|${v.color}`, v.stock]));
    this.variants = colors.flatMap((color) => sizes.map((size) => {
      const n = Math.floor(Number(old.get(`${size}|${color}`)) || 0);
      return { size, color, stock: Math.max(0, n) };
    }));
    this.stock = this.variants.reduce((acc, v) => acc + v.stock, 0);
  } else {
    this.variants = [];
    this.stock = 0;
  }

  // Um produto não pode sugerir-se a si próprio
  this.related = (this.related || []).filter((id) => String(id) !== String(this._id));

  // Gera um slug único a partir do nome
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name);
    let slug = base;
    let n = 2;
    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) slug = `${base}-${n++}`;
    this.slug = slug;
  }
  next();
});

export default mongoose.model('Product', productSchema);
