import { Activity, RefreshCw, Server, Cpu, Clock, Terminal, Shield } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import ServiceHealthCard from '@/components/system/ServiceHealthCard';
import EnvInspector from '@/components/system/EnvInspector';
import SessionsTable from '@/components/system/SessionsTable';
import CronJobsTable from '@/components/system/CronJobsTable';
import ApiUsageTable from '@/components/system/ApiUsageTable';

export default function SystemPage() {
  const { health, info, jobs, apiUsage, loading, refresh } = useSystemHealth();

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
            <Activity className="h-5 w-5 text-slate-500" />
            Saúde do Sistema
          </h1>
          <p className="text-xs text-slate-500">
            Monitoramento de serviços, infraestrutura Ywara e sessões
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-4 text-xs font-medium bg-slate-800 border border-slate-700 rounded-sm text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Verificar agora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {health?.services.map((service) => (
          <ServiceHealthCard key={service.name} service={service} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SessionsTable />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CronJobsTable jobs={jobs} />
            <ApiUsageTable apiUsage={apiUsage} />
          </div>

          {info && <EnvInspector envs={info.envStatus} />}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ambiente & Versões</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Server className="h-3.5 w-3.5" />
                  <span className="text-xs">Admin Backend</span>
                </div>
                <span className="text-xs font-mono text-sky-400 font-bold">v{info?.version || '0.0.0'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Cpu className="h-3.5 w-3.5" />
                  <span className="text-xs">Node.js</span>
                </div>
                <span className="text-xs font-mono text-slate-300">{info?.nodeVersion || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal className="h-3.5 w-3.5" />
                  <span className="text-xs">Plataforma</span>
                </div>
                <span className="text-xs font-mono text-slate-300 uppercase">{info?.platform || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">Uptime</span>
                </div>
                <span className="text-xs font-mono text-slate-300">{info ? formatUptime(info.uptimeSeconds) : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-sky-500/5 border border-sky-500/20 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-sky-400">
              <Shield className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Segurança</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              As sessões são assinadas via JWT e persistidas no banco do Iaçã. A revogação limpa o registro no banco, invalidando o acesso imediatamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
