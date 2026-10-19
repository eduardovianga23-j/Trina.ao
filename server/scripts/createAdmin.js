/*
  Cria (ou promove) uma conta de administrador.
  Uso:  npm run create-admin
  Pergunta o nome, o email e a password no terminal.
*/
import 'dotenv/config';
import mongoose from 'mongoose';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import User from '../models/User.js';

const rl = readline.createInterface({ input, output });

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trina_ao');
  const email = (process.env.ADMIN_EMAIL || (await rl.question('Email do administrador: '))).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido');

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log(`✅ A conta ${email} passou a ser administradora.`);
  } else {
    const name = (process.env.ADMIN_NAME || (await rl.question('Nome: '))).trim() || 'Administrador';
    const password = process.env.ADMIN_PASSWORD || (await rl.question('Password (mínimo 8 caracteres): '));
    if (password.length < 8) throw new Error('A password tem de ter pelo menos 8 caracteres');
    await User.create({ name, email, password, role: 'admin' });
    console.log(`✅ Administrador ${email} criado. Já podes entrar no site e abrir /admin.`);
  }
} catch (err) {
  console.error('❌', err.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect();
}
