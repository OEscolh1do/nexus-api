import React from 'react';
import { Polygon, Marker } from 'react-leaflet';
import L, { LeafletEvent } from 'leaflet';
import { InstallationArea } from '@/core/state/slices/projectSlice';
import { useUIStore, type Tool } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';

/**
 * Flag de supressão: quando um polygon/marker click dispara, levanta esta flag
 * para impedir que o map click (que dispara logo depois no react-leaflet)
 * chame clearSelection() e anule a seleção.
 */
export const suppressNextMapClick = { value: false };

// =============================================================================
// TYPES
// =============================================================================

interface ParametricRoofBlockProps {
  roof: InstallationArea;
  activeTool: Tool;
  activeModuleSpec: any;
}

// =============================================================================
// STYLES
// =============================================================================

const AREA_POLYGON_STYLE = {
  color: '#10b981',      
  weight: 2,
  opacity: 0.8,
  fillColor: '#10b981',
  fillOpacity: 0.15,
  dashArray: '6, 4',
};

const AREA_HOVER_STYLE = {
  ...AREA_POLYGON_STYLE,
  color: '#f59e0b',
  fillColor: '#f59e0b',
  fillOpacity: 0.25,
};

const AREA_SELECTED_STYLE = {
  ...AREA_POLYGON_STYLE,
  color: '#8b5cf6',
  fillColor: '#8b5cf6',
  fillOpacity: 0.2,
  dashArray: '4, 2',
};


function globalLatLngToLocal(
  area: InstallationArea,
  geoLat: number,
  geoLng: number
): { x: number; y: number } {
  const earthRadius = 6378137;
  const latRads = area.center[0] * (Math.PI / 180);
  
  const deltaY_M = (geoLat - area.center[0]) * (Math.PI / 180) * earthRadius;
  const deltaX_M = (geoLng - area.center[1]) * (Math.PI / 180) * earthRadius * Math.cos(latRads);
  
  // Reverse rotation: undo azimuth
  const angleRad = -area.azimuth * (Math.PI / 180);
  const x = deltaX_M * Math.cos(angleRad) - deltaY_M * Math.sin(angleRad);
  const y = deltaX_M * Math.sin(angleRad) + deltaY_M * Math.cos(angleRad);
  
  return { x, y };
}

// =============================================================================
// GRIP ICONS
// =============================================================================

