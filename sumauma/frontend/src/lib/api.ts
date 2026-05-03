import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/admin',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Interceptor: injeta JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: redireciona para login se 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(`[API-Auth-Loop] 401 detectado em ${error.config.url}. Resetando auth...`);
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }

);

export default api;
