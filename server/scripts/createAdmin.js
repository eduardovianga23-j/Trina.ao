/*
  Cria (ou promove) o ADMINISTRADOR PRINCIPAL da loja.
  Uso:  npm run create-admin
  Pergunta o email, o nome e a password no terminal (a password aparece como ****).

  Gestores (que só gerem produtos) adicionam-se no site: Painel → Equipa.
*/
import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import User from '../models/User.js';

const rl = readline.createInterface({ input, output });

// Lê uma password sem a mostrar no ecrã
const askHidden = (question) =>
  new Promise((resolve) => {
    if (!input.isTTY) return rl.question(question).then(resolve);
    rl.close(); // o readline mostraria o que se escreve; a partir daqui lemos o teclado diretamente
    output.write(question);
    input.setRawMode(true);
    input.resume();
    let value = '';
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\r' || ch === '\n') {
          input.setRawMode(false);
          input.removeListener('data', onData);
          output.write('\n');
          input.pause();
          return resolve(value);
        }
        if (ch === '\u0003') { output.write('\n'); process.exit(130); } // Ctrl+C
        if (ch === '\u0008' || ch === '\u007f') {                      // apagar
          if (value) { value = value.slice(0, -1); output.write('\b \b'); }
        } else if (ch >= ' ') {
          value += ch;
          output.write('*');
        }
      }
    };
    input.on('data', onData);
  });

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trina_ao');
  const others = await User.find({ role: 'admin' }).select('email');
  if (others.length) console.log(`ℹ️  Administrador(es) principal(is) atual(is): ${others.map((u) => u.email).join(', ')}`);

  const email = (process.env.ADMIN_EMAIL || (await rl.question('Email do administrador principal: '))).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido');

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`✅ A conta ${email} passou a ser administradora principal.`);
  } else {
    const name = (process.env.ADMIN_NAME || (await rl.question('Nome: '))).trim() || 'Administrador';
    const password = process.env.ADMIN_PASSWORD || (await askHidden('Password (mínimo 8 caracteres): '));
    if (password.length < 8) throw new Error('A password tem de ter pelo menos 8 caracteres');
    await User.create({ name, email, password, role: 'admin' });
    console.log(`✅ Administrador principal ${email} criado. Já podes entrar no site e abrir /admin.`);
  }
} catch (err) {
  console.error('❌', err.message);
  process.exitCode = 1;
} finally {
  if (!rl.closed) rl.close();
  await mongoose.disconnect();
}
