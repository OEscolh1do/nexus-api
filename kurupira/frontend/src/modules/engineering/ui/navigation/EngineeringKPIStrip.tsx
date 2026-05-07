import React from 'react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useTechKPIs } from '../../hooks/useTechKPIs';
import { useElectricalValidation } from '../../hooks/useElectricalValidation';
import { cn } from '@/lib/utils';
import { useProposalCalculator } from '@/modules/proposal/hooks/useProposalCalculator';

interface KPIItemProps {
  label: string;
  value: string | number;
  unit?: string;
  severity?: 'ok' | 'warning' | 'error' | 'neutral';
  tooltip?: string;
}

const KPIItem: React.FC<KPIItemProps> = ({ label, value, unit, severity = 'neutral', tooltip }) => {
  const colorClass = 
    severity === 'ok' ? 'text-emerald-400' :
    severity === 'warning' ? 'text-amber-400' :
    severity === 'error' ? 'text-rose-400' :
    'text-slate-400';

  const dotClass = 
    severity === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
    severity === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
    severity === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
    'bg-slate-700';

  return (
    <div className="flex flex-col justify-center px-4 border-r border-slate-800/60 last:border-0 group cursor-help transition-colors hover:bg-slate-900/40" title={tooltip}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={cn("text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors")}>
          {label}
        </span>
        <div className={cn("w-1 h-1 rounded-full", dotClass)} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-[13px] font-mono font-black tabular-nums leading-none", colorClass)}>
          {value}
        </span>
        {unit && <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{unit}</span>}
      </div>
    </div>
  );
};

export const EngineeringKPIStrip: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const modules = useSolarStore(selectModules);
  const inverters = useSolarStore(selectInverters);
  const { kpi } = useTechKPIs();
  const { globalHealth } = useElectricalValidation();
  const { financials, pricing } = useProposalCalculator();

  const totalKWp = (modules.reduce((acc, m) => acc + (m.power * (m.quantity || 1)), 0) / 1000);
  
  // FDI severity logic
  const fdiSeverity = kpi.dcAcRatio < 1.05 || kpi.dcAcRatio > 1.50 ? 'error' : 
                      kpi.dcAcRatio > 1.35 ? 'warning' : 'ok';

  if (compact) {
    return (
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-baseline gap-1" title="Potência Instalada">
          <span className="text-[11px] font-black text-slate-100 font-mono tabular-nums">
            {totalKWp.toFixed(1)}
          </span>
          <span className="text-[8px] font-bold text-slate-600 uppercase">kWp</span>
        </div>
        <div className="flex items-baseline gap-1" title="ROI Estimado">
           <span className="text-[11px] font-black text-indigo-400 font-mono tabular-nums">
            {financials.roi.toFixed(0)}
          </span>
          <span className="text-[8px] font-bold text-indigo-600 uppercase">%</span>
        </div>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          globalHealth === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
          globalHealth === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
        )} title="Status Elétrico" />
      </div>
    );
  }

  return (
    <div className="flex items-stretch h-11 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-hide select-none shrink-0">
      <KPIItem 
        label="Potência CC" 
        value={totalKWp.toFixed(2)} 
        unit="kWp" 
        severity={totalKWp > 0 ? 'ok' : 'neutral'}
        tooltip="Potência total instalada em Corrente Contínua"
      />
      
      <KPIItem 
        label="FDI (DC/AC)" 
        value={(kpi.dcAcRatio * 100).toFixed(1)} 
        unit="%" 
        severity={modules.length > 0 && inverters.length > 0 ? fdiSeverity : 'neutral'}
        tooltip="Fator de Dimensionamento do Inversor (Ideal: 110-135%)"
      />

      <KPIItem 
        label="Geração Est." 
        value={kpi.estimatedGeneration.toFixed(0)} 
        unit="kWh" 
        severity={kpi.estimatedGeneration > 0 ? 'ok' : 'neutral'}
        tooltip="Geração média mensal estimada baseada no TMY e PR"
      />

      <KPIItem 
        label="Status" 
        value={globalHealth === 'error' ? 'FALHA' : globalHealth === 'warning' ? 'AVISO' : 'OK'} 
        severity={globalHealth === 'warning' ? 'warning' : globalHealth === 'error' ? 'error' : 'ok'}
        tooltip="Saúde geral das conexões e limites de tensão/corrente"
      />

      <div className="flex-1 min-w-[20px]" />

      {/* Commercial Data - Standardized formatting */}
      <KPIItem 
        label="Investimento" 
        value={pricing.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
        unit="R$" 
        severity="neutral"
        tooltip="Valor total do sistema para o cliente final"
      />

      <KPIItem 
        label="Payback" 
        value={financials.paybackYears.toFixed(1)} 
        unit="ANOS" 
        severity={financials.paybackYears < 5 ? 'ok' : 'neutral'}
        tooltip="Tempo estimado de retorno do investimento"
      />

      <div className="flex items-center px-6 bg-indigo-500/5 border-l border-slate-800 transition-colors hover:bg-indigo-500/10">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-indigo-500/60 uppercase tracking-[0.2em] leading-none mb-1">ROI Est.</span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-indigo-400 font-mono tabular-nums leading-none">
              {financials.roi.toFixed(1)}
            </span>
            <span className="text-[9px] font-bold text-indigo-600 uppercase">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
