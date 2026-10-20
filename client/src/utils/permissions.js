// Permissões dos gestores (iguais às do servidor: server/utils/permissions.js)
export const PERMISSIONS = [
  { key: 'products', label: 'Produtos', path: '/admin', description: 'Criar, editar e apagar produtos, stock e promoções' },
  { key: 'orders', label: 'Encomendas', path: '/admin/encomendas', description: 'Ver encomendas e marcar como enviada ou entregue' },
  { key: 'reviews', label: 'Avaliações', path: '/admin/avaliacoes', description: 'Ver e apagar avaliações de clientes' },
  { key: 'reports', label: 'Estatísticas', path: '/admin/estatisticas', description: 'Ver as vendas e exportar para a contabilidade (sem dados pessoais dos clientes)' },
];

export const permsOf = (user) => {
  if (user?.role === 'admin') return { products: true, orders: true, reviews: true, reports: true };
  if (user?.role !== 'manager') return { products: false, orders: false, reviews: false, reports: false };
  const p = user.permissions || {};
  return { products: p.products ?? true, orders: Boolean(p.orders), reviews: Boolean(p.reviews), reports: Boolean(p.reports) };
};

// Primeira página do painel a que a pessoa tem acesso
export const firstAdminPath = (user) => PERMISSIONS.find((p) => permsOf(user)[p.key])?.path || null;

/*
  Título de cada pessoa da equipa, a partir das permissões (muda sozinho quando mudas as permissões):
    tudo (administrador principal) → "Administrador principal"
    só uma → "Gestor de encomendas", "Gestor de produtos", "Gestor de avaliações" ou "Contabilidade"
    duas ou três → "Gestor · Produtos e Encomendas"
    as quatro → "Gestor geral"
*/
const SINGLE_TITLE = {
  orders: 'Gestor de encomendas',
  products: 'Gestor de produtos',
  reviews: 'Gestor de avaliações',
  reports: 'Contabilidade',
};

export const roleTitle = (user) => {
  if (user?.role === 'admin') return 'Administrador principal';
  if (user?.role !== 'manager') return 'Cliente';
  const on = PERMISSIONS.filter((p) => permsOf(user)[p.key]);
  if (on.length === 0) return 'Gestor';
  if (on.length === 1) return SINGLE_TITLE[on[0].key];
  if (on.length === PERMISSIONS.length) return 'Gestor geral';
  const names = on.map((p) => p.label);
  return `Gestor · ${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
};
