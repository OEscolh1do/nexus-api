import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { BarChart3, Activity, TrendingUp, ArrowUp, CalendarDays, Zap } from 'lucide-react';
import { type GenerationEstimate } from '@/modules/engineering/hooks/useGenerationEstimate';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const geracao = payload.find((p: any) => p.dataKey === 'geracao')?.value ?? 0;
  const consumo = payload.find((p: any) => p.dataKey === 'consumo')?.value ?? 0;
  const balance = geracao - consumo;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-sm p-3 text-[11px] shadow-2xl backdrop-blur-md z-50 min-w-[180px]">
      <p className="text-slate-500 font-bold mb-2 uppercase tracking-widest font-mono border-b border-slate-800 pb-1.5">{label}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">GERAÇÃO</span>
          <span className="text-amber-400 font-mono tabular-nums font-bold">{Math.round(geracao)} kWh</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">CONSUMO</span>
          <span className="text-sky-400 font-mono tabular-nums font-bold">{Math.round(consumo)} kWh</span>
        </div>
        <div className="flex justify-between gap-6 border-t border-slate-800 pt-1.5 mt-0.5">
          <span className="text-slate-300 font-bold">BALANÇO</span>
          <span className={cn(
            "font-mono tabular-nums font-bold",
            balance >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {balance >= 0 ? '+' : ''}{Math.round(balance)} kWh
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPARISON GRID (Tab Comparar)
// =============================================================================

interface ComparisonGridProps {
  comparingIds: string[];
  onSelect: (item: any) => void;
}

const ComparisonGrid: React.FC<ComparisonGridProps> = ({ comparingIds, onSelect }) => {
  const { modules } = useCatalogStore();
  const comparingModules = modules.filter(m => comparingIds.includes(m.id));

  if (comparingModules.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center opacity-40">
        <Activity size={32} className="text-slate-700 mb-3" />
        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
          Marque módulos no catálogo para comparar
        </span>
      </div>
    );
  }

  const specs = [
    { key: 'pmax', label: 'Potência', unit: 'Wp', get: (m: any) => m.electrical.pmax },
    { key: 'eff', label: 'Eficiência', unit: '%', get: (m: any) => ((m.electrical.efficiency ?? 0) * 100).toFixed(1) },
    { key: 'voc', label: 'Voc', unit: 'V', get: (m: any) => m.electrical.voc.toFixed(1) },
    { key: 'isc', label: 'Isc', unit: 'A', get: (m: any) => m.electrical.isc.toFixed(2) },
    { key: 'vmp', label: 'Vmp', unit: 'V', get: (m: any) => m.electrical.vmp.toFixed(1) },
    { key: 'imp', label: 'Imp', unit: 'A', get: (m: any) => m.electrical.imp.toFixed(2) },
    { key: 'area', label: 'Área', unit: 'm²', get: (m: any) => ((m.physical.widthMm * m.physical.heightMm) / 1e6).toFixed(2) },
    { key: 'peso', label: 'Peso', unit: 'kg', get: (m: any) => m.physical.weightKg },
  ];

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 px-3 text-slate-600 font-black uppercase tracking-widest w-[100px]">Spec</th>
              {comparingModules.map(m => (
                <th key={m.id} className="text-center py-2 px-3 min-w-[120px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{m.manufacturer}</span>
                    <span className="text-amber-400 font-black font-mono">{m.electrical.pmax}W</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specs.map(spec => {
              const values = comparingModules.map(m => Number(spec.get(m)));
              const maxVal = Math.max(...values);
              return (
                <tr key={spec.key} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-bold uppercase tracking-widest">{spec.label}</td>
                  {comparingModules.map(m => {
                    const val = spec.get(m);
                    const isBest = Number(val) === maxVal && values.filter(v => v === maxVal).length === 1;
                    const pct = maxVal > 0 ? (Number(val) / maxVal) * 100 : 0;
                    return (
                      <td key={m.id} className="text-center py-2 px-3">
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "font-mono font-bold tabular-nums",
                            isBest ? "text-emerald-400" : "text-slate-300"
                          )}>
                            {val}
                            <span className="text-[8px] text-slate-600 ml-0.5">{spec.unit}</span>
                          </span>
                          {/* Heatmap Bar */}
                          <div className="w-12 h-[2px] bg-slate-900 mt-1 relative overflow-hidden rounded-full">
                            <div 
                              className={cn(
                                "absolute left-0 top-0 h-full transition-all duration-500", 
                                isBest ? "bg-emerald-500" : "bg-slate-600"
                              )}
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 px-3" />
              {comparingModules.map(m => (
                <td key={m.id} className="py-3 px-3 text-center">
                  <button
                    onClick={() => onSelect(m)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-400 hover:text-amber-400 text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Adotar
                  </button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ModuleInsightsAreaProps {
  estimate: GenerationEstimate;
  comparingIds: string[];
  onSelectFromCompare: (item: any) => void;
}

export const ModuleInsightsArea: React.FC<ModuleInsightsAreaProps> = ({
  estimate,
  comparingIds,
  onSelectFromCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'generation' | 'compare'>('generation');
  const { hasData, chartData, avgMonthlyGeneration, avgMonthlyConsumption, coveragePercent, totalAnnualGeneration } = estimate;

  const tabs = [
    { id: 'generation' as const, label: 'Geração vs Consumo', icon: <BarChart3 size={10} /> },
    { id: 'compare' as const, label: 'Comparar', icon: <Activity size={10} />, badge: comparingIds.length > 0 ? comparingIds.length : undefined },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">

      {/* Tab Bar */}
      <div className="flex items-center border-b border-slate-800 shrink-0 bg-slate-950/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-[9px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-amber-400 border-amber-500 bg-amber-950/10"
                : "text-slate-600 border-transparent hover:text-slate-400 hover:border-slate-700"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[7px] font-black rounded-sm">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'generation' ? (
        <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800/40 border border-slate-800/60 rounded-sm shrink-0 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
              <TrendingUp size={10} className="text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Geração Média</span>
                <span className="text-[12px] font-mono font-black text-amber-400 tabular-nums">{hasData ? Math.round(avgMonthlyGeneration) : '—'} <span className="text-[8px] text-slate-600">kWh</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
              <Zap size={10} className="text-sky-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Consumo Médio</span>
                <span className="text-[12px] font-mono font-black text-sky-400 tabular-nums">{hasData ? Math.round(avgMonthlyConsumption) : '—'} <span className="text-[8px] text-slate-600">kWh</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
              <CalendarDays size={10} className="text-indigo-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Anual</span>
                <span className="text-[12px] font-mono font-black text-slate-200 tabular-nums">{hasData ? (totalAnnualGeneration >= 1000 ? (totalAnnualGeneration / 1000).toFixed(1) : Math.round(totalAnnualGeneration)) : '—'} <span className="text-[8px] text-slate-600">{totalAnnualGeneration >= 1000 ? 'MWh' : 'kWh'}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
              <ArrowUp size={10} className={cn("shrink-0", coveragePercent >= 100 ? "text-emerald-400" : "text-rose-400")} />
              <div className="flex flex-col">
                <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em]">Cobertura</span>
                <span className={cn(
                  "text-[12px] font-mono font-black tabular-nums",
                  coveragePercent >= 100 ? "text-emerald-400" : coveragePercent >= 80 ? "text-amber-400" : "text-rose-400"
                )}>
                  {hasData ? coveragePercent.toFixed(0) : '—'}%
                </span>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 relative min-h-[300px] lg:min-h-[200px]">
            {!hasData ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                <BarChart3 size={32} className="text-amber-500/30 mb-3" />
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  Adicione módulos para visualizar a geração
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="genGradOk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="genGradDeficit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="conGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                    width={50}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.03)' }} />

                  {/* Consumo (atrás) */}
                  <Bar dataKey="consumo" fill="url(#conGrad)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                  {/* Geração (frente) */}
                  <Bar dataKey="geracao" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.geracao >= entry.consumo ? 'url(#genGradOk)' : 'url(#genGradDeficit)'} 
                      />
                    ))}
                  </Bar>

                  {/* Linha de média de geração */}
                  <ReferenceLine y={avgMonthlyGeneration} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />
                  {/* Linha de média de consumo */}
                  <ReferenceLine y={avgMonthlyConsumption} stroke="#0ea5e9" strokeDasharray="3 3" strokeOpacity={0.2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          {hasData && (
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Geração Estimada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-sky-500/30 rounded-sm" />
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Consumo</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ComparisonGrid
          comparingIds={comparingIds}
          onSelect={onSelectFromCompare}
        />
      )}
    </div>
  );
};
