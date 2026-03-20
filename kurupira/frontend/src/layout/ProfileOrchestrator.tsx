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

import React, { useState } from 'react';
import { useAuth } from '@/core/auth/useAuth';
import { useSolarStore } from '@/core/state/solarStore';
import { TechModule } from '@/modules/engineering/TechModule';
import { ElectricalModule } from '@/modules/electrical/ElectricalModule';
import { DocumentationModule } from '@/modules/documentation/DocumentationModule';
import { ProposalModule } from '@/modules/proposal/ProposalModule';
import { SettingsModule } from '@/modules/settings/SettingsModule';
import { LeadContextPanel, LeadContext } from '@/components/LeadContextPanel';
import { DASHBOARD_TABS, TabId, TAB_COLOR_CLASSES } from '@/config/navigation';
import {
  Lock, ShieldCheck, ShieldAlert,
  PanelLeftClose, PanelLeftOpen,
  FolderOpen, Plus, Maximize2, Minimize2,
  Zap
} from 'lucide-react';

// =============================================================================
// MOCK DATA (substituir por dados reais via API na integração)
// =============================================================================

const MOCK_PROJECTS = [
  { id: '1', name: 'Supermercado Central', status: 'IN_PROGRESS', iacaLeadId: 'lead-001' },
  { id: '2', name: 'Residência Silva', status: 'DRAFT', iacaLeadId: 'lead-002' },
  { id: '3', name: 'Galpão Industrial Norte', status: 'REVIEW', iacaLeadId: 'lead-003' },
];

const MOCK_LEAD_CONTEXT: LeadContext = {
  id: 'lead-001',
  name: 'Supermercado Central LTDA',
  phone: '(92) 99123-4567',
  city: 'Manaus',
  state: 'AM',
  energyBillUrl: '#',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-slate-500' },
  IN_PROGRESS: { label: 'Em Progresso', color: 'bg-blue-500' },
  REVIEW: { label: 'Em Revisão', color: 'bg-amber-500' },
  APPROVED: { label: 'Aprovado', color: 'bg-emerald-500' },
};

// =============================================================================
// WORKSPACE ORCHESTRATOR
// =============================================================================

export const ProfileOrchestrator: React.FC = () => {
  const { activeModule, setActiveModule, userRole } = useSolarStore();
  const { user, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeProject, setActiveProject] = useState(MOCK_PROJECTS[0]);
  const [leadContext] = useState<LeadContext>(MOCK_LEAD_CONTEXT);

  // Ensure activeModule is a valid TabId
  const currentModule = (['engineering', 'electrical', 'documentation', 'proposal', 'settings'].includes(activeModule)
    ? activeModule
    : 'engineering') as TabId;

  const MODULE_ROLES: Record<TabId, string[]> = {
    'engineering': ['ENGINEER', 'ADMIN'],
    'electrical': ['ENGINEER', 'ADMIN'],
    'documentation': ['ENGINEER', 'ADMIN'],
    'proposal': ['SALES', 'ENGINEER', 'ADMIN'],
    'settings': ['ENGINEER', 'ADMIN'],
  };

  const allowedTabs = DASHBOARD_TABS.filter(tab =>
    MODULE_ROLES[tab.id]?.includes(userRole)
  );

  const hasAccess = (moduleId: TabId) => MODULE_ROLES[moduleId]?.includes(userRole);

  const statusBadge = STATUS_BADGES[activeProject.status] || STATUS_BADGES.DRAFT;

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col font-sans overflow-hidden">

      {/* ================================================================ */}
      {/* HEADER — Compacto, focado no projeto ativo                       */}
      {/* ================================================================ */}
      <header className="bg-slate-800 border-b border-slate-700/50 px-3 py-1.5 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white leading-tight">
                Kurupira <span className="text-emerald-400 text-[10px] font-normal">Workspace</span>
              </h1>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={sidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>

          {/* Active Project Badge */}
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1">
            <FolderOpen size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
              {activeProject.name}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          {/* Workflow Tabs (compact) */}
          <nav className="flex gap-0.5">
            {allowedTabs.map(tab => {
              const Icon = tab.icon;
              const colorClasses = TAB_COLOR_CLASSES[tab.color];
              const isActive = currentModule === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModule(tab.id)}
                  title={tab.description}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all whitespace-nowrap
                    ${isActive
                      ? `${colorClasses.active} shadow-lg shadow-slate-900/50`
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
                  `}
                >
                  <Icon size={12} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
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
              : <ShieldCheck size={11} className="text-emerald-400" />}
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

      {/* ================================================================ */}
      {/* BODY — Sidebar + Canvas                                          */}
      {/* ================================================================ */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR — Project Explorer + Lead Context */}
        {sidebarOpen && (
          <aside className="w-64 bg-slate-850 border-r border-slate-700/50 flex flex-col shrink-0"
                 style={{ backgroundColor: '#1a1f2e' }}>

            {/* Project Explorer */}
            <div className="p-3 border-b border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Projetos</h2>
                <button
                  className="p-1 rounded hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Novo Projeto"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-1">
                {MOCK_PROJECTS.map(project => {
                  const badge = STATUS_BADGES[project.status] || STATUS_BADGES.DRAFT;
                  const isSelected = activeProject.id === project.id;

                  return (
                    <button
                      key={project.id}
                      onClick={() => setActiveProject(project)}
                      className={`
                        w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all
                        ${isSelected
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white border border-transparent'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{project.name}</span>
                        <span className={`w-2 h-2 rounded-full ${badge.color}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lead Context Panel */}
            <div className="p-3 flex-1 overflow-y-auto">
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contexto Comercial
              </h2>
              <LeadContextPanel leadContext={leadContext} />
            </div>
          </aside>
        )}

        {/* CANVAS — Área Imersiva dos Módulos */}
        <main className="flex-1 overflow-hidden bg-slate-900">
          {currentModule === 'engineering' && (
            hasAccess('engineering') ? <TechModule /> : <AccessDenied />
          )}

          {currentModule === 'electrical' && (
            hasAccess('electrical') ? <ElectricalModule /> : <AccessDenied />
          )}

          {currentModule === 'documentation' && (
            hasAccess('documentation') ? <DocumentationModule /> : <AccessDenied />
          )}

          {currentModule === 'proposal' && <ProposalModule />}

          {currentModule === 'settings' && (
            hasAccess('settings') ? <SettingsModule /> : <AccessDenied />
          )}
        </main>
      </div>
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
