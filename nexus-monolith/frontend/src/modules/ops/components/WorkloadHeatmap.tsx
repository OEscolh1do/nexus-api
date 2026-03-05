
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-left">
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs w-64">
                Colaborador
              </th>
              {metrics[0]?.weeks.map((w, i) => (
                <th key={i} className="px-4 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs text-center">
                  {w.weekLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.map(userMetric => (
              <tr key={userMetric.userId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        <User size={14} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-700 dark:text-slate-200">{userMetric.userFullName}</div>
                    </div>
                  </div>
                </td>
                {userMetric.weeks.map((week, idx) => (
                  <td key={idx} className="px-4 py-4 text-center">
                    <div className={`
                      inline-flex items-center justify-center w-12 h-8 rounded-md text-xs font-bold border transition-all
                      ${week.status === 'LOW' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : ''}
                      ${week.status === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' : ''}
                      ${week.status === 'HIGH' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse' : ''}
                    `}>
                      {week.taskCount}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-6 text-[10px] uppercase font-bold text-slate-500">
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Disponível (0-2)
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> Ocupado (3-5)
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-sm"></span> Sobrecarga (6+)
         </div>
      </div>
    </div>
  );
};
