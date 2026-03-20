/**
 * =============================================================================
 * APP.TSX - KURUPIRA WORKSPACE (Engenharia Solar)
 * =============================================================================
 * 
 * ARQUITETURA V4.0 - WORKSPACE IMERSIVO:
 * - Layout dark com Sidebar (Project Explorer) + Canvas (Módulos)
 * - Estado global gerenciado por Zustand (solarStore)
 * - Delegação de UI para módulos isolados (TechModule, ElectricalModule, etc.)
 * 
 * =============================================================================
 */

import React from 'react';
import { ProfileOrchestrator } from './layout/ProfileOrchestrator';
import { AuthProvider } from './core/auth/AuthProvider';
import { useAuth } from './core/auth/useAuth';
import { Loader2 } from 'lucide-react';

const AuthGuard: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-400" />
          <span className="text-xs text-slate-500 font-medium">Carregando Kurupira...</span>
        </div>
      </div>
    );
  }

  return <ProfileOrchestrator />;
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 selection:bg-emerald-500/20 selection:text-white">
      <AuthProvider>
        <AuthGuard />
      </AuthProvider>
    </div>
  );
};

export default App;
