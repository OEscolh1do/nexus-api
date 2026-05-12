import React from 'react';
import { Trash2, Zap, Settings2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StringDef } from '../../../../../store/useTechStore';
import { ENGINEERING_CONSTANTS } from '../../../../../constants/engineeringConstants';

// ─────────────────────────────────────────────────────────────────────────────
// STRING ROW — Diagrama Unifilar Interativo (Tier S)
// ─────────────────────────────────────────────────────────────────────────────

interface StringRowProps {
  str: StringDef;
  index: number;
  maxModules: number;
  minModules?: number;
  unitVoc?: number;
  unitVmp?: number;
  unitImp?: number;
  onUpdate: (data: Partial<StringDef>) => void;
  onRemove: (() => void) | undefined;
  onOpenProperties: () => void;
}

export const StringRow: React.FC<StringRowProps> = ({
  str,
  index,
  maxModules,
  minModules = 0,
  unitVoc,
  unitVmp = 0,
  unitImp = 0,
  onUpdate,
  onRemove,
  onOpenProperties,
}) => {
  const isEmpty = str.modulesCount === 0;

  // Cálculo da tensão desta string usando a base unitária (V/mod)
  const stringVoc = (unitVoc || 0) * str.modulesCount;
  
  // Cálculo de Queda de Tensão (Spec-04)
  const stringVmp = unitVmp * str.modulesCount;
  const dropV = (str.cableLength > 0 && str.cableSection > 0 && unitImp > 0)
    ? (2 * str.cableLength * unitImp) / (ENGINEERING_CONSTANTS.COPPER_CONDUCTIVITY * str.cableSection)
    : 0;
  const dropPercent = stringVmp > 0 ? (dropV / stringVmp) * 100 : 0;

  // O limite visual elástico (Zoom Out Dinâmico)
  // Garante que haja pelo menos o limite máximo + 2 blocos de folga,
  // ou a quantidade atual + 3 blocos de pista livre na frente.
  const elasticMax = Math.max(maxModules > 0 ? maxModules + 2 : 10, str.modulesCount + 3);

  const labelColor = isEmpty ? 'text-slate-600' : 'text-sky-400';

  return (
    <div className={cn(
      'group/row flex items-center h-[34px] px-2 rounded-md border transition-all duration-300 overflow-hidden relative',
      isEmpty
        ? 'border-slate-800/40 bg-slate-900/5 opacity-50'
        : 'border-slate-800 bg-slate-900/40 hover:border-sky-500/40 hover:bg-slate-900/60 shadow-lg'
    )}>
      {/* Glow lateral no hover */}
      {!isEmpty && <div className="absolute left-0 top-0 w-[2px] h-full bg-sky-500 opacity-0 group-hover/row:opacity-100 transition-opacity" />}
      
      {/* ── COL 1: ID ── */}
      <div 
        className={cn(
          'text-[10px] font-black font-mono tabular-nums shrink-0 w-7 sm:w-9 flex items-center gap-1',
          labelColor
        )}
        title="Identificador"
      >
        {!isEmpty && <Zap size={10} className="text-sky-400 shrink-0 hidden xl:block" />}
        <span>S{index + 1}</span>
      </div>

      {/* ── COL 2: Removida (Movida para Propriedades) ── */}

      {/* ── COL 3: Barra de Progresso Segmentada (Overdrive) ── */}
      <div className="flex-1 flex items-center h-[24px] mx-1 sm:mx-2 gap-2 min-w-[100px]">
        
        {/* Interactive Track Container */}
        <div className="relative flex-1 h-[20px] bg-slate-950/60 rounded-[3px] border border-slate-800/60 p-[1.5px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] flex gap-[1px] mt-0.5">
          
          {/* Blocos Individuais (Células de Energia) */}
          {Array.from({ length: elasticMax }).map((_, i) => {
            const isActive = i < str.modulesCount;
            const isOverdrive = i >= maxModules && maxModules > 0;
            const isMinMarker = i === minModules - 1 && minModules > 0;
            const isMaxMarker = i === maxModules && maxModules > 0;

            // Estado Eletro-visual (Neurodesign)
            const isUnderMinimum = str.modulesCount < minModules && str.modulesCount > 0;

            let activeColor = "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.4)]";
            if (isUnderMinimum) {
               activeColor = "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]";
            } else if (isOverdrive) {
               activeColor = "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]";
            }

            return (
              <div key={i} className="relative flex-1 h-full">
                {/* Bloco Renderizado */}
                <div 
                  className={cn(
                    "w-full h-full rounded-[1px] transition-all duration-200",
                    isActive ? activeColor : (isOverdrive ? "bg-red-950/30" : "bg-slate-800/40")
                  )}
                />
                
                {/* Marker Mínimo (Fronteira Esquerda do Bloco) */}
                {isMinMarker && (
                  <div 
                    className={cn(
                      "absolute top-[-4px] bottom-[-4px] left-[-1px] w-[2px] z-10 pointer-events-none transition-colors duration-300 shadow-[0_0_10px_rgba(0,0,0,0.8)]",
                      isUnderMinimum ? "bg-amber-400" : "bg-emerald-400"
                    )}
                    title="Mínimo para Start (Vmin)" 
                  />
                )}
                
                {/* Marker Máximo (Fronteira Esquerda do Bloco de Overdrive) */}
                {isMaxMarker && (
                  <div 
                    className="absolute top-[-4px] bottom-[-4px] left-[-1px] w-[2px] bg-red-500 z-10 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.8)]" 
                    title="Limite Máximo (Voc Max)" 
                  />
                )}
              </div>
            );
          })}

          {/* Native Range Input (Interação Transparente com limites expandidos) */}
          <input
            type="range"
            min={0}
            max={elasticMax}
            value={str.modulesCount}
            onChange={(e) => onUpdate({ modulesCount: parseInt(e.target.value) })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            title="Deslize para ajustar (permite overdrive)"
          />
        </div>

        {/* Display do Valor Exato + Controles Manuais Acoplados */}
        <div className="shrink-0 flex items-center justify-between bg-slate-900 border border-slate-800/60 rounded-[3px] overflow-hidden h-[22px] shadow-sm">
           <button 
             onClick={() => onUpdate({ modulesCount: Math.max(0, str.modulesCount - 1) })}
             className="w-5 h-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors active:bg-slate-700"
             title="Remover 1 Módulo"
           >
             <Minus size={10} strokeWidth={3} />
           </button>
           
           <div className="w-6 sm:w-7 flex flex-col items-center justify-center">
             <span className={cn(
               "text-[12px] sm:text-[13px] font-black font-mono tabular-nums leading-none tracking-tighter drop-shadow-md",
               str.modulesCount > maxModules ? "text-red-400" 
               : str.modulesCount < minModules && str.modulesCount > 0 ? "text-amber-400"
               : "text-white"
             )}>
               {str.modulesCount}
             </span>
           </div>

           <button 
             onClick={() => onUpdate({ modulesCount: str.modulesCount + 1 })}
             className="w-5 h-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors active:bg-slate-700"
             title="Adicionar 1 Módulo"
           >
             <Plus size={10} strokeWidth={3} />
           </button>
        </div>
      </div>

      {/* ── COL 4: Telemetria ── */}
      <div className="flex items-center shrink-0 w-[85px] sm:w-[90px] gap-1 justify-end">
        {!isEmpty && dropPercent > 0 && (
          <div 
            className={cn(
              "text-[9px] font-black font-mono px-1.5 py-0.5 rounded-[2px] border tabular-nums shadow-sm",
              dropPercent > 2 ? "bg-red-500/10 border-red-500/20 text-red-400" 
              : dropPercent > 1 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500/60"
            )}
          >
            Δ{dropPercent.toFixed(1)}%
          </div>
        )}

        <div 
          className={cn(
            "px-2 h-[22px] rounded-[3px] flex items-center border min-w-[50px] justify-center transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]",
            isEmpty ? "bg-slate-900/50 border-slate-800 text-slate-700" 
            : dropPercent > 2 ? "bg-red-950/40 border-red-500/40 text-red-400"
            : "bg-slate-950 border-emerald-500/30 text-emerald-400"
          )}
          title="Tensão de Operação"
        >
          <span className="text-[10px] font-mono font-black tabular-nums tracking-tighter">
            {stringVoc.toFixed(0)}<span className="text-[7px] ml-0.5 opacity-40">V</span>
          </span>
        </div>
      </div>

      {/* ── COL 5: Ações ── */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        <button
          onClick={onOpenProperties}
          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-[3px] transition-all active:scale-90"
          title="Propriedades da String"
        >
          <Settings2 size={11} />
        </button>

        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-[3px] transition-all active:scale-90"
            title="Remover"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
};
