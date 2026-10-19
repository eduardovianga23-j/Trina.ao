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

  // Remove tamanhos repetidos ou vazios
  this.sizes = [...new Set((this.sizes || []).map((s) => String(s).trim()).filter(Boolean))];

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
