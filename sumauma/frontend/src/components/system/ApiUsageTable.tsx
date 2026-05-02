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
                
                let usageBadgeClass = 'badge-active';
                if (percentage > 95) usageBadgeClass = 'badge-blocked';
                else if (percentage > 80) usageBadgeClass = 'badge-pending';

                return (
                  <tr key={tenant.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-[11px] text-slate-300 font-medium">
                      {tenant.name}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400">
                      {tenant.apiPlan}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-right text-slate-200">
                      {tenant.apiCurrentUsage.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-right text-slate-500">
                      {tenant.apiMonthlyQuota.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`badge ${usageBadgeClass} tabular-nums text-[10px]`}>
                          {percentage.toFixed(1)}%
                        </span>
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              percentage > 95 ? 'bg-rose-500' : 
                              percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
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
