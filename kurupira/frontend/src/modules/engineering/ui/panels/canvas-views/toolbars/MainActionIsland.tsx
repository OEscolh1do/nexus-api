import { 
  MousePointer2, 
  Hand, 
  Ruler, 
  Grab,
  Eye,
  Compass
} from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton } from '../PhysicalCanvasView';

// =============================================================================
// MAIN ACTION ISLAND (D3 — Core Navigation Island)
// =============================================================================
//
// Esta ilha vertical flutuante é o núcleo de navegação universal.
// Contém ferramentas que atravessam todas as camadas do projeto.
// =============================================================================

export const MainActionIsland: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const isAnatomyPanelOpen = useUIStore(s => s.isAnatomyPanelOpen);
  const toggleAnatomyPanel = useUIStore(s => s.toggleAnatomyPanel);

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center py-4 gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_12px_48px_rgba(0,0,0,0.6)] rounded-xl z-[1100] animate-in fade-in slide-in-from-left-4 duration-300 select-none w-11">
      
      {/* ── SEÇÃO 1: NAVEGAÇÃO UNIVERSAL (S, H, G, M) ── */}
      <div className="flex flex-col gap-1.5 items-center">
        <ToolbarButton 
          icon={MousePointer2} 
          label="Selecionar" 
          active={activeTool === 'SELECT'} 
          onClick={() => setActiveTool('SELECT')} 
          shortcut="S"
          className="w-8 h-8"
        />
        <ToolbarButton 
          icon={Hand} 
          label="Mão (Pan)" 
          active={activeTool === 'PAN'} 
          onClick={() => setActiveTool('PAN')} 
          shortcut="H"
          className="w-8 h-8"
        />
        <ToolbarButton 
          icon={Grab} 
          label="Mover / Transformar" 
          active={activeTool === 'MOVE'} 
          onClick={() => setActiveTool('MOVE')} 
          shortcut="G"
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

      <div className="w-6 h-px bg-slate-800/60 shrink-0" />

      {/* ── SEÇÃO 3: UTILITÁRIOS GLOBAIS ── */}
      <div className="flex flex-col gap-2 items-center">
        <ToolbarButton 
           icon={Eye} 
           label="Anatomia do Suporte" 
           active={isAnatomyPanelOpen} 
           onClick={toggleAnatomyPanel} 
           className="w-8 h-8"
        />
        <ToolbarButton 
           icon={Compass} 
           label="Resetar Norte" 
           active={false} 
           onClick={() => {}} 
           className="w-8 h-8 text-slate-500 hover:text-rose-400"
        />
      </div>

    </div>
  );
};
