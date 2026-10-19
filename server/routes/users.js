import express from 'express';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    if (req.body.password) user.password = req.body.password;

    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Equipa (só o administrador principal) ----------
const teamView = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });

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
    user.role = 'manager';
    await user.save();
    res.status(201).json(teamView(user));
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
    await user.save();
    res.json({ message: `${user.name} deixou de ser gestor(a).` });
  } catch (err) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Admin — get all users
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
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
