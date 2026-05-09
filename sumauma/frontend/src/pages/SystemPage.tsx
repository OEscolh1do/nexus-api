import { Activity, RefreshCw, Server, Cpu, Clock, Terminal, Shield, GitCompare } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import ServiceHealthCard from '@/components/system/ServiceHealthCard';
import EnvInspector from '@/components/system/EnvInspector';
import SessionsTable from '@/components/system/SessionsTable';
import CronJobsTable from '@/components/system/CronJobsTable';
import ApiUsageTable from '@/components/system/ApiUsageTable';
import RolesTab from '@/components/roles/RolesTab';
import IdentityAuditTab from '@/components/system/IdentityAuditTab';
import { useState } from 'react';

export default function SystemPage() {
  const { 
    health, info, jobs, sessions, apiUsage, loading, refresh, revokeSession, 
    auditReport, auditStatus, runIdentityAudit, reprovisionUser,
    deleteLogtoOrphan, provisionLocalUser, blockLocalUser,
    linkLogtoOrg, provisionLogtoOrg, deleteLocalUser, deleteLocalTenant, provisionLocalTenant, syncAttributes, runBatchAction
  } = useSystemHealth();
  const [activeTab, setActiveTab] = useState<'health' | 'roles' | 'identity'>('health');

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden pb-4">
      <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-sm border border-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-sm border border-slate-700">
            <Activity className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200 uppercase tracking-tight">
              Saúde & Segurança
            </h1>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Acompanhe a saúde do sistema, conexões ativas e a segurança das contas
            </p>
          </div>
        </div>

        <button
          onClick={() => refresh()}
          disabled={loading}
          className="flex items-center gap-2 h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 rounded-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 px-1">
        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'health'
              ? 'border-sky-500 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <Activity className="h-3 w-3" />
          Status
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'roles'
              ? 'border-sky-500 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <Shield className="h-3 w-3" />
          Perfis
        </button>
        <button
          id="tab-identity-audit"
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'identity'
              ? 'border-sky-500 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <GitCompare className="h-3 w-3" />
          Integridade
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === 'health' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {health?.services.map((service) => (
                <ServiceHealthCard key={service.name} service={service} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <SessionsTable sessions={sessions} onRevoke={revokeSession} loading={loading} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CronJobsTable jobs={jobs} />
                  <ApiUsageTable apiUsage={apiUsage} />
                </div>

                {info && <EnvInspector envs={info.envStatus} />}
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden shadow-inner">
                  <div className="px-3 py-1.5 bg-slate-800/50 border-b border-slate-800">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Informações Técnicas</h3>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Server className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Servidor Principal</span>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 font-bold">v{info?.version || '0.0.0'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Cpu className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Motor de Processamento</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{info?.nodeVersion || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Terminal className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Plataforma</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{info?.platform || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Tempo Online</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{info ? formatUptime(info.uptimeSeconds) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-sm space-y-2">
                  <div className="flex items-center gap-2 text-sky-500/70">
                    <Shield className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Proteção de Acesso</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Suas conexões são protegidas e registradas individualmente. Você pode encerrar acessos suspeitos a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'identity' && (
          <IdentityAuditTab
            report={auditReport}
            status={auditStatus}
            onRunAudit={runIdentityAudit}
            onReprovision={reprovisionUser}
            onDeleteOrphan={deleteLogtoOrphan}
            onProvisionLocal={provisionLocalUser}
            onBlockLocal={blockLocalUser}
            onLinkOrg={linkLogtoOrg}
            onProvisionOrg={provisionLogtoOrg}
            onDeleteLocal={deleteLocalUser}
            onDeleteTenant={deleteLocalTenant}
            onProvisionLocalTenant={provisionLocalTenant}
            onSyncAttributes={syncAttributes}
            onBatchAction={runBatchAction}
          />
        )}
      </div>
    </div>
  );
}
