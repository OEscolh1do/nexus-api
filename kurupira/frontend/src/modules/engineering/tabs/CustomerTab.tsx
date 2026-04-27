import React from 'react';
import { SiteCanvasView } from '../ui/panels/canvas-views/SiteCanvasView';

interface Props {
  onConfirm?: () => void;
}

/**
 * CustomerTab — wrapper sobre SiteCanvasView para uso em modais.
 * O InputForm legado foi removido na migração para o Kurupira.
 * SiteCanvasView gerencia todos os dados do cliente diretamente no store.
 */
export const CustomerTab: React.FC<Props> = ({ onConfirm }) => {
  return (
    <div className="flex flex-col">
      <div className="h-[560px]">
        <SiteCanvasView />
      </div>

      {onConfirm && (
        <div className="shrink-0 px-4 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest rounded-sm transition-all active:scale-95 shadow-lg"
          >
            Confirmar Localização
          </button>
        </div>
      )}
    </div>
  );
};
