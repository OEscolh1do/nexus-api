import React, { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSolarStore } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import { calcKWpAlvo } from '@/core/state/slices/journeySlice';
import { ConsumptionChart } from './consumption/ConsumptionChart';
import { ClimateCorrelationChart } from './consumption/ClimateCorrelationChart';
import { SimulatedLoadsPanel } from './consumption/SimulatedLoadsPanel';
import { TrendingUp, Zap, Sun, MapPin } from 'lucide-react';

const CONN_LABEL: Record<string, string> = {
  monofasico: 'Monofásico',
  bifasico: 'Bifásico',
  trifasico: 'Trifásico',
};

const GrowthFactorSection: React.FC = () => {
  const loadGrowthFactor = useSolarStore(s => s.loadGrowthFactor);
  const setLoadGrowthFactor = useSolarStore(s => s.setLoadGrowthFactor);

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-slate-900 rounded-sm border border-slate-800">
      <TrendingUp size={14} className="text-amber-400 shrink-0" />
      <span className="text-xs text-slate-400 w-40 shrink-0">
        Crescimento projetado
      </span>
      <input
        type="range"
        min={0}
        max={50}
        step={5}
        value={loadGrowthFactor}
        onChange={e => setLoadGrowthFactor(Number(e.target.value))}
        className="flex-1 accent-amber-500 h-1 cursor-pointer"
      />
      <span className="text-sm font-mono text-amber-400 w-10 text-right">
        {loadGrowthFactor}%
      </span>
    </div>
  );
};

