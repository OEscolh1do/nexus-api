import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Operator {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface AuthState {
  token: string | null;
  operator: Operator | null;
  isAuthenticated: boolean;
  login: (token: string, operator: Operator) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      operator: null,
      isAuthenticated: false,

      login: (token, operator) =>
        set({ token, operator, isAuthenticated: true }),

      logout: async () => {
        const token = useAuthStore.getState().token;
        if (token) {
          // Tentar avisar o backend (fire and forget) para auditoria
          try {
            fetch('/admin/auth/logout', {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
              },
            });
          } catch (err) {
            console.warn('Falha ao notificar logout no backend', err);
          }
        }

        set({ token: null, operator: null, isAuthenticated: false });
      },
    }),
    {
      name: 'neonorte-admin-auth',
    }
  )
);
