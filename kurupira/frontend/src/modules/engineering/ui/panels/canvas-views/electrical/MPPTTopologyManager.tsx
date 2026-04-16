import React from 'react';
import { CompactNumberInput } from './components/CompactNumberInput';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MPPTConfig } from '../../../../store/useTechStore';

interface MPPTTopologyManagerProps {
  inverterId: string;
  mpptConfig: MPPTConfig;
  updateMPPT: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  // Resultados Locais (Mini-laudo)
  vocCalculado: number;
  iscCalculado: number;
  potenciaMppt: number;
  // Limites
  vMaxInversor: number;
  iscMaxMppt: number;
}

export const MPPTTopologyManager: React.FC<MPPTTopologyManagerProps> = ({
  inverterId,
  mpptConfig,
  updateMPPT,
  vocCalculado,
  iscCalculado,
  potenciaMppt,
  vMaxInversor,
  iscMaxMppt,
}) => {
  const isVocError = vocCalculado > vMaxInversor;
  const isIscError = iscCalculado > iscMaxMppt;
  const mpptValid = !isVocError && !isIscError;

  return (
    <div 
      id={`mppt-${mpptConfig.mpptId}`}
      className="bg-slate-900 rounded-lg border border-slate-800 p-4 relative overflow-hidden flex flex-col gap-4"
    >
      {/* Header do MPPT */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
         <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-widest uppercase">
           MPPT {mpptConfig.mpptId}
         </span>
         <div className="flex items-center gap-1.5">
           {mpptValid ? (
             <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
               <CheckCircle2 size={10} /> Validado
             </span>
           ) : (
             <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
               <ShieldAlert size={10} /> Restrições
             </span>
           )}
         </div>
      </div>

      {/* Controles de Input com Debounce nativo do componente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CompactNumberInput 
          label="Mods/String" 
          value={mpptConfig.modulesPerString || 0} 
          min={0} max={40} 
          onCommit={(val) => updateMPPT(inverterId, mpptConfig.mpptId, { modulesPerString: val })} 
        />
        <CompactNumberInput 
          label="Qtd Strings" 
          value={mpptConfig.stringsCount || 0} 
          min={0} max={10} 
          onCommit={(val) => updateMPPT(inverterId, mpptConfig.mpptId, { stringsCount: val })} 
        />
        <CompactNumberInput 
          label="Azimute (°)" 
          value={mpptConfig.azimuth || 180} 
          min={0} max={360} 
          onCommit={(val) => updateMPPT(inverterId, mpptConfig.mpptId, { azimuth: val })} 
        />
        <CompactNumberInput 
          label="Inclin. (°)" 
          value={mpptConfig.inclination || 15} 
          min={0} max={90} 
          onCommit={(val) => updateMPPT(inverterId, mpptConfig.mpptId, { inclination: val })} 
        />
      </div>

      {/* Visualizador de Strings */}
      <div className="bg-slate-950 border border-slate-800/50 rounded flex flex-col gap-1 p-3">
        {mpptConfig.stringsCount > 0 ? (
           Array.from({ length: mpptConfig.stringsCount }).map((_, i) => (
             <div key={i} className="flex items-center gap-2">
               <span className="text-[10px] text-slate-500 uppercase tracking-widest min-w-10">Str {i+1}</span>
               <div className="flex gap-0.5 flex-wrap flex-1">
                 {Array.from({ length: mpptConfig.modulesPerString }).map((_, m) => (
                   <div key={m} className="w-1.5 h-3 bg-sky-500/80 rounded-[1px]" />
                 ))}
               </div>
               <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {mpptConfig.modulesPerString} mod
               </span>
             </div>
           ))
        ) : (
          <div className="text-[9px] text-slate-600 uppercase tracking-widest text-center py-2">
             Configure para visualizar topologia
          </div>
        )}
      </div>

      {/* Mini-Laudo do MPPT */}
      <div className="flex gap-4 text-[11px] font-mono mt-1 pt-3 border-t border-slate-800">
         <span className={cn('flex flex-col', isVocError ? 'text-red-400' : 'text-slate-400')}>
           <span className="text-[8px] uppercase tracking-widest text-slate-500">Voc (Tmin)</span>
           <span>{vocCalculado.toFixed(1)}V</span>
         </span>
         <span className={cn('flex flex-col border-l border-slate-800 pl-4', isIscError ? 'text-red-400' : 'text-slate-400')}>
           <span className="text-[8px] uppercase tracking-widest text-slate-500">Isc Máx</span>
           <span>{iscCalculado.toFixed(1)}A</span>
         </span>
         <span className="flex flex-col border-l border-slate-800 pl-4 text-slate-300">
           <span className="text-[8px] uppercase tracking-widest text-slate-500">Potência DC</span>
           <span>{potenciaMppt.toFixed(2)} kWp</span>
         </span>
      </div>
    </div>
  );
};
