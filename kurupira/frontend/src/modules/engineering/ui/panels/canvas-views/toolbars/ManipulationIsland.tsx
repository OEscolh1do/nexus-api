import React from 'react';
import { MousePointer2, Grab } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton } from '../PhysicalCanvasView';

// =============================================================================
// MANIPULATION ISLAND (D3 — Object Control)
// =============================================================================
//
// Focada estritamente na seleção e transformação de entidades no canvas.
// =============================================================================

export const ManipulationIsland: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);

  const isSelectActive = activeTool === 'SELECT';
  const isMoveActive = activeTool === 'MOVE';

  const manipulationTools = [
    {
      id: 'select',
      icon: MousePointer2,
      label: 'Selecionar',
      active: isSelectActive,
      onClick: () => setActiveTool('SELECT'),
      shortcut: 'S'
    },
    {
      id: 'move',
      icon: Grab,
      label: 'Mover / Transformar',
      active: isMoveActive,
      onClick: () => setActiveTool('MOVE'),
      shortcut: 'G'
    }
  ];

  // O ícone principal reflete a ferramenta ativa do grupo
  const activeToolConfig = manipulationTools.find(t => t.active) || manipulationTools[0];

  return (
    <div className="flex flex-col items-center py-2 gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl animate-in fade-in slide-in-from-left-4 duration-300 select-none w-11">
      <ToolbarButton 
        icon={activeToolConfig.icon} 
        label={activeToolConfig.label} 
        active={isSelectActive || isMoveActive} 
        onClick={activeToolConfig.onClick} 
        shortcut={activeToolConfig.shortcut}
        subTools={manipulationTools}
        className="w-8 h-8"
      />
    </div>
  );
};
