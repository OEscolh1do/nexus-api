import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Extende os tipos do axios com flag para chamadas não-críticas
// que não devem acionar lockout em caso de 403.
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAccessDenied?: boolean;
  }
  interface InternalAxiosRequestConfig {
    skipAccessDenied?: boolean;
  }
}

const api = axios.create({
  baseURL: '/admin',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Silent refresh queue ──────────────────────────────────────────────────────
// Serialises concurrent 401s: only one refresh call is in-flight at a time.
// Subsequent requests queue up and are retried once the token is renewed.

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function notifyRefreshQueue(newToken: string) {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
}

function decodeJwt(token: string): { exp?: number; [key: string]: unknown } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to a multiple of 4 so atob() never throws on non-aligned payloads
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(
      decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
  } catch {
    return null;
  }
}

function isTokenExpiredOrExpiringSoon(token: string, marginSeconds = 60): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now() + marginSeconds * 1000;
}

// ─── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Respect an explicitly set Authorization (e.g. LoginPage passing rawIdToken directly)
  if (config.headers.Authorization) return config;

  const { token, refreshToken, logout } = useAuthStore.getState();

  if (token) {
    if (isTokenExpiredOrExpiringSoon(token)) {
      if (!refreshToken) {
        // No way to refresh — force logout immediately
        logout();
        if (!window.location.pathname.includes('/login')) {
          sessionStorage.setItem('sumauma_force_logout', 'true');
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Sessão expirada'));
      }
      // Has refresh token — let the request through; response interceptor handles the 401
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      const serverMsg = error.response.data?.error ?? '';
      const isM2MError = serverMsg.includes('M2M');

      // M2M errors or already-retried requests go straight to logout
      if (isM2MError || originalRequest._retry) {
        useAuthStore.getState().logout();
        sessionStorage.setItem('sumauma_force_logout', 'true');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      const { refreshToken, updateToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        // SSO users or sessions without a refresh token
        logout();
        sessionStorage.setItem('sumauma_force_logout', 'true');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another refresh is already in flight — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            api(originalRequest).then(resolve).catch(reject);
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post('/admin/auth/refresh', { refreshToken });
        const newToken: string = data.token;
        const newRefreshToken: string | undefined = data.refreshToken;

        if (newRefreshToken) {
          useAuthStore.getState().updateTokens(newToken, newRefreshToken);
        } else {
          updateToken(newToken);
        }
        notifyRefreshQueue(newToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshQueue = [];
        logout();
        sessionStorage.setItem('sumauma_force_logout', 'true');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      // Chamadas marcadas com skipAccessDenied (ex: audit-login, não-críticas)
      // nunca devem acionar lockout — o caller trata o erro individualmente.
      if (originalRequest?.skipAccessDenied) return Promise.reject(error);

      const serverMsg = error.response.data?.error ?? '';
      if (serverMsg.includes('operadores') || serverMsg.includes('provisionado')) {
        useAuthStore.getState().setAccessDenied(true);
        return Promise.reject(error);
      }
      return Promise.reject(new Error('Você não tem permissão para realizar esta ação.'));
    }

    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Erro interno no servidor. Tente novamente em instantes.'));
    }

    if (!error.response) {
      if (error.message === 'Sessão expirada') return Promise.reject(error);
      return Promise.reject(new Error('Sem conexão com o servidor. Verifique sua rede ou se o backend está online.'));
    }

    return Promise.reject(error);
  }
);

export default api;
