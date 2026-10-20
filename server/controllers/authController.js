import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { permsOf } from '../utils/permissions.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Resposta igual para todos os tipos de login
const session = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  permissions: permsOf(user),
  token: generateToken(user._id),
});

const normEmail = (email) => String(email || '').trim().toLowerCase();

export const register = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Indica o nome e um email válido' });
    if (password.length < 6) return res.status(400).json({ message: 'A senha tem de ter pelo menos 6 caracteres' });

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        message: exists.googleId && !exists.password
          ? 'Este email já tem conta criada com o Google. Usa o botão "Continuar com o Google".'
          : 'Email já registado',
      });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json(session(user));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

export const login = async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (user && user.googleId && !user.password) {
      return res.status(401).json({ message: 'Esta conta foi criada com o Google. Usa o botão "Continuar com o Google".' });
    }
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email ou password incorretos' });
    }
    res.json(session(user));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

export const getMe = async (req, res) => {
  const u = await User.findById(req.user._id).select('-password -favorites').lean();
  if (!u) return res.status(404).json({ message: 'Conta não encontrada' });
  const { googleId, ...rest } = u;
  res.json({ ...rest, permissions: permsOf(u), google: Boolean(googleId) }); // não expõe o identificador Google, só se está ligado
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
    res.status(created ? 201 : 200).json({ ...session(user), created });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
};
