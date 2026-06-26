import React from 'react';
import { Image } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ArrangementToolbar } from './ArrangementToolbar';

// =============================================================================
// DRAFTING ISLAND (D3 — Contextual Creation Island)
// =============================================================================
//
// Esta ilha vertical flutuante é dedicada a ferramentas de criação e edição.
// Renderiza dinamicamente baseada no modo de vista e no bloco focado.
// =============================================================================

export const DraftingIsland: React.FC = () => {
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);

  // Item 1: Nova lógica de renderização
  // CONTEXT → todas as ferramentas de arranjo (ArrangementToolbar)
  // DIAGRAM/UNIFILAR → botão de retorno ao arranjo
  if (canvasViewMode !== 'CONTEXT') {
    return (
      <div className="flex flex-col items-center py-2 gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl animate-in fade-in slide-in-from-top-4 duration-500 select-none w-11">
        <button
          onClick={() => setCanvasViewMode('CONTEXT')}
          title="Voltar ao Arranjo (1)"
          className="relative flex items-center justify-center w-8 h-8 rounded-[4px] text-slate-600 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-150 outline-none group"
        >
          <Image size={15} strokeWidth={2} />
          <span className="absolute -top-1 -right-1 text-[7px] font-bold px-1 rounded-full border border-slate-800 bg-slate-900 text-slate-700">1</span>
        </button>
      </div>
    );
  }

  // Em modo CONTEXT: renderizar todas as ferramentas de arranjo unificadas
  return (
    <div className="flex flex-col items-center py-4 px-1 gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl animate-in fade-in slide-in-from-top-4 duration-500 select-none w-11 overflow-y-auto custom-scrollbar max-h-[60vh]">
      <ArrangementToolbar />
      {/* Visual Pulse para indicar fim da zona de criação */}
      <div className="mt-2 w-4 h-px bg-slate-800/60" />
    </div>
  );
};
