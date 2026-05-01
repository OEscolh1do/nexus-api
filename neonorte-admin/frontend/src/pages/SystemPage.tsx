import { Activity } from 'lucide-react';

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-200">Sistema</h1>
          <p className="text-xs text-slate-500">Healthcheck, cron jobs, sessões ativas e uso de API</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
          <div className="flex flex-col items-center gap-3 text-center">
            <Activity className="h-8 w-8 text-emerald-500/30" />
            <p className="text-sm text-slate-500">Saúde dos Serviços — em desenvolvimento</p>
            <p className="text-xs text-slate-600">Iaçã, Kurupira, MySQL, latência</p>
          </div>
        </div>

        <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-slate-800 bg-slate-900/50">
          <div className="flex flex-col items-center gap-3 text-center">
            <Activity className="h-8 w-8 text-sky-500/30" />
            <p className="text-sm text-slate-500">Sessões & API Usage — em desenvolvimento</p>
            <p className="text-xs text-slate-600">Sessões ativas, quotas, alertas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
