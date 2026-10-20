// Permissões dos gestores (iguais às do servidor: server/utils/permissions.js)
export const PERMISSIONS = [
  { key: 'products', label: 'Produtos', path: '/admin', description: 'Criar, editar e apagar produtos, stock e promoções' },
  { key: 'orders', label: 'Encomendas', path: '/admin/encomendas', description: 'Ver encomendas e marcar como enviada ou entregue' },
  { key: 'reviews', label: 'Avaliações', path: '/admin/avaliacoes', description: 'Ver e apagar avaliações de clientes' },
  { key: 'reports', label: 'Estatísticas', path: '/admin/estatisticas', description: 'Ver as vendas, a faturação e os mais vendidos' },
];

export const permsOf = (user) => {
  if (user?.role === 'admin') return { products: true, orders: true, reviews: true, reports: true };
  if (user?.role !== 'manager') return { products: false, orders: false, reviews: false, reports: false };
  const p = user.permissions || {};
  return { products: p.products ?? true, orders: Boolean(p.orders), reviews: Boolean(p.reviews), reports: Boolean(p.reports) };
};

// Primeira página do painel a que a pessoa tem acesso
export const firstAdminPath = (user) => PERMISSIONS.find((p) => permsOf(user)[p.key])?.path || null;
