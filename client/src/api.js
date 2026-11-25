// Axios instance + all API calls (the only place HTTP happens).
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' });
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
api.interceptors.response.use((r) => r, (err) => {
  const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/register');
  if (err.response?.status === 401 && !isAuthCall) onUnauthorized();
  return Promise.reject(err);
});

export const errorInfo = (err) => {
  const d = err.response?.data;
  const fields = {};
  (d?.errors || []).forEach((e) => { fields[e.field] = e.message; });
  return { message: d?.message || err.message || 'Something went wrong', fields };
};

export const authApi = {
  login: (b) => api.post('/auth/login', b).then((r) => r.data.data),
  register: (b) => api.post('/auth/register', b).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
};
export const leadApi = {
  list: (params, signal) => api.get('/leads', { params, signal }).then((r) => r.data),
  stats: () => api.get('/leads/stats').then((r) => r.data.data),
  create: (b) => api.post('/leads', b).then((r) => r.data.data),
  update: (id, b) => api.put(`/leads/${id}`, b).then((r) => r.data.data),
  setStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }).then((r) => r.data.data),
  remove: (id) => api.delete(`/leads/${id}`).then((r) => r.data),
};
