import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both the raw token this file reads on each request AND the
      // zustand-persisted auth blob (useStore's `ecommerce-auth` key) that
      // drives isAuthenticated across the app. Removing only the former left
      // stale/expired sessions "authenticated" after reload, so PublicOnly
      // guards (e.g. on /auth/login) bounced straight back to /profile
      // instead of letting the user log in again.
      localStorage.removeItem('token');
      localStorage.removeItem('ecommerce-auth');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error.response?.data || { message: 'Errore di rete' });
  }
);

export default api;
