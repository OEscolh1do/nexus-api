import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useSolarStore } from '@/core/state/solarStore';
import { useUIStore } from '@/core/state/uiStore';
import { renderToStaticMarkup } from 'react-dom/server';
import { NeonorteMarkerUI } from '@/components/ui/NeonorteMarkerUI';

/**
 * PROJECT SITE MARKER
 * 
 * Marcador técnico que aponta para as coordenadas cadastradas no Projeto.
 * Serve como referência visual (mira) no Layout 0.
 */
interface ProjectSiteMarkerProps {
  lat?: number;
  lng?: number;
}

export const ProjectSiteMarker: React.FC<ProjectSiteMarkerProps> = ({ 
  lat: propsLat, 
  lng: propsLng 
}) => {
  const clientData = useSolarStore(s => s.clientData);
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const selectEntity = useUIStore(s => s.selectEntity);
  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);

  const lat = propsLat ?? clientData.lat;
  const lng = propsLng ?? clientData.lng;
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

  const position: [number, number] = [lat, lng];
  const hasAreas = (installationAreas || []).length > 0;

  // Render do Pin Neonorte (Sincronizado via Componente UI)
  const icon = L.divIcon({
    className: 'bg-transparent',
    iconSize: [40, 56],
    iconAnchor: [20, 56], 
    html: renderToStaticMarkup(<NeonorteMarkerUI size="md" />)
  });

  return (
    <Marker 
      position={position} 
      icon={icon}
      opacity={hasAreas ? 0.6 : 1}
      eventHandlers={{
        click: () => {
          setFocusedBlock('site');
          selectEntity('site', 'project-site', 'Dados do Sítio');
        }
      }}
    >
      <Tooltip direction="top" offset={[0, -45]} className="bg-slate-950/95 border border-slate-800 text-slate-200 font-mono text-[10px] p-2 rounded-sm shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-0.5">
          <span className="font-black uppercase tracking-[0.2em] text-[8px] text-emerald-400 border-b border-emerald-500/20 pb-0.5 mb-1">Ponto de Referência</span>
          <span className="font-bold text-[11px] text-white truncate max-w-[160px]">{clientData.clientName || 'Projeto Solar'}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest">{clientData.city}, {clientData.state}</span>
        </div>
      </Tooltip>
    </Marker>
  );
};
