import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true }, // preço de cada unidade no momento da compra (euros)
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  color: { type: new mongoose.Schema({ name: String, hex: String }, { _id: false }), default: undefined },
  reserved: { type: Boolean, default: false }, // esta peça saiu do stock quando o cliente foi pagar
});

/*
  Estados:
  - paymentStatus: pending (ainda a pagar) · awaiting (referência Multibanco criada, à espera)
                   · paid (pago) · failed (o pagamento falhou ou a referência expirou) · expired (desistiu)
  - orderStatus:   awaiting_payment · processing (pago, a preparar) · shipped (a caminho)
                   · delivered (entregue) · cancelled (cancelada)
*/
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    shippingAddress: {
      name: String,
      phone: String,
      street: String,
      postalCode: String,
      city: String,
      country: { type: String, default: 'Portugal' },
    },
    nif: { type: String, default: '' }, // contribuinte para a fatura (opcional)
    notes: { type: String, maxlength: 500 },

    paymentMethod: { type: String, default: '' }, // card, mb_way, multibanco, paypal... (vem do Stripe)
    paymentStatus: {
      type: String,
      enum: ['pending', 'awaiting', 'paid', 'failed', 'expired'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['awaiting_payment', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'awaiting_payment',
    },
    paidAt: Date,
    trackingNumber: { type: String, default: '' },
    // Acompanhamento da entrega
    shippedAt: Date,   // a loja enviou (a caminho)
    deliveredAt: Date, // a loja confirmou a entrega
    receivedAt: Date,  // o cliente confirmou que recebeu
    stockReserved: { type: Boolean, default: false },

    // Fatura certificada (InvoiceXpress)
    invoice: {
      type: new mongoose.Schema({
        status: { type: String, enum: ['creating', 'issued', 'failed'] },
        id: Number,          // número interno no InvoiceXpress
        number: String,      // ex.: "FR 2026/15"
        permalink: String,
        error: String,
        attempts: { type: Number, default: 0 },
        updatedAt: Date,
      }, { _id: false }),
      default: undefined,
    },

    // Ligação ao Stripe
    stripeSessionId: { type: String, index: true },
    stripePaymentIntentId: String,
    multibanco: {
      type: new mongoose.Schema({ entity: String, reference: String, expiresAt: Date, voucherUrl: String }, { _id: false }),
      default: undefined,
    },

    subtotal: { type: Number, required: true },
    couponCode: String,                   // código de desconto usado
    discount: { type: Number, default: 0 }, // euros descontados nos produtos
    shippingCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
