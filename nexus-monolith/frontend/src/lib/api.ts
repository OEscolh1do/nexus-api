import axios, { type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: \`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2\`,
});

// Interceptor para adicionar token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
