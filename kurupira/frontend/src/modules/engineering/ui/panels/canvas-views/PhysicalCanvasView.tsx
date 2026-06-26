import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Camera,
  MapPin,
  Zap,
  Layers,
  Image,
  type LucideIcon
} from 'lucide-react';
import {
  useMapEvents,
  Polyline,
  Marker as LeafletMarker,
  Tooltip,
  Polygon as LeafletPolygon,
  Rectangle
} from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../../store/useTechStore';
import { useCatalogStore } from '../../../store/useCatalogStore';
import { useInverterUIStore } from '../../../store/useInverterUIStore';
import { useElectricalValidation } from '../../../hooks/useElectricalValidation';
import { useThermalPremises } from '../../../hooks/useThermalPremises';
import { useTechKPIs } from '../../../hooks/useTechKPIs';
import { toArray } from '@/core/types/normalized.types';
import { calculateStringMetrics } from '../../../utils/electricalMath';
import { getModuleSpecs } from '../../../utils/specAdapter';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { MapCore, globalLeafletMapRef } from '../../../components/MapCore';
import { WebGLOverlay } from '../../../components/WebGLOverlay';
import { ViewLayerSelector } from '../../components/ViewLayerSelector';
import { ManipulationIsland } from './toolbars/ManipulationIsland';
import { NavigationIsland } from './toolbars/NavigationIsland';
import { VisionIsland } from './toolbars/VisionIsland';
import { DraftingIsland } from './toolbars/DraftingIsland';
import { SearchIsland } from './toolbars/SearchIsland';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import { DiagramCanvasView } from './DiagramCanvasView';
import { UnifilarSchematicCanvas, type MpptValidationError } from './electrical/UnifilarSchematicCanvas';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================


interface SubTool {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active: boolean;
  shortcut?: string;
}

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  shortcut?: string;
  className?: string;
  subTools?: SubTool[];
}

// Fix 3: Move MPPT_HUD_COLORS to module level
const MPPT_HUD_COLORS = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#f43f5e','#06b6d4','#fb923c','#a855f7'];

// =============================================================================
// SUB-COMPONENTS: MAP STYLE SWITCHER (L0-A)
// =============================================================================

