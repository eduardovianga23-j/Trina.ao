import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Não autorizado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password -googleId');
    // A conta pode ter sido apagada depois de o token ser criado
    if (!req.user) return res.status(401).json({ message: 'Sessão inválida, entra novamente' });
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
