import mongoose from 'mongoose';

/*
  Avaliação de um produto, feita por quem o comprou e confirmou que o recebeu ("compra verificada").
  Uma avaliação por produto e por pessoa (pode ser editada).
*/
export const MAX_REVIEW_PHOTOS = 3;

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    name: { type: String, required: true }, // nome mostrado (primeiro nome + inicial)
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    photos: {
      type: [String],
      validate: { validator: (a) => a.length <= MAX_REVIEW_PHOTOS, message: `No máximo ${MAX_REVIEW_PHOTOS} fotos` },
      default: [],
    },
    size: { type: String, default: '' },  // o que comprou (ajuda outros clientes)
    color: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