const MapStyleSwitcher: React.FC = () => {
  const mapStyle = useUIStore(s => s.mapStyle);
  const setMapStyle = useUIStore(s => s.setMapStyle);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);

  const [isOpen, setIsOpen] = useState(false);

  if (canvasViewMode !== 'CONTEXT') return null;

  const styles: Array<{ id: 'hybrid' | 'satellite' | 'roadmap' | 'terrain'; label: string }> = [
    { id: 'hybrid', label: 'Híbrido' },
    { id: 'satellite', label: 'Satélite' },
    { id: 'roadmap', label: 'Ruas' },
    { id: 'terrain', label: 'Terreno' }
  ];

  return (
    <div className="absolute bottom-16 right-4 z-[1100]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Trocar estilo do mapa"
          className="flex items-center justify-center p-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg transition-all hover:border-indigo-500/50 group"
        >
          <Layers size={18} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 right-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-2xl p-2 min-w-[140px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col gap-1">
              {styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => {
                    setMapStyle(style.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide rounded transition-all text-left",
                    mapStyle === style.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SatelliteOpacityControl: React.FC = () => {
  const satelliteOpacity = useUIStore(s => s.satelliteOpacity);
  const setSatelliteOpacity = useUIStore(s => s.setSatelliteOpacity);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);

  if (canvasViewMode !== 'CONTEXT') return null;

  return (
    <div className="absolute bottom-28 right-4 z-[1100]">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg">
        <Image size={14} className="text-slate-400 shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={satelliteOpacity}
          onChange={(e) => setSatelliteOpacity(Number(e.target.value))}
          className="w-20 h-1 accent-indigo-500 cursor-pointer"
          title="Opacidade do satélite"
        />
        <span className="text-[9px] font-mono font-bold text-slate-400 w-8 text-right tabular-nums">
          {satelliteOpacity}%
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS: RIBBONS
// =============================================================================

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  icon: Icon, 
  label, 
  active, 
  disabled, 
  onClick, 
  shortcut, 
  className,
  subTools 
}) => {
  const [showFlyout, setShowFlyout] = useState(false);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const toggleFlyout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !subTools) return;
    setShowFlyout(!showFlyout);
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (!showFlyout) return;
    closeTimerRef.current = setTimeout(() => {
      setShowFlyout(false);
    }, 300);
  };

  return (
    <div 
      className="relative group/tool" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        disabled={disabled}
        onClick={() => {
          if (!disabled) onClick();
        }}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
        aria-label={`${label}${shortcut ? `, atalho ${shortcut}` : ''}`}
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-[4px] transition-all duration-150 outline-none",
          active 
            ? "bg-indigo-500 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] scale-[0.98]" 
            : "text-slate-500 hover:bg-slate-800 hover:text-slate-200 active:scale-95",
          disabled && "opacity-20 grayscale cursor-not-allowed scale-[0.9]",
          className
        )}
      >
        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        
        {/* Indicador de Seleção Ativa */}
        {active && (
          <div className="absolute -left-1.5 w-[2px] h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}

        {/* Zona de Clique do Grupo (Split-click area) */}
        {subTools && subTools.length > 0 && (
          <div 
            onClick={toggleFlyout}
            className="absolute bottom-0 right-0 w-4 h-4 flex items-end justify-end cursor-pointer group-hover/tool:bg-white/5 rounded-br-[4px] transition-colors"
          >
            <div className="mb-[1px] mr-[1px] w-0 h-0 border-l-[4px] border-l-transparent border-b-[4px] border-b-slate-400 group-hover/tool:border-b-white transition-colors" />
          </div>
        )}
      </button>

      {/* Flyout Menu (Sub-tools) */}
      {showFlyout && subTools && subTools.length > 0 && (
        <>
          {/* Bridge to prevent gap closing */}
          <div className="absolute left-full top-0 w-2 h-full cursor-default" />
          
          <div className="absolute left-full ml-2 top-0 flex gap-1 p-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-lg z-[1200] animate-in fade-in slide-in-from-left-1 duration-200">
             {subTools.map((tool) => (
               <ToolbarButton
                 key={tool.id}
                 icon={tool.icon}
                 label={tool.label}
                 active={tool.active}
                 onClick={() => {
                   tool.onClick();
                   setShowFlyout(false);
                 }}
                 shortcut={tool.shortcut}
                 className="w-8 h-8"
               />
             ))}
          </div>
        </>
      )}
    </div>
  );
};

export const RibbonSection: React.FC<{ children: React.ReactNode; disabled?: boolean }> = ({ children, disabled }) => (
  <div className={cn(
    "flex flex-col gap-1 p-0.5 transition-all duration-300",
    disabled && "opacity-20 grayscale-[0.5] pointer-events-none"
  )}>
    <div className="flex flex-col gap-1">
      {children}
    </div>
  </div>
);

// =============================================================================
// SUB-COMPONENTS: SAFE EDGE OVERLAY
// =============================================================================

const SafeEdgeOverlay: React.FC<{ points: [number, number][] }> = ({ points }) => {
  if (points.length < 3) return null;
  return (
    <LeafletPolygon 
      positions={points} 
      fillColor="transparent" 
      color="#f59e0b" 
      weight={1} 
      dashArray="4, 8" 
      opacity={0.6}
      interactive={false}
    />
  );
};

// =============================================================================
// SUB-COMPONENTS: DRAWING ENGINE (Leaflet-aware)
// =============================================================================

interface DrawingEngineProps {
  activeTool: string;
  points: [number, number][];
  setPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
}

const DrawingEngine: React.FC<DrawingEngineProps> = ({ activeTool, points, setPoints }) => {
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const addDropPoint = useSolarStore(s => s.addDropPoint);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getSnappedPos = (current: L.LatLng, prev: [number, number]): L.LatLng => {
    if (!isShiftPressed) return current;
    const p1 = L.latLng(prev);
    const p2 = current;
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    if (Math.abs(dx) > Math.abs(dy)) {
      return L.latLng(p1.lat, p2.lng);
    } else {
      return L.latLng(p2.lat, p1.lng);
    }
  };

  const autoLayoutArea = useSolarStore(s => s.autoLayoutArea);
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const spawnFreeformArea = useSolarStore(s => s.spawnFreeformArea);
  const spawnObstacle = useSolarStore(s => s.spawnObstacle);
  const selectedAreaId = useUIStore(s => s.selectedEntity.type === 'area' ? s.selectedEntity.id : null);
  const setActiveTool = useUIStore(s => s.setActiveTool);

  const map = useMapEvents({
    click: (e) => {
      // Fix 2: Allow points to be drawn for POLYGON/SUBTRACT/MEASURE
      // (the finalization guard in the footer already handles selectedAreaId check)
      if (activeTool === 'POLYGON' || activeTool === 'SUBTRACT' || activeTool === 'MEASURE') {
        let pos = e.latlng;
        if (points.length > 0) {
          pos = getSnappedPos(pos, points[points.length - 1]);
        }
        setPoints(prev => [...prev, [pos.lat, pos.lng]]);
      } else if (activeTool === 'DROP_POINT') {
        addDropPoint([e.latlng.lat, e.latlng.lng]);
      } else if (activeTool === 'PLACE_MODULE') {
        const clickedArea = installationAreas.find(area => {
          const point = L.latLng(e.latlng.lat, e.latlng.lng);
          const polygon = L.polygon(area.polygon as any);
          const bounds = polygon.getBounds();
          if (!bounds.contains(point)) return false;

          let inside = false;
          const x = e.latlng.lat;
          const y = e.latlng.lng;
          const vs = area.polygon;
          for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1];
            const xj = vs[j][0], yj = vs[j][1];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
              inside = !inside;
            }
          }
          return inside;
        });

        if (clickedArea) {
          autoLayoutArea(clickedArea.id);
        }
      }
    },
    // Item 3: Duplo-clique fecha o polígono
    dblclick: (e) => {
      if (activeTool !== 'POLYGON' && activeTool !== 'SUBTRACT') return;
      L.DomEvent.stopPropagation(e.originalEvent);
      if (points.length >= 3) {
        if (activeTool === 'POLYGON') {
          spawnFreeformArea(points);
          setPoints([]);
          setActiveTool('SELECT');
        } else if (activeTool === 'SUBTRACT' && selectedAreaId) {
          spawnObstacle(selectedAreaId, points);
          setPoints([]);
          setActiveTool('SELECT');
        }
      }
    },
    mousemove: (e) => {
      if (activeTool !== 'POLYGON' && activeTool !== 'SUBTRACT' && activeTool !== 'MEASURE') return;
      let pos = e.latlng;
      if (points.length > 0) {
        pos = getSnappedPos(pos, points[points.length - 1]);
      }
      setMousePos([pos.lat, pos.lng]);
    }
  });

  // Item 3: Cursor crosshair para modos CAD
  React.useEffect(() => {
    const container = map.getContainer();
    const isCadMode = activeTool === 'POLYGON' || activeTool === 'SUBTRACT' || activeTool === 'MEASURE' || activeTool === 'PLACE_MODULE';
    if (isCadMode) {
      container.style.cursor = 'crosshair';
    } else if (activeTool === 'PAN') {
      container.style.cursor = 'grab';
    } else {
      container.style.cursor = '';
    }
    return () => { container.style.cursor = ''; };
  }, [activeTool, map]);

  if ((activeTool !== 'POLYGON' && activeTool !== 'SUBTRACT' && activeTool !== 'MEASURE') || points.length === 0) return null;

  const color = activeTool === 'SUBTRACT' ? "#f43f5e" : activeTool === 'MEASURE' ? "#10b981" : "#6366f1";

  // Item 3: Detectar proximidade ao primeiro ponto para snap visual
  const nearFirstPoint = points.length >= 3 && mousePos
    ? map.distance(L.latLng(mousePos), L.latLng(points[0])) < 2
    : false;

  return (
    <>
      <Polyline positions={points} color={color} weight={3} dashArray="5, 10" />
      {mousePos && (
        <Polyline positions={[points[points.length - 1], mousePos]} color={color} weight={2} opacity={0.5} dashArray="2, 4">
          <Tooltip permanent direction="center" className="bg-slate-900 border-none text-indigo-400 font-mono text-[10px] p-0.5 rounded-sm shadow-xl">
             {map.distance(L.latLng(points[points.length - 1]), L.latLng(mousePos)).toFixed(2)}m
          </Tooltip>
        </Polyline>
      )}
      {points.map((p, i) => {
        const prev = i > 0 ? points[i - 1] : null;
        const dist = prev ? map.distance(L.latLng(prev), L.latLng(p)) : null;
        // Item 3: Usar CLOSE_SNAP_ICON no primeiro vértice se estiver próximo
        const useSnapIcon = i === 0 && nearFirstPoint;
        const defaultIcon = L.divIcon({
          className: activeTool === 'SUBTRACT' ? 'bg-rose-500 border-2 border-white rounded-full' : 'bg-white border-2 border-indigo-600 rounded-full',
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        });
        return (
          <React.Fragment key={i}>
            <LeafletMarker position={p} icon={useSnapIcon ? CLOSE_SNAP_ICON : defaultIcon} />
            {dist && (
              <Polyline positions={[prev!, p]} color="transparent" opacity={0}>
                <Tooltip permanent direction="center" className="bg-slate-900/80 border-none text-slate-300 font-mono text-[9px] p-0.5 rounded-sm">
                  {dist.toFixed(2)}m
                </Tooltip>
              </Polyline>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

const DropPointLayer: React.FC = () => {
  const dropPoints = useSolarStore(s => s.project.dropPoints);
  const removeDropPoint = useSolarStore(s => s.removeDropPoint);
  const updateDropPoint = useSolarStore(s => s.updateDropPoint);
  const activeTool = useUIStore(s => s.activeTool);

  const dropIcon = L.divIcon({
    html: renderToStaticMarkup(
      <div className="relative group">
        <div className="absolute inset-0 bg-rose-500 blur-sm opacity-50 group-hover:opacity-100 transition-opacity rounded-full" />
        <div className="relative w-8 h-8 bg-slate-900 border-2 border-rose-500 rounded-lg flex items-center justify-center shadow-2xl">
          <MapPin size={16} className="text-rose-500" />
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-tighter">
          Saída CC
        </div>
      </div>
    ),
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <>
      {dropPoints.map(dp => (
        <LeafletMarker
          key={dp.id}
          position={dp.center}
          icon={dropIcon}
          draggable={activeTool === 'MOVE'}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              updateDropPoint(dp.id, [position.lat, position.lng]);
            },
            contextmenu: () => removeDropPoint(dp.id)
          }}
        />
      ))}
    </>
  );
};

// =============================================================================
// L1-A: POLYGON EDIT LAYER — Vertex editing for selected area
// =============================================================================

// FIX 1: Extract divIcon as module-level constants to prevent re-creation on every render
const VERTEX_ICON = L.divIcon({
  html: '<div style="width:12px;height:12px;background:white;border:2px solid #6366f1;border-radius:50%;cursor:move;"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const MIDPOINT_ICON = L.divIcon({
  html: '<div style="width:8px;height:8px;background:#22d3ee;border:1px solid white;border-radius:50%;cursor:pointer;opacity:0.7;"></div>',
  className: '',
  iconSize: [8, 8],
  iconAnchor: [4, 4]
});

const VERTEX_ICON_SNAP = L.divIcon({
  html: '<div style="width:12px;height:12px;background:white;border:2px solid #22d3ee;border-radius:50%;cursor:move;box-shadow:0 0 8px rgba(34,211,238,0.6);"></div>',
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const ROTATION_ICON = L.divIcon({
  html: '<div style="width:24px;height:24px;background:#4f46e5;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:move;box-shadow:0 2px 8px rgba(0,0,0,0.4);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Item 3: Ícone de snap-to-close para o primeiro vértice
const CLOSE_SNAP_ICON = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#10b981;border:2px solid #6ee7b7;border-radius:50%;box-shadow:0 0 12px rgba(16,185,129,0.8);animation:pulse 1s infinite;"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const PolygonEditLayer: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const selectedAreaId = useUIStore(s => s.selectedEntity.type === 'area' ? s.selectedEntity.id : null);
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const updateAreaPolygon = useSolarStore(s => s.updateAreaPolygon);
  const rotateArea = useSolarStore(s => s.rotateArea);

  const [rotationAngle, setRotationAngle] = useState<number | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // TASK 6: Track Shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const area = installationAreas.find(a => a.id === selectedAreaId);

  // useMemo must be called before any conditional return (Rules of Hooks)
  const centroid = useMemo<[number, number]>(() => {
    if (!area || area.polygon.length < 3) return [0, 0];
    const latSum = area.polygon.reduce((sum, v) => sum + v[0], 0);
    const lngSum = area.polygon.reduce((sum, v) => sum + v[1], 0);
    return [latSum / area.polygon.length, lngSum / area.polygon.length];
  }, [area]);

  if (activeTool !== 'SELECT' || !selectedAreaId) return null;
  if (!area || area.polygon.length < 3) return null;

  const handleVertexDragEnd = (index: number, e: any) => {
    let newPos = e.target.getLatLng();

    // TASK 6: Snap to orthogonal if Shift is pressed
    if (isShiftPressed) {
      const prevIdx = (index - 1 + area.polygon.length) % area.polygon.length;
      const nextIdx = (index + 1) % area.polygon.length;
      const prev = area.polygon[prevIdx];
      const next = area.polygon[nextIdx];

      // Find which neighbor is closer for snapping
      const deltaLatPrev = Math.abs(newPos.lat - prev[0]);
      const deltaLngPrev = Math.abs(newPos.lng - prev[1]);
      const deltaLatNext = Math.abs(newPos.lat - next[0]);
      const deltaLngNext = Math.abs(newPos.lng - next[1]);

      // Snap to closest neighbor's axis
      const snapToPrev = Math.min(deltaLatPrev, deltaLngPrev) < Math.min(deltaLatNext, deltaLngNext);
      if (snapToPrev) {
        if (deltaLatPrev < deltaLngPrev) {
          newPos = L.latLng(prev[0], newPos.lng); // Snap to horizontal
        } else {
          newPos = L.latLng(newPos.lat, prev[1]); // Snap to vertical
        }
      } else {
        if (deltaLatNext < deltaLngNext) {
          newPos = L.latLng(next[0], newPos.lng);
        } else {
          newPos = L.latLng(newPos.lat, next[1]);
        }
      }
    }

    const newPolygon = [...area.polygon];
    newPolygon[index] = [newPos.lat, newPos.lng];
    updateAreaPolygon(selectedAreaId, newPolygon as any);
  };

  const handleMidpointClick = (afterIndex: number, e: any) => {
    const newPos = e.target.getLatLng();
    const newPolygon = [...area.polygon];
    newPolygon.splice(afterIndex + 1, 0, [newPos.lat, newPos.lng] as any);
    updateAreaPolygon(selectedAreaId, newPolygon as any);
  };

  const handleVertexRightClick = (index: number) => {
    if (area.polygon.length <= 3) return;
    const newPolygon = area.polygon.filter((_, i) => i !== index);
    updateAreaPolygon(selectedAreaId, newPolygon as any);
  };

  // TASK 7: Rotation handle drag
  const handleRotationDragEnd = (e: any) => {
    const newPos = e.target.getLatLng();
    const angle = Math.atan2(newPos.lng - centroid[1], newPos.lat - centroid[0]) * (180 / Math.PI);
    const newAzimuth = (90 - angle + 360) % 360; // Convert from atan2 to compass azimuth
    rotateArea(selectedAreaId, newAzimuth);
    setRotationAngle(null);
  };

  const handleRotationDrag = (e: any) => {
    const newPos = e.target.getLatLng();
    const angle = Math.atan2(newPos.lng - centroid[1], newPos.lat - centroid[0]) * (180 / Math.PI);
    const newAzimuth = (90 - angle + 360) % 360;
    setRotationAngle(newAzimuth);
  };

  return (
    <>
      {area.polygon.map((vertex, i) => (
        <LeafletMarker
          key={`vertex-${i}`}
          position={vertex as any}
          icon={isShiftPressed ? VERTEX_ICON_SNAP : VERTEX_ICON}
          draggable
          eventHandlers={{
            // FIX 2: Stop propagation on mousedown and click to prevent clearing selection
            mousedown: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
            },
            dragend: (e) => handleVertexDragEnd(i, e),
            contextmenu: () => handleVertexRightClick(i)
          }}
        />
      ))}
      {area.polygon.map((vertex, i) => {
        const nextVertex = area.polygon[(i + 1) % area.polygon.length];
        const midLat = (vertex[0] + nextVertex[0]) / 2;
        const midLng = (vertex[1] + nextVertex[1]) / 2;
        return (
          <LeafletMarker
            key={`mid-${i}`}
            position={[midLat, midLng]}
            icon={MIDPOINT_ICON}
            eventHandlers={{
              // FIX 2: Stop propagation for midpoints too
              mousedown: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                handleMidpointClick(i, e);
              }
            }}
          />
        );
      })}
      {/* Rotation handle at area centroid */}
      <LeafletMarker
        key="rotation-handle"
        position={centroid}
        icon={ROTATION_ICON}
        draggable
        eventHandlers={{
          mousedown: (e) => { L.DomEvent.stopPropagation(e.originalEvent); },
          drag: handleRotationDrag,
          dragend: handleRotationDragEnd
        }}
      >
        {rotationAngle !== null && (
          <Tooltip permanent direction="top" offset={[0, -16]} className="bg-indigo-700 border-none text-white font-mono text-[9px] p-0.5 rounded-sm shadow-xl">
            {rotationAngle.toFixed(0)}°
          </Tooltip>
        )}
      </LeafletMarker>
    </>
  );
};

const ObstacleLayer: React.FC<{ areas: any[] }> = ({ areas }) => {
  return (
    <>
      {areas.map(area => (
        (area.obstacles || []).map((obs: any) => (
          <LeafletPolygon
            key={obs.id}
            positions={obs.polygon}
            fillColor="#fb7185" // rose-400
            fillOpacity={0.4}
            color="#f43f5e" // rose-500
            weight={1}
            dashArray="5, 5"
          />
        ))
      ))}
    </>
  );
};

// =============================================================================
// ITEM 2: BOX-SELECT LAYER — Box selection for STRINGING mode
// =============================================================================

interface BoxSelectLayerProps {
  placedModules: any[];
  onSelectModules: (ids: string[], additive: boolean) => void;
}

const BoxSelectLayer: React.FC<BoxSelectLayerProps> = ({ placedModules, onSelectModules }) => {
  const startRef = React.useRef<L.LatLng | null>(null);
  const [dragRect, setDragRect] = React.useState<[L.LatLng, L.LatLng] | null>(null);
  const isDraggingRef = React.useRef(false);
  const isShiftRef = React.useRef(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') isShiftRef.current = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') isShiftRef.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  const map = useMapEvents({
    mousedown: (e) => {
      // Só ativa box-select com botão esquerdo
      if (e.originalEvent.button !== 0) return;
      startRef.current = e.latlng;
      isDraggingRef.current = false;
    },
    mousemove: (e) => {
      if (!startRef.current) return;
      const dist = map.distance(startRef.current, e.latlng);
      if (dist > 5) {
        isDraggingRef.current = true;
        map.dragging.disable();
        setDragRect([startRef.current, e.latlng]);
      }
    },
    mouseup: (e) => {
      if (!startRef.current || !isDraggingRef.current) {
        startRef.current = null;
        map.dragging.enable();
        setDragRect(null);
        return;
      }
      // Calcular bounds e selecionar módulos dentro
      const bounds = L.latLngBounds(startRef.current, e.latlng);
      const ids = placedModules
        .filter(m => m.center && bounds.contains(L.latLng(m.center[0], m.center[1])))
        .map(m => m.id);
      onSelectModules(ids, isShiftRef.current);
      startRef.current = null;
      isDraggingRef.current = false;
      map.dragging.enable();
      setDragRect(null);
    }
  });

  if (!dragRect) return null;

  const [sw, ne] = dragRect;
  const bounds = L.latLngBounds(sw, ne);

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: '#22d3ee',
        fillColor: '#22d3ee',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 4',
        interactive: false,
      }}
    />
  );
};

// =============================================================================
// TASK 8: AREA LABELS LAYER — Display area info at centroid
// =============================================================================

const AreaLabelsLayer: React.FC = () => {
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const placedModules = useSolarStore(s => s.project.placedModules);
  const renameAreaFn = useSolarStore(s => s.renameArea);
  const selectEntityFn = useUIStore(s => s.selectEntity);

  // Only show in CONTEXT mode
  if (canvasViewMode !== 'CONTEXT') return null;

  const r = 6371000; // Earth radius

  const calcAreaM2 = (polygon: [number, number][]) => {
    if (polygon.length < 3) return 0;
    const p0 = polygon[0];
    const localCoords = polygon.map(p => {
      const dy = (p[0] - p0[0]) * (Math.PI / 180) * r;
      const dx = (p[1] - p0[1]) * (Math.PI / 180) * r * Math.cos(p0[0] * Math.PI / 180);
      return [dx, dy];
    });

    let area = 0;
    for (let i = 0; i < localCoords.length; i++) {
      const j = (i + 1) % localCoords.length;
      area += localCoords[i][0] * localCoords[j][1];
      area -= localCoords[j][0] * localCoords[i][1];
    }
    return Math.abs(area) / 2;
  };

  return (
    <>
      {installationAreas.map((area, idx) => {
        const areaM2 = calcAreaM2(area.polygon as any);
        const modulesCount = placedModules.filter(m => m.areaId === area.id).length;
        const areaName = area.name ?? `Área ${idx + 1}`;

        const labelIcon = L.divIcon({
          html: renderToStaticMarkup(
            <div style={{ pointerEvents: 'none', cursor: 'pointer' }} className="bg-slate-900/80 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-slate-300 whitespace-nowrap backdrop-blur-sm">
              <div className="font-bold text-indigo-400">{areaName}</div>
              <div className="text-slate-400">{areaM2.toFixed(1)}m² · {modulesCount} mod</div>
            </div>
          ),
          className: 'cursor-pointer',
          iconSize: [120, 42],
          iconAnchor: [60, 42]
        });

        return (
          <LeafletMarker
            key={`label-${area.id}`}
            position={area.center}
            icon={labelIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                selectEntityFn('area', area.id, areaName);
              },
              dblclick: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                const newName = window.prompt('Nome da área:', area.name ?? `Área ${idx + 1}`);
                if (newName !== null) {
                  renameAreaFn(area.id, newName);
                }
              }
            }}
          />
        );
      })}
    </>
  );
};

