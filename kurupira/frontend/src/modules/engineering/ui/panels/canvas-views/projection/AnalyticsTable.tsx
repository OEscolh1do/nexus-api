import React from 'react';
import { ProjectionMonthData } from '../../../../utils/projectionMath';

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface AnalyticsTableProps {
  data: ProjectionMonthData[];
  totalGen: number;
  totalCons: number;
  economiaAno: number;
  tariffRate: number;
}

export const AnalyticsTable: React.FC<AnalyticsTableProps> = ({
  data,
  totalGen,
  totalCons,
  economiaAno,
  tariffRate,
}) => {
  const sumExcedente = data.reduce((a, d) => a + d.excedente, 0);
  const sumDeficit   = data.reduce((a, d) => a + d.deficit, 0);

  return (
    <div className="h-full overflow-auto custom-scrollbar relative border border-slate-800/40 rounded-sm bg-slate-950/20">
      <table className="w-full text-[9px] sm:text-[10px] border-collapse min-w-[600px]">
        <thead className="sticky top-0 z-20 bg-slate-950 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
          <tr>
            <th className="sticky left-0 z-30 bg-slate-950 px-4 py-2.5 text-left font-black text-slate-500 uppercase tracking-widest border-r border-slate-800/60 shadow-[2px_0_5_rgba(0,0,0,0.3)]">
              Mês
            </th>
            {['Geração', 'Consumo', 'Excedente', 'Déficit', 'Economia'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-right font-black text-slate-600 uppercase tracking-widest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900/50">
          {data.map((d) => (
            <tr key={d.month} className="group hover:bg-slate-800/30 transition-colors">
              <td className="sticky left-0 z-10 bg-slate-950 px-4 py-2 font-black text-slate-400 border-r border-slate-800/60 group-hover:text-slate-100 transition-colors shadow-[2px_0_5_rgba(0,0,0,0.3)]">
                {d.month}
              </td>
              <td className="px-4 py-2 font-mono text-right text-amber-400 tabular-nums">
                {Math.round(d.gen).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2 font-mono text-right text-sky-400 tabular-nums">
                <div className="flex flex-col items-end">
                  <span>{Math.round(d.cons).toLocaleString('pt-BR')}</span>
                  {d.addedLoad > 0 && (
                    <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter -mt-0.5 opacity-60">
                      (+{Math.round(d.addedLoad)})
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 font-mono text-right text-violet-400 tabular-nums">
                {Math.round(d.excedente).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2 font-mono text-right text-rose-400 tabular-nums">
                {Math.round(d.deficit).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2 font-mono text-right text-emerald-400 font-black tabular-nums">
                {tariffRate > 0 ? `R$ ${formatBRL(d.economiaMes)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-20">
          <tr className="bg-slate-900 shadow-[0_-1px_0_rgba(255,255,255,0.05)] border-t-2 border-slate-700">
            <td className="sticky left-0 z-30 bg-slate-900 px-4 py-3 font-black text-slate-300 border-r border-slate-800/60 shadow-[2px_0_5px_rgba(0,0,0,0.3)] uppercase tracking-wider">
              TOTAL
            </td>
            <td className="px-4 py-3 font-mono font-black text-right text-amber-300 tabular-nums">
              {totalGen.toLocaleString('pt-BR')}
            </td>
            <td className="px-4 py-3 font-mono font-black text-right text-sky-300 tabular-nums">
              {totalCons.toLocaleString('pt-BR')}
            </td>
            <td className="px-4 py-3 font-mono font-black text-right text-violet-300 tabular-nums">
              {Math.round(sumExcedente).toLocaleString('pt-BR')}
            </td>
            <td className="px-4 py-3 font-mono font-black text-right text-rose-300 tabular-nums">
              {Math.round(sumDeficit).toLocaleString('pt-BR')}
            </td>
            <td className="px-4 py-3 font-mono font-black text-right text-emerald-400 tabular-nums">
              {tariffRate > 0 ? `R$ ${formatBRL(economiaAno)}` : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
