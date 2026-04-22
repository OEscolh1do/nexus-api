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
    <div className="h-full overflow-auto custom-scrollbar">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-slate-800">
            {['Mês', 'Geração kWh', 'Consumo kWh', 'Excedente', 'Déficit', 'Economia'].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-black text-slate-600 uppercase tracking-widest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month} className="border-b border-slate-900/50 hover:bg-slate-900/40 transition-colors">
              <td className="px-3 py-1.5 font-black text-slate-300">{d.month}</td>
              <td className="px-3 py-1.5 font-mono text-amber-400">{Math.round(d.gen).toLocaleString('pt-BR')}</td>
              <td className="px-3 py-1.5 font-mono text-sky-400 flex flex-col">
                <span>{Math.round(d.cons).toLocaleString('pt-BR')}</span>
                {d.addedLoad > 0 && (
                  <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter -mt-0.5">
                    ({Math.round(d.baseCons)} + {Math.round(d.addedLoad)})
                  </span>
                )}
              </td>
              <td className="px-3 py-1.5 font-mono text-violet-400">{Math.round(d.excedente).toLocaleString('pt-BR')}</td>
              <td className="px-3 py-1.5 font-mono text-rose-400">{Math.round(d.deficit).toLocaleString('pt-BR')}</td>
              <td className="px-3 py-1.5 font-mono text-emerald-300 font-black">
                {tariffRate > 0 ? `R$ ${formatBRL(d.economiaMes)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-700 bg-slate-900/40">
            <td className="px-3 py-2 font-black text-slate-300">TOTAL</td>
            <td className="px-3 py-2 font-mono font-black text-amber-300">{totalGen.toLocaleString('pt-BR')}</td>
            <td className="px-3 py-2 font-mono font-black text-sky-300">{totalCons.toLocaleString('pt-BR')}</td>
            <td className="px-3 py-2 font-mono font-black text-violet-300">
              {Math.round(sumExcedente).toLocaleString('pt-BR')}
            </td>
            <td className="px-3 py-2 font-mono font-black text-rose-300">
              {Math.round(sumDeficit).toLocaleString('pt-BR')}
            </td>
            <td className="px-3 py-2 font-mono font-black text-emerald-300">
              {tariffRate > 0 ? `R$ ${formatBRL(economiaAno)}` : '—'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
