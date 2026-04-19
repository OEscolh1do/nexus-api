import React from 'react';
import { 
  Maximize2, 
  CloudSun,
  Map as MapIcon,
  Satellite,
  Globe
} from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { ToolbarButton, RibbonSection } from '../PhysicalCanvasView';

export const GlobalLayerToolbar: React.FC = () => {
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);
  const isSatelliteHighVis = useUIStore(s => s.isSatelliteHighVis);
  const toggleSatelliteHighVis = useUIStore(s => s.toggleSatelliteHighVis);
  const mapType = useUIStore(s => s.mapType);
  const setMapType = useUIStore(s => s.setMapType);

  return (
    <div className="flex flex-col gap-2">
      <RibbonSection>
        <ToolbarButton 
          icon={Maximize2} 
          label="Física" 
          active={canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT'} 
          onClick={() => setCanvasViewMode('CONTEXT')} 
        />
      </RibbonSection>

      <RibbonSection>
        <ToolbarButton 
          icon={Satellite} 
          label="Visão Satélite" 
          active={mapType === 'SATELLITE'} 
          onClick={() => setMapType('SATELLITE')} 
        />
        <ToolbarButton 
          icon={Globe} 
          label="Google (Alta Recência)" 
          active={mapType === 'GOOGLE_SATELLITE'} 
          onClick={() => setMapType('GOOGLE_SATELLITE')} 
        />
        <ToolbarButton 
          icon={MapIcon} 
          label="Visão Padrão" 
          active={mapType === 'STREET'} 
          onClick={() => setMapType('STREET')} 
        />
      </RibbonSection>

      <RibbonSection>
        <ToolbarButton 
          icon={CloudSun} 
          label="Alta Visibilidade" 
          active={isSatelliteHighVis} 
          onClick={() => toggleSatelliteHighVis()} 
          disabled={mapType !== 'SATELLITE'}
        />
      </RibbonSection>
    </div>
  );
};
