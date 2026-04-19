import React from 'react';
import { 
  Ruler, 
  Square,
  MapPin,
  Settings
} from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton, RibbonSection } from '../PhysicalCanvasView';

export const SiteToolbar: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);

  return (
    <>
      <RibbonSection>
        <ToolbarButton 
          icon={Square} 
          label="Delimitar" 
          active={activeTool === 'POLYGON'} 
          onClick={() => setActiveTool('POLYGON')} 
          shortcut="P"
        />
        <ToolbarButton 
          icon={Ruler} 
          label="Medir" 
          active={activeTool === 'MEASURE'} 
          onClick={() => setActiveTool('MEASURE')} 
          shortcut="M"
        />
        <ToolbarButton 
          icon={MapPin} 
          label="Drop Point (Saída CC)" 
          active={activeTool === 'DROP_POINT'} 
          onClick={() => setActiveTool('DROP_POINT')} 
          shortcut="D"
        />
      </RibbonSection>

      <RibbonSection>
        <ToolbarButton 
          icon={Settings} 
          label="Afastamentos" 
          active={false} 
          onClick={() => {}} 
        />
      </RibbonSection>
    </>
  );
};