// =============================================================================
// SUB-COMPONENTS: STRINGING LAYERS
// =============================================================================


const StringPathOverlay: React.FC<{
  moduleIds: string[];
  placedModules: any[];
  mpptColorMap: Record<string, string>;
  onMissingCenterCount?: (count: number) => void;
}> = ({ moduleIds, placedModules, mpptColorMap, onMissingCenterCount }) => {
  // TASK 3: Build Manhattan-routed paths for all assigned strings
  const assignedPaths = useMemo(() => {
    const groups: Record<string, { color: string; positions: [number, number][]; manhattanPath: [number, number][]; arrows: Array<{ pos: [number, number]; angle: number }> }> = {};

    placedModules.forEach(m => {
      if (!m.stringData || !m.center) return;
      const key = `${m.stringData.inverterId}:${m.stringData.mpptId}`;
      if (!groups[key]) {
        groups[key] = { color: mpptColorMap[key] ?? '#6366f1', positions: [], manhattanPath: [], arrows: [] };
      }
      groups[key].positions.push(m.center as [number, number]);
    });

    // Sort by longitude (left to right) and generate Manhattan routing
    Object.values(groups).forEach(group => {
      group.positions.sort((a, b) => a[1] - b[1]); // Sort by lng

      // Build Manhattan path: for each pair [p1, p2], route as [p1, [p2[0], p1[1]], p2]
      const manhattan: [number, number][] = [];
      const arrows: Array<{ pos: [number, number]; angle: number }> = [];

      for (let i = 0; i < group.positions.length; i++) {
        const p1 = group.positions[i];
        manhattan.push(p1);

        if (i < group.positions.length - 1) {
          const p2 = group.positions[i + 1];
          const corner: [number, number] = [p2[0], p1[1]]; // Vertical first, then horizontal
          manhattan.push(corner);

          // Arrow at midpoint of horizontal segment
          const midLat = (corner[0] + p2[0]) / 2;
          const midLng = (corner[1] + p2[1]) / 2;
          const angle = p2[1] > corner[1] ? 90 : -90; // Right or left
          arrows.push({ pos: [midLat, midLng], angle });
        }
      }

      group.manhattanPath = manhattan;
      group.arrows = arrows;
    });

    return Object.entries(groups);
  }, [placedModules, mpptColorMap]);

  // [R4-03] MEDIUM: Compute count of geometrically orphaned modules
  const missingCenterCount = useMemo(() => {
    return placedModules.filter(m => {
      if (!m.stringData) return false;
      if (!m.center) return true;
      return m.center[0] === 0 && m.center[1] === 0;
    }).length;
  }, [placedModules]);

  React.useEffect(() => {
    if (onMissingCenterCount) {
      onMissingCenterCount(missingCenterCount);
    }
  }, [missingCenterCount, onMissingCenterCount]);

  // Current selection path (remains direct polyline, no routing)
  const selectionPositions = useMemo(() => {
    if (moduleIds.length < 2) return [];
    return moduleIds
      .map(id => placedModules.find(m => m.id === id)?.center)
      .filter(Boolean) as [number, number][];
  }, [moduleIds, placedModules]);

  return (
    <>
      {assignedPaths.map(([key, { color, manhattanPath, arrows }]) => (
        manhattanPath.length >= 2 && (
          <React.Fragment key={key}>
            <Polyline
              positions={manhattanPath as any}
              color={color}
              weight={2}
              opacity={0.7}
            />
            {/* TASK 3: Directional arrows */}
            {arrows.map((arrow, idx) => {
              const arrowIcon = L.divIcon({
                html: `<div style="width:8px;height:6px;transform:rotate(${arrow.angle}deg);"><svg viewBox="0 0 8 6" fill="${color}"><polygon points="0,0 8,3 0,6"/></svg></div>`,
                className: '',
                iconSize: [8, 6],
                iconAnchor: [4, 3]
              });
              return (
                <LeafletMarker
                  key={`${key}-arrow-${idx}`}
                  position={arrow.pos}
                  icon={arrowIcon}
                  interactive={false}
                />
              );
            })}
          </React.Fragment>
        )
      ))}
      {selectionPositions.length >= 2 && (
        <Polyline
          positions={selectionPositions as any}
          color="#22d3ee"
          weight={2.5}
          dashArray="5, 5"
          opacity={0.9}
        />
      )}
    </>
  );
};

