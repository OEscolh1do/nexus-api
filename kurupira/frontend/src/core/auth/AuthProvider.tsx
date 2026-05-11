import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogto } from '@logto/react';
import { useSolarStore } from '@/core/state/solarStore';
import { AuthContext, User } from './useAuth';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import { useIdentityStore, getInitials, getAvatarColor } from '@/core/state/identityStore';

function mapRole(jwtRole: string): 'SALES' | 'ENGINEER' | 'ADMIN' {
  if (jwtRole === 'ADMIN' || jwtRole === 'COORDENACAO') return 'ADMIN';
  if (jwtRole === 'ENGINEER') return 'ENGINEER';
  return 'SALES';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const setUserRole = useSolarStore(state => state.setUserRole);
  const setProfile = useIdentityStore(state => state.setProfile);
  const clearProfile = useIdentityStore(state => state.clearProfile);
  
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: logtoLoading, getIdTokenClaims, getAccessToken, signOut: logtoSignOut, clearAllTokens } = useLogto();

  // ─── Refs estáveis para funções que mudam referência a cada render ───────────
  // Usar refs evita que mudanças de identidade de função (getAccessToken, navigate, etc.)
  // disparem re-execuções desnecessárias dos useEffects, eliminando o loop de polling.
  const getAccessTokenRef = React.useRef(getAccessToken);
  const getIdTokenClaimsRef = React.useRef(getIdTokenClaims);
  const navigateRef = React.useRef(navigate);
  const clearAllTokensRef = React.useRef(clearAllTokens);

  // Mantém as refs sempre atualizadas (sem disparar efeitos)
  useEffect(() => { getAccessTokenRef.current = getAccessToken; }, [getAccessToken]);
  useEffect(() => { getIdTokenClaimsRef.current = getIdTokenClaims; }, [getIdTokenClaims]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { clearAllTokensRef.current = clearAllTokens; }, [clearAllTokens]);

  // ─── Efeito principal: roda apenas quando o estado de auth muda de fato ──────
  useEffect(() => {
    // Se o Logto ainda está carregando o estado de auth, aguardamos
    if (logtoLoading) return;

    // Se o Logto determinou que NÃO está autenticado, vamos para a tela de login
    if (!isAuthenticated) {
      sessionStorage.removeItem('kurupira_token');
      navigateRef.current('/login', { replace: true });
      setInternalLoading(false);
      return;
    }

    // Se está autenticado, extraímos os claims e o token
    const fetchClaims = async () => {
      try {
        const claims = await getIdTokenClaimsRef.current();
        const rawToken = await getAccessTokenRef.current('https://api.ywara.com.br');
        
        if (!claims || !rawToken) {
          throw new Error('Sem claims ou token de acesso');
        }

        // Guarda o token no sessionStorage para o NexusClient usar
        sessionStorage.setItem('kurupira_token', rawToken);

        const userId = (claims.id || claims.sub) as string;
        const role = (claims.role as string) || 'ENGINEER';
        const userEmail = (claims.username as string) || (claims.email as string);

        setUser({
          id: userId,
          email: userEmail,
          role,
          tenantId: (claims.tenantId as string) || 'default-tenant-001',
        });
        
        const mappedRole = mapRole(role);
        setUserRole(mappedRole);

        setProfile({
          id: userId,
          fullName: (claims.name as string) || userEmail.split('@')[0],
          email: userEmail,
          role: mappedRole,
          initials: getInitials(claims.name as string, userEmail),
          color: getAvatarColor(userId),
        });

        setInternalLoading(false);
      } catch (err) {
        console.error('Falha ao processar sessão Logto', err);
        sessionStorage.removeItem('kurupira_token');
        if (clearAllTokensRef.current) {
          await clearAllTokensRef.current();
        }
        navigateRef.current('/login', { replace: true });
        setInternalLoading(false);
      }
    };

    fetchClaims();
    // INTENCIONAL: apenas isAuthenticated e logtoLoading como deps.
    // As funções do Logto (getAccessToken, etc.) são capturadas via refs acima,
    // garantindo valores frescos sem causar re-execuções desnecessárias do efeito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, logtoLoading, setUserRole]);

  // ─── Refresh proativo de token: roda apenas quando estado de auth muda ───────
  // Mantém o sessionStorage com um token fresco para o NexusClient (não-React).
  useEffect(() => {
    if (!isAuthenticated || logtoLoading) return;

    const refreshInterval = setInterval(async () => {
      try {
        const freshToken = await getAccessTokenRef.current('https://api.ywara.com.br');
        if (freshToken) {
          sessionStorage.setItem('kurupira_token', freshToken);
        }
      } catch (err) {
        console.error('[AuthProvider] Erro ao atualizar token proativamente:', err);
      }
    }, 10 * 60 * 1000); // Atualiza a cada 10 minutos (tokens Logto costumam durar 1h)

    return () => clearInterval(refreshInterval);
    // INTENCIONAL: getAccessToken capturado via ref — ver comentário acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, logtoLoading]);

  const signOut = async () => {
    sessionStorage.removeItem('kurupira_token');
    localStorage.removeItem('token');
    setUser(null);
    clearProfile();
    try {
      if (clearAllTokensRef.current) {
        await clearAllTokensRef.current();
      }
      // Marcamos o logout no storage local para evitar loops, sem precisar registrar 
      // novas URIs complexas no Console do Logto (evita Erro 400)
      sessionStorage.setItem('just_logged_out', 'true');
      // Passamos a URL de origem para o Logto redirecionar de volta após o logout
      await logtoSignOut(window.location.origin);
    } catch (err) {
      console.error('[Auth] Erro ao tentar redirecionar para o logout do Logto:', err);
      sessionStorage.setItem('just_logged_out', 'true');
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
