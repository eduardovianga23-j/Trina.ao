import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/uploads.js';
import paymentRoutes from './routes/payments.js';
import { stripeEnabled } from './utils/stripe.js';
import { verifyMail } from './utils/mailer.js';
import { invoicingEnabled, autoInvoicing } from './utils/invoicing.js';
import { sweepOrders } from './controllers/orderController.js';
import reviewRoutes from './routes/reviews.js';
import contactRoutes from './routes/contact.js';
import { UPLOAD_DIR, storageMode } from './utils/storage.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ Define JWT_SECRET no ficheiro server/.env (pelo menos 32 caracteres). Vê o .env.example.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Segurança: cabeçalhos de proteção (anti-clickjacking, sem "X-Powered-By", etc.)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
// Avisos do Stripe (tem de vir antes do express.json)
app.use('/api/payments', paymentRoutes);
app.use(express.json({ limit: '1mb' }));

// Fotos guardadas localmente (quando não se usa o Cloudinary)
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', index: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Trina.ao API running 🚀' }));

// Erros não tratados
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Pedido demasiado grande' });
  console.error(err);
  res.status(500).json({ message: 'Erro no servidor' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trina_ao')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} · fotos: ${storageMode()}`);
      console.log(stripeEnabled()
        ? `💳 Pagamentos Stripe ativos (${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'modo REAL' : 'modo de teste'})`
        : '💳 Pagamentos desligados: falta STRIPE_SECRET_KEY no server/.env');
      verifyMail().then(console.log);
      console.log(invoicingEnabled()
        ? `🧾 InvoiceXpress ligado (conta ${process.env.INVOICEXPRESS_ACCOUNT})${autoInvoicing() ? ' · faturas automáticas ativas' : ' · faturas automáticas só com pagamentos reais (Stripe em modo de teste)'}`
        : '🧾 Faturas automáticas desligadas (opcional: INVOICEXPRESS_ACCOUNT e INVOICEXPRESS_API_KEY no .env)');
      // Confirma pagamentos e devolve ao stock as peças de pagamentos abandonados
      setTimeout(sweepOrders, 15 * 1000);
      setInterval(sweepOrders, 5 * 60 * 1000);
    });
  })
  .catch((err) => console.error('❌ MongoDB error:', err.message));
