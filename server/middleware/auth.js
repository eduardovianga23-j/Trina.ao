import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { can } from '../utils/permissions.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Não autorizado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password -googleId -passwordResetHash -passwordResetExpires');
    // A conta pode ter sido apagada depois de o token ser criado
    if (!req.user) return res.status(401).json({ message: 'Sessão inválida, entra novamente' });
    // A senha mudou depois de esta sessão começar (ex.: recuperou a senha noutro dispositivo)
    if ((decoded.sv || 0) !== (req.user.sessionVersion || 0)) {
      return res.status(401).json({ message: 'A senha foi alterada. Entra novamente.' });
    }
    next();
  } catch {
    res.status(401).json({ message: 'Sessão expirada, entra novamente' });
  }
};

// Só o administrador principal (ex.: gerir a equipa, encomendas)
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado — apenas o administrador principal' });
  }
  next();
};

// Administrador principal ou gestor (ex.: criar, editar e apagar produtos)
export const staffOnly = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Acesso negado — apenas a equipa da loja' });
  }
  next();
};

// Precisa de uma permissão (o administrador principal tem todas)
const PERM_LABEL = { products: 'produtos', orders: 'encomendas', reviews: 'avaliações' };
export const requirePerm = (perm) => (req, res, next) => {
  if (!can(req.user, perm)) {
    return res.status(403).json({ message: `Não tens permissão para gerir ${PERM_LABEL[perm] || perm}. Fala com o administrador principal.` });
  }
  next();
};

// Sessão opcional: se houver token válido, req.user fica preenchido; senão continua sem utilizador (compra sem conta)
export const optionalAuth = async (req, res, next) => {
  req.user = null;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -googleId -passwordResetHash -passwordResetExpires');
      if (user && (decoded.sv || 0) === (user.sessionVersion || 0)) req.user = user;
    }
  } catch { /* token inválido: segue como visitante */ }
  next();
};