const ModuleInteractionLayer: React.FC<{
  activeTool: string;
  placedModules: any[];
  selectedIds: string[];
  mpptColorMap: Record<string, string>;
  onToggle: (id: string) => void
}> = ({ activeTool, placedModules, selectedIds, mpptColorMap, onToggle }) => {
  if (activeTool !== 'STRINGING') return null;

  const getModuleColor = (mod: any): string => {
    if (selectedIds.includes(mod.id)) return "#22d3ee"; // selecionado agora
    if (mod.stringData) {
      const key = `${mod.stringData.inverterId}:${mod.stringData.mpptId}`;
      return mpptColorMap[key] ?? "#6366f1";
    }
    return "#4f46e5"; // livre
  };

  const getModuleFillOpacity = (mod: any): number => {
    if (selectedIds.includes(mod.id)) return 0.6;
    if (mod.stringData) return 0.45;
    return 0.15;
  };

  return (
    <>
      {placedModules.map(mod => {
        const fillColor = getModuleColor(mod);
        const fillOpacity = getModuleFillOpacity(mod);
        return (
          <LeafletPolygon
            key={mod.id}
            positions={mod.polygon}
            fillColor={fillColor}
            fillOpacity={fillOpacity}
            color={fillColor}
            weight={selectedIds.includes(mod.id) ? 2 : 1}
            eventHandlers={{ click: () => onToggle(mod.id) }}
          >
            {mod.stringData && (
              <Tooltip sticky>
                <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>
                  {`MPPT ${mod.stringData.mpptId}`}
                  {mod.stringData.stringId
                    ? ` · ${mod.stringData.stringId.startsWith('String ') ? mod.stringData.stringId : `str-${mod.stringData.stringId.slice(0, 4)}`}`
                    : ''}
                </span>
              </Tooltip>
            )}
          </LeafletPolygon>
        );
      })}
    </>
  );
};

// =============================================================================
// STRINGING QUICK POPOVER — Inline MPPT assignment popover
// =============================================================================

