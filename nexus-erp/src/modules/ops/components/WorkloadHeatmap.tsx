
import React from 'react';
import { User } from 'lucide-react';
import type { WorkloadMetric } from '../types';

interface Props {
  metrics: WorkloadMetric[];
}

export const WorkloadHeatmap: React.FC<Props> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) {
      return (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Nenhum dado de carga de trabalho disponível.
          </div>
      );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200/60 dark:border-slate-800 text-left">
              <th className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400 tracking-wide text-[11px] uppercase w-64">
                Colaborador
              </th>
              {metrics[0]?.weeks.map((w, i) => (
                <th key={i} className="px-4 py-4 font-semibold text-slate-500 dark:text-slate-400 tracking-wide text-[11px] uppercase text-center min-w-[100px]">
                  {w.weekLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800">
            {metrics.map(userMetric => (
              <tr key={userMetric.userId} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                        <User size={14} />
                    </div>
                    <div>
                        <div className="font-semibold text-[13px] text-slate-700 dark:text-slate-200">{userMetric.userFullName}</div>
                    </div>
                  </div>
                </td>
                {userMetric.weeks.map((week, idx) => (
                  <td key={idx} className="px-4 py-3.5 text-center">
                    <div className={`
                      inline-flex items-center justify-center w-12 h-7 rounded text-[13px] font-semibold border transition-all
                      ${week.status === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : ''}
                      ${week.status === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : ''}
                      ${week.status === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 shadow-sm relative overflow-hidden' : ''}
                    `}>
                      {week.status === 'HIGH' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>}
                      <span className="relative z-10">{week.taskCount}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      {/* Legend */}
      <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
         <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/50"></span> Disponível (0-2)
         </div>
         <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/50"></span> Ocupado (3-5)
         </div>
         <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/20 border border-rose-500/50"></span> Sobrecarga (6+)
         </div>
      </div>
    </div>
  );
};
