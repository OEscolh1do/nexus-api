import React from 'react';
import { Trash2, Settings2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StringDef } from '../../../../../store/useTechStore';
import { ENGINEERING_CONSTANTS } from '../../../../../constants/engineeringConstants';

// ─────────────────────────────────────────────────────────────────────────────
// STRING ROW v2 — Two-Line Layout (S + A + B)
//
// Anatomia:
//  Line 1: [S1]  [══════════ barra segmentada + overlay 384V ══░░] [🗑]
//  Line 2:  ↳    [-] [12] [+]   Δ0.8%                              [⚙]
//
// Decisão de design:
//  - Bar-First (S): barra ocupa flex-1 em 165px — leitura pré-atentiva
//  - Two-Line (A):  separa output (L1) de controles (L2) — ISA-101
//  - Sem coluna fixa de tensão: overlay absoluto economiza 85-90px
// ─────────────────────────────────────────────────────────────────────────────

interface StringRowProps {
  str: StringDef;
  index: number;
  maxModules: number;
  minModules?: number;
  mpptAzimuth?: number;
  mpptInclination?: number;
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
  mpptAzimuth,
  mpptInclination,
  unitVoc,
  unitVmp = 0,
  unitImp = 0,
  onUpdate,
  onRemove,
  onOpenProperties,
}) => {
  const isEmpty = str.modulesCount === 0;

  // Tensão desta string (V)
  const stringVoc = (unitVoc || 0) * str.modulesCount;

  // Queda de tensão no cabo (Spec-04)
  const stringVmp = unitVmp * str.modulesCount;
  const dropV = (str.cableLength > 0 && str.cableSection > 0 && unitImp > 0)
    ? (2 * str.cableLength * unitImp) / (ENGINEERING_CONSTANTS.COPPER_CONDUCTIVITY * str.cableSection)
    : 0;
  const dropPercent = stringVmp > 0 ? (dropV / stringVmp) * 100 : 0;

  // Limite visual elástico — garante folga além do máximo
  const elasticMax = Math.max(maxModules > 0 ? maxModules + 2 : 10, str.modulesCount + 3);

  // Estado de violação
  const isUnderMinimum = str.modulesCount < minModules && str.modulesCount > 0;
  const isOverMax      = str.modulesCount > maxModules && maxModules > 0;

  // Cor do contador
  const countColor = isOverMax
    ? 'text-red-400'
    : isUnderMinimum
    ? 'text-amber-400'
    : 'text-white';

  const hasCustomOrientation = 
    (str.azimuth !== undefined && str.azimuth !== mpptAzimuth) || 
    (str.inclination !== undefined && str.inclination !== mpptInclination);

  return (
    <div
      className={cn(
        'group/row flex flex-col rounded-md border transition-all duration-200 px-1 py-1 gap-[2px]',
        isEmpty
          ? 'border-slate-800/30 bg-transparent opacity-40'
          : 'border-slate-800/70 bg-slate-900/30 hover:border-sky-500/30 hover:bg-slate-900/50'
      )}
    >
      {/* ── ROW 1: ID · Barra Elástica · Delete ─────────── */}
      <div className="flex items-center gap-1.5 h-[20px]">
        {/* 1. ID */}
        <span
          className={cn(
            'text-[10px] font-black font-mono tabular-nums shrink-0 w-4 text-center leading-none',
            isEmpty ? 'text-slate-600' : 'text-sky-400'
          )}
          title="Identificador da String"
        >
          S{index + 1}
        </span>

        {/* 2. Barra Segmentada (flex-1) */}
        <div className="relative flex-1 h-[18px] bg-slate-950/60 rounded-[3px] border border-slate-800/60 p-[1.5px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] flex gap-[1px] overflow-hidden">
          {Array.from({ length: elasticMax }).map((_, i) => {
            const isActive    = i < str.modulesCount;
            const isOverdrive = i >= maxModules && maxModules > 0;
            const isMinMarker = i === minModules - 1 && minModules > 0;
            const isMaxMarker = i === maxModules && maxModules > 0;

            let activeColor = 'bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.4)]';
            if (isUnderMinimum && isActive) {
              activeColor = 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]';
            } else if (isOverdrive && isActive) {
              activeColor = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]';
            }

            return (
              <div key={i} className="relative flex-1 h-full">
                <div className={cn('w-full h-full rounded-[1px] transition-all duration-150', isActive ? activeColor : (isOverdrive ? 'bg-red-950/30' : 'bg-slate-800/40'))} />
                {isMinMarker && <div className={cn('absolute top-[-3px] bottom-[-3px] left-[-1px] w-[2px] z-10', isUnderMinimum ? 'bg-amber-400' : 'bg-emerald-400')} title="Vmin" />}
                {isMaxMarker && <div className="absolute top-[-3px] bottom-[-3px] left-[-1px] w-[2px] bg-red-500 z-10" title="Voc Max" />}
              </div>
            );
          })}

          <input
            type="range"
            min={0}
            max={elasticMax}
            value={str.modulesCount}
            onChange={(e) => onUpdate({ modulesCount: parseInt(e.target.value) })}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />

          {!isEmpty && (
            <div className="absolute right-2 inset-y-0 flex items-center pointer-events-none z-10">
              {unitVoc && unitVoc > 0 ? (
                <span className="text-[10px] font-black font-mono tabular-nums text-white drop-shadow-[0_0_4px_rgba(0,0,0,1)] leading-none tracking-tight">
                  {stringVoc.toFixed(0)}<span className="text-[7.5px] opacity-70 ml-[1px]">V</span>
                </span>
              ) : (
                <span className="text-[10px] font-black font-mono text-slate-400 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)] leading-none tracking-tight">
                  ---V
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Delete */}
        <div className="w-5 shrink-0 flex items-center justify-center">
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-0.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-[3px] transition-all active:scale-90"
              title="Remover String"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* ── ROW 2: Stepper · Alertas · Settings ─────────── */}
      <div className="flex items-center gap-1.5 pl-[22px] h-[20px]">
        {/* 4. Stepper */}
        <div className={cn(
          "shrink-0 flex items-center border rounded-[3px] overflow-hidden h-[18px] shadow-sm transition-all",
          isEmpty ? "bg-slate-950/50 border-slate-800/30 opacity-70 hover:opacity-100" : "bg-slate-900 border-slate-800/60"
        )}>
          <button
            onClick={() => onUpdate({ modulesCount: Math.max(0, str.modulesCount - 1) })}
            className={cn(
              "w-6 h-full flex items-center justify-center transition-colors",
              isEmpty ? "text-slate-700 cursor-not-allowed" : "text-slate-500 hover:text-white hover:bg-slate-800 active:bg-slate-700"
            )}
            disabled={isEmpty}
            title="Remover 1 Módulo"
          >
            <Minus size={9} strokeWidth={3} />
          </button>
          <div className="w-7 flex items-center justify-center">
            <span className={cn(
              'text-[11px] font-black font-mono tabular-nums leading-none tracking-tighter',
              countColor
            )}>
              {str.modulesCount}
            </span>
          </div>
          <button
            onClick={() => onUpdate({ modulesCount: str.modulesCount + 1 })}
            className="w-6 h-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors active:bg-slate-700"
            title="Adicionar 1 Módulo"
          >
            <Plus size={9} strokeWidth={3} />
          </button>
        </div>

        {/* 5. Alertas */}
        {!isEmpty && (
          <>
            {(!unitImp || unitImp === 0) && str.cableLength > 0 ? (
              <span className="text-[8px] font-black font-mono text-slate-600/50 cursor-help" title="Faltam dados para queda">Δ--%</span>
            ) : dropPercent > 0 ? (
              <span
                className={cn('text-[8px] font-black font-mono tabular-nums cursor-help', dropPercent > 2 ? 'text-red-400' : dropPercent > 1 ? 'text-amber-400' : 'text-slate-600')}
                title={`Queda de tensão: ${dropPercent.toFixed(1)}%`}
              >
                Δ{dropPercent.toFixed(1)}%
              </span>
            ) : null}

            {hasCustomOrientation && (
              <div className="flex items-center justify-center bg-amber-500/10 px-1 py-[1px] rounded text-amber-400 cursor-help ml-1" title="Orientação Divergente">
                <span className="text-[7px] font-black uppercase tracking-widest">Desalinhada</span>
              </div>
            )}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* 6. Settings */}
        <button
          onClick={onOpenProperties}
          className={cn("p-0.5 rounded-[3px] transition-all mr-[3px]", isEmpty ? "text-slate-700 hover:text-slate-400 hover:bg-slate-800/40" : "text-slate-500 hover:text-sky-400 hover:bg-sky-500/10")}
          title="Propriedades da String"
        >
          <Settings2 size={10} />
        </button>
      </div>
    </div>
  );
};
