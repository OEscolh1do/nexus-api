import React, { useEffect, useState } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { AuthContext, User } from './useAuth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setUserRole = useSolarStore(state => state.setUserRole);

  useEffect(() => {
    // Mode de Desenvolvimento / Mock SSO
    console.log("AuthProvider: Supabase removido. Workspace Kurupira ativado com sessão local mockada.");
    
    // Auto-login instantâneo como engenheiro para contornar qualquer barreira de gateway
    setUser({ id: "mock-kurupira-user", email: "engenheiro@neonorte", role: "ADMIN" });
    setUserRole('ADMIN');
    setLoading(false);
  }, [setUserRole]);

  const signOut = async () => {
    console.warn("SignOut não faz nada no ambiente Kurupira mockado atual.");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
