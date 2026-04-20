import React from 'react';
import { Eye } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton } from '../PhysicalCanvasView';

// =============================================================================
// VISION ISLAND (D3 — Visual Debug & Telemetry)
// =============================================================================
//
// Utilitários de visualização e diagnósticos da cena técnica.
// =============================================================================

export const VisionIsland: React.FC = () => {
  const isAnatomyPanelOpen = useUIStore(s => s.isAnatomyPanelOpen);
  const toggleAnatomyPanel = useUIStore(s => s.toggleAnatomyPanel);

  return (
    <div className="flex flex-col items-center py-2 gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48_rgba(0,0,0,0.6)] rounded-xl animate-in fade-in slide-in-from-left-4 duration-700 select-none w-11">
      <ToolbarButton 
         icon={Eye} 
         label="Anatomia do Suporte" 
         active={isAnatomyPanelOpen} 
         onClick={toggleAnatomyPanel} 
         className="w-8 h-8"
      />
    </div>
  );
};
