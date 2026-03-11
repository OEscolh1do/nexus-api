import axios from "axios";

// Garante que o /api/v2 seja anexado caso a URL de ambiente venha "limpa" (ex: https://fly.dev)
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Se quem cadastrou a .env esqueceu o /api/v2 no final, nós colocamos
    return envUrl.endsWith('/api/v2') ? envUrl : `${envUrl}/api/v2`;
  }
  return "http://localhost:3001/api/v2"; // Fallback Local
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
