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
import { Routes, Route } from 'react-router-dom';
import { ProfileOrchestrator } from './layout/ProfileOrchestrator';
import { AuthProvider } from './core/auth/AuthProvider';
import { useAuth } from './core/auth/useAuth';
import { NeonorteLoader } from './components/ui/NeonorteLoader';
import CallbackPage from './pages/CallbackPage';
import LoginPage from './pages/LoginPage';

const AuthGuard: React.FC = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <NeonorteLoader
        size="fullscreen"
        message="Autenticando..."
        overlay={false}
      />
    );
  }

  // Prevents rendering the app if fetchClaims failed and we are redirecting
  if (!user) {
    return null;
  }

  return <ProfileOrchestrator />;
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 selection:bg-emerald-500/20 selection:text-white">
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={
          <AuthProvider>
            <AuthGuard />
          </AuthProvider>
        } />
      </Routes>
    </div>
  );
};

export default App;
