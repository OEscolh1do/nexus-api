import React from 'react';
import { 
  Square, 
  Minus, 
  MoveVertical, 
  MoveHorizontal,
  Settings
} from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { ToolbarButton, RibbonSection } from '../PhysicalCanvasView';

export const ArrangementToolbar: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];
  const isLayout0 = installationAreas.length === 0;

  return (
    <>
      <RibbonSection>
        <ToolbarButton 
          icon={Square} 
          label="Área" 
          active={activeTool === 'POLYGON'} 
          onClick={() => setActiveTool('POLYGON')} 
        />
        <ToolbarButton 
          icon={Minus} 
          label="Corredor Técnico (Subtract)" 
          active={activeTool === 'SUBTRACT'} 
          onClick={() => setActiveTool('SUBTRACT')} 
          disabled={isLayout0}
          shortcut="S"
        />
      </RibbonSection>

      <RibbonSection disabled={isLayout0}>
        <ToolbarButton 
          icon={MoveVertical} 
          label="Retrato" 
          active={true} 
          onClick={() => {}} 
          disabled={isLayout0}
        />
        <ToolbarButton 
          icon={MoveHorizontal} 
          label="Paisagem" 
          active={false} 
          onClick={() => {}} 
          disabled={isLayout0}
        />
      </RibbonSection>

      {!isLayout0 && (
        <RibbonSection>
          <ToolbarButton 
            icon={Settings} 
            label="Ajustar" 
            active={false} 
            onClick={() => {}} 
          />
        </RibbonSection>
      )}
    </>
  );
};
