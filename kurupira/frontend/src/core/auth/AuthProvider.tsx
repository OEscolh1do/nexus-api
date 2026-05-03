import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogto } from '@logto/react';
import { useSolarStore } from '@/core/state/solarStore';
import { AuthContext, User } from './useAuth';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';

function mapRole(jwtRole: string): 'SALES' | 'ENGINEER' | 'ADMIN' {
  if (jwtRole === 'ADMIN' || jwtRole === 'COORDENACAO') return 'ADMIN';
  if (jwtRole === 'ENGINEER') return 'ENGINEER';
  return 'SALES';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const setUserRole = useSolarStore(state => state.setUserRole);
  
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: logtoLoading, getIdTokenClaims, getIdToken, signOut: logtoSignOut, clearAllTokens } = useLogto();

  useEffect(() => {
    // Se o Logto ainda está carregando o estado de auth, aguardamos
    if (logtoLoading) return;

    // Se o Logto determinou que NÃO está autenticado, vamos para a tela de login
    if (!isAuthenticated) {
      sessionStorage.removeItem('kurupira_token');
      navigate('/login', { replace: true });
      setInternalLoading(false);
      return;
    }

    // Se está autenticado, extraímos os claims e o token
    const fetchClaims = async () => {
      try {
        const claims = await getIdTokenClaims();
        const rawToken = await getIdToken();
        
        if (!claims || !rawToken) {
          throw new Error('Sem claims ou token');
        }

        // Guarda o token no sessionStorage para o NexusClient usar
        sessionStorage.setItem('kurupira_token', rawToken);

        const userId = (claims.id || claims.sub) as string;
        const role = (claims.role as string) || 'ENGINEER';

        setUser({
          id: userId,
          email: (claims.username as string) || (claims.email as string),
          role,
          tenantId: (claims.tenantId as string) || 'default-tenant-001',
        });
        
        setUserRole(mapRole(role));
        setInternalLoading(false);
      } catch (err) {
        console.error('Falha ao processar sessão Logto', err);
        sessionStorage.removeItem('kurupira_token');
        navigate('/login', { replace: true });
        setInternalLoading(false);
      }
    };

    fetchClaims();
  }, [isAuthenticated, logtoLoading, getIdTokenClaims, getIdToken, navigate, setUserRole]);

  const signOut = async () => {
    sessionStorage.removeItem('kurupira_token');
    localStorage.removeItem('token');
    setUser(null);
    try {
      if (clearAllTokens) {
        await clearAllTokens();
      }
      await logtoSignOut(window.location.origin);
    } catch (err) {
      console.error('[Auth] Erro ao tentar redirecionar para o logout do Logto:', err);
      // Se der erro (ex: Post-Logout URI não cadastrada no Console do Logto),
      // forçamos o usuário para a tela de login localmente.
      window.location.href = '/login';
    }
  };

  if (logtoLoading || internalLoading) {
    return (
      <NeonorteLoader
        size="fullscreen"
        message="Validando sessão Ywara..."
        overlay={false}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading: false, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
