import React from 'react';
import { Hand, Ruler } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton } from '../PhysicalCanvasView';

// =============================================================================
// NAVIGATION ISLAND (D3 — Viewport Exploration)
// =============================================================================
//
// Focada na exploração do mapa e ferramentas de leitura sem alteração de estado.
// =============================================================================

export const NavigationIsland: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);

  return (
    <div className="flex flex-col items-center py-2 gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl animate-in fade-in slide-in-from-left-4 duration-500 select-none w-11">
      <ToolbarButton 
        icon={Hand} 
        label="Mão (Pan)" 
        active={activeTool === 'PAN'} 
        onClick={() => setActiveTool('PAN')} 
        shortcut="H"
        className="w-8 h-8"
      />
      <ToolbarButton 
        icon={Ruler} 
        label="Medir (Régua)" 
        active={activeTool === 'MEASURE'} 
        onClick={() => setActiveTool('MEASURE')} 
        shortcut="M"
        className="w-8 h-8"
      />
    </div>
  );
};
