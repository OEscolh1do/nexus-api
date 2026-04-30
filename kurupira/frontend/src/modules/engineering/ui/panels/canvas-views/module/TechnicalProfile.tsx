import React, { useState } from 'react';
import { ChevronDown, ShieldAlert, Sun, Zap, Activity, Component } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ModuleSpecs } from '@/core/schemas/equipment.schemas';
import { TechnicalDiagram } from './TechnicalDiagram';
import { type SystemValidationReport } from '@/modules/engineering/utils/electricalMath';
import { type InverterState } from '../../../../store/useTechStore';

interface TechnicalProfileProps {
  module?: ModuleSpecs;
  quantity?: number;
  electricalReport?: SystemValidationReport | null;
  activeInverter?: InverterState | null;
}

export const TechnicalProfile: React.FC<TechnicalProfileProps> = ({ module, quantity, electricalReport, activeInverter }) => {
  const [showStringCompat, setShowStringCompat] = useState(true);

  if (!module || quantity === undefined) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950/40 text-center animate-in fade-in duration-300">
        <div className="w-24 h-24 mb-4 rounded-full border border-dashed border-slate-800 flex items-center justify-center bg-slate-900/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <Component size={40} className="text-slate-700" strokeWidth={1} />
        </div>
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
          Perfil Técnico
        </span>
        <span className="text-[10px] text-slate-600 mt-2 max-w-[200px]">
          Selecione um arranjo no painel superior para visualizar a curva I-V e dados elétricos.
        </span>
      </div>
    );
  }

  const efficiency = ((module.vmp * module.imp) / module.power) * 100; // Approximated from available data
  const totalArea = quantity * (module.area || 2.5);

  // NBR 16690 calculations
  const T_min = 10;
  const T_amb_max = 40;
  const NOCT = 45;
  const tempCoeffVoc = module.tempCoeff || -0.30;
  const tempCoeffPmax = module.tempCoeff || -0.30;
  const vocMaxUnit = module.voc * (1 + (tempCoeffVoc / 100) * (T_min - 25));
  const t_celula_max = T_amb_max + NOCT - 20;
  const vmpMinUnit = module.vmp * (1 + (tempCoeffPmax / 100) * (t_celula_max - 25));
  const nMax600 = Math.floor(600 * 0.95 / vocMaxUnit);
  const nMax1000 = Math.floor(1000 * 0.95 / vocMaxUnit);
  const nMin = Math.ceil(100 / vmpMinUnit);

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar bg-slate-950/40 @container animate-in fade-in slide-in-from-right-2 duration-300">

      {/* Header — Power Badge + Tech */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-sm">
              <Sun size={12} className="text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{module.manufacturer}</span>
              <span className="text-[9px] text-slate-500 font-mono truncate max-w-[180px]">{module.model}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-mono font-black text-amber-400 tabular-nums leading-none">{module.power}</span>
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Wp</span>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-1.5 bg-slate-950/50 border border-slate-800/50 rounded-sm">
            <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-0.5">Eficiência</span>
            <span className="text-[11px] font-mono font-bold text-emerald-400 tabular-nums">
              {efficiency > 0 && efficiency < 100 ? efficiency.toFixed(1) : '—'}%
            </span>
          </div>
          <div className="flex flex-col items-center p-1.5 bg-slate-950/50 border border-slate-800/50 rounded-sm">
            <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-0.5">Módulos</span>
            <span className="text-[11px] font-mono font-bold text-slate-200 tabular-nums">{quantity}</span>
          </div>
          <div className="flex flex-col items-center p-1.5 bg-slate-950/50 border border-slate-800/50 rounded-sm">
            <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-0.5">Área</span>
            <span className="text-[11px] font-mono font-bold text-slate-400 tabular-nums">{totalArea.toFixed(1)}m²</span>
          </div>
        </div>
      </div>

      {/* I-V Curve */}
      <div className="p-4 border-b border-slate-800">
        <TechnicalDiagram voc={module.voc} isc={module.isc} vmp={module.vmp} imp={module.imp} />
      </div>

      {/* Electrical Specs Grid */}
      <div className="p-4 border-b border-slate-800">
        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Zap size={9} className="text-amber-500/60" /> Parâmetros Elétricos (STC)
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          <SpecItem label="Vmp" value={`${module.vmp.toFixed(1)} V`} />
          <SpecItem label="Imp" value={`${module.imp.toFixed(2)} A`} />
          <SpecItem label="Voc" value={`${module.voc.toFixed(1)} V`} />
          <SpecItem label="Isc" value={`${module.isc.toFixed(2)} A`} />
          <SpecItem label="Fill Factor" value={`${((module.vmp * module.imp) / (module.voc * module.isc) * 100).toFixed(1)}%`} />
          <SpecItem label="Coef. Temp" value={`${tempCoeffVoc}%/°C`} />
        </div>
      </div>

      {/* Thermal Corrections */}
      <div className="p-4 border-b border-slate-800">
        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Activity size={9} className="text-rose-500/60" /> Correções Térmicas
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          <SpecItem label="Voc Máx (10°C)" value={`${vocMaxUnit.toFixed(1)} V`} accent="rose" />
          <SpecItem label="Vmp Mín (65°C)" value={`${vmpMinUnit.toFixed(1)} V`} accent="amber" />
          <SpecItem label="Isc × 1.25" value={`${(module.isc * 1.25).toFixed(2)} A`} />
        </div>
      </div>

      {/* String Compatibility — Collapsible */}
      <div className="p-4">
        <button
          onClick={() => setShowStringCompat(!showStringCompat)}
          className="w-full flex items-center justify-between mb-2"
        >
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={9} className="text-emerald-500/60" /> Compatibilidade de String
          </span>
          <ChevronDown size={12} className={cn("text-slate-600 transition-transform", showStringCompat && "rotate-180")} />
        </button>
        {showStringCompat && (
          <div className="grid grid-cols-2 gap-2 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="bg-slate-950 p-2.5 border border-slate-800/50 flex flex-col items-center">
              <span className="text-[7px] text-slate-600 uppercase font-black mb-1">Inversor 600V</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">{nMin} a {nMax600}</span>
              <span className="text-[7px] text-slate-700 mt-0.5">módulos em série</span>
            </div>
            <div className="bg-slate-950 p-2.5 border border-slate-800/50 flex flex-col items-center">
              <span className="text-[7px] text-slate-600 uppercase font-black mb-1">Inversor 1000V</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">{nMin} a {nMax1000}</span>
              <span className="text-[7px] text-slate-700 mt-0.5">módulos em série</span>
            </div>
          </div>
        )}
      </div>

      {/* CROSS-CONTEXT FEEDBACK: Inverter Compatibility */}
      {activeInverter && (
        <div className="p-4 bg-slate-950/60 border-t-2 border-slate-800 relative overflow-hidden">
          {/* Subtle glow effect based on status */}
          <div className={cn(
            "absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 blur-xl",
            electricalReport?.globalStatus === 'error' ? 'bg-rose-500' :
            electricalReport?.globalStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
          )} />
          
          <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Zap size={9} className={cn(
               electricalReport?.globalStatus === 'error' ? 'text-rose-500' :
               electricalReport?.globalStatus === 'warning' ? 'text-amber-500' : 'text-emerald-500'
            )} /> 
            Compatibilidade com Inversor
          </span>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold truncate max-w-[150px]">{activeInverter.snapshot.model}</span>
              <span className={cn(
                "text-[8px] font-black uppercase px-2 py-0.5 rounded-sm",
                electricalReport?.globalStatus === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                electricalReport?.globalStatus === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              )}>
                {electricalReport?.globalStatus === 'error' ? 'Incompatível' :
                 electricalReport?.globalStatus === 'warning' ? 'Revisar' : 'Compatível'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex flex-col p-2 bg-slate-900/50 border border-slate-800/40 rounded-sm">
                <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Corrente MPPT</span>
                <div className="flex items-baseline justify-between">
                  <span className={cn("text-[10px] font-mono font-bold", ((module.isc * 1.25) > activeInverter.snapshot.maxCurrentPerMPPT) ? 'text-rose-400' : 'text-slate-300')}>
                    {(module.isc * 1.25).toFixed(1)}A
                  </span>
                  <span className="text-[8px] text-slate-600 font-bold">/ {activeInverter.snapshot.maxCurrentPerMPPT}A</span>
                </div>
              </div>
              <div className="flex flex-col p-2 bg-slate-900/50 border border-slate-800/40 rounded-sm">
                <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Tensão MPPT Máx</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {activeInverter.snapshot.maxInputVoltage}V
                  </span>
                </div>
              </div>
            </div>

            {/* Electrical Alerts specific to module mismatch */}
            {electricalReport?.globalStatus !== 'ok' && (
              <div className="mt-1 p-2 bg-slate-900/50 border-l-2 border-amber-500/50 text-[9px] text-slate-400">
                Verifique a aba <strong>Elétrica</strong> para ver o detalhamento dos alertas de tensão e corrente nas strings.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SPEC ITEM — Micro component for consistent spec display
// =============================================================================

const SpecItem: React.FC<{ label: string; value: string; accent?: 'rose' | 'amber' | 'emerald' }> = ({ label, value, accent }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[7px] text-slate-600 uppercase font-bold tracking-wider">{label}</span>
    <span className={cn(
      "text-[11px] font-mono font-bold tabular-nums",
      accent === 'rose' ? 'text-rose-300/90' :
      accent === 'amber' ? 'text-amber-300/90' :
      accent === 'emerald' ? 'text-emerald-400' :
      'text-slate-200'
    )}>
      {value}
    </span>
  </div>
);