const StringingQuickPopover: React.FC<{
  selectedModuleIds: string[];
  placedModules: any[];
  techInverters: any[];
  catalogInvertersList: any[];
  onAssign: (moduleIds: string[], inverterId: string, mpptId: number, stringId: string) => void;
  onClear: () => void;
}> = ({ selectedModuleIds, placedModules, techInverters, catalogInvertersList, onAssign, onClear }) => {
  const activeTool = useUIStore(s => s.activeTool);
  const [popPos, setPopPos] = useState<{ x: number; y: number } | null>(null);

  const computePos = useCallback(() => {
    const map = globalLeafletMapRef.current;
    if (!map || selectedModuleIds.length === 0) { setPopPos(null); return; }
    const selected = selectedModuleIds.map(id => placedModules.find(m => m.id === id)).filter(Boolean) as any[];
    if (selected.length === 0) { setPopPos(null); return; }
    const avgLat = selected.reduce((s, m) => s + m.center[0], 0) / selected.length;
    const avgLng = selected.reduce((s, m) => s + m.center[1], 0) / selected.length;
    const pt = map.latLngToContainerPoint(L.latLng(avgLat, avgLng));
    // Clamp to stay inside canvas with 120px margin from edges
    const containerSize = map.getSize();
    const x = Math.max(80, Math.min(pt.x, containerSize.x - 80));
    const y = Math.max(60, Math.min(pt.y - 90, containerSize.y - 200));
    setPopPos({ x, y });
  }, [selectedModuleIds, placedModules]);

  useEffect(() => {
    computePos();
    const map = globalLeafletMapRef.current;
    if (!map) return;
    map.on('move zoom', computePos);
    return () => { map.off('move zoom', computePos); };
  }, [computePos]);

  if (activeTool !== 'STRINGING' || selectedModuleIds.length === 0 || !popPos || techInverters.length === 0) return null;

  const handleAssign = (inverterId: string, mpptId: number) => {
    const existingStringIds = new Set<string>(
      placedModules
        .filter(m => m.stringData?.inverterId === inverterId && m.stringData?.mpptId === mpptId && m.stringData?.stringId)
        .map(m => m.stringData!.stringId as string)
    );
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nextStringId = 'String A';
    for (let i = 0; i < letters.length; i++) {
      const candidate = `String ${letters[i]}`;
      if (!existingStringIds.has(candidate)) { nextStringId = candidate; break; }
    }
    onAssign(selectedModuleIds, inverterId, mpptId, nextStringId);
  };

  return (
    <div
      style={{ position: 'absolute', left: popPos.x, top: popPos.y, transform: 'translateX(-50%)', zIndex: 2000 }}
      className="pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-slate-950/98 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-2 min-w-[160px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">
            {selectedModuleIds.length} módulo{selectedModuleIds.length !== 1 ? 's' : ''} → MPPT
          </span>
          <button onClick={onClear} className="text-slate-600 hover:text-slate-300 transition-colors text-[10px]">✕</button>
        </div>
        {/* Arrow pointing down to modules */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-700/80" />
        {/* MPPT buttons grouped by inverter */}
        {techInverters.map((inv: any) => {
          const cat = catalogInvertersList.find((c: any) => c.id === inv.catalogId);
          const invLabel = cat?.model ?? inv.id.slice(0, 8);
          return (
            <div key={inv.id} className="mb-1">
              {techInverters.length > 1 && (
                <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1 mb-0.5">{invLabel}</div>
              )}
              <div className="flex flex-wrap gap-1">
                {inv.mpptConfigs.map((mppt: any) => {
                  const assignedCount = placedModules.filter(
                    m => m.stringData?.inverterId === inv.id && m.stringData?.mpptId === mppt.mpptId
                  ).length;
                  const configuredCapacity = (mppt.strings || []).reduce(
                    (acc: number, s: any) => acc + (s.modulesCount || mppt.modulesPerString || 0), 0
                  );
                  const isFull = configuredCapacity > 0 && assignedCount >= configuredCapacity;
                  return (
                    <button
                      key={mppt.mpptId}
                      onClick={() => handleAssign(inv.id, mppt.mpptId)}
                      className={cn(
                        "px-2 py-1 text-[9px] font-black uppercase rounded-md border transition-all",
                        isFull
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white"
                      )}
                    >
                      MPPT {mppt.mpptId}
                      {assignedCount > 0 && <span className="ml-0.5 text-[7px] opacity-60">{assignedCount}↑</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// ITEM 4: PLACE_MODULE PANEL — Painel de Configuração
// =============================================================================

const PlaceModulePanel: React.FC = () => {
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const { engineeringData, updateEngineeringData } = useSolarStore();
  const installationAreas = useSolarStore(s => s.project.installationAreas);
  const selectedAreaId = useUIStore(s => s.selectedEntity.type === 'area' ? s.selectedEntity.id : null);
  const autoLayoutArea = useSolarStore(s => s.autoLayoutArea);

  if (activeTool !== 'PLACE_MODULE') return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[1200] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl">
        {/* Orientação */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Orientação</span>
          <div className="flex gap-1">
            <button
              onClick={() => updateEngineeringData({ moduleOrientation: 'portrait' })}
              className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded transition-all",
                engineeringData.moduleOrientation === 'portrait' ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}
            >Retrato</button>
            <button
              onClick={() => updateEngineeringData({ moduleOrientation: 'landscape' })}
              className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded transition-all",
                engineeringData.moduleOrientation === 'landscape' ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}
            >Paisagem</button>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Aplicar */}
        <button
          onClick={() => {
            const targetId = selectedAreaId ?? installationAreas[0]?.id;
            if (targetId) { autoLayoutArea(targetId); setActiveTool('SELECT'); }
          }}
          disabled={installationAreas.length === 0}
          className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
        >
          Aplicar
        </button>

        {/* Cancelar */}
        <button onClick={() => setActiveTool('SELECT')} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS: ANATOMY VIEW
// =============================================================================

const AnatomyView: React.FC<{ isOpen: boolean; onClose: () => void; surfaceType: string; onSurfaceChange: (type: string) => void }> = ({ isOpen, onClose, surfaceType, onSurfaceChange }) => {
  // D4: sem early-return — usa CSS transition para slide (sheet lateral)

  const getAnatomyContent = (type: string) => {
    switch (type.toLowerCase()) {
      case 'metalico':
        return {
          title: 'Fixação Metálica',
          material: 'Alumínio Extrudado',
          spec: 'NBR 6123 (Vento)',
          svg: (
            <svg width="180" height="100" viewBox="0 0 180 100" className="drop-shadow-2xl">
              <path d="M 20 85 L 40 70 L 60 85 L 80 70 L 100 85 L 120 70 L 140 85" fill="none" stroke="#475569" strokeWidth="2" />
              <rect x="55" y="60" width="10" height="15" fill="#6366f1" />
              <rect x="35" y="55" width="50" height="5" fill="#6366f1" />
              <text x="5" y="15" className="text-[8px] font-mono fill-slate-500">Mini-Trilho EPDM</text>
            </svg>
          )
        };
      case 'fibrocimento':
        return {
          title: 'Haste Rosqueada',
          material: 'Aço Inox 304',
          spec: 'Vedação EPDM',
          svg: (
            <svg width="180" height="100" viewBox="0 0 180 100" className="drop-shadow-2xl">
              <line x1="10" y1="85" x2="170" y2="85" stroke="#475569" strokeWidth="3" />
              <rect x="88" y="40" width="4" height="45" fill="#6366f1" />
              <rect x="70" y="35" width="40" height="6" rx="2" fill="#6366f1" />
              <text x="5" y="15" className="text-[8px] font-mono fill-slate-500">Parafuso Prisioneiro</text>
            </svg>
          )
        };
      default:
        return {
          title: 'Gancho Ajustável',
          material: 'Alumínio 6063-T5',
          spec: 'Carga: 2.4 kN/m²',
          svg: (
            <svg width="180" height="100" viewBox="0 0 180 100" className="drop-shadow-2xl">
              <path d="M 10 85 Q 30 75 50 85 T 90 85 T 130 85 T 170 85" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 2" />
              <path d="M 85 85 L 85 65 L 110 65 L 110 55" fill="none" stroke="#6366f1" strokeWidth="4" />
              <rect x="80" y="50" width="60" height="5" fill="#6366f1" />
              <text x="5" y="15" className="text-[8px] font-mono fill-slate-500">Gancho Inox + Trilho</text>
            </svg>
          )
        };
    }
  };

  const content = getAnatomyContent(surfaceType);

  return (
    // D4: Sheet lateral direito — largura fixa, slide da borda, z abaixo do ViewSwitcher (z-[1200] vs z-[2000])
    <div className={cn(
      "absolute top-0 right-0 bottom-0 w-64 bg-slate-950/98 backdrop-blur-xl border-l border-slate-800 shadow-[-8px_0_32px_rgba(0,0,0,0.5)] z-[1200] overflow-hidden flex flex-col transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
    )}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Anatomia do Suporte</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Seletor de Superfície dentro da Anatomia (D4) */}
      <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/20">
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1.5">Mudar Superfície</span>
        <div className="grid grid-cols-2 gap-1">
          {[
            { value: 'ceramica', label: 'Cerâmica' },
            { value: 'metalico', label: 'Metálico' },
            { value: 'fibrocimento', label: 'Fibro' },
            { value: 'laje', label: 'Laje' }
          ].map(type => (
            <button
              key={type.value}
              onClick={() => onSurfaceChange(type.value)}
              className={cn(
                "px-1.5 py-1 text-[9px] font-black uppercase tracking-tight rounded-[2px] transition-all text-center",
                surfaceType === type.value
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-800 hover:text-slate-300 border border-slate-800"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        <div className="aspect-video bg-slate-900/50 border border-slate-800/50 rounded-sm flex items-center justify-center relative group">
          {content.svg}
          <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-500 uppercase">Título</span>
            <span className="text-indigo-400 font-bold text-right">{content.title}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-500 uppercase">Material</span>
            <span className="text-slate-300">{content.material}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-500 uppercase">Norma</span>
            <span className="text-emerald-500 font-bold">{content.spec}</span>
          </div>
        </div>
        <button 
          onClick={() => {
             const types = ['ceramica', 'metalico', 'fibrocimento', 'laje'];
             const next = types[(types.indexOf(surfaceType) + 1) % types.length];
             onSurfaceChange(next);
          }}
          className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-all font-mono"
        >
          Próximo Sistema
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// UNIFILAR LAYER — Self-contained wrapper for Layer 3 inside the arrangement
// Gathers all electrical data needed by UnifilarSchematicCanvas without
// coupling PhysicalCanvasView to ElectricalCanvasView internals.
// =============================================================================

const UnifilarLayer: React.FC = () => {
  const modules        = useSolarStore(selectModules);
  const invertersNorm  = useTechStore(state => state.inverters);
  const techInverters  = useMemo(() => toArray(invertersNorm), [invertersNorm]);

  const activeInverterId = useInverterUIStore(s => s.activeInverterId);
  const activeInverter   = useMemo(() => {
    if (activeInverterId) return techInverters.find(i => i.id === activeInverterId) ?? techInverters[0] ?? null;
    return techInverters[0] ?? null;
  }, [techInverters, activeInverterId]);

  const catalogInverters = useCatalogStore(s => s.inverters);
  const activeCatalogItem = useMemo(
    () => catalogInverters.find((c: InverterCatalogItem) => c.id === activeInverter?.catalogId),
    [catalogInverters, activeInverter],
  );

  const { tmin, tcellMax } = useThermalPremises();
  const { electrical }     = useElectricalValidation();

  const calcVmpCalor = useCallback((specs: any, modulesPerString: number): number => {
    if (!specs || modulesPerString <= 0) return 0;
    const tCoeffVmp = specs.tempCoeffVmp ?? specs.tempCoeffPmax ?? specs.tempCoeffVoc;
    return specs.vmp * (1 + (tCoeffVmp / 100) * (tcellMax - 25)) * modulesPerString;
  }, [tcellMax]);

  const mpptMetrics = useMemo((): Record<number, any> => {
    if (!activeInverter || modules.length === 0) return {};
    const result: Record<number, any> = {};
    activeInverter.mpptConfigs.forEach(mppt => {
      const specificModule = mppt.moduleModel ? modules.find(m => m.model === mppt.moduleModel) : modules[0];
      const specs = getModuleSpecs(specificModule);

      // Se não há specs, registrar entrada zerada para que a topologia apareça
      if (!specs) {
        result[mppt.mpptId] = {
          vocFrio: 0, vmpCalor: 0, iscTotal: 0, iscProtection: 0,
          impTotal: 0, powerKwp: 0, hasMismatch: false,
          unitVmp: 0, unitImp: 0, unitIsc: 0,
        };
        return;
      }

      const activeStrings = mppt.strings?.length ? mppt.strings :
        Array.from({ length: mppt.stringsCount || 0 }).map(() => ({ modulesCount: mppt.modulesPerString || 0 }));
      const strCount  = activeStrings.length;
      const maxMods   = strCount > 0 ? Math.max(...activeStrings.map(s => s.modulesCount)) : 0;
      const totalMods = activeStrings.reduce((acc, s) => acc + s.modulesCount, 0);

      const metrics  = maxMods > 0 ? calculateStringMetrics(specs, maxMods, tmin) : null;
      const vmpCalor = maxMods > 0 ? calcVmpCalor(specs, maxMods) : 0;

      const bifacialFactor = specs.isBifacial ? (1 + 0.70 * specs.albedo) : 1;
      const mpptEntry      = electrical?.entries?.find(e => e.mpptId === mppt.mpptId);
      const hasMismatch    = mpptEntry?.messages.some(m => m.includes('Sistema Multi-orientado')) || false;

      result[mppt.mpptId] = {
        vocFrio:       metrics?.vocMax ?? 0,
        vmpCalor,
        iscTotal:      (specs.isc || 0) * strCount * bifacialFactor,
        iscProtection: (specs.isc || 0) * strCount * bifacialFactor * 1.25,
        impTotal:      (specs.imp || 0) * strCount * bifacialFactor,
        powerKwp:      totalMods > 0 ? (specs.pmax * totalMods) / 1000 : 0,
        hasMismatch,
        unitVmp: specs.vmp,
        unitImp: specs.imp,
        unitIsc: (specs.isc || 0) * bifacialFactor,
        unitPmax: specs.pmax ?? (specs.vmp * (specs.imp ?? specs.isc * 0.95)),
        moduleModel: specificModule?.model ?? specificModule?.manufacturer ?? '',
      };
    });
    return result;
  }, [activeInverter, modules, tmin, calcVmpCalor, electrical]);

  const validationErrors = useMemo<Record<number, MpptValidationError>>(() => {
    const result: Record<number, MpptValidationError> = {};
    electrical?.entries?.forEach(entry => {
      if (entry.status !== 'ok' && entry.messages.length > 0) {
        result[entry.mpptId] = {
          severity: entry.status === 'error' ? 'error' : 'warn',
          messages: entry.messages,
        };
      }
    });
    return result;
  }, [electrical]);

  if (!activeInverter) {
    return (
      <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/95">
        <div className="flex flex-col gap-3 items-center text-center px-8">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Zap size={20} className="text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-400">Nenhum inversor configurado</p>
          <p className="text-xs text-slate-600">Acesse a aba <span className="font-bold text-slate-500">Inversores</span> para configurar o sistema elétrico.</p>
        </div>
      </div>
    );
  }

  return (
    <UnifilarSchematicCanvas
      inverter={activeInverter}
      catalogItem={activeCatalogItem}
      mpptMetrics={mpptMetrics}
      validationErrors={validationErrors}
    />
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const PhysicalCanvasView: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const canvasViewMode = useUIStore(s => s.canvasViewMode);
  const setCanvasViewMode = useUIStore(s => s.setCanvasViewMode);
  const satelliteOpacity = useUIStore(s => s.satelliteOpacity);
  const showGrid = useUIStore(s => s.showGrid);

  // Anatomia migrada de useState local → Zustand (persiste entre re-renders)
  const isAnatomyPanelOpen = useUIStore(s => s.isAnatomyPanelOpen);
  const closeAnatomyPanel = useUIStore(s => s.closeAnatomyPanel);

  const [drawingPoints, setDrawingPoints] = React.useState<[number, number][]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = React.useState<string[]>([]);
  const [missingCenterCount, setMissingCenterCount] = React.useState(0);

  // MELHORIA 1: Acesso aos inversores e catálogo para o picker de MPPT
  const techInvertersNorm = useTechStore(state => state.inverters);
  const techInverters = useMemo(() => toArray(techInvertersNorm), [techInvertersNorm]);
  const catalogInvertersList = useCatalogStore(s => s.inverters);

  // C3: FDI correto usando useTechKPIs
  const { kpi } = useTechKPIs();

  // B2: Validation health for statusbar badge
  const { globalHealth, unassignedModulesCount, orphanedSpecCount, orphanedInverterCount, emptyConfiguredMPPTCount } = useElectricalValidation();

  // Loader do canvas: controlado pelo MapReadyObserver via uiStore (sem timer local)
  const isMapLoading = useUIStore(
    s => s.isAppLoading && s.loadingContext === 'map-tiles'
  );


  const placedModules = useSolarStore(s => s.project.placedModules);
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];
  
  const moduleSpecs = useSolarStore(s => s.modules);
  const assignModulesToString = useSolarStore(s => s.assignModulesToString);
  const removePlacedModuleFn = useSolarStore(s => s.removePlacedModule);
  const spawnFreeformArea = useSolarStore(s => s.spawnFreeformArea);
  const spawnObstacle = useSolarStore(s => s.spawnObstacle);
  const selectedAreaId = useUIStore(s => s.selectedEntity.type === 'area' ? s.selectedEntity.id : null);
  const updateClientData = useSolarStore(s => s.updateClientData);

  // Fix 4: Remove duplicate techInvertersForMeta, use techInverters directly
  // [R5-03] LOW: Add hash signature of module counts as dependency to detect internal changes
  const mpptConfigSignature = useMemo(() =>
    techInverters.map(inv =>
      inv.mpptConfigs.map((m: any) =>
        (m.strings || []).map((s: any) => s.modulesCount || 0).join(',')
      ).join('|')
    ).join(';;'),
    [techInverters]
  );

  const modulosMeta = useMemo(() => {
    let total = 0;
    techInverters.forEach(inv => {
      inv.mpptConfigs.forEach((mppt: any) => {
        (mppt.strings || []).forEach((str: any) => { total += str.modulesCount || 0; });
      });
    });
    return total > 0 ? total : 0;
  }, [techInverters, mpptConfigSignature]);

  // Fix 7 & Fix 8: Electrical Calculation for String + maxInputVoltage
  const maxInputVoltage = useMemo(() => {
    if (techInverters.length === 0) return 800;
    // Use the first inverter's catalog entry as reference
    const firstInv = techInverters[0];
    const cat = catalogInvertersList.find(c => c.id === firstInv.catalogId);
    return (cat as any)?.maxInputVoltage ?? 800;
  }, [techInverters, catalogInvertersList]);

  const stringElectrical = useMemo(() => {
    if (!selectedModuleIds || selectedModuleIds.length === 0) return { voc: 0, isc: 0 };

    const firstMod = placedModules.find(m => m.id === selectedModuleIds[0]);
    if (!firstMod || !firstMod.moduleSpecId) return { voc: 0, isc: 0 };

    const spec = moduleSpecs.entities[firstMod.moduleSpecId];
    if (!spec) return { voc: 0, isc: 0 };

    // Fix 7: Clean zero-based (no magic fallbacks)
    const vocBase = spec.voc ?? 0;
    const iscBase = spec.isc ?? 0;

    return {
      voc: vocBase * selectedModuleIds.length,
      isc: iscBase
    };
  }, [selectedModuleIds, placedModules, moduleSpecs]);

  // Area & Perimeter Calculation
  const stats = useMemo(() => {
    const r = 6371000;
    const calcPathArea = (pts: [number, number][]) => {
      if (pts.length < 3) return 0;
      const p0 = pts[0];
      const localCoords = pts.map(p => {
        const dy = (p[0] - p0[0]) * (Math.PI / 180) * r;
        const dx = (p[1] - p0[1]) * (Math.PI / 180) * r * Math.cos(p0[0] * Math.PI / 180);
        return [dx, dy];
      });

      let area = 0;
      for (let i = 0; i < localCoords.length; i++) {
         const j = (i + 1) % localCoords.length;
         area += localCoords[i][0] * localCoords[j][1];
         area -= localCoords[j][0] * localCoords[i][1];
      }
      return Math.abs(area) / 2;
    };

    const calcPathLength = (pts: [number, number][]) => {
      let len = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        const dLat = (p2[0] - p1[0]) * (Math.PI / 180) * r;
        const dLng = (p2[1] - p1[1]) * (Math.PI / 180) * r * Math.cos(p1[0] * Math.PI / 180);
        len += Math.sqrt(dLat * dLat + dLng * dLng);
      }
      return len;
    };

    // Current Drawing Stats
    const drawingArea = calcPathArea(drawingPoints);
    const drawingLen = calcPathLength(drawingPoints);

    // Global Project Stats
    let totalArea = 0;
    let obstacleArea = 0;

    installationAreas.forEach(area => {
      // Area total do polígono principal
      // Nota: as áreas já estão em vertices locais métricos no projectSlice se viermos de lá, 
      // mas aqui recalculamos do LatLng para consistência na UI.
      totalArea += calcPathArea(area.polygon);
      
      // Subtrair todas as obstruções
      area.obstacles.forEach(obs => {
        obstacleArea += calcPathArea(obs.polygon);
      });
    });

    return {
      areaTot: totalArea,
      areaUtil: Math.max(0, totalArea - obstacleArea),
      modulos: placedModules.length,
      currentDraw: {
        area: drawingArea,
        length: drawingLen
      }
    };
  }, [drawingPoints, installationAreas, placedModules]);

  // Item 5: Cálculo de kWp total instalado
  const totalKwp = useMemo(() => {
    if (placedModules.length === 0) return 0;
    return placedModules.reduce((sum, m) => {
      if (!m.moduleSpecId) return sum;
      const spec = moduleSpecs.entities[m.moduleSpecId];
      if (!spec) return sum;
      // Use vmp * imp for power if pmax not available
      const power = (spec as any).pmax ?? (spec.vmp * (spec.imp ?? spec.isc * 0.95));
      return sum + (power / 1000);
    }, 0);
  }, [placedModules, moduleSpecs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: ignore when focus is in an input field
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const k = e.key.toLowerCase();
      if (e.key === 'Escape') { setDrawingPoints([]); setActiveTool('SELECT'); }

      // Undo/Redo (TASK 5)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useSolarStore.temporal.getState().undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useSolarStore.temporal.getState().redo();
      }

      // Viewport Modes
      if (e.key === '1') setCanvasViewMode('CONTEXT');
      if (e.key === '2') setCanvasViewMode('DIAGRAM');
      if (e.key === '3') setCanvasViewMode('UNIFILAR');

      // Universal Tools
      if (k === 's') setActiveTool('SELECT');
      if (k === 'g') setActiveTool('MOVE');
      if (k === 'h') setActiveTool('PAN');

      // Layer Tools
      if (k === 'p') setActiveTool('POLYGON');
      if (k === 'b') setActiveTool('SUBTRACT');
      if (k === 'd') setActiveTool('DROP_POINT');
      if (k === 'm') setActiveTool('MEASURE');
      if (k === 'q') setActiveTool('STRINGING');
      if (k === 'f') setActiveTool('PLACE_MODULE');

      if (e.key === 'Enter' && drawingPoints.length >= 3) {
        if (activeTool === 'POLYGON') {
          spawnFreeformArea(drawingPoints);
          setDrawingPoints([]);
          setActiveTool('SELECT');
        } else if (activeTool === 'SUBTRACT') {
          // D01: Guard — can't subtract without a selected area
          if (!selectedAreaId) {
            // Points remain so user can select correct area
            return;
          }
          spawnObstacle(selectedAreaId, drawingPoints);
          setDrawingPoints([]);
          setActiveTool('SELECT');
        }
      }

      // Delete/Backspace — remove selected modules in STRINGING mode
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeTool === 'STRINGING' && selectedModuleIds.length > 0) {
        e.preventDefault();
        selectedModuleIds.forEach(id => removePlacedModuleFn(id));
        setSelectedModuleIds([]);
      }

      // Ctrl+A — select all modules in the selected area (or all modules)
      if ((e.ctrlKey || e.metaKey) && k === 'a' && activeTool === 'STRINGING') {
        e.preventDefault();
        const targetAreaId = selectedAreaId;
        const allIds = targetAreaId
          ? placedModules.filter(m => m.areaId === targetAreaId).map(m => m.id)
          : placedModules.map(m => m.id);
        setSelectedModuleIds(allIds);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingPoints, setActiveTool, setCanvasViewMode, activeTool, selectedAreaId, spawnFreeformArea, spawnObstacle, selectedModuleIds, placedModules, removePlacedModuleFn]);

  // B3: Limpar seleção de módulos ao sair de STRINGING
  useEffect(() => {
    if (activeTool !== 'STRINGING') {
      setSelectedModuleIds([]);
    }
  }, [activeTool]);

  const isDrawingActive = activeTool === 'POLYGON' || activeTool === 'SUBTRACT';
  const isDropPointActive = activeTool === 'DROP_POINT';
  const isMeasureActive = activeTool === 'MEASURE';
  const isStringingActive = selectedModuleIds.length > 0;
  const isPlaceModuleActive = activeTool === 'PLACE_MODULE';

  // C02: Stable mpptColorMap — only recomputes when unique MPPT assignments change (not all module IDs)
  const mpptColorMap = useMemo(() => {
    const uniqueMpptKeys = new Set<string>();
    placedModules.forEach(m => {
      if (!m.stringData) return;
      uniqueMpptKeys.add(`${m.stringData.inverterId}:${m.stringData.mpptId}`);
    });

    const sortedKeys = Array.from(uniqueMpptKeys).sort();
    const map: Record<string, string> = {};
    sortedKeys.forEach((key, idx) => {
      map[key] = MPPT_HUD_COLORS[idx % MPPT_HUD_COLORS.length];
    });
    return map;
  }, [placedModules]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* ── D1: TopRibbon local ELIMINADO — canvas começa direto ── */}

      <div className="flex-1 flex min-h-0 relative bg-slate-950/20">
        {/* C1: SearchIsland — só em CONTEXT */}
        {canvasViewMode === 'CONTEXT' && <SearchIsland />}

        {/* ── STACK DE ILHAS (Lado Esquerdo) ── */}
        <div className="absolute left-6 top-24 flex flex-col gap-3 items-center z-[1100]">
          {canvasViewMode === 'CONTEXT' && (
            <>
              <ManipulationIsland />
              {/* Item 6b: Separador entre ilhas */}
              <div className="w-6 h-px bg-slate-800/50" />
              <NavigationIsland />
              <div className="w-6 h-px bg-slate-800/50" />
              <VisionIsland />
              <div className="w-6 h-px bg-slate-800/50" />
            </>
          )}
          <DraftingIsland />
        </div>

        <div className="flex-1 relative min-w-0 bg-slate-950 overflow-hidden">
          {/* Loader do canvas — controlado pelo MapReadyObserver via uiStore */}
          {isMapLoading && (
            <NeonorteLoader
              size="panel"
              message="Carregando mapa..."
            />
          )}

          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              (canvasViewMode === 'DIAGRAM' || canvasViewMode === 'UNIFILAR') ? "opacity-0 pointer-events-none" : ""
            )}
            style={(canvasViewMode === 'CONTEXT') ? { opacity: satelliteOpacity / 100 } : undefined}
          >
            <MapCore activeTool={activeTool}>
              <WebGLOverlay />
              <DrawingEngine activeTool={activeTool} points={drawingPoints} setPoints={setDrawingPoints} />
              <SafeEdgeOverlay points={drawingPoints} />
              <ObstacleLayer areas={installationAreas} />
              {/* Item 2: Box-select para STRINGING */}
              {activeTool === 'STRINGING' && (
                <BoxSelectLayer
                  placedModules={placedModules}
                  onSelectModules={(ids, additive) => {
                    setSelectedModuleIds(prev => additive ? [...new Set([...prev, ...ids])] : ids);
                  }}
                />
              )}
              <AreaLabelsLayer />
              <DropPointLayer />
              <PolygonEditLayer />
              <ModuleInteractionLayer
                activeTool={activeTool}
                placedModules={placedModules}
                selectedIds={selectedModuleIds}
                mpptColorMap={mpptColorMap}
                onToggle={(id) => {
                  setSelectedModuleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                }}
              />
              <StringPathOverlay
                moduleIds={selectedModuleIds}
                placedModules={placedModules}
                mpptColorMap={mpptColorMap}
                onMissingCenterCount={setMissingCenterCount}
              />
            </MapCore>
          </div>

          {/* Layer 2: Diagrama de Blocos (Topologia) */}
          {canvasViewMode === 'DIAGRAM' && (
            <div className="absolute inset-0 z-[10] animate-in fade-in zoom-in-95 duration-500">
               <DiagramCanvasView />
            </div>
          )}

          {/* Layer 3: Diagrama Unifilar (IEC 60617 / NBR 16690) */}
          {canvasViewMode === 'UNIFILAR' && (
            <div className="absolute inset-0 z-[10] animate-in fade-in zoom-in-95 duration-500">
               <UnifilarLayer />
            </div>
          )}

          <div
            className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-500",
              showGrid ? "opacity-10" : "opacity-0"
            )}
            style={{ backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
          />
          
          {/* Seletor de Camadas — alinhado à esquerda, acima da MainActionIsland */}
          <ViewLayerSelector />

          {/* D5: HUDs de CAD e Stringing REMOVIDOS do canvas — agora no footer */}

          {/* D4: AnatomyView como sheet lateral direito — não colide com ViewSwitcher */}
          <AnatomyView
            isOpen={isAnatomyPanelOpen}
            onClose={closeAnatomyPanel}
            surfaceType={clientData.roofType || 'ceramica'}
            onSurfaceChange={(type) => updateClientData({ roofType: type as any })}
          />

          {/* Item 4: PlaceModulePanel floating config */}
          <PlaceModulePanel />

          {/* Fix 1: HUD: Status de Stringing por MPPT - wrapped in conditional */}
          {canvasViewMode === 'CONTEXT' && (() => {
            const assignedModules = placedModules.filter(m => m.stringData);
            if (assignedModules.length === 0) return null;
            const byMppt: Record<string, { inverterId: string; mpptId: number; count: number }> = {};
            assignedModules.forEach(m => {
              if (!m.stringData) return;
              const key = `${m.stringData.inverterId}:${m.stringData.mpptId}`;
              if (!byMppt[key]) byMppt[key] = { ...m.stringData, count: 0 };
              byMppt[key].count++;
            });
            const entries = Object.values(byMppt);
            return (
              <div className="absolute bottom-4 left-[76px] z-[1100] flex flex-col gap-1 pointer-events-none">
                {entries.map((e, i) => (
                  <div
                    key={`${e.inverterId}:${e.mpptId}`}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/90 backdrop-blur-sm border border-slate-800 rounded-full"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: MPPT_HUD_COLORS[i % MPPT_HUD_COLORS.length] }}
                    />
                    <span className="text-[8px] font-black font-mono text-slate-400 uppercase">
                      MPPT {e.mpptId} — {e.count} mod
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* L0-A: Map Style Switcher */}
          <MapStyleSwitcher />
          <SatelliteOpacityControl />

          {/* Fix 1: Camera button - wrapped in conditional */}
          {canvasViewMode === 'CONTEXT' && (
            <div className="absolute bottom-4 right-4 z-[1100]">
              <button
                disabled
                title="Bancada de Fotos (em breve)"
                className="flex items-center justify-center p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg transition-all group relative cursor-not-allowed opacity-40"
              >
                <Camera size={18} className="text-slate-500 transition-colors" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[7px] font-black text-white shadow-lg">0</div>
              </button>
            </div>
          )}

          {/* Stringing Quick Popover — MUST be inside flex-1 relative min-w-0 */}
          {activeTool === 'STRINGING' && (
            <StringingQuickPopover
              selectedModuleIds={selectedModuleIds}
              placedModules={placedModules}
              techInverters={techInverters}
              catalogInvertersList={catalogInvertersList}
              onAssign={(moduleIds, inverterId, mpptId, stringId) => {
                assignModulesToString(moduleIds, inverterId, mpptId, stringId);
                setSelectedModuleIds([]);
                setActiveTool('SELECT');
              }}
              onClear={() => setSelectedModuleIds([])}
            />
          )}
        </div>
      </div>

      <div className="h-10 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center px-4 z-[1100]">
        {isDrawingActive ? (
          /* CAD Mode HUD */
          <div className="flex-1 flex items-center gap-4 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest font-mono">
                CAD MODE — {drawingPoints.length} vértice{drawingPoints.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setDrawingPoints([]); setActiveTool('SELECT'); }}
                className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-sm transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={drawingPoints.length < 3 || (activeTool === 'SUBTRACT' && !selectedAreaId)}
                onClick={() => {
                  if (drawingPoints.length >= 3) {
                    if (activeTool === 'POLYGON') spawnFreeformArea(drawingPoints);
                    else if (activeTool === 'SUBTRACT' && selectedAreaId) spawnObstacle(selectedAreaId, drawingPoints);
                    setDrawingPoints([]);
                    setActiveTool('SELECT');
                  }
                }}
                className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {activeTool === 'SUBTRACT' && !selectedAreaId ? 'Selecione uma Área' : 'Finalizar (Enter)'}
              </button>
            </div>
          </div>
        ) : activeTool === 'STRINGING' && selectedModuleIds.length === 0 ? (
          /* Fix 6: STRINGING hint when 0 modules selected */
          <div className="flex-1 flex items-center gap-4 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest font-mono">
                STRINGING ATIVO — Clique nos módulos para selecionar
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => setActiveTool('SELECT')}
              className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-sm transition-all"
            >
              Sair (Esc)
            </button>
          </div>
        ) : isStringingActive ? (
          /* Stringing HUD */
          <div className="flex-1 flex items-center gap-6 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter leading-none">Configurando String</span>
                <span className="text-cyan-400 font-black text-xs uppercase tracking-widest">{selectedModuleIds.length} Módulos</span>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-6 tabular-nums">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Voc Total</span>
                {/* Fix 7 & Fix 8: Voc with '--' fallback and dynamic threshold */}
                <span className={cn("font-bold text-xs", stringElectrical.voc > 0 && stringElectrical.voc > maxInputVoltage ? "text-rose-400" : "text-slate-200")}>
                  {stringElectrical.voc > 0 ? `${stringElectrical.voc.toFixed(2)}V` : '--'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Isc</span>
                {/* Fix 7: Isc with '--' fallback */}
                <span className="text-slate-200 font-bold text-xs">
                  {stringElectrical.isc > 0 ? `${stringElectrical.isc.toFixed(2)}A` : '--'}
                </span>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedModuleIds([])} className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-colors">Limpar</button>
            </div>
          </div>
        ) : isDropPointActive ? (
          /* Drop Point Mode HUD */
          <div className="flex-1 flex items-center gap-4 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest font-mono">
                POSICIONAR SAÍDA CC — Clique no mapa para marcar o ponto de saída
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <button
               onClick={() => setActiveTool('SELECT')}
               className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        ) : isMeasureActive ? (
          /* Measure Mode HUD */
          <div className="flex-1 flex items-center gap-6 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">
                MÉTRICA INTELIGENTE — {drawingPoints.length} ponto{drawingPoints.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-6 tabular-nums">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Comprimento Total</span>
                <span className="text-slate-200 font-bold text-xs">{stats.currentDraw.length.toFixed(2)}m</span>
              </div>
              {drawingPoints.length >= 3 && (
                <div className="flex flex-col animate-in zoom-in-95 duration-200">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter text-emerald-500/80">Área Fechada</span>
                  <span className="text-emerald-400 font-bold text-xs">{stats.currentDraw.area.toFixed(2)}m²</span>
                </div>
              )}
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-4">
               <button
                  onClick={() => setDrawingPoints([])}
                  className="text-slate-500 hover:text-slate-300 transition-colors uppercase text-[9px] font-black"
               >
                 Limpar
               </button>
               <button
                  onClick={() => setActiveTool('SELECT')}
                  className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/50 rounded-sm transition-all"
               >
                 Sair (Esc)
               </button>
            </div>
          </div>
        ) : isPlaceModuleActive ? (
          /* L1-C: PLACE_MODULE HUD */
          <div className="flex-1 flex items-center gap-4 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest font-mono">
                PREENCHER ÁREA — Clique em uma área de instalação
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 uppercase font-black">Orientação</span>
              <span className="text-indigo-400 text-[10px] font-bold">
                {useSolarStore.getState().engineeringData.moduleOrientation === 'portrait' ? 'Retrato' : 'Paisagem'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => setActiveTool('SELECT')}
              className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-sm transition-all"
            >
              Cancelar (Esc)
            </button>
          </div>
        ) : selectedAreaId && activeTool === 'SELECT' ? (
          /* Area Selected HUD */
          <div className="flex-1 flex items-center gap-4 font-mono text-[11px] h-full animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest font-mono">
                {installationAreas.find(a => a.id === selectedAreaId)?.name ?? `Área selecionada`}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-slate-500 uppercase font-black">Arrastar ponto central = Mover</span>
              <span className="text-slate-700">·</span>
              <span className="text-[9px] text-slate-500 uppercase font-black">Delete = Excluir</span>
              <span className="text-slate-700">·</span>
              <span className="text-[9px] text-slate-500 uppercase font-black">Duplo-clique label = Renomear</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => {
                const count = placedModules.filter(m => m.areaId === selectedAreaId).length;
                const ok = count === 0 || window.confirm(`Esta área contém ${count} módulo(s). Confirmar exclusão?`);
                if (ok) {
                  useSolarStore.getState().deleteArea(selectedAreaId);
                  useUIStore.getState().clearSelection();
                }
              }}
              className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 rounded-sm transition-all"
            >
              Excluir Área
            </button>
          </div>
        ) : (
          /* Item 5: Estado padrão simplificado */
          <div className="flex-1 flex items-center gap-6 font-mono text-[11px] tabular-nums tracking-wider h-full">
            <div className="flex items-center gap-4">
              {/* Item 5: kWp instalado */}
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-600 font-black uppercase text-[9px]">kWp</span>
                <span className="text-indigo-400 font-bold">{totalKwp > 0 ? totalKwp.toFixed(2) : '--'}</span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              {/* Item 5: Útil (área mais relevante) */}
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Útil</span><span className="text-emerald-400 font-bold">{stats.areaUtil.toFixed(1)}m²</span></div>
              {/* Mods X/Y mantido */}
              <div className="flex gap-1.5 items-center">
                <span className="text-slate-600 font-black uppercase text-[9px]">Mods</span>
                <span className={cn("font-bold", stats.modulos < modulosMeta ? "text-amber-400" : "text-indigo-400")}>{stats.modulos}/{modulosMeta}</span>
              </div>
              {/* FDI mantido */}
              <div className="flex gap-1.5 items-center">
                <span className="text-slate-600 font-black uppercase text-[9px]">FDI</span>
                <span className={cn(
                  "font-bold",
                  kpi.dcAcRatio === 0 ? "text-slate-500" :
                  kpi.dcAcRatio > 1.35 ? "text-rose-400" :
                  kpi.dcAcRatio < 0.75 ? "text-amber-400" :
                  "text-emerald-400"
                )}>
                  {kpi.dcAcRatio > 0 ? kpi.dcAcRatio.toFixed(2) : '--'}
                </span>
              </div>
              {/* C02: Warning for modules with stringData but no center */}
              {missingCenterCount > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-700/50 text-slate-400 border border-slate-700">
                  <span>⚠</span>
                  <span>{missingCenterCount} sem coord.</span>
                </div>
              )}
              {/* Validation health indicator */}
              {(() => {
                const issueLabels: string[] = [];
                if (orphanedSpecCount > 0) issueLabels.push(`${orphanedSpecCount} spec↑`);
                if (orphanedInverterCount > 0) issueLabels.push(`${orphanedInverterCount} inv↑`);
                if (unassignedModulesCount > 0) issueLabels.push(`${unassignedModulesCount} s/str`);
                if (emptyConfiguredMPPTCount > 0) issueLabels.push(`${emptyConfiguredMPPTCount} MPPT∅`);

                const displayLabels = issueLabels.slice(0, 2);
                const extraCount = issueLabels.length - displayLabels.length;
                const badgeText = displayLabels.join(' · ') + (extraCount > 0 ? ` +${extraCount}` : '');
                const hasIssues = globalHealth !== 'ok' || issueLabels.length > 0;

                return hasIssues ? (
                  <div className={cn(
                    "flex gap-1.5 items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                    globalHealth === 'error' || orphanedSpecCount > 0 || orphanedInverterCount > 0
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  )}>
                    <span>{globalHealth === 'error' || orphanedSpecCount > 0 || orphanedInverterCount > 0 ? '✕' : '⚠'}</span>
                    <span>{badgeText || 'Verificar elétrico'}</span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4 h-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Motor On-Thread</span>
        </div>
      </div>
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; } `}</style>
    </div>
  );
};
