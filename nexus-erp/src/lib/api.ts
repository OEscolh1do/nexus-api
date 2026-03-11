import axios, { type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2`,
});

// Interceptor para adicionar token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta global (Tratamento de Sessão Expirada / 403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("[API] Sessão expirada ou acesso negado (403/401). Limpando credenciais...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Evita loop infinito caso a API continue falhando na página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
