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
  // Lógica de responsividade simples para barSize e margens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  // Extrair valores do motor de cálculo
  const faturaBase = data.find(d => d.label === 'Fatura Atual')?.value || 0;
  const custoAdicional = data.find(d => d.label === 'Custo Novas Cargas')?.value || 0;
  const availability = data.find(d => d.label === 'Custo Disponibilidade')?.value || 0;
  const cosip = data.find(d => d.label === 'Iluminação Pública')?.value || 0;
  const savings = data.find(d => d.label === 'Economia Solar')?.value || 0;
  const newTotal = data.find(d => d.label === 'Nova Fatura')?.value || 0;

  const hasAdditionalLoad = custoAdicional > 1;
  const projectedTotal = faturaBase + custoAdicional;

  const chartData = [
    {
      name: isMobile ? 'ATUAL' : 'FATURA ATUAL',
      total: faturaBase,
      type: 'before',
      details: [{ label: 'Consumo Histórico', value: faturaBase }]
    }
  ];

  if (hasAdditionalLoad) {
    chartData.push({
      name: isMobile ? 'PROJ.' : 'PROJETADO',
      total: projectedTotal,
      type: 'projected',
      details: [
        { label: 'Carga Base', value: faturaBase },
        { label: 'Novas Cargas', value: custoAdicional }
      ]
    });
  }

  chartData.push({
    name: isMobile ? 'SOLAR' : 'COM SOLAR',
    total: newTotal,
    type: 'after',
    details: [
      { label: 'Piso ANEEL', value: availability },
      { label: 'Ilum. Pública', value: cosip }
    ]
  });

  const comparisonBase = hasAdditionalLoad ? projectedTotal : faturaBase;
  const savingsPct = comparisonBase > 0 ? (Math.abs(savings) / comparisonBase * 100).toFixed(0) : 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 relative">
        {/* Selo de Economia Flutuante - Responsivo */}
        {comparisonBase > 0 && (
          <div className={cn(
            "absolute z-10 flex flex-col items-center pointer-events-none select-none transition-all duration-500",
            isMobile ? "top-[40%] right-4" : "top-[35%] left-[66%]",
            !hasAdditionalLoad && !isMobile && "left-1/2 -translate-x-1/2"
          )}>
            <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-2 rounded-sm flex flex-col items-center shadow-xl animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-1 text-emerald-400">
                <ArrowDownRight size={isMobile ? 12 : 14} className="animate-bounce" />
                <span className="text-sm sm:text-lg font-black font-mono tracking-tighter">-{savingsPct}%</span>
              </div>
              <span className="text-[7px] sm:text-[8px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">Economia Real</span>
            </div>
            {!isMobile && <div className="h-24 sm:h-32 w-px bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent mt-2" />}
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 50, right: 20, left: 20, bottom: 20 }}
            barSize={isMobile ? 40 : 60}
          >
            <XAxis 
              dataKey="name" 
              stroke="#334155" 
              tick={{ fill: '#475569', fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false} 
              dy={10}
            />
            <YAxis hide domain={[0, 'dataMax + 200']} />
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
                      className="text-[10px] sm:text-[12px] font-black font-mono tabular-nums"
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

      <div className="px-4 py-3 bg-slate-900/40 border-t border-slate-800/60 mt-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Economia mensal estimada</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">
              {formatBRL(Math.abs(savings))}
            </span>
          </div>
          <div className="flex flex-col sm:items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Previsão de Retorno Anual</span>
            <span className="text-sm font-black text-white tabular-nums">
              {formatBRL(Math.abs(savings * 12))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