const vertexGripIcon = L.divIcon({
  className: 'bg-white border-2 border-slate-900 rounded-full shadow-md cursor-crosshair',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const midEdgeGripIcon = L.divIcon({
  className: 'bg-indigo-200 border border-indigo-500 rounded shadow cursor-cell opacity-60 hover:opacity-100',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  html: '<div style="font-size:6px;text-align:center;line-height:8px;color:#6366f1">+</div>',
});

const centerGripIcon = L.divIcon({
  className: 'bg-white border-2 border-indigo-500 rounded-full shadow-md cursor-move',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: '<div style="width:6px;height:6px;border-radius:50%;background:#6366f1;margin:2px auto;"></div>',
});

const rotateGripIcon = L.divIcon({
  className: 'bg-amber-100 border-2 border-amber-500 rounded-full shadow-md cursor-pointer',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: '<div style="font-size:8px;text-align:center;line-height:12px">🔄</div>',
});

// =============================================================================
// COMPONENT
// =============================================================================

export const ParametricRoofBlock: React.FC<ParametricRoofBlockProps> = ({ roof: area, activeTool, activeModuleSpec }) => {
  const selectEntity = useUIStore(s => s.selectEntity);
  const selectedEntity = useUIStore(s => s.selectedEntity);

  const isSelected = (selectedEntity.type === 'polygon' || selectedEntity.type === 'area') && selectedEntity.id === area.id;


  let currentStyle = AREA_POLYGON_STYLE;
  if (isSelected) currentStyle = AREA_SELECTED_STYLE;

  return (
    <>
      <Polygon
        positions={area.polygon}
        pathOptions={currentStyle}
        eventHandlers={{
          mouseover: (e) => {
            if (activeTool === 'SELECT' && !isSelected) e.target.setStyle(AREA_HOVER_STYLE);
          },
          mouseout: (e) => {
            if (activeTool === 'SELECT' && !isSelected) e.target.setStyle(AREA_POLYGON_STYLE);
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e.originalEvent);
            suppressNextMapClick.value = true; // Impede clearSelection() no map click
            if (activeTool === 'SELECT') {
              selectEntity('area', area.id, `Área ${area.id.substring(area.id.length - 4)}`);
            } else if (activeTool === 'PLACE_MODULE' && activeModuleSpec) {
                const local = globalLatLngToLocal(area, e.latlng.lat, e.latlng.lng);
                
                const parseDims = (areaVal: number, dim: string) => {
                  const m = dim.match(/(\d+)\s*x\s*(\d+)/i);
                  if (m) {
                    const w = parseInt(m[1], 10) / 1000;
                    const h = parseInt(m[2], 10) / 1000;
                    return { w: Math.max(w, h), h: Math.min(w, h) };
                  }
                  const h = Math.sqrt(areaVal / 2); return { w: h*2, h: h };
                };
                
                const { w: widthM, h: heightM } = parseDims(activeModuleSpec.area, activeModuleSpec.dimensions);
                
                useSolarStore.getState().placeModule(
                    area.id,
                    local.x,
                    local.y,
                    activeModuleSpec.id,
                    widthM,
                    heightM
                );
            }
          },
        }}
      />
      
      {/* ── GRIPS (Only when selected) ── */}
      {isSelected && (
        <FreeformGrips area={area} polygonPoints={area.polygon} />
      )}
    </>
  );
};

// =============================================================================
// SUB-COMPONENT: FREEFORM GRIPS (Vertex + MidEdge + Center + Rotate)
// =============================================================================

function FreeformGrips({ area, polygonPoints }: { area: InstallationArea; polygonPoints: [number, number][] }) {
  const updateArea = useSolarStore(s => s.updateArea);
  const updateAreaVertex = useSolarStore(s => s.updateAreaVertex);
  const addAreaVertex = useSolarStore(s => s.addAreaVertex);

  // --- Center Drag (Translate) ---
  const handleCenterDrag = React.useCallback((e: LeafletEvent) => {
    const pos = e.target.getLatLng();
    updateArea(area.id, { center: [pos.lat, pos.lng] });
  }, [area.id, updateArea]);

  // --- Rotation Hook ---
  const rotatorPos = React.useMemo(() => {
    // Place rotator 4m above the topmost vertex
    const [lat, lng] = area.center;
    const angleRad = area.azimuth * (Math.PI / 180);
    const maxY = Math.max(...area.localVertices.map(v => v.y));
    const offsetY = maxY + 4; // 4 meters above top edge
    
    const earthRadius = 6378137;
    const latRads = lat * (Math.PI / 180);
    const rx = 0 * Math.cos(angleRad) - offsetY * Math.sin(angleRad);
    const ry = 0 * Math.sin(angleRad) + offsetY * Math.cos(angleRad);
    const dLat = (ry / earthRadius) * (180 / Math.PI);
    const dLng = (rx / (earthRadius * Math.cos(latRads))) * (180 / Math.PI);
    return [lat + dLat, lng + dLng] as [number, number];
  }, [area]);

  const handleRotatorDrag = React.useCallback((e: LeafletEvent) => {
    const pos = e.target.getLatLng();
    const dLat = (pos.lat - area.center[0]) * 111320;
    const dLng = (pos.lng - area.center[1]) * 111320 * Math.cos(area.center[0] * Math.PI / 180);
    let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    updateArea(area.id, { azimuth: angle });
  }, [area.center, area.id, updateArea]);

  return (
    <>
      {/* Center Drag Grip */}
      <Marker 
        position={area.center} 
        icon={centerGripIcon} 
        draggable={true}
        eventHandlers={{ drag: handleCenterDrag }}
      />

      {/* Vertex Grips (Quinas) */}
      {polygonPoints.map((pt, i) => (
        <Marker
          key={`vtx-${i}`}
          position={pt}
          icon={vertexGripIcon}
          draggable={true}
          eventHandlers={{
            drag: (e: LeafletEvent) => {
              const pos = e.target.getLatLng();
              const local = globalLatLngToLocal(area, pos.lat, pos.lng);
              updateAreaVertex(area.id, i, local.x, local.y);
            }
          }}
        />
      ))}

      {/* Mid-Edge Grips (Add Vertex) */}
      {polygonPoints.map((pt, i) => {
        const next = polygonPoints[(i + 1) % polygonPoints.length];
        const midLat = (pt[0] + next[0]) / 2;
        const midLng = (pt[1] + next[1]) / 2;
        return (
          <Marker
            key={`mid-${i}`}
            position={[midLat, midLng]}
            icon={midEdgeGripIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                // Calculate local coords for the midpoint
                const local = globalLatLngToLocal(area, midLat, midLng);
                addAreaVertex(area.id, i, local.x, local.y);
              }
            }}
          />
        );
      })}

      {/* Rotation Grip */}
      <Marker
        position={rotatorPos}
        icon={rotateGripIcon}
        draggable={true}
        eventHandlers={{ drag: handleRotatorDrag }}
      />
    </>
  );
}
