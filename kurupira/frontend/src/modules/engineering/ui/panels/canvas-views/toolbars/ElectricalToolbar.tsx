import React from 'react';
import {
  Link2,
  Trash2,
  Box,
  Activity,
  Shapes,
} from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { usePanelStore } from '@/modules/engineering/store/panelStore';
import { ToolbarButton, RibbonSection } from '../PhysicalCanvasView';

export const ElectricalToolbar: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);
  const placedModules = useSolarStore(s => s.project.placedModules) || [];
  const clearStringAssignments = useSolarStore(s => s.clearStringAssignments);

  const promoteToCenter = usePanelStore(s => s.promoteToCenter);

  const hasModules = placedModules.length > 0;
  const stringCount = placedModules.filter(m => m.stringData).length;

  return (
    <>
      <RibbonSection>
        <ToolbarButton
          icon={Shapes}
          label="Editor de Símbolos"
          active={false}
          onClick={() => promoteToCenter('symbol-editor')}
        />
      </RibbonSection>

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
          icon={Trash2}
          label={`Limpar Stringing (${stringCount} módulos)`}
          active={false}
          onClick={() => {
            if (stringCount > 0 && window.confirm(`Limpar stringing de ${stringCount} módulos?`)) {
              clearStringAssignments();
            }
          }}
          className="hover:text-rose-500"
          disabled={stringCount === 0}
        />
      </RibbonSection>
    </>
  );
};
