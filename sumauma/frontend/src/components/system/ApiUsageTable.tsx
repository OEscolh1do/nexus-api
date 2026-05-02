import { Zap } from 'lucide-react';
import { ApiUsageInfo } from '@/hooks/useSystemHealth';

export default function ApiUsageTable({ apiUsage }: { apiUsage: ApiUsageInfo[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Zap className="h-4 w-4 text-slate-500" />
          Uso de API por Tenant
        </h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Tenant</th>
              <th className="px-4 py-2 font-medium">Plano</th>
              <th className="px-4 py-2 font-medium text-right">Uso Corrente</th>
              <th className="px-4 py-2 font-medium text-right">Quota</th>
              <th className="px-4 py-2 font-medium text-right">% Uso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {apiUsage.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">
                  Nenhum dado de uso de API encontrado.
                </td>
              </tr>
            ) : (
              apiUsage.map(tenant => {
                const percentage = tenant.apiMonthlyQuota > 0 
                  ? (tenant.apiCurrentUsage / tenant.apiMonthlyQuota) * 100 
                  : 0;
                
                let usageColor = 'text-emerald-400';
                if (percentage > 95) usageColor = 'text-rose-400';
                else if (percentage > 80) usageColor = 'text-amber-400';

                return (
                  <tr key={tenant.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2 text-[11px] text-slate-300">
                      {tenant.name}
                    </td>
                    <td className="px-4 py-2 text-[11px] font-mono text-slate-400">
                      {tenant.apiPlan}
                    </td>
                    <td className="px-4 py-2 text-[11px] font-mono text-right text-slate-300">
                      {tenant.apiCurrentUsage.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 text-[11px] font-mono text-right text-slate-400">
                      {tenant.apiMonthlyQuota.toLocaleString('pt-BR')}
                    </td>
                    <td className={`px-4 py-2 text-[11px] font-mono font-bold text-right ${usageColor}`}>
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
