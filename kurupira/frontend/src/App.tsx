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

// Captura token + leadId injetados via deep link do Iaçã (?token=<jwt>&leadId=<id>&name=<nome>)
// Executado antes do AuthProvider para que sessionStorage já esteja preenchido
function captureDeepLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const leadId = params.get('leadId');
  const leadName = params.get('name');

  if (token) {
    sessionStorage.setItem('kurupira_token', token);
  }

  if (leadId) {
    sessionStorage.setItem('kurupira_leadId', leadId);
    if (leadName) sessionStorage.setItem('kurupira_leadName', leadName);
  }

  // Limpa URL (segurança — token não deve ficar no histórico/referer)
  if (token || leadId) {
    window.history.replaceState({}, '', window.location.pathname);
  }
}

captureDeepLinkParams();

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
