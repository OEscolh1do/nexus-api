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

import React, { useEffect } from 'react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { TechModule } from '@/modules/engineering/TechModule';
import { ProjectExplorer } from '@/modules/engineering/ui/ProjectExplorer';
import { ProjectService } from '@/services/ProjectService';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import { Lock } from 'lucide-react';
import { HubTopRibbon } from '@/modules/engineering/ui/panels/HubTopRibbon';



// =============================================================================
// WORKSPACE ORCHESTRATOR
// =============================================================================

export const ProfileOrchestrator: React.FC = () => {
  const { activeModule, setActiveModule, userRole } = useSolarStore();
  const setAppLoading = useUIStore(s => s.setAppLoading);
  const clearAppLoading = useUIStore(s => s.clearAppLoading);
  const updateClientData = useSolarStore(state => state.updateClientData);

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

  const hasAccess = (moduleId: string) => MODULE_ROLES[moduleId]?.includes(userRole);

  // Handle project selection — hydrate from DB then enter workspace
  const handleSelectProject = async (projectId: string) => {
    setAppLoading('catalog', 'Preparando ambiente de engenharia...');
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
      clearAppLoading();
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col font-sans overflow-hidden">

      {/* ================================================================ */}
      {/* HEADER — Visível apenas fora do workspace de engenharia.         */}
      {/* No workspace, o TopRibbon assume Logo + Nav + User.              */}
      {/* ================================================================ */}
      {currentModule === 'hub' && <HubTopRibbon />}

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

      {/* Global Loader — Acionado via useUIStore para hidratação de catálogo */}
      <NeonorteLoader size="fullscreen" context="catalog" overlay />
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
