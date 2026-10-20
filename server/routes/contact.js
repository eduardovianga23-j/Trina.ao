import express from 'express';
import jwt from 'jsonwebtoken';
import { storeEmail } from '../utils/mailer.js';
import { emailContact } from '../utils/emails.js';

/*
  POST /api/contact  { name, email, subject, order, message, website }
  Formulário de contacto: a mensagem chega ao email da loja.
  Responder ao email responde diretamente ao cliente.
  - "website" é um campo escondido: se vier preenchido, é um robô (spam) e é ignorado.
  - No máximo 5 mensagens por 15 minutos a partir do mesmo endereço.
*/
const router = express.Router();

const SUBJECTS = {
  encomenda: 'A minha encomenda',
  devolucao: 'Trocas e devoluções',
  produto: 'Dúvida sobre um produto',
  pagamento: 'Pagamentos',
  outro: 'Outro assunto',
};

const hits = new Map(); // ip -> [datas]
const WINDOW = 15 * 60 * 1000;
const tooMany = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
};

const clean = (v, max) => String(v ?? '').trim().slice(0, max);

router.post('/', async (req, res) => {
  const body = req.body || {};
  if (body.website) return res.json({ ok: true }); // robô
  if (tooMany(req.ip)) return res.status(429).json({ message: 'Enviaste várias mensagens seguidas. Tenta de novo daqui a uns minutos.' });

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const subject = SUBJECTS[body.subject] ? body.subject : 'outro';
  const order = clean(body.order, 20).replace(/[^\w#-]/g, '');
  const message = clean(body.message, 3000);

  if (name.length < 2) return res.status(400).json({ message: 'Indica o teu nome' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Indica um email válido para te respondermos' });
  if (message.length < 10) return res.status(400).json({ message: 'Escreve a tua mensagem (pelo menos 10 caracteres)' });
  if (!storeEmail()) return res.status(503).json({ message: 'O formulário ainda não está configurado. Escreve-nos diretamente por email.' });

  // Se tiver sessão iniciada, junta a informação da conta (ajuda a encontrar as encomendas)
  let account = null;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) account = jwt.verify(token, process.env.JWT_SECRET).id;
  } catch { /* sem sessão */ }

  const sent = await emailContact({ name, email, subjectLabel: SUBJECTS[subject], order, message, account });
  if (!sent) return res.status(502).json({ message: 'Não foi possível enviar a mensagem agora. Tenta de novo ou escreve-nos por email.' });
  res.json({ ok: true });
});

export default router;
