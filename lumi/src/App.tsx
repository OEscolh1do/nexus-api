/**
 * =============================================================================
 * APP.TSX - PONTO DE ENTRADA DA APLICAÇÃO LUMI
 * =============================================================================
 * 
 * ARQUITETURA V3.0 - MODULAR:
 * - Migração de SolarDashboard para ProfileOrchestrator  
 * - Estado global gerenciado por Zustand (solarStore)
 * - Delegação de UI para módulos isolados (ClientModule, TechModule, etc.)
 * 
 * =============================================================================
 */

import React from 'react';
import { ProfileOrchestrator } from './layout/ProfileOrchestrator';
import { AuthProvider } from './core/auth/AuthProvider';
import { useAuth } from './core/auth/useAuth';
import { LoginView } from './modules/auth/LoginView';
import { Loader2 } from 'lucide-react';

// =============================================================================
// COMPONENTE ROOT COM AUTENTICAÇÃO
// =============================================================================

const AuthGuard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-neonorte-green" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return <ProfileOrchestrator />;
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 selection:bg-neonorte-green/20 selection:text-neonorte-deepPurple">
      <AuthProvider>
        <AuthGuard />
      </AuthProvider>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;
