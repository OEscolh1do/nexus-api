import axios from 'axios';

// Em produção (Vercel/Hostinger), VITE_API_URL deve ser definido
// Localmente, fallback para localhost
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar Token JWT automaticamente
api.interceptors.request.use((config) => {
  try {
    const storageItem = localStorage.getItem('auth-storage');
    if (storageItem) {
      const parsed = JSON.parse(storageItem);
      const token = parsed.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error("Erro ao recuperar token:", error);
  }
  return config;
});

export default api;
