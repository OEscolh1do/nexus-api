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
  refreshToken: string | null;
  operator: Operator | null;
  isAuthenticated: boolean;
  accessDenied: boolean;
  login: (token: string, operator: Operator, refreshToken?: string | null) => void;
  /** Silently updates the access token (called by the refresh interceptor). */
  updateToken: (token: string) => void;
  /** Silently updates both tokens after a rotation (called by the refresh interceptor). */
  updateTokens: (token: string, refreshToken: string) => void;
  setAccessDenied: (value: boolean) => void;
  logout: () => void;
}

function isJwtExpired(token: string): boolean {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!payload?.exp) return false;
    return payload.exp * 1000 < Date.now() - 30_000;
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      operator: null,
      isAuthenticated: false,
      accessDenied: false,

      login: (token, operator, refreshToken = null) =>
        set({ token, refreshToken, operator, isAuthenticated: true, accessDenied: false }),

      updateToken: (token) => set({ token }),

      updateTokens: (token, refreshToken) => set({ token, refreshToken }),

      setAccessDenied: (value) => set({ accessDenied: value }),

      logout: () => {
        const { token, refreshToken } = get();
        if (token) {
          // Fire-and-forget: revoga o refresh token no backend
          fetch('/admin/auth/logout', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          }).catch(() => {});
        }
        set({ token: null, refreshToken: null, operator: null, isAuthenticated: false });
      },
    }),
    {
      name: 'neonorte-admin-auth',
      // accessDenied is session-only — never persist it to avoid permanent lockout on reload
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        operator: state.operator,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && isJwtExpired(state.token) && !state.refreshToken) {
          // Token expirado E sem refresh token → limpa sessão no boot
          state.token = null;
          state.refreshToken = null;
          state.operator = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
