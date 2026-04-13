/**
 * =============================================================================
 * WORKSPACE ORCHESTRATOR — Kurupira (ex-ProfileOrchestrator)
 * =============================================================================
 * 
 * PARADIGMA WORKSPACE:
 * - Sidebar fixa à esquerda (Project Explorer + Lead Context)
 * - Canvas à direita (módulos de engenharia em tela cheia)
 * - Header compacto (projeto ativo + status + ações)
 * 
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/core/auth/useAuth';
import { useSolarStore } from '@/core/state/solarStore';
import { TechModule } from '@/modules/engineering/TechModule';
import { ProjectExplorer } from '@/modules/engineering/ui/ProjectExplorer';
import { ProjectService } from '@/services/ProjectService';
import {
  Lock, ShieldCheck, ShieldAlert,
  Maximize2, Minimize2, Zap
} from 'lucide-react';



// =============================================================================
// WORKSPACE ORCHESTRATOR
// =============================================================================

export const ProfileOrchestrator: React.FC = () => {
  const { activeModule, setActiveModule, userRole } = useSolarStore();
  const clientData = useSolarStore(state => state.clientData);
  const { signOut } = useAuth();


  const updateClientData = useSolarStore(state => state.updateClientData);
  const [fullscreen, setFullscreen] = useState(false);

  // Hidrata iacaLeadId do deep link (sessionStorage ← captureDeepLinkParams em App.tsx)
  useEffect(() => {
    const leadId = sessionStorage.getItem('kurupira_leadId');
    if (leadId) {
      const leadName = sessionStorage.getItem('kurupira_leadName');
      updateClientData({
        iacaLeadId: leadId,
        ...(leadName ? { clientName: leadName } : {}),
      });
      sessionStorage.removeItem('kurupira_leadId');
      sessionStorage.removeItem('kurupira_leadName');
    }
  }, [updateClientData]);

  // Ensure activeModule is valid
  const currentModule = (['hub', 'engineering'].includes(activeModule)
    ? activeModule
    : 'hub');

  const MODULE_ROLES: Record<string, string[]> = {
    'hub': ['SALES', 'ENGINEER', 'ADMIN'],
    'engineering': ['ENGINEER', 'ADMIN'],
  };

  // Loading state for project hydration
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  const hasAccess = (moduleId: string) => MODULE_ROLES[moduleId]?.includes(userRole);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  // Handle project selection — hydrate from DB then enter workspace
  const handleSelectProject = async (projectId: string) => {
    setIsLoadingProject(true);
    try {
      const success = await ProjectService.loadProjectAndHydrate(projectId);
      if (success) {
        setActiveModule('engineering');
      } else {
        console.error('[Orchestrator] Failed to hydrate project', projectId);
      }
    } catch (e) {
      console.error('[Orchestrator] Error loading project', e);
    } finally {
      setIsLoadingProject(false);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col font-sans overflow-hidden">

      {/* ================================================================ */}
      {/* HEADER — Visível apenas fora do workspace de engenharia.         */}
      {/* No workspace, o TopRibbon assume Logo + Nav + User.              */}
      {/* ================================================================ */}
      {currentModule === 'hub' && (
        <header className="bg-slate-800 border-b border-slate-700/50 px-3 py-1.5 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-3">
          {/* Logo atuando como botão Home para voltar ao Hub */}
          <button 
            onClick={() => setActiveModule('hub')}
            className="flex items-center gap-2 hover:opacity-100 transition-opacity"
            title="Voltar para Projetos"
          >
            <img src="/logo-neonorte.png" alt="Neonorte" className="h-5 w-auto opacity-90" />
          </button>

          {currentModule !== 'hub' && (
            <>
              <div className="h-5 w-px bg-slate-700 mx-1" />



          {/* Active Project Badge */}
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1">
            <Zap size={13} className="text-neonorte-green" />
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
              {clientData.clientName || 'Novo Projeto'}
            </span>
          </div>
            </>
          )}
        </div>

        {/* Right: User + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Modo imersivo"
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded">
            {userRole === 'ADMIN'
              ? <ShieldAlert size={11} className="text-red-400" />
              : <ShieldCheck size={11} className="text-neonorte-green" />}
            <span className="text-[10px] font-bold text-slate-300 uppercase">{userRole}</span>
          </div>

          <button
            // @ts-ignore
            onClick={signOut}
            className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded transition-colors"
            title="Sair"
          >
            <Lock size={14} />
          </button>
        </div>
      </header>
      )}

      {/* ================================================================ */}
      {/* BODY — Sidebar + Canvas                                          */}
      {/* ================================================================ */}
      <div className="flex-1 flex overflow-hidden">



        {/* CANVAS — Área Imersiva dos Módulos */}
        <main className="flex-1 overflow-hidden bg-slate-900">
          {currentModule === 'hub' && (
            hasAccess('hub') ? <ProjectExplorer onSelectProject={handleSelectProject} /> : <AccessDenied />
          )}

          {currentModule === 'engineering' && (
            hasAccess('engineering') ? <TechModule /> : <AccessDenied />
          )}
        </main>
      </div>

      {/* Loading overlay for project hydration */}
      {isLoadingProject && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">Carregando projeto do banco de dados...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// ACCESS DENIED COMPONENT
// =============================================================================

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full text-red-400 bg-slate-900">
    <Lock size={32} className="mb-2 opacity-50" />
    <h3 className="font-bold text-sm">Acesso Negado</h3>
    <p className="text-xs text-slate-500 mt-1">Seu perfil não tem permissão para este módulo.</p>
  </div>
);
