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
import { ProjectExplorer } from '@/modules/engineering/ui/ProjectExplorer';
import { SiteContextModal, getSiteContext, SiteContext } from '@/modules/engineering/ui/SiteContextModal';
import { DASHBOARD_TABS, TabId, TAB_COLOR_CLASSES, getTabIndex } from '@/config/navigation';
import {
  Lock, ShieldCheck, ShieldAlert,
  PanelLeftClose, PanelLeftOpen,
  Maximize2, Minimize2, Zap, Check,
  LayoutDashboard, Download, MapPin,
  Battery
} from 'lucide-react';



// =============================================================================
// WORKSPACE ORCHESTRATOR
// =============================================================================

export const ProfileOrchestrator: React.FC = () => {
  const { activeModule, setActiveModule, userRole } = useSolarStore();
  const clientData = useSolarStore(state => state.clientData);
  const { user, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Ensure activeModule is a valid TabId
  const currentModule = (['hub', 'engineering', 'electrical', 'documentation', 'proposal', 'settings'].includes(activeModule)
    ? activeModule
    : 'hub') as TabId;

  const MODULE_ROLES: Record<TabId, string[]> = {
    'hub': ['SALES', 'ENGINEER', 'ADMIN'],
    'engineering': ['ENGINEER', 'ADMIN'],
    'electrical': ['ENGINEER', 'ADMIN'],
    'documentation': ['ENGINEER', 'ADMIN'],
    'proposal': ['SALES', 'ENGINEER', 'ADMIN'],
    'settings': ['ENGINEER', 'ADMIN'],
  };

  // Site Context Modal state (Phase 2)
  const [siteContext, setSiteContext] = useState<SiteContext | null>(null);
  const [showContextModal, setShowContextModal] = useState(false);

  const allowedTabs = DASHBOARD_TABS.filter(tab =>
    MODULE_ROLES[tab.id]?.includes(userRole)
  );

  const hasAccess = (moduleId: TabId) => MODULE_ROLES[moduleId]?.includes(userRole);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  // Handle project selection from ProjectExplorer (Phase 1 -> Phase 2)
  const handleSelectProject = (projectId: string) => {
    const context = getSiteContext(projectId);
    setSiteContext(context);
    setShowContextModal(true);
  };

  // Handle 'Dimensionar Projeto' from SiteContextModal (Phase 2 -> Phase 3)
  const handleDimensionar = (_projectId: string) => {
    setShowContextModal(false);
    setActiveModule('engineering');
    // TODO: Carregar dados do projeto no store (setActiveProjectId)
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
            <Zap size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
              {clientData.clientName || 'Novo Projeto'}
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

        {/* SIDEBAR — Workflow Stepper + Mini-Context + Quick Actions */}
        {sidebarOpen && currentModule !== 'hub' && (
          <aside className="w-56 bg-slate-950 border-r border-slate-800/50 flex flex-col shrink-0">

            {/* Workflow Stepper */}
            <div className="p-3 flex-1 overflow-y-auto">
              <h2 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3">Workflow</h2>
              <nav className="space-y-0.5">
                {DASHBOARD_TABS.filter(tab => tab.id !== 'hub' && tab.id !== 'settings').map((tab, index) => {
                  const colorClasses = TAB_COLOR_CLASSES[tab.color];
                  const isActive = currentModule === tab.id;
                  const currentIdx = getTabIndex(currentModule);
                  const tabIdx = getTabIndex(tab.id);
                  const isCompleted = tabIdx < currentIdx && tabIdx > 0;
                  const isAllowed = MODULE_ROLES[tab.id]?.includes(userRole);

                  return (
                    <button
                      key={tab.id}
                      onClick={() => isAllowed && setActiveModule(tab.id)}
                      disabled={!isAllowed}
                      className={`
                        w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all group
                        ${isActive
                          ? 'bg-white/5 text-white'
                          : isCompleted
                            ? 'text-emerald-500/70 hover:text-emerald-400 hover:bg-white/5'
                            : isAllowed
                              ? 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
                              : 'text-slate-800 cursor-not-allowed'
                        }
                      `}
                    >
                      {/* Step indicator */}
                      <div className={`
                        w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[9px] font-black transition-all
                        ${isActive
                          ? colorClasses.active
                          : isCompleted
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-900 text-slate-700 border border-slate-800'
                        }
                      `}>
                        {isCompleted ? <Check size={11} strokeWidth={3} /> : index + 1}
                      </div>

                      {/* Label + Description */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-bold block truncate ${
                          isActive ? 'text-white' : ''
                        }`}>
                          {tab.label}
                        </span>
                        <span className="text-[8px] text-slate-700 block truncate">
                          {tab.description}
                        </span>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="w-1 h-4 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mini-Context (Projeto Ativo) */}
            <div className="shrink-0 border-t border-slate-800/50 p-3">
              <h2 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Projeto Ativo</h2>
              <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap size={10} className="text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-white truncate">
                    {clientData.clientName || 'Sem projeto'}
                  </span>
                </div>
                {clientData.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={9} className="text-slate-600 shrink-0" />
                    <span className="text-[9px] text-slate-500 truncate">
                      {clientData.city}, {clientData.state}
                    </span>
                  </div>
                )}
                {(clientData.averageConsumption ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Battery size={9} className="text-slate-600 shrink-0" />
                    <span className="text-[9px] text-slate-500">
                      {(clientData.averageConsumption ?? 0).toLocaleString('pt-BR')} kWh/mês
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 border-t border-slate-800/50 p-2 space-y-0.5">
              <button
                onClick={() => setActiveModule('hub')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-semibold text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
              >
                <LayoutDashboard size={12} />
                Voltar ao Hub
              </button>
              <button
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-semibold text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
              >
                <Download size={12} />
                Exportar PDF
              </button>
            </div>
          </aside>
        )}

        {/* CANVAS — Área Imersiva dos Módulos */}
        <main className="flex-1 overflow-hidden bg-slate-900">
          {currentModule === 'hub' && (
            hasAccess('hub') ? <ProjectExplorer onSelectProject={handleSelectProject} /> : <AccessDenied />
          )}

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

      {/* SITE CONTEXT MODAL (Phase 2 Overlay) */}
      {siteContext && (
        <SiteContextModal
          context={siteContext}
          isOpen={showContextModal}
          onClose={() => setShowContextModal(false)}
          onDimensionar={handleDimensionar}
        />
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
