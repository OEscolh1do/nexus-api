import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/admin',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function isTokenExpiredOrExpiringSoon(token: string, marginSeconds = 60): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() + marginSeconds * 1000;
  } catch {
    return true;
  }
}

// Interceptor: injeta JWT em toda requisição e verifica expiração proativa
api.interceptors.request.use((config) => {
  const { token, logout } = useAuthStore.getState();
  if (token) {
    if (isTokenExpiredOrExpiringSoon(token)) {
      logout();
      window.location.href = '/login';
      return Promise.reject(new Error('Sessão expirada'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: trata erros de auth e rede
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(`[API] 401 em ${error.config?.url} — sessão expirada`);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      console.warn(`[API] 403 em ${error.config?.url} — permissão insuficiente`);
      return Promise.reject(new Error('Você não tem permissão para realizar esta ação.'));
    }

    if (error.response?.status >= 500) {
      console.error(`[API] ${error.response.status} em ${error.config?.url}`);
      return Promise.reject(new Error('Erro interno no servidor. Tente novamente em instantes.'));
    }

    // Erros de rede (ECONNREFUSED, timeout, sem resposta)
    if (!error.response) {
      console.error(`[API] Erro de rede em ${error.config?.url}:`, error.message);
      return Promise.reject(new Error('Sem conexão com o servidor. Verifique sua rede.'));
    }

    return Promise.reject(error);
  }
);

export default api;
