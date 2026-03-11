import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { useSolarStore } from '@/core/state/solarStore';
import { SettingsService } from '@/services/SettingsService';
import { AuthContext } from './useAuth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setUserRole = useSolarStore(state => state.setUserRole);

  useEffect(() => {
    // Phase 2 SSO: Override Auth if token is passed from Nexus Hub
    const nexusParams = new URLSearchParams(window.location.search);
    const sessionToken = nexusParams.get("session") || localStorage.getItem("nexus_token");

    if (sessionToken) {
      localStorage.setItem("nexus_token", sessionToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Simulate User Session to bypass LoginView
      setUser({ id: "nexus-sso-user", email: "sso@neonorte", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "" } as User);
      setUserRole('ADMIN'); // Defaulting role to admin for SSO users temporarily for Dev
      setLoading(false);
      return;
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id, true); // true = initial load
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Prevent aggressive re-fetching when the window regains focus.
        if (!useSolarStore.getState().userRole) {
          await fetchUserProfile(session.user.id, false);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, isInitialLoad: boolean) => {
    try {
      console.log('AuthProvider: Iniciando fetchUserProfile para', userId);

      // Only show the blocking global loader if it's the first render or we don't have a role
      if (isInitialLoad || !useSolarStore.getState().userRole) {
        setLoading(true);
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout! O Supabase não respondeu após 8 segundos.')), 8000)
      );

      const fetchPromise = supabase
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) throw error;

      if (data) {
        setUserRole(data.role as any);
        await SettingsService.loadSettingsFromDB();
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    } finally {
      // Always remove the loader at the end, regardless of who triggered it
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

