import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { permsOf, readPermissions } from '../utils/permissions.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Atualiza o perfil (nome). O email e a senha não se mudam por aqui.
router.put('/profile', protect, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'O nome tem de ter entre 2 e 80 caracteres' });
    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ---------- Favoritos (cada utilizador com sessão) ----------
const MAX_FAVORITES = 200;
const validIds = (list) => [...new Set((Array.isArray(list) ? list : []).map(String))].filter((id) => mongoose.isValidObjectId(id));

// Lista os ids dos favoritos
router.get('/favorites', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('favorites');
  res.json({ ids: (user?.favorites || []).map(String) });
});

// Junta favoritos (ex.: os que a pessoa marcou antes de entrar na conta)
router.post('/favorites', protect, async (req, res) => {
  try {
    const ids = validIds(req.body?.ids).slice(0, MAX_FAVORITES);
    const existing = (await Product.find({ _id: { $in: ids } }).select('_id')).map((p) => p._id);
    const user = await User.findById(req.user._id);
    const merged = validIds([...user.favorites.map(String), ...existing.map(String)]).slice(-MAX_FAVORITES);
    user.favorites = merged;
    await user.save();
    res.json({ ids: merged });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

router.put('/favorites/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId) || !(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    await User.updateOne({ _id: req.user._id }, { $addToSet: { favorites: productId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

router.delete('/favorites/:productId', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.json({ ok: true });
    await User.updateOne({ _id: req.user._id }, { $pull: { favorites: req.params.productId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// ---------- Equipa (só o administrador principal) ----------
const teamView = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, permissions: permsOf(u), createdAt: u.createdAt });
const noPermission = (p) => !Object.values(p).some(Boolean);

// Lista o administrador principal e os gestores
router.get('/team', protect, adminOnly, async (req, res) => {
  try {
    const team = await User.find({ role: { $in: ['admin', 'manager'] } }).sort({ role: 1, createdAt: 1 });
    res.json(team.map(teamView));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Torna uma conta existente em gestor (pelo email)
router.post('/team', protect, adminOnly, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Email inválido' });
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Não existe nenhuma conta com este email. Pede à pessoa para criar conta no site primeiro.' });
    }
    if (user.role === 'admin') return res.status(400).json({ message: 'Esta conta é a do administrador principal.' });
    if (user.role === 'manager') return res.status(400).json({ message: 'Esta pessoa já é gestora.' });
    const permissions = req.body?.permissions ? readPermissions(req.body.permissions) : { products: true, orders: false, reviews: false };
    if (noPermission(permissions)) return res.status(400).json({ message: 'Escolhe pelo menos uma permissão.' });
    user.role = 'manager';
    user.permissions = permissions;
    await user.save();
    res.status(201).json(teamView(user));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Muda as permissões de um gestor  { permissions: { products, orders, reviews } }
router.put('/team/:id/permissions', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).catch(() => null);
    if (!user || user.role !== 'manager') return res.status(404).json({ message: 'Gestor não encontrado' });
    const permissions = readPermissions(req.body?.permissions);
    if (noPermission(permissions)) {
      return res.status(400).json({ message: 'Um gestor precisa de pelo menos uma permissão. Para tirar o acesso todo, usa "Retirar acesso".' });
    }
    user.permissions = permissions;
    await user.save();
    res.json(teamView(user));
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Retira o acesso de gestor (a conta continua a existir, como cliente)
router.delete('/team/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).catch(() => null);
    if (!user || user.role !== 'manager') return res.status(404).json({ message: 'Gestor não encontrado' });
    user.role = 'customer';
    user.permissions = undefined;
    await user.save();
    res.json({ message: `${user.name} deixou de ser gestor(a).` });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Admin — get all users
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password -googleId -passwordResetHash -passwordResetExpires -sessionVersion');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin — delete user
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'Não podes apagar a tua própria conta aqui.' });
    const target = await User.findById(req.params.id).catch(() => null);
    if (!target) return res.status(404).json({ message: 'Utilizador não encontrado' });
    if (target.role === 'admin') return res.status(403).json({ message: 'Não é possível apagar o administrador principal.' });
    await target.deleteOne();
    res.json({ message: 'Utilizador eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
