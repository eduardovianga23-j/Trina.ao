import mongoose from 'mongoose';

// "Avisa-me quando voltar": um email por produto/tamanho/cor esgotado. Fica notifiedAt quando o aviso é enviado.
const stockAlertSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifiedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('StockAlert', stockAlertSchema);
