import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Box,
  Share2,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepperInput } from './components/StepperInput';
import { CompactNumberInput } from './components/CompactNumberInput';
import { MPPTConfig } from '../../../../store/useTechStore';

// ─────────────────────────────────────────────────────────────────────────────
// MPPT CONFIG STRIP (Dynamic Capacity Cockpit v2)
// Grid de configuração e telemetria industrial de alta precisão.
// ─────────────────────────────────────────────────────────────────────────────

interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
}

interface MPPTConfigStripProps {
  inverterId: string;
  mpptConfigs: MPPTConfig[];
  mpptMetrics: Record<number, MPPTMiniMetrics>;
  updateMPPT: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  limitVMax: number;
  limitVMpptMin: number;
  limitIscMaxMppt: number;
  inventoryStatus?: 'ok' | 'warning' | 'error';
  minModulesLimit?: number;
  maxModulesLimit?: number;
}

export const MPPTConfigStrip: React.FC<MPPTConfigStripProps> = ({
  inverterId,
  mpptConfigs,
  mpptMetrics,
  updateMPPT,
  limitVMax,
  limitVMpptMin,
  limitIscMaxMppt,
  inventoryStatus = 'ok',
  minModulesLimit,
  maxModulesLimit,
}) => {
  if (mpptConfigs.length === 0) return null;

  return (
    <div
      className="bg-slate-950 p-6 border-b border-slate-800 shrink-0"
      role="region"
      aria-label="Cockpit de MPPTs"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {mpptConfigs.map((mppt) => {
          const metrics = mpptMetrics[mppt.mpptId];
          const hasVoc  = metrics && metrics.vocFrio > 0;
          const vocErr  = hasVoc && metrics.vocFrio > limitVMax;
          const vmpErr  = hasVoc && metrics.vmpCalor > 0 && metrics.vmpCalor < limitVMpptMin;
          const iscErr  = hasVoc && metrics.iscTotal > limitIscMaxMppt;
          const hasMism = metrics?.hasMismatch;
          const sectionOk = hasVoc && !vocErr && !vmpErr && !iscErr && !hasMism;
          const isEmpty = !hasVoc;

          return (
            <div
              key={mppt.mpptId}
              id={`mppt-strip-${mppt.mpptId}`}
              className={cn(
                "flex flex-col bg-slate-900/40 border rounded-lg overflow-hidden transition-all duration-300 group hover:shadow-[0_0_20px_rgba(0,0,0,0.4)]",
                (vocErr || vmpErr || iscErr) 
                  ? "border-red-500/30 bg-red-500/[0.02] shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                  : hasMism 
                    ? "border-amber-500/30 bg-amber-500/[0.02]" 
                    : sectionOk 
                      ? "border-emerald-500/20 hover:border-emerald-500/40" 
                      : "border-slate-800"
              )}
            >
              {/* Micro-Header: Compact Title & Rendimento */}
              <div className={cn(
                "flex justify-between items-center px-3 py-1.5 border-b transition-colors",
                (vocErr || vmpErr || iscErr) ? "bg-red-500/10 border-red-500/20 text-red-400" :
                hasMism ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                sectionOk ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" :
                "bg-slate-800/40 border-slate-800 text-slate-500"
              )}>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                    <Cpu size={10} className={cn(!isEmpty && "text-current")} />
                    MPPT {mppt.mpptId}
                  </span>
                  {/* Status Indicator */}
                  {(vocErr || vmpErr || iscErr || hasMism) ? (
                    <AlertTriangle size={10} className="animate-pulse" />
                  ) : sectionOk ? (
                    <CheckCircle2 size={10} />
                  ) : null}
                </div>
                
                {/* Rendimento Integrado no Header */}
                {hasVoc && (
                  <span className={cn(
                    "text-[10px] font-mono font-black tabular-nums border px-1.5 py-0.5 rounded shadow-sm leading-none",
                    sectionOk ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/50" : 
                    "text-amber-400 border-amber-500/30 bg-amber-950/50"
                  )}>
                    {metrics.powerKwp.toFixed(2)} <span className="opacity-70 text-[8px]">kWp</span>
                  </span>
                )}
              </div>

              {/* Body: High-Density Input Grid */}
              <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                <StepperInput
                  label="Módulos"
                  icon={Box}
                  value={mppt.modulesPerString || 0}
                  min={0} max={maxModulesLimit ?? 40}
                  minRecommended={minModulesLimit}
                  maxRecommended={maxModulesLimit}
                  onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { modulesPerString: val })}
                  className={cn(inventoryStatus === 'error' && '[&_input]:text-red-400')}
                />
                <CompactNumberInput
                  label="Azimute"
                  value={mppt.azimuth || 180}
                  min={0} max={360}
                  onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { azimuth: val })}
                />
                <StepperInput
                  label="Strings"
                  icon={Share2}
                  value={mppt.stringsCount || 0}
                  min={0} max={10}
                  onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { stringsCount: val })}
                  className={cn(inventoryStatus === 'error' && '[&_input]:text-red-400')}
                />
                <CompactNumberInput
                  label="Inclinação"
                  value={mppt.inclination || 15}
                  min={0} max={90}
                  onCommit={(val) => updateMPPT(inverterId, mppt.mpptId, { inclination: val })}
                />
              </div>

              {/* Footer: Condensed Telemetry */}
              {hasVoc ? (
                <div className="mt-auto bg-slate-950/80 px-3 py-2.5 border-t border-slate-800/50 flex flex-col gap-2">
                  {/* Gauge 1: Voltage Window (Janela MPPT) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[8px] font-black tracking-widest text-slate-500 uppercase leading-none">
                      <span>Voc <span className={cn("font-mono", vocErr ? "text-red-400" : "text-slate-400")}>{metrics.vocFrio.toFixed(0)}V</span></span>
                      <span>Min <span className="font-mono text-slate-400">{limitVMpptMin}V</span> | Max <span className="font-mono text-slate-400">{limitVMax}V</span></span>
                    </div>
                    <div className="relative h-1.5 bg-slate-900 rounded-full border border-white/5 overflow-hidden">
                      {/* Vstart marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10" style={{ left: `${(limitVMpptMin / limitVMax) * 100}%` }} />
                      
                      {/* Thermal Range Bar */}
                      {metrics.vmpCalor > 0 && (
                        <div 
                          className={cn(
                            "absolute h-full transition-all duration-500 rounded-full", 
                            vocErr ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : "bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                          )}
                          style={{
                            left: `${Math.max(0, Math.min(100, (metrics.vmpCalor / limitVMax) * 100))}%`,
                            width: `${Math.max(2, Math.min(100, ((metrics.vocFrio - metrics.vmpCalor) / limitVMax) * 100))}%`
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Gauge 2: Current Load (Carga Isc) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[8px] font-black tracking-widest text-slate-500 uppercase leading-none">
                      <span>Isc <span className={cn("font-mono", iscErr ? "text-amber-400" : "text-slate-400")}>{metrics.iscTotal.toFixed(1)}A</span></span>
                      <span>Max <span className="font-mono text-slate-400">{limitIscMaxMppt}A</span></span>
                    </div>
                    <div className="relative h-1 bg-slate-900 rounded-full border border-white/5 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          iscErr ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "bg-emerald-500/60"
                        )}
                        style={{ width: `${Math.min(100, (metrics.iscTotal / limitIscMaxMppt) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto p-3 flex items-center justify-center gap-1.5 opacity-20 border-t border-dashed border-slate-800">
                  <Zap size={10} className="text-slate-500" />
                  <span className="text-[8px] font-black tracking-widest">VAZIO</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

