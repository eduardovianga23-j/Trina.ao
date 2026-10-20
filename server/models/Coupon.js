import mongoose from 'mongoose';

/*
  Códigos de desconto (ex.: BEMVINDA10).
  type: percent  → value = % de desconto nos produtos (ex.: 10)
        fixed    → value = euros de desconto (ex.: 5)
        shipping → envio grátis
*/
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, match: [/^[A-Z0-9_-]{3,20}$/, 'O código só pode ter letras, números, - e _ (3 a 20)'] },
    description: { type: String, trim: true, maxlength: 120, default: '' },
    type: { type: String, enum: ['percent', 'fixed', 'shipping'], required: true },
    value: { type: Number, default: 0, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },   // compra mínima (euros)
    startsAt: Date,
    expiresAt: Date,
    maxUses: { type: Number, min: 1 },                   // vazio = sem limite
    usedCount: { type: Number, default: 0 },
    onePerCustomer: { type: Boolean, default: true },
    firstOrderOnly: { type: Boolean, default: false },  // só na primeira compra
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.pre('validate', function (next) {
  if (this.type === 'percent' && !(this.value >= 1 && this.value <= 90)) this.invalidate('value', 'A percentagem tem de estar entre 1% e 90%');
  if (this.type === 'fixed' && !(this.value > 0)) this.invalidate('value', 'Indica quantos euros de desconto');
  if (this.type === 'shipping') this.value = 0;
  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) this.invalidate('expiresAt', 'A data de fim tem de ser depois da de início');
  next();
});

export default mongoose.model('Coupon', couponSchema);
