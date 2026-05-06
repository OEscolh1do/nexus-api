import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/admin',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[API] Falha ao decodificar JWT payload:', err);
    return null;
  }
}

function isTokenExpiredOrExpiringSoon(token: string, marginSeconds = 60): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    // Se não conseguimos ler a expiração, não bloqueamos a requisição proativamente
    // deixamos o backend decidir (401) para evitar loops se o formato do token mudar
    return false;
  }
  return payload.exp * 1000 < Date.now() + marginSeconds * 1000;
}

// Interceptor: injeta JWT em toda requisição e verifica expiração proativa
api.interceptors.request.use((config) => {
  const { token, logout } = useAuthStore.getState();
  
  if (token) {
    if (isTokenExpiredOrExpiringSoon(token)) {
      console.warn('[API] Token expirado detectado no interceptor de request');
      logout();
      sessionStorage.setItem('sumauma_force_logout', 'true');
      
      // Só redireciona se não estivermos já na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
    const originalRequest = error.config;
    const url = originalRequest?.url || 'URL desconhecida';

    if (error.response?.status === 401) {
      const serverMsg = error.response.data?.error || 'Sessão expirada';
      const isM2MError = serverMsg.includes('M2M');
      
      console.warn(`[API] 401 em ${url} — ${serverMsg}`);
      
      if (!isM2MError) {
        useAuthStore.getState().logout();
        sessionStorage.setItem('sumauma_force_logout', 'true');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      console.warn(`[API] 403 em ${url} — permissão insuficiente`);
      return Promise.reject(new Error('Você não tem permissão para realizar esta ação.'));
    }

    if (error.response?.status >= 500) {
      console.error(`[API] ${error.response.status} em ${url}`, error.response.data);
      return Promise.reject(new Error('Erro interno no servidor. Tente novamente em instantes.'));
    }

    // Erros de rede ou erros lançados pelo interceptor de request
    if (!error.response) {
      const isSessionExpired = error.message === 'Sessão expirada';
      
      if (isSessionExpired) {
        console.warn(`[API] Requisição para ${url} cancelada: Sessão expirada`);
        return Promise.reject(error);
      }

      console.error(`[API] Erro de rede ou servidor offline em ${url}:`, error.message);
      return Promise.reject(new Error('Sem conexão com o servidor. Verifique sua rede ou se o backend está online.'));
    }

    return Promise.reject(error);
  }
);

export default api;
