import { Clock } from 'lucide-react';
import { CronJob } from '@/hooks/useSystemHealth';

export default function CronJobsTable({ jobs }: { jobs: CronJob[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-800">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Clock className="h-4 w-4 text-slate-500" />
          Status dos Cron Jobs
        </h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Job ID</th>
              <th className="px-4 py-2 font-medium">Locked At</th>
              <th className="px-4 py-2 font-medium">Expires At</th>
              <th className="px-4 py-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-500">
                  Nenhum job registrado na tabela CronLock
                </td>
              </tr>
            ) : (
              jobs.map(job => {
                const isLocked = new Date(job.expiresAt) > new Date();
                return (
                  <tr key={job.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2 font-mono text-[11px] text-slate-300">
                      {job.id}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px]">
                      {new Date(job.lockedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px]">
                      {new Date(job.expiresAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isLocked ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Livre
                        </span>
                      )}
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
