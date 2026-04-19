import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSolarStore } from '@/core/state/solarStore';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';
import { ConsumptionChart } from './consumption/ConsumptionChart';
import { SimulatedLoadsPanel } from './consumption/SimulatedLoadsPanel';
import { TrendingUp, Zap, MapPin, ArrowUpRight } from 'lucide-react';



export const ConsumptionCanvasView: React.FC<{ className?: string }> = ({ className }) => {
  // Store Reads
  const clientData = useSolarStore(s => s.clientData);
  const simulatedItems = useSolarStore(s => s.simulatedItems);
  const loadGrowthFactor = useSolarStore(s => s.loadGrowthFactor);
  const setLoadGrowthFactor = useSolarStore(s => s.setLoadGrowthFactor);
  const setKWpAlvo = useSolarStore(s => s.setKWpAlvo);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const updateClientData = useSolarStore(s => s.updateClientData);

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
    <div className={cn('relative w-full h-full flex flex-col bg-slate-950 lg:overflow-hidden overflow-y-auto', className)}>
      
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

      {/* ── CORPO DASHBOARD (SINGLE SCREEN COCKPIT) ─────────────────── */}
      <div className="flex-1 lg:overflow-hidden overflow-visible bg-slate-950 p-4 lg:p-5 flex flex-col gap-4">
        
        {/* 1. BARRA DE TELEMETRIA (PREMISSAS COMPACTAS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
           {/* Célula: Tipo de Ligação */}
           <div className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex flex-col gap-1.5 min-w-0">
              <label className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">
                 <TrendingUp size={10} className="text-slate-600" /> Ligação
              </label>
              <select 
                value={clientData.connectionType || 'monofasico'}
                onChange={e => updateClientData({ connectionType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[11px] text-white font-mono focus:border-sky-500/50 outline-none transition-all uppercase"
              >
                <option value="monofasico">MONO</option>
                <option value="bifasico">BI</option>
                <option value="trifasico">TRI</option>
              </select>
           </div>

           {/* Célula: Tarifa */}
           <div className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex flex-col gap-1.5 min-w-0">
              <label className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">
                 <Zap size={10} className="text-slate-600" /> Tarifa Reais/kWh
              </label>
              <div className="relative">
                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-700 font-mono font-bold text-[10px]">R$</span>
                 <input 
                   type="number" step="0.01"
                   value={clientData.tariffRate || 0}
                   onChange={e => updateClientData({ tariffRate: Number(e.target.value) })}
                   className="w-full bg-slate-950 border border-slate-800 rounded-sm pl-7 pr-2 py-1 text-[11px] text-sky-500 font-mono tracking-tight focus:border-sky-500/50 outline-none transition-all text-right"
                 />
              </div>
           </div>

           {/* Célula: Média Rápida */}
           <div className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex flex-col gap-1.5 min-w-0">
              <label className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">
                 <Zap size={10} className="text-sky-400" /> Média de Consumo
              </label>
              <div className="relative">
                 <input 
                   type="number"
                   value={clientData.averageConsumption ? Number(clientData.averageConsumption.toFixed(2)) : ''}
                   onChange={e => updateClientData({ averageConsumption: Number(e.target.value) })}
                   className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[11px] text-sky-400 font-mono font-black tracking-tight focus:border-sky-500/50 outline-none transition-all text-right tabular-nums"
                   placeholder="0"
                 />
                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-700 font-bold uppercase">kWh</span>
              </div>
           </div>

           {/* Célula: Expansão */}
           <div className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex flex-col gap-1.5 min-w-0 group">
              <div className="flex items-center justify-between gap-2">
                 <label className="flex items-center gap-2 text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">
                    <ArrowUpRight size={10} className="text-sky-500" /> Expansão
                 </label>
                 <span className="text-[10px] text-sky-500 font-mono">+{loadGrowthFactor}%</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1">
                 <input
                   type="range" min={0} max={50} step={5}
                   value={loadGrowthFactor}
                   onChange={e => setLoadGrowthFactor(Number(e.target.value))}
                   className="flex-1 accent-sky-500 h-1 bg-slate-900 rounded-full cursor-pointer transition-all focus:outline-none"
                 />
              </div>
           </div>
        </div>

        {/* 2. DASHBOARD UNIFICADO (Gráfico + Inventário de Cargas) */}
        <div className="flex-1 flex flex-col min-h-0 gap-3">
           <div className="flex items-center justify-between ml-1 relative shrink-0">
             <span className="text-[11px] text-slate-500 uppercase font-black tracking-widest leading-none flex items-center gap-2">
                <TrendingUp size={12} className="text-sky-500" /> Perfil de Consumo vs Projeção Mensal
             </span>
             <div className="flex items-center gap-3">
                {/* Removida label Variação Climática TMY Inclusa */}
             </div>
           </div>
           
           <div className="bg-slate-900 border border-slate-800 rounded-sm shadow-2xl overflow-hidden lg:flex-1 h-auto lg:min-h-0 flex flex-col">
              {/* ÁREA PRINCIPAL: GRÁFICO + SIDEBAR */}
              <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                 {/* LADO ESQUERDO: GRÁFICO (flex-1) */}
                 <div className="flex-1 min-h-[300px] lg:min-h-0 p-4 lg:p-6 flex flex-col">
                    <ConsumptionChart />
                 </div>
                 
                 {/* LADO DIREITO: INVENTÁRIO DE CARGAS (320px) */}
                 <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-slate-800/60 p-4 lg:p-5 flex flex-col overflow-hidden">
                    <SimulatedLoadsPanel 
                      compact 
                      projectionAvg={totalConsumptionAvg} 
                    />
                 </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
