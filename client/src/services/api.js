import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Envia a sessão (token) em todos os pedidos
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem('trina_user') || 'null');
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch { /* sessão corrompida: ignora */ }
  return config;
});

// Sessão expirada: termina a sessão e avisa a app
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('trina_user')) {
      localStorage.removeItem('trina_user');
      window.dispatchEvent(new Event('trina:logout'));
    }
    return Promise.reject(err);
  }
);

// Mensagem de erro legível vinda do servidor
export const apiError = (err, fallback = 'Ocorreu um erro. Tenta novamente.') =>
  err?.response?.data?.message || (err?.request && !err.response ? 'Sem ligação ao servidor. Confirma que o servidor está ligado.' : fallback);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  googleConfig: () => api.get('/auth/google-config'),
  google: (credential) => api.post('/auth/google', { credential }),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getBySlug: (slug) => api.get(`/products/slug/${encodeURIComponent(slug)}`),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id) => api.get(`/products/${id}/related`),
  // Admin
  getAllAdmin: () => api.get('/products/admin/all'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
};

export const uploadAPI = {
  images: (files, onProgress) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    return api.post('/uploads', form, {
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
  },
  // Apaga fotos enviadas que não chegaram a ser guardadas num produto
  discard: (urls) => (urls.length ? api.delete('/uploads', { data: { urls } }).catch(() => {}) : Promise.resolve()),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: () => api.get('/orders'),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

// Equipa da loja (só o administrador principal)
export const teamAPI = {
  list: () => api.get('/users/team'),
  add: (email) => api.post('/users/team', { email }),
  remove: (id) => api.delete(`/users/team/${id}`),
};

export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  getAll: () => api.get('/users'),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
