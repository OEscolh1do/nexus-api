import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import { FinancialWaterfallData } from '../../../../utils/projectionMath';
import { ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialBalanceChartProps {
  data: FinancialWaterfallData[];
}

const formatBRL = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-sm shadow-2xl">
        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
          Detalhamento de Custo
        </div>
        <div className="space-y-1.5">
          {d.details.map((det: any, i: number) => (
            <div key={i} className="flex justify-between gap-4 items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase">{det.label}</span>
              <span className="text-[10px] font-black text-white tabular-nums">{formatBRL(det.value)}</span>
            </div>
          ))}
          <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex justify-between gap-4 items-center">
            <span className="text-[9px] font-black text-slate-300 uppercase">Total Estimado</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">{formatBRL(d.total)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const FinancialBalanceChart: React.FC<FinancialBalanceChartProps> = ({ data }) => {
  // Extrair valores do motor de cálculo
  const faturaBase = data.find(d => d.label === 'Fatura Atual')?.value || 0;
  const custoAdicional = data.find(d => d.label === 'Custo Novas Cargas')?.value || 0;
  const availability = data.find(d => d.label === 'Custo Disponibilidade')?.value || 0;
  const cosip = data.find(d => d.label === 'Iluminação Pública')?.value || 0;
  const savings = data.find(d => d.label === 'Economia Solar')?.value || 0;
  const newTotal = data.find(d => d.label === 'Nova Fatura')?.value || 0;

  const hasAdditionalLoad = custoAdicional > 1; // Tolerance for floating point
  const projectedTotal = faturaBase + custoAdicional;

  const chartData = [
    {
      name: 'ATUAL',
      total: faturaBase,
      type: 'before',
      details: [{ label: 'Consumo Histórico', value: faturaBase }]
    }
  ];

  if (hasAdditionalLoad) {
    chartData.push({
      name: 'PROJETADO',
      total: projectedTotal,
      type: 'projected',
      details: [
        { label: 'Carga Base', value: faturaBase },
        { label: 'Novas Cargas', value: custoAdicional }
      ]
    });
  }

  chartData.push({
    name: 'COM SOLAR',
    total: newTotal,
    type: 'after',
    details: [
      { label: 'Piso ANEEL', value: availability },
      { label: 'Ilum. Pública', value: cosip }
    ]
  });

  // A economia deve ser comparada ao que ele PAGARIA (Projetado) se não tivesse solar
  const comparisonBase = hasAdditionalLoad ? projectedTotal : faturaBase;
  const savingsPct = comparisonBase > 0 ? (Math.abs(savings) / comparisonBase * 100).toFixed(0) : 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 relative">
        {/* Selo de Economia Flutuante */}
        {comparisonBase > 0 && (
          <div className={cn(
            "absolute top-[35%] z-10 flex flex-col items-center pointer-events-none select-none transition-all duration-500",
            hasAdditionalLoad ? "left-[66%]" : "left-1/2 -translate-x-1/2"
          )}>
            <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-3 py-2 rounded-sm flex flex-col items-center shadow-xl animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-1 text-emerald-400">
                <ArrowDownRight size={14} className="animate-bounce" />
                <span className="text-lg font-black font-mono tracking-tighter">-{savingsPct}%</span>
              </div>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">Economia Real</span>
            </div>
            <div className="h-32 w-px bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent mt-2" />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 40, right: 40, left: 20, bottom: 20 }}
            barSize={60}
          >
            <XAxis 
              dataKey="name" 
              stroke="#334155" 
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis hide domain={[0, 'dataMax + 100']} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            
            <Bar dataKey="total" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.type === 'before' ? '#1e293b' : 
                    entry.type === 'projected' ? '#334155' :
                    '#10b981'
                  } 
                  fillOpacity={entry.type === 'after' ? 0.9 : 0.8}
                  stroke={
                    entry.type === 'before' ? '#334155' : 
                    entry.type === 'projected' ? '#475569' :
                    '#34d399'
                  }
                  strokeWidth={1}
                />
              ))}
              <LabelList 
                dataKey="total" 
                position="top" 
                content={(props: any) => {
                  const { x, y, width, value, index } = props;
                  return (
                    <text 
                      x={x + width / 2} 
                      y={y - 12} 
                      fill={chartData[index].type === 'after' ? '#34d399' : '#94a3b8'} 
                      textAnchor="middle" 
                      className="text-[12px] font-black font-mono tabular-nums"
                    >
                      {formatBRL(value)}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-4 py-3 bg-black/20 border-t border-slate-800/40 mt-auto">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Economia mensal</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">
              {formatBRL(Math.abs(savings))}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Retorno anual</span>
            <span className="text-sm font-black text-white tabular-nums">
              {formatBRL(Math.abs(savings * 12))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
