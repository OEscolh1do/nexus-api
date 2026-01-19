import axios from 'axios';

// Em produção (Vercel/Hostinger), VITE_API_URL deve ser definido
// Localmente, fallback para localhost
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // Enable sending cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for generic error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (Unauthorized), it means cookie is invalid or missing
    // We optionally reject it so the store can handle "isAuthenticated: false"
    return Promise.reject(error);
  }
);

export default api;
