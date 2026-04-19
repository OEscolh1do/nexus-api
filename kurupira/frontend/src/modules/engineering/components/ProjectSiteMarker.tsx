import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useSolarStore } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';

/**
 * PROJECT SITE MARKER
 * 
 * Marcador técnico que aponta para as coordenadas cadastradas no Projeto.
 * Serve como referência visual (mira) no Layout 0.
 */
export const ProjectSiteMarker: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const selectEntity = useUIStore(s => s.selectEntity);
  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);

  if (!clientData.lat || !clientData.lng) return null;

  const position: [number, number] = [clientData.lat, clientData.lng];
  const hasAreas = installationAreas.length > 0;

  // Render do ícone técnico (estilo CAD/Mira) via DivIcon
  const icon = L.divIcon({
    className: 'bg-transparent',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div class="relative w-full h-full flex items-center justify-center">
        <!-- Pulso de radar -->
        <div class="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping"></div>
        
        <!-- Círculo externo -->
        <div class="absolute inset-1 rounded-full border-2 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        
        <!-- Crosshair (mira) -->
        <div class="absolute inset-0 flex items-center justify-center opacity-40">
           <div class="w-full h-[1px] bg-indigo-400"></div>
           <div class="absolute w-[1px] h-full bg-indigo-400"></div>
        </div>
        
        <!-- Centro sólido -->
        <div class="w-1.5 h-1.5 rounded-full bg-white shadow-xl z-10 border border-indigo-600"></div>
      </div>
    `
  });

  return (
    <Marker 
      position={position} 
      icon={icon}
      opacity={hasAreas ? 0.4 : 1}
      eventHandlers={{
        click: () => {
          setFocusedBlock('site');
          selectEntity('site', 'project-site', 'Projeto');
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} className="bg-slate-900 border-indigo-500/30 text-indigo-100 font-mono text-[10px] p-1.5 rounded-sm shadow-2xl">
        <div className="flex flex-col gap-0.5">
          <span className="font-black uppercase tracking-widest text-[8px] text-indigo-400 border-b border-indigo-500/20 pb-0.5 mb-0.5">Referência Sítio</span>
          <span className="truncate max-w-[120px]">{clientData.clientName || 'Projeto Solar'}</span>
        </div>
      </Tooltip>
    </Marker>
  );
};
