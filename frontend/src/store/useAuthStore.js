import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check session

  // --- LOGIN ---
  login: async (email, password) => {
    try {
      // Backend sets the cookie, we just get the user
      const response = await api.post('/auth/login', { email, password });
      
      set({ 
        user: response.data.user, 
        isAuthenticated: true,
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao realizar login';
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      return { success: false, error: msg };
    }
  },

  // --- LOGOUT ---
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn("Logout error", error);
    } finally {
      // Always clear local state
      set({ user: null, isAuthenticated: false });
    }
  },

  // --- CHECK SESSION (Hydration) ---
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ 
        user: response.data, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch {
      // If 401 or error, we are not logged in
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  }
}));

export default useAuthStore;