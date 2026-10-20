import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { permsOf } from '../utils/permissions.js';
import { passwordProblem, newResetToken, hashToken } from '../utils/password.js';
import { hit, peek, reset as resetLimit } from '../utils/rateLimit.js';
import { emailPasswordReset, emailPasswordChanged } from '../utils/emails.js';
import Order from '../models/Order.js';

// Compras feitas sem conta com este email passam para a conta (só quando o email está confirmado:
// entrar com o Google ou recuperar a senha pelo link do email)
const attachGuestOrders = (user) =>
  Order.updateMany({ guestEmail: user.email, user: { $exists: false } }, { $set: { user: user._id } })
    .then((r) => r.modifiedCount && console.log(`🧾 ${r.modifiedCount} compra(s) sem conta ligadas a ${user.email}`))
    .catch(() => {});

// sv = versão das sessões: quando a senha muda, sobe, e os tokens antigos deixam de valer
const generateToken = (user) =>
  jwt.sign({ id: user._id, sv: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Resposta igual para todos os tipos de login
const session = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  permissions: permsOf(user),
  token: generateToken(user),
});

const normEmail = (email) => String(email || '').trim().toLowerCase();

export const register = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 80);
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Indica o nome e um email válido' });
    const problem = passwordProblem(password, { email, name });
    if (problem) return res.status(400).json({ message: problem });

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: exists.googleId && !exists.password
          ? 'Este email já tem conta criada com o Google. Usa o botão "Continuar com o Google".'
          : 'Este email já tem conta. Inicia sessão ou recupera a senha.',
      });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json(session(user));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

/*
  Proteção contra quem tenta adivinhar senhas:
  depois de 5 tentativas erradas para o mesmo email, essa conta fica bloqueada 15 minutos
  (só para entrar com senha; recuperar a senha e o Google continuam a funcionar).
*/
const FAIL_WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 5;

export const login = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Indica o email e a senha' });

    const fails = peek('login-fail', email, FAIL_WINDOW);
    if (fails.count >= MAX_FAILS) {
      const min = Math.max(1, Math.ceil(fails.retryInMs / 60000));
      return res.status(429).json({
        message: `Demasiadas tentativas erradas. Por segurança, espera ${min} ${min === 1 ? 'minuto' : 'minutos'} ou usa "Esqueci-me da senha".`,
      });
    }

    const user = await User.findOne({ email });
    if (user && user.googleId && !user.password) {
      return res.status(401).json({ message: 'Esta conta foi criada com o Google. Usa o botão "Continuar com o Google" ou "Esqueci-me da senha" para criar uma senha.' });
    }
    if (!user || !(await user.comparePassword(password))) {
      const { count } = hit('login-fail', email, FAIL_WINDOW);
      const left = MAX_FAILS - count;
      return res.status(401).json({
        message: left > 0 && left <= 2
          ? `Email ou senha incorretos. ${left === 1 ? 'Resta 1 tentativa' : `Restam ${left} tentativas`} antes de a conta ficar bloqueada 15 minutos.`
          : 'Email ou senha incorretos',
      });
    }
    resetLimit('login-fail', email);
    res.json(session(user));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// ---------- Recuperar a senha ----------

const RESET_MINUTES = 60;
const GENERIC_FORGOT = 'Se existir uma conta com esse email, enviámos um link para criares uma senha nova. Vê também a pasta de spam.';

