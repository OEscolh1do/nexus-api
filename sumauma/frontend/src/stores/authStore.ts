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

/** Verifica se um JWT (sem biblioteca) está expirado. */
function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload?.exp) return false;
    // Margem de 30s para evitar falsos positivos por clock skew
    return payload.exp * 1000 < Date.now() - 30_000;
  } catch {
    return false;
  }
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
                'Content-Type': 'application/json',
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
      // Ao hidratar o store do localStorage, descarta imediatamente tokens expirados.
      // Isso garante que isAuthenticated=false no primeiro render, evitando o loop
      // que ocorre quando o usuário volta horas depois com o token expirado persistido.
      onRehydrateStorage: () => (state) => {
        if (state?.token && isJwtExpired(state.token)) {
          console.info('[AuthStore] Token expirado detectado no boot — limpando sessão.');
          state.token = null;
          state.operator = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
