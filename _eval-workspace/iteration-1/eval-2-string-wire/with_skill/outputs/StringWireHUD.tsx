// StringWireHUD.tsx — implementação com guia da skill arranjo-layer-dev
// HUD flutuante "String em formação" conforme spec Layer 1

import React from 'react';

interface StringWireHUDProps {
  moduleCount: number;
  maxModules: number;
  vocAccumulated: number;
  vocMax: number;
  vocStatus: 'ok' | 'warning' | 'error';
  onFinalize: () => void;
  onCancel: () => void;
}

const VOC_COLOR: Record<StringWireHUDProps['vocStatus'], string> = {
  ok:      'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-red-400',
};

const VOC_LABEL: Record<StringWireHUDProps['vocStatus'], string> = {
  ok:      '✅',
  warning: '⚠',
  error:   '🔴 Limite excedido',
};

export const StringWireHUD: React.FC<StringWireHUDProps> = ({
  moduleCount,
  maxModules,
  vocAccumulated,
  vocMax,
  vocStatus,
  onFinalize,
  onCancel,
}) => {
  const canFinalize = vocStatus !== 'error' && moduleCount >= 2;

  return (
    <div
      className="
        fixed top-4 right-4 z-[600]
        w-64
        bg-slate-900/95 backdrop-blur-sm
        border border-slate-700/60
        rounded-lg shadow-xl
        p-3
        font-mono
      "
    >
      {/* Header */}
      <div className="text-[10px] uppercase tracking-widest text-indigo-400 mb-2">
        String em formação
      </div>

      {/* Module count */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400 text-xs">Módulos</span>
        <span className="text-slate-200 text-xs font-semibold">
          {moduleCount}
          {maxModules > 0 && (
            <span className="text-slate-500"> / {maxModules} (lim. MPPT)</span>
          )}
        </span>
      </div>

      {/* Voc accumulated */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-400 text-xs">Voc acum.</span>
        <span className={`text-xs font-semibold ${VOC_COLOR[vocStatus]}`}>
          {vocAccumulated.toFixed(1)} V &nbsp;{VOC_LABEL[vocStatus]}
        </span>
      </div>

      {/* Voc max reference */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-[10px]">Limite inversor</span>
        <span className="text-slate-500 text-[10px]">{vocMax.toFixed(0)} V</span>
      </div>

      {/* Error message */}
      {vocStatus === 'error' && (
        <p className="text-red-400 text-[10px] mb-2 leading-tight">
          Voc excede o limite máximo do inversor. Reduza o número de módulos.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onFinalize}
          disabled={!canFinalize}
          className={`
            flex-1 py-1.5 rounded text-[11px] font-semibold transition-colors
            ${
              canFinalize
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          Finalizar String
        </button>
        <button
          onClick={onCancel}
          className="
            flex-1 py-1.5 rounded text-[11px] font-semibold
            bg-slate-700/60 hover:bg-slate-700 text-slate-300
            transition-colors
          "
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default StringWireHUD;
