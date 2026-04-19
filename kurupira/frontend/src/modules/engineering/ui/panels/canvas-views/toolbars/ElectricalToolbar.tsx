import React from 'react';
import { 
  Link2, 
  Trash2,
  Box,
  Activity,
  Hash
} from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { ToolbarButton, RibbonSection } from '../PhysicalCanvasView';

export const ElectricalToolbar: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);
  const placedModules = useSolarStore(s => s.project.placedModules) || [];
  
  const hasModules = placedModules.length > 0;

  return (
    <>
      <RibbonSection>
        <ToolbarButton 
          icon={Activity} 
          label="Unifilar" 
          active={canvasViewMode === 'UNIFILAR'} 
          onClick={() => setCanvasViewMode('UNIFILAR')} 
        />
        <ToolbarButton 
          icon={Box} 
          label="Fluxo" 
          active={canvasViewMode === 'DIAGRAM'} 
          onClick={() => setCanvasViewMode('DIAGRAM')} 
        />
      </RibbonSection>

      <RibbonSection disabled={!hasModules}>
        <ToolbarButton 
          icon={Link2} 
          label="Stringing" 
          active={activeTool === 'STRINGING'} 
          onClick={() => setActiveTool('STRINGING')} 
          disabled={!hasModules}
        />
        <ToolbarButton 
          icon={Hash} 
          label="Tags" 
          active={false} 
          onClick={() => {}} 
          disabled={!hasModules}
        />
        <ToolbarButton 
          icon={Trash2} 
          label="Limpar" 
          active={false} 
          onClick={() => {}} 
          className="hover:text-rose-500"
          disabled={!hasModules}
        />
      </RibbonSection>
    </>
  );
};