export const ConsumptionCanvasView: React.FC<{ className?: string }> = ({ className }) => {
  // Store Reads
  const clientData = useSolarStore(s => s.clientData);
  const simulatedItems = useSolarStore(s => s.simulatedItems);
  const loadGrowthFactor = useSolarStore(s => s.loadGrowthFactor);
  const setKWpAlvo = useSolarStore(s => s.setKWpAlvo);
  const kWpAlvo = useSolarStore(s => s.kWpAlvo);
  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);

  // Derived Info for the Header & Calculations
  const averageConsumption = clientData?.averageConsumption ?? 0;
  const city = clientData?.city ?? '';
  const stateUF = clientData?.state ?? '';
  const connType = clientData?.connectionType ?? '';
  const tariff = clientData?.tariffRate ?? 0;
  const connLabel = CONN_LABEL[connType] ?? '';

  // Calculate complete monthly consumption (Base + Simulated)
  const totalConsumptionMonthly = useMemo(() => {
    // 1. Base consumption array
    const inv = clientData.invoices?.[0];
    const baseHistory = (inv?.monthlyHistory?.length === 12) 
      ? inv.monthlyHistory 
      : Array(12).fill(averageConsumption);

    // 2. Simulated consumption distribution
    const simulatedArray = Array(12).fill(0).map((_, i) => {
      return Object.values(simulatedItems.entities).reduce((sum, item) => {
        const duty = item.dutyCycle ?? 1;
        const kwh = ((item.power * duty * item.hoursPerDay * (item.daysPerMonth ?? 30) * item.qty) / 1000);
        
        const isConstante = !item.perfil || item.perfil === 'constante';
        const isVerao = item.perfil === 'verao' && [0, 1, 2, 9, 10, 11].includes(i);
        const isInverno = item.perfil === 'inverno' && [4, 5, 6, 7].includes(i);
        
        return sum + ((isConstante || isVerao || isInverno) ? kwh : 0);
      }, 0);
    });

    // 3. Combined array
    return baseHistory.map((val, i) => val + simulatedArray[i]);
  }, [clientData.invoices, averageConsumption, simulatedItems]);

  const totalConsumptionAvg = useMemo(() => {
    return totalConsumptionMonthly.reduce((a, b) => a + b, 0) / 12;
  }, [totalConsumptionMonthly]);

  // Recalculate Target kWp automatically
  useEffect(() => {
    const monthlyHsp = clientData.monthlyIrradiation ?? [];
    // Only calculate if we have consumption data
    if (totalConsumptionAvg > 0) {
      const result = calcKWpAlvo(totalConsumptionMonthly, monthlyHsp, loadGrowthFactor);
      setKWpAlvo(result);
    } else {
      setKWpAlvo(0); // Cannot size without consumption
    }
  }, [totalConsumptionMonthly, clientData.monthlyIrradiation, loadGrowthFactor, setKWpAlvo, totalConsumptionAvg]);

  return (
    <div className={cn('relative w-full h-full flex flex-col bg-slate-950 overflow-hidden', className)}>
      
      {/* ── CORPO PRINCIPAL SCROLLABLE ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0 bg-slate-950 p-6 gap-6 pb-24">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <h1 className="text-amber-400 text-xs font-mono flex items-center gap-2 font-bold uppercase tracking-widest">
            <Zap size={14} />
            Dimensionamento de Carga (Consumo)
            {(city || connLabel || tariff > 0) && (
              <span className="text-slate-500 text-[10px] font-sans font-normal flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2">
                {city && <><MapPin size={9} className="shrink-0" />{city}{stateUF ? `, ${stateUF}` : ''}</>}
                {connLabel && <> · {connLabel}</>}
                {tariff > 0 && <> · R$ {tariff.toFixed(2)}/kWh</>}
              </span>
            )}
          </h1>
          {/* Opcional: Adicionar Carga Rápida link/botão para scroll -> Painel C */}
          <button 
            onClick={() => document.getElementById('simulated-loads-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[10px] text-amber-500/70 hover:text-amber-400 font-bold uppercase tracking-wider"
          >
            [+ Adicionar Carga]
          </button>
        </div>

        {/* ── PAINEL A (Perfil) & PAINEL B (Clima) ──────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-none min-h-[340px]">
          
          {/* Seção 1 — Perfil (75%) */}
          <div className="xl:col-span-9 flex flex-col h-full min-h-[320px] xl:border-r border-slate-800/60 xl:pr-6">
            <ConsumptionChart />
          </div>

          {/* Seção 2 — Clima Correlation (25%) */}
          <div className="xl:col-span-3 bg-slate-900 border border-slate-800/80 rounded-sm p-4 flex flex-col h-full min-h-[320px]">
            <ClimateCorrelationChart />
          </div>

        </div>

        {/* ── PAINEL C (Cargas Simuladas) ───────────────────────────── */}
        <div id="simulated-loads-section" className="flex-none mt-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Cargas Simuladas</p>
          <SimulatedLoadsPanel />
        </div>

        {/* ── PAINEL D (Fator de Crescimento) ───────────────────────── */}
        <div className="flex-none mt-2 mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Fator de Crescimento</p>
          <GrowthFactorSection />
        </div>

      </div>

      {/* ── FAIXA DE RESULTADO (Sticky Bottom) ────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 pt-2 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 pb-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 rounded-sm border border-amber-500/20 shadow-2xl">
          {/* Resultado */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Potência Alvo (kWp)</p>
              <p className="text-2xl font-bold text-amber-400 font-mono italic tabular-nums">
                {kWpAlvo && kWpAlvo > 0 ? `${kWpAlvo.toFixed(2)}` : '—'}<span className="text-xs ml-1 not-italic opacity-60">kWp</span>
              </p>
            </div>
            <div className="border-l border-slate-800 pl-8">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Consumo Projetado</p>
              <p className="text-lg font-mono text-slate-200 tabular-nums">
                {Math.round(totalConsumptionAvg * (1 + loadGrowthFactor / 100))}<span className="text-[10px] ml-1 opacity-50">kWh/mês</span>
              </p>
            </div>
          </div>

          {/* CTA */}
          {kWpAlvo && kWpAlvo > 0 ? (
            <button
              onClick={() => setFocusedBlock('module')}
              className="flex items-center gap-2 px-6 py-3 bg-sky-600/10 hover:bg-sky-600/20 border border-sky-600/30 text-sky-400 font-bold uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-lg active:scale-95"
            >
              Selecionar Módulo
              <Sun size={14} />
            </button>
          ) : (
            <span className="text-[10px] text-slate-600 italic tracking-wider">Aguardando dados de consumo e HSP...</span>
          )}
        </div>
      </div>
    </div>
  );
};
