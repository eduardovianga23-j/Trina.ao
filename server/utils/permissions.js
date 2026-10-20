/*
  Permissões da equipa da loja.
  - admin (administrador principal): pode tudo, incluindo gerir a equipa, cancelar encomendas e reembolsos.
  - manager (gestor): só o que o administrador principal ligar:
      products → criar, editar e apagar produtos (stock e promoções incluídos)
      orders   → ver as encomendas e marcar como enviada/entregue
      reviews  → ver e apagar avaliações de clientes
      reports  → ver as estatísticas de vendas (faturação, mais vendidos)
*/
export const PERMISSIONS = ['products', 'orders', 'reviews', 'reports'];

const NONE = { products: false, orders: false, reviews: false, reports: false };
const ALL = { products: true, orders: true, reviews: true, reports: true };

export const permsOf = (user) => {
  if (user?.role === 'admin') return { ...ALL };
  if (user?.role !== 'manager') return { ...NONE };
  const p = user.permissions || {};
  return {
    products: p.products ?? true, // gestores antigos (antes das permissões) geriam produtos
    orders: Boolean(p.orders),
    reviews: Boolean(p.reviews),
    reports: Boolean(p.reports),
  };
};

export const can = (user, perm) => Boolean(permsOf(user)[perm]);

// Lê { products, orders, reviews, reports } vindo do formulário (só aceita estes)
export const readPermissions = (input = {}) =>
  Object.fromEntries(PERMISSIONS.map((k) => [k, input?.[k] === true]));
