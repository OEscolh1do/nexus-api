import React from 'react';
import { Square } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton } from '../PhysicalCanvasView';
import { ArrangementToolbar } from './ArrangementToolbar';
import { ElectricalToolbar } from './ElectricalToolbar';

// =============================================================================
// DRAFTING ISLAND (D3 — Contextual Creation Island)
// =============================================================================
//
// Esta ilha vertical flutuante é dedicada a ferramentas de criação e edição.
// Renderiza dinamicamente baseada no modo de vista e no bloco focado.
// =============================================================================

export const DraftingIsland: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const activeFocusedBlock = useUIStore(s => s.activeFocusedBlock);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);

  // Mapeamento de quais ferramentas mostrar baseado na camada/modo
  const isSiteMode = canvasViewMode === 'CONTEXT';

  // Se não estiver em modo de edição (ex: Diagrama), pode-se optar por ocultar
  const isCreationMode = canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT';
  
  if (!isCreationMode) return null;

  return (
    <div className="flex flex-col items-center py-4 px-1 gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl animate-in fade-in slide-in-from-top-4 duration-500 select-none w-11 overflow-y-auto custom-scrollbar max-h-[60vh]">
      
      <div className="flex flex-col gap-4 items-center w-full">
        {/* Layer 0 / Site Tools se estiver em contexto */}
        {isSiteMode && (
          <div className="flex flex-col gap-1.5 items-center">
             <ToolbarButton 
                icon={Square} 
                label="Delimitar Área" 
                active={activeTool === 'POLYGON'} 
                onClick={() => setActiveTool('POLYGON')} 
                shortcut="P"
                className="w-8 h-8"
             />
          </div>
        )}

        {/* Camada de Arranjo */}
        {activeFocusedBlock === 'arrangement' && !isSiteMode && <ArrangementToolbar />}

        {/* Camadas Elétricas */}
        {(activeFocusedBlock === 'module' || activeFocusedBlock === 'inverter' || activeFocusedBlock === 'simulation') && !isSiteMode && (
          <ElectricalToolbar />
        )}
      </div>

      {/* Visual Pulse para indicar fim da zona de criação */}
      <div className="mt-2 w-4 h-px bg-slate-800/60" />
    </div>
  );
};
