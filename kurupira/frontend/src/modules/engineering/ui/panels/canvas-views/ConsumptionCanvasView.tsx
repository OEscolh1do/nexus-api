import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSolarStore } from '@/core/state/solarStore';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';
import { ConsumptionChart } from './consumption/ConsumptionChart';
import { SimulatedLoadsPanel } from './consumption/SimulatedLoadsPanel';
import { TrendingUp, Zap, MapPin, Info, ArrowUpRight } from 'lucide-react';

const MONTH_LABELS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const ConsumptionCanvasView: React.FC<{ className?: string }> = ({ className }) => {
  // Store Reads
  const clientData = useSolarStore(s => s.clientData);
  const simulatedItems = useSolarStore(s => s.simulatedItems);
  const loadGrowthFactor = useSolarStore(s => s.loadGrowthFactor);
  const setLoadGrowthFactor = useSolarStore(s => s.setLoadGrowthFactor);
  const setKWpAlvo = useSolarStore(s => s.setKWpAlvo);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const updateClientData = useSolarStore(s => s.updateClientData);
  const updateMonthlyConsumption = useSolarStore(s => s.updateMonthlyConsumption);

  const city = clientData?.city ?? '';
  const stateUF = clientData?.state ?? '';

  // Calculate complete monthly consumption (Base + Simulated)
  const totalConsumptionMonthly = useMemo(() => {
    const inv = clientData.invoices?.[0];
    const averageConsumption = clientData?.averageConsumption ?? 0;
    const baseHistory = (inv?.monthlyHistory?.length === 12) 
      ? inv.monthlyHistory 
      : Array(12).fill(averageConsumption);

    const simulatedArray = Array(12).fill(0).map(() => {
      return Object.values(simulatedItems.entities).reduce((sum, item) => {
        const duty = item.dutyCycle ?? 1;
        const kwh = ((item.power * duty * item.hoursPerDay * (item.daysPerMonth ?? 30) * item.qty) / 1000);
        return sum + kwh;
      }, 0);
    });

    return baseHistory.map((val, i) => val + simulatedArray[i]);
  }, [clientData.invoices, clientData.averageConsumption, simulatedItems]);

  const totalConsumptionAvg = useMemo(() => {
    const avg = totalConsumptionMonthly.reduce((a, b) => a + b, 0) / 12;
    return avg * (1 + loadGrowthFactor / 100);
  }, [totalConsumptionMonthly, loadGrowthFactor]);

  // Recalculate Target kWp automatically
  useEffect(() => {
    const monthlyHsp = clientData.monthlyIrradiation ?? [];
    if (totalConsumptionAvg > 0) {
      const result = calcKWpAlvo(totalConsumptionMonthly, monthlyHsp, loadGrowthFactor);
      setKWpAlvo(result);
    } else {
      setKWpAlvo(0);
    }
  }, [totalConsumptionMonthly, clientData.monthlyIrradiation, loadGrowthFactor, setKWpAlvo, totalConsumptionAvg]);

  return (
    <div className={cn('relative w-full h-full flex flex-col bg-slate-950 overflow-hidden', className)}>
      
      {/* ── HEADER DE INSTRUMENTO ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 sm:py-3 border-b border-slate-800 bg-slate-950 z-20 shrink-0 shadow-lg gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-sky-500 text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.2em] leading-none">
            <Zap size={14} strokeWidth={2.5} />
            Módulo de Engenharia: Dimensionamento de Carga
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-500 text-[11px] font-medium uppercase tracking-tight">
            {city && <div className="flex items-center gap-1.5"><MapPin size={10} className="text-slate-600" />{city}, {stateUF}</div>}
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-800" />
            <div className="text-slate-600 font-mono italic">Base: {(totalConsumptionAvg / (1 + loadGrowthFactor / 100)).toFixed(2).toLocaleString()} kWh/mês</div>
          </div>
        </div>

        {/* HUD DE RESULTADOS (KWp ALVO) */}
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Potência Alvo (DC)</span>
              <div className="flex items-baseline gap-1.5 px-3 py-1 bg-sky-500/5 border border-sky-500/20 rounded-sm">
                 <span className="text-2xl font-black text-sky-500 font-mono tracking-tighter tabular-nums">
                    {kWpAlvo && kWpAlvo > 0 ? kWpAlvo.toFixed(2) : "0.00"}
                 </span>
                 <span className="text-[11px] font-bold text-sky-600 uppercase">kWp</span>
              </div>
           </div>
        </div>
      </div>

      {/* ── CORPO DASHBOARD (MÉTRICA ÚNICA) ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-4 lg:p-6 pb-24 lg:pb-32 space-y-6">
        
        {/* 1. BARRA DE PREMISSAS E CONFIGURAÇÃO (Compacta) */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-sm shadow-xl">
           {/* Premissa: Tipo de Ligação */}
           <div className="flex-1 space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] text-slate-500 font-black uppercase tracking-widest">
                 <TrendingUp size={10} className="text-slate-600" /> Tipo de Ligação
              </label>
              <select 
                value={clientData.connectionType || 'monofasico'}
                onChange={e => updateClientData({ connectionType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-sky-500/50 outline-none transition-all"
              >
                <option value="monofasico">MONOFÁSICO</option>
                <option value="bifasico">BIFÁSICO</option>
                <option value="trifasico">TRIFÁSICO</option>
              </select>
           </div>

           <div className="hidden lg:block w-px h-10 bg-slate-800/60" />

           {/* Premissa: Tarifa */}
           <div className="flex-1 space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] text-slate-500 font-black uppercase tracking-widest">
                 <Zap size={10} className="text-slate-600" /> Tarifa Final
              </label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 font-mono font-bold text-[11px]">R$</span>
                 <input 
                   type="number" 
                   step="0.01"
                   value={clientData.tariffRate || 0}
                   onChange={e => updateClientData({ tariffRate: Number(e.target.value) })}
                   className="w-full bg-slate-950 border border-slate-800 rounded-sm pl-9 pr-3 py-2 text-xs text-sky-500/80 font-mono tracking-tight focus:border-sky-500/50 outline-none transition-all"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-700 font-bold">/kWh</span>
              </div>
           </div>

           <div className="hidden lg:block w-px h-10 bg-slate-800/60" />

           {/* Premissa: Média Rápida (kWh) */}
           <div className="flex-1 space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] text-slate-500 font-black uppercase tracking-widest">
                 <Zap size={10} className="text-sky-400" /> Média Rápida
              </label>
              <div className="relative">
                 <input 
                   type="number"
                   value={clientData.averageConsumption ? Number(clientData.averageConsumption.toFixed(2)) : ''}
                   onChange={e => updateClientData({ averageConsumption: Number(e.target.value) })}
                   className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-xs text-sky-400 font-mono font-black tracking-tight focus:border-sky-500/50 outline-none transition-all text-right tabular-nums"
                   placeholder="0"
                 />
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-700 font-bold uppercase">kWh</span>
              </div>
           </div>

           <div className="hidden lg:block w-px h-10 bg-slate-800/60" />

           {/* Premissa: Fator de Crescimento (Redesenhado) */}
           <div className="flex-1 space-y-1.5 group">
              <label className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-black uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                    <ArrowUpRight size={10} className="text-sky-500" /> Expansão de Carga
                 </div>
                 <span className="text-sky-500 font-mono group-hover:scale-110 transition-transform">+{loadGrowthFactor}%</span>
              </label>
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-sm px-3 py-1.5">
                 <input
                   type="range"
                   min={0}
                   max={50}
                   step={5}
                   value={loadGrowthFactor}
                   onChange={e => setLoadGrowthFactor(Number(e.target.value))}
                   className="flex-1 accent-sky-500 h-1 bg-slate-900 rounded-full cursor-pointer hover:accent-sky-400 transition-all focus:outline-none"
                 />
                 <div className="flex items-center gap-1 min-w-[32px] justify-end">
                    <input 
                      type="number"
                      value={loadGrowthFactor}
                      onChange={e => setLoadGrowthFactor(Number(e.target.value))}
                      className="w-8 bg-transparent border-none text-[11px] font-mono font-black text-sky-500/80 text-right outline-none"
                    />
                    <span className="text-[11px] text-slate-700 font-bold">%</span>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. ÁREA DE GRÁFICOS (Largura Total) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between ml-1 relative">
             <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest leading-none flex items-center gap-2">
                <TrendingUp size={12} className="text-sky-500" /> Perfil de Consumo vs Projeção Mensal
             </span>
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-900 border border-slate-800 rounded-sm">
                   <Info size={10} className="text-slate-600" />
                   <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Variação Climática TMY Inclusa</span>
                </div>
             </div>
           </div>
           
           <div className="bg-slate-900 border border-slate-800 p-4 lg:p-6 rounded-sm shadow-2xl">
              <div className="h-[320px] lg:h-[380px]">
                 <ConsumptionChart />
              </div>
              
              {/* Grid de Meses Individuais (Histórico de Faturas) */}
              <div className="mt-8 pt-6 border-t border-slate-800/60">
                 <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                    {MONTH_LABELS.map((month, idx) => {
                       const inv = clientData.invoices?.[0];
                       const val = inv?.monthlyHistory?.[idx] ?? clientData.averageConsumption ?? 0;
                       
                       return (
                          <div key={month} className="space-y-1.5 group">
                             <label className="block text-[11px] text-slate-500 group-hover:text-sky-500 transition-colors font-bold text-center uppercase tracking-tighter">{month}</label>
                             <input 
                                type="number"
                                value={val.toFixed(2) || ''}
                                onChange={e => updateMonthlyConsumption(idx, Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-1 py-1.5 text-xs font-mono font-bold text-slate-400 text-center focus:border-sky-500/40 focus:bg-slate-900 outline-none transition-all tabular-nums"
                             />
                          </div>
                       );
                    })}
                 </div>
                 <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-sky-500/20 rounded-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500/50" />
                          <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] italic">Projeção Média: {totalConsumptionAvg.toFixed(2)} kWh/mês</span>
                       </div>
                    </div>
                    <p className="text-[11px] text-slate-600 italic uppercase tracking-[0.2em] font-black">
                       * Sistema recalculado em tempo real com dados de irradiação local.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* 3. INVENTÁRIO DE CARGAS */}
        <div id="simulated-loads-section" className="flex flex-col gap-3">
           <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest ml-1 flex items-center gap-2">
              <Zap size={12} className="text-amber-500/50" /> Inventário de Cargas Projetadas
           </span>
           <SimulatedLoadsPanel />
        </div>

      </div>

    </div>
  );
};
