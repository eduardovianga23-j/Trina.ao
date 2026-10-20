import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
import couponRoutes from './routes/coupons.js';
import stockAlertRoutes from './routes/stockAlerts.js';
import { UPLOAD_DIR, storageMode } from './utils/storage.js';
import { pageMeta, renderIndex, robotsTxt, sitemapXml, readTemplate } from './utils/seo.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ Define JWT_SECRET no ficheiro server/.env (pelo menos 32 caracteres). Vê o .env.example.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Site já construído (client/dist). Online, o mesmo servidor mostra o site e a API.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const SERVE_CLIENT = fs.existsSync(path.join(CLIENT_DIST, 'index.html')) && process.env.SERVE_CLIENT !== '0';

// Online o servidor fica atrás de um "proxy" (Render, Railway...): assim os limites usam o IP verdadeiro
if (IS_PROD || process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// Segurança: cabeçalhos de proteção (anti-clickjacking, sem "X-Powered-By", regras do que a página pode carregar)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // O botão "Continuar com o Google" abre uma janela da Google
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", 'https://accounts.google.com/gsi/client'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'connect-src': ["'self'", 'https://accounts.google.com/gsi/'],
      'frame-src': ['https://accounts.google.com/gsi/'],
      'font-src': ["'self'", 'data:'],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      ...(IS_PROD ? {} : { 'upgrade-insecure-requests': null }),
    },
  },
}));

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
app.use('/api/coupons', couponRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);

// Saúde do servidor (o alojamento usa isto para saber se está tudo bem)
app.get('/api/health', (req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ ok: db, db: db ? 'ligada' : 'desligada' });
});
app.use('/api', (req, res) => res.status(404).json({ message: 'Endereço da API não encontrado' }));

if (SERVE_CLIENT) {
  // Ficheiros do site (os que têm um código no nome podem ficar guardados no navegador 1 ano)
  app.use(express.static(CLIENT_DIST, {
    index: false,
    setHeaders: (res, file) => {
      res.setHeader('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    },
  }));
  // Google: lista de páginas e regras
  app.get('/robots.txt', (req, res) => res.type('text/plain').send(robotsTxt()));
  app.get('/sitemap.xml', async (req, res) => {
    try { res.type('application/xml').send(await sitemapXml()); } catch { res.status(500).end(); }
  });

  // Todas as outras páginas (/shop, /produto/..., /conta...) são o mesmo index.html: o React trata do resto.
  // Antes de enviar, o servidor escreve o título, a descrição e a foto de cada página (Google e partilhas).
  const template = readTemplate(path.join(CLIENT_DIST, 'index.html'));
  app.get(/^\/(?!api\/|uploads\/).*/, async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    try {
      const meta = await pageMeta(req.path, req.query);
      res.status(meta.status || 200).type('html').send(renderIndex(template, meta));
    } catch {
      res.type('html').send(template);
    }
  });
} else {
  app.get('/', (req, res) => res.json({ message: 'Trina.ao API running 🚀' }));
}

// Erros não tratados
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Pedido demasiado grande' });
  console.error(err);
  res.status(500).json({ message: 'Erro no servidor' });
});

// Avisos de configuração quando o site está online
if (IS_PROD) {
  const warn = (m) => console.warn(`⚠️  ${m}`);
  if (!process.env.MONGO_URI) warn('Falta MONGO_URI (a base de dados do MongoDB Atlas).');
  if (!process.env.CLIENT_URL || process.env.CLIENT_URL.includes('localhost')) warn('CLIENT_URL deve ser o endereço do site (ex.: https://trina.pt). É usado nos emails e nos pagamentos.');
  if (storageMode() === 'local') warn('As fotos estão a ser guardadas no disco do servidor e podem perder-se a cada atualização. Põe CLOUDINARY_URL no .env.');
  if (stripeEnabled() && !process.env.STRIPE_WEBHOOK_SECRET) warn('Falta STRIPE_WEBHOOK_SECRET (o webhook confirma pagamentos Multibanco mesmo com o site fechado).');
  if (!SERVE_CLIENT) warn('O site (client/dist) não foi encontrado: corre "npm run build" na pasta principal.');
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trina_ao')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} · fotos: ${storageMode()}${SERVE_CLIENT ? ' · site incluído' : ''}`);
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
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    // Online, sai com erro para o alojamento reiniciar o servidor sozinho
    if (IS_PROD) process.exit(1);
  });
