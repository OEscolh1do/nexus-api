import React, { useEffect, useState } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { AuthContext, User } from './useAuth';

const IACA_URL = import.meta.env.VITE_IACA_URL || 'http://localhost:3000';

// Demo mode: se não há VITE_IACA_URL configurada em produção, funciona como preview/demo
const IS_DEMO = !import.meta.env.VITE_IACA_URL && !import.meta.env.DEV;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function mapRole(jwtRole: string): 'SALES' | 'ENGINEER' | 'ADMIN' {
  if (jwtRole === 'ADMIN' || jwtRole === 'COORDENACAO') return 'ADMIN';
  if (jwtRole === 'ENGINEER') return 'ENGINEER';
  return 'SALES';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setUserRole = useSolarStore(state => state.setUserRole);

  useEffect(() => {
    // Prioridade: sessionStorage (injetado via ?token= na URL) → localStorage (SSO bridge Iaçã)
    const token =
      sessionStorage.getItem('kurupira_token') ||
      localStorage.getItem('token');

    if (!token) {
      if (import.meta.env.DEV || IS_DEMO) {
        // Dev standalone / Demo mode: mock user
        setUser({ id: 'dev-engineer', email: 'engenheiro@neonorte.dev', role: 'ADMIN', tenantId: 'dev-tenant' });
        setUserRole('ADMIN');
        setLoading(false);
      } else {
        window.location.href = IACA_URL;
      }
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      sessionStorage.removeItem('kurupira_token');
      localStorage.removeItem('token');
      if (IS_DEMO) {
        setUser({ id: 'demo-user', email: 'demo@neonorte.dev', role: 'ADMIN', tenantId: 'demo-tenant' });
        setUserRole('ADMIN');
        setLoading(false);
      } else {
        window.location.href = IACA_URL;
      }
      return;
    }

    // Verificar expiração
    const exp = payload.exp as number | undefined;
    if (exp && Date.now() / 1000 > exp) {
      sessionStorage.removeItem('kurupira_token');
      localStorage.removeItem('token');
      if (import.meta.env.DEV || IS_DEMO) {
        setUser({ id: 'dev-engineer', email: 'engenheiro@neonorte.dev', role: 'ADMIN', tenantId: 'dev-tenant' });
        setUserRole('ADMIN');
        setLoading(false);
      } else {
        window.location.href = IACA_URL;
      }
      return;
    }

    // Garantir que o token esteja no sessionStorage para o NexusClient
    if (!sessionStorage.getItem('kurupira_token')) {
      sessionStorage.setItem('kurupira_token', token);
    }

    const userId = (payload.id || payload.sub) as string;
    const role = (payload.role as string) || 'VENDEDOR';

    setUser({
      id: userId,
      email: payload.username as string | undefined,
      role,
      tenantId: (payload.tenantId as string) || 'default-tenant-001',
    });
    setUserRole(mapRole(role));
    setLoading(false);
  }, [setUserRole]);

  const signOut = async () => {
    sessionStorage.removeItem('kurupira_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = IACA_URL;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
