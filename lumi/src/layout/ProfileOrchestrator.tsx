import React from 'react';
import { useAuth } from '@/core/auth/useAuth';
import { useSolarStore } from '@/core/state/solarStore';
import { ClientModule } from '@/modules/crm/ClientModule';
import { TechModule } from '@/modules/engineering/TechModule';
import { ElectricalModule } from '@/modules/electrical/ElectricalModule';
import { DocumentationModule } from '@/modules/documentation/DocumentationModule';
import { ProposalModule } from '@/modules/proposal/ProposalModule';
import { FinanceModule } from '@/modules/finance/FinanceModule';
import { SettingsModule } from '@/modules/settings/SettingsModule';
import { DASHBOARD_TABS, TabId, TAB_COLOR_CLASSES } from '@/config/navigation';
import { Lock, ShieldCheck, ShieldAlert, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const RoleBadge = ({ role }: { role: string }) => {
  const colors: Record<string, string> = {
    'SALES': 'bg-blue-100 text-blue-700',
    'ENGINEER': 'bg-purple-100 text-purple-700',
    'ADMIN': 'bg-slate-800 text-white'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colors[role] || 'bg-gray-100'}`}>
      {role}
    </span>
  );
};

// Placeholder para módulos não implementados

export const ProfileOrchestrator: React.FC = () => {
  const { activeModule, setActiveModule, userRole } = useSolarStore();
  const { user, signOut } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();

  // Mapeia roles permitidas para cada módulo
  const MODULE_ROLES: Record<TabId, string[]> = {
    'crm': ['SALES', 'ENGINEER', 'ADMIN'],
    'engineering': ['ENGINEER', 'ADMIN'],
    'electrical': ['ENGINEER', 'ADMIN'],
    'documentation': ['ENGINEER', 'ADMIN'],
    'finance': ['ADMIN'],
    'proposal': ['SALES', 'ENGINEER', 'ADMIN'],
    'settings': ['ENGINEER', 'ADMIN'],
  };

  // Filtra tabs baseado no role
  const allowedTabs = DASHBOARD_TABS.filter(tab =>
    MODULE_ROLES[tab.id]?.includes(userRole)
  );

  const hasAccess = (moduleId: TabId) => MODULE_ROLES[moduleId]?.includes(userRole);

  return (
    <div className="w-full h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neonorte-green rounded-lg flex items-center justify-center text-white font-bold text-sm">SF</div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Lumi <span className="text-neonorte-green">V3</span></h1>
              <p className="text-[9px] text-slate-400">Full-Height Modular</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* Navigation Tabs */}
          <nav className="flex gap-1 overflow-x-auto">
            {allowedTabs.map(tab => {
              const Icon = tab.icon;
              const colorClasses = TAB_COLOR_CLASSES[tab.color];
              const isActive = activeModule === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModule(tab.id)}
                  title={tab.description}
                  className={`
                     flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap
                     ${isActive
                      ? `${colorClasses.active} shadow-md`
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                   `}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neonorte-green/10 hover:bg-neonorte-green/20 text-neonorte-green rounded-md text-xs font-bold transition-colors"
              title="Instalar App Lumi"
            >
              <Download size={14} />
              <span className="hidden md:inline">Instalar App</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-200">
            {userRole === 'ADMIN' ? <ShieldAlert size={12} className="text-red-500" /> : <ShieldCheck size={12} className="text-blue-500" />}
            <RoleBadge role={userRole} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]">
              {user?.email || 'Usuário Logado'}
            </span>
            <button
              // @ts-ignore
              onClick={signOut}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-red-500 rounded transition-colors"
              title="Sair do sistema"
            >
              <Lock size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden">
        {/* CRM */}
        {activeModule === 'crm' && <ClientModule />}

        {/* Engineering */}
        {activeModule === 'engineering' && (
          hasAccess('engineering') ? <TechModule /> : <AccessDenied />
        )}

        {/* Electrical ✅ */}
        {activeModule === 'electrical' && (
          hasAccess('electrical') ? <ElectricalModule /> : <AccessDenied />
        )}

        {/* Documentation ✅ */}
        {activeModule === 'documentation' && (
          hasAccess('documentation') ? <DocumentationModule /> : <AccessDenied />
        )}

        {/* Finance */}
        {activeModule === 'finance' && (
          hasAccess('finance')
            ? <FinanceModule />
            : <AccessDenied />
        )}

        {/* Proposal ✅ NOVO */}
        {activeModule === 'proposal' && <ProposalModule />}

        {/* Settings ✅ NOVO */}
        {activeModule === 'settings' && (
          hasAccess('settings') ? <SettingsModule /> : <AccessDenied />
        )}
      </main>

    </div>
  );
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50">
    <Lock size={32} className="mb-2" />
    <h3 className="font-bold">Acesso Negado</h3>
    <p className="text-sm">Seu perfil não tem permissão para acessar este módulo.</p>
  </div>
);
