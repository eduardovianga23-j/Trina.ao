import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

/*
  Envio de emails.
  - Com SMTP_USER e SMTP_PASS no server/.env: envia de verdade (ex.: pelo teu Gmail).
  - Sem isso: não envia, mas guarda cada email em server/emails/ para veres como fica
    (abre o ficheiro .html no navegador).
*/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PREVIEW_DIR = path.join(__dirname, '..', 'emails');

export const mailEnabled = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: String(process.env.SMTP_PASS).replace(/\s/g, '') },
    });
  }
  return transporter;
};

const fromAddress = () => process.env.MAIL_FROM || `Trina <${process.env.SMTP_USER}>`;

// Email da loja que recebe os avisos de encomendas novas
export const storeEmail = () => process.env.STORE_EMAIL || process.env.SMTP_USER || '';

const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);

// Envia sem bloquear o pedido. Um erro no email nunca estraga a compra. Devolve true se correu bem.
export const sendMail = ({ to, subject, html, text, replyTo }) => {
  if (!to) return Promise.resolve();
  const job = mailEnabled()
    ? getTransporter().sendMail({ from: fromAddress(), to, subject, html, text, ...(replyTo && { replyTo }) })
        .then(() => { console.log(`📧 Email enviado para ${to}: ${subject}`); return true; })
    : (async () => {
        await fs.mkdir(PREVIEW_DIR, { recursive: true });
        const file = path.join(PREVIEW_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}-${slug(subject)}.html`);
        await fs.writeFile(file, `<!-- Para: ${to} | Assunto: ${subject} -->\n${html}`);
        console.log(`📧 (Gmail não configurado) Email guardado em server/emails/ — para ${to}: ${subject}`);
        return true;
      })();
  return job.catch((err) => { console.error(`📧 Erro ao enviar email para ${to}:`, err.message); return false; });
};

// Confirma no arranque se o Gmail aceita a senha
export const verifyMail = async () => {
  if (!mailEnabled()) return '📧 Emails: Gmail não configurado (ficam guardados em server/emails/)';
  try {
    await getTransporter().verify();
    return `📧 Emails ativos (${process.env.SMTP_USER})`;
  } catch (err) {
    return `📧 Emails: o Gmail recusou a ligação (${err.message.split('\n')[0]}). Confirma SMTP_USER e SMTP_PASS (palavra-passe de app).`;
  }
};