// POST /api/auth/forgot  { email } — envia o link por email (a resposta é sempre igual, para não revelar quem tem conta)
export const forgotPassword = async (req, res) => {
  try {
    const email = normEmail(req.body?.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Indica um email válido' });
    // No máximo 3 emails por hora para o mesmo endereço
    if (hit('forgot-email', email, 60 * 60 * 1000).count > 3) return res.json({ message: GENERIC_FORGOT });

    const user = await User.findOne({ email });
    if (user) {
      const { token, hash } = newResetToken();
      user.passwordResetHash = hash;
      user.passwordResetExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
      emailPasswordReset(user, `${base}/nova-senha?token=${token}`, RESET_MINUTES);
    }
    res.json({ message: GENERIC_FORGOT });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// POST /api/auth/reset  { token, password } — define a senha nova e entra logo
export const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ message: 'Este link não é válido. Pede um novo.' });

    const user = await User.findOne({ passwordResetHash: hashToken(token), passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Este link já expirou ou já foi usado. Pede um novo.' });

    const problem = passwordProblem(password, user);
    if (problem) return res.status(400).json({ message: problem });

    attachGuestOrders(user);
    user.password = password;
    user.passwordResetHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    user.sessionVersion = (user.sessionVersion || 0) + 1; // as sessões antigas deixam de valer
    await user.save();
    resetLimit('login-fail', user.email);
    emailPasswordChanged(user);
    res.json(session(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// PUT /api/auth/password  { currentPassword, newPassword } — mudar a senha com sessão iniciada
export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const current = String(req.body?.currentPassword || '');
    const next = String(req.body?.newPassword || '');
    // Contas só com Google ainda não têm senha: podem criar uma sem indicar a atual
    if (user.password && !(await user.comparePassword(current))) {
      return res.status(400).json({ message: 'A senha atual não está certa' });
    }
    const problem = passwordProblem(next, user);
    if (problem) return res.status(400).json({ message: problem });
    if (user.password && current === next) return res.status(400).json({ message: 'A senha nova tem de ser diferente da atual' });

    user.password = next;
    user.passwordChangedAt = new Date();
    user.sessionVersion = (user.sessionVersion || 0) + 1; // termina a sessão nos outros dispositivos
    await user.save();
    emailPasswordChanged(user);
    res.json(session(user)); // este dispositivo continua com sessão
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

export const getMe = async (req, res) => {
  const u = await User.findById(req.user._id).select('-favorites').lean();
  if (!u) return res.status(404).json({ message: 'Conta não encontrada' });
  const { googleId, password, passwordChangedAt, sessionVersion, passwordResetHash, passwordResetExpires, ...rest } = u;
  res.json({ ...rest, permissions: permsOf(u), google: Boolean(googleId), hasPassword: Boolean(password) }); // não expõe o identificador Google, só se está ligado
};

// ---------- Google ----------

const googleClientId = () => process.env.GOOGLE_CLIENT_ID || '';
let googleClient = null;
const getGoogleClient = () => (googleClient ||= new OAuth2Client(googleClientId()));

// GET /api/auth/google-config — o site pergunta se o login com Google está ativo
export const googleConfig = (req, res) => {
  res.json({ clientId: googleClientId() || null });
};

/*
  Encontra ou cria a conta a partir dos dados confirmados pela Google.
  - Já entrou com Google antes: usa essa conta.
  - Já tem conta com o mesmo email (criada com password): liga o Google a essa conta.
    É seguro porque a Google confirmou que a pessoa é dona do email.
  - Não tem conta: cria uma nova, sem password.
*/
export const userFromGooglePayload = async (payload) => {
  const email = normEmail(payload.email);
  let user = await User.findOne({ googleId: payload.sub });
  if (user) return { user, created: false };

  user = await User.findOne({ email });
  if (user) {
    user.googleId = payload.sub;
    if (!user.avatar && payload.picture) user.avatar = payload.picture;
    await user.save();
    return { user, created: false };
  }

  user = await User.create({
    name: String(payload.name || email.split('@')[0]).slice(0, 80),
    email,
    googleId: payload.sub,
    avatar: payload.picture || '',
  });
  return { user, created: true };
};

// POST /api/auth/google  { credential }  (credential = token enviado pelo botão da Google)
export const googleLogin = async (req, res) => {
  if (!googleClientId()) {
    return res.status(503).json({ message: 'O login com Google ainda não está configurado no servidor.' });
  }
  const credential = String(req.body?.credential || '');
  if (!credential) return res.status(400).json({ message: 'Falta a confirmação da Google' });

  let payload;
  try {
    // Confirma com a Google que o token é verdadeiro, recente e foi feito para este site
    const ticket = await getGoogleClient().verifyIdToken({ idToken: credential, audience: googleClientId() });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: 'Não foi possível confirmar a conta Google. Tenta novamente.' });
  }
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({ message: 'A conta Google não tem um email confirmado.' });
  }

  try {
    const { user, created } = await userFromGooglePayload(payload);
    attachGuestOrders(user);
    res.status(created ? 201 : 200).json({ ...session(user), created });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
