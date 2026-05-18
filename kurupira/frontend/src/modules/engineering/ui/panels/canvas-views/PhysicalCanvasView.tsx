import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Hash,
  X,
  Camera,
  MapPin,
  Zap,
  type LucideIcon
} from 'lucide-react';
import { 
  useMapEvents, 
  Polyline, 
  Marker as LeafletMarker, 
  Tooltip, 
  Polygon as LeafletPolygon
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
import { MapCore } from '../../../components/MapCore';
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

  if ((activeTool !== 'POLYGON' && activeTool !== 'SUBTRACT' && activeTool !== 'MEASURE') || points.length === 0) return null;

  const color = activeTool === 'SUBTRACT' ? "#f43f5e" : activeTool === 'MEASURE' ? "#10b981" : "#6366f1";

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
        return (
          <React.Fragment key={i}>
            <LeafletMarker position={p} icon={L.divIcon({ className: activeTool === 'SUBTRACT' ? 'bg-rose-500 border-2 border-white rounded-full' : 'bg-white border-2 border-indigo-600 rounded-full', iconSize: [8, 8], iconAnchor: [4, 4] })} />
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
// SUB-COMPONENTS: STRINGING LAYERS
// =============================================================================


const StringPathOverlay: React.FC<{
  moduleIds: string[];
  placedModules: any[];
  mpptColorMap: Record<string, string>;
  onMissingCenterCount?: (count: number) => void;
}> = ({ moduleIds, placedModules, mpptColorMap, onMissingCenterCount }) => {
  // Build paths for all assigned strings
  const assignedPaths = useMemo(() => {
    const groups: Record<string, { color: string; positions: [number, number][] }> = {};
    placedModules.forEach(m => {
      if (!m.stringData || !m.center) return;
      const key = `${m.stringData.inverterId}:${m.stringData.mpptId}`;
      if (!groups[key]) {
        groups[key] = { color: mpptColorMap[key] ?? '#6366f1', positions: [] };
      }
      groups[key].positions.push(m.center as [number, number]);
    });
    return Object.entries(groups);
  }, [placedModules, mpptColorMap]);

  // [R4-03] MEDIUM: Compute count of geometrically orphaned modules
  // Detect both !m.center AND center = [0,0] (invalid default coordinates)
  const missingCenterCount = useMemo(() => {
    return placedModules.filter(m => {
      if (!m.stringData) return false;
      if (!m.center) return true;
      // [0,0] is invalid coordinate (Equator/Prime Meridian)
      return m.center[0] === 0 && m.center[1] === 0;
    }).length;
  }, [placedModules]);

  // Report count to parent
  React.useEffect(() => {
    if (onMissingCenterCount) {
      onMissingCenterCount(missingCenterCount);
    }
  }, [missingCenterCount, onMissingCenterCount]);

  // Current selection path
  const selectionPositions = useMemo(() => {
    if (moduleIds.length < 2) return [];
    return moduleIds
      .map(id => placedModules.find(m => m.id === id)?.center)
      .filter(Boolean) as [number, number][];
  }, [moduleIds, placedModules]);

  return (
    <>
      {assignedPaths.map(([key, { color, positions }]) => (
        positions.length >= 2 && (
          <Polyline
            key={key}
            positions={positions as any}
            color={color}
            weight={1.5}
            dashArray="3, 6"
            opacity={0.5}
          />
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

  // Anatomia migrada de useState local → Zustand (persiste entre re-renders)
  const isAnatomyPanelOpen = useUIStore(s => s.isAnatomyPanelOpen);
  const closeAnatomyPanel = useUIStore(s => s.closeAnatomyPanel);

  const [drawingPoints, setDrawingPoints] = React.useState<[number, number][]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = React.useState<string[]>([]);
  const [stringingPickerOpen, setStringingPickerOpen] = useState(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: ignore when focus is in an input field
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const k = e.key.toLowerCase();
      if (e.key === 'Escape') { setDrawingPoints([]); setActiveTool('SELECT'); }

      // Viewport Modes
      if (e.key === '1') setCanvasViewMode('CONTEXT');
      if (e.key === '2') setCanvasViewMode('BLUEPRINT');
      if (e.key === '3') setCanvasViewMode('DIAGRAM');
      if (e.key === '4') setCanvasViewMode('UNIFILAR');

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingPoints, setActiveTool, setCanvasViewMode, activeTool, selectedAreaId, spawnFreeformArea, spawnObstacle]);

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

  // C03: More granular mpptColorMap dependency — only recompute when stringData assignments change
  const mpptColorSig = useMemo(() =>
    placedModules
      .filter(m => m.stringData)
      .map(m => `${m.id}:${m.stringData!.inverterId}:${m.stringData!.mpptId}`)
      .sort()
      .join('|'),
    [placedModules]
  );

  const mpptColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIdx = 0;
    placedModules.forEach(m => {
      if (!m.stringData) return;
      const key = `${m.stringData.inverterId}:${m.stringData.mpptId}`;
      if (!(key in map)) { map[key] = MPPT_HUD_COLORS[colorIdx++ % MPPT_HUD_COLORS.length]; }
    });
    return map;
  }, [mpptColorSig]);

  // MPPT Picker — exibido ao confirmar stringing
  const StringingMpptPicker = stringingPickerOpen && selectedModuleIds.length > 0 ? (
    <div className="absolute inset-0 z-[2000] flex items-end justify-center pb-16 pointer-events-none">
      <div
        className="pointer-events-auto bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-4 w-[360px] animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">
            Atribuir {selectedModuleIds.length} módulo{selectedModuleIds.length !== 1 ? 's' : ''} ao MPPT
          </span>
          <button onClick={() => setStringingPickerOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        {/* D03: Aviso de reassociação com origem das strings */}
        {(() => {
          const assignedModules = selectedModuleIds
            .map(id => placedModules.find(m => m.id === id))
            .filter(m => m?.stringData);

          if (assignedModules.length === 0) return null;

          const sourceStrings = [...new Set(
            assignedModules.map(m => {
              const sd = m!.stringData!;
              const inv = techInverters.find(i => i.id === sd.inverterId);
              const invLabel = inv
                ? (catalogInvertersList.find((c: any) => c.id === inv.catalogId)?.model ?? `Inv ${sd.inverterId.slice(0, 6)}`)
                : `Inv ${sd.inverterId.slice(0, 6)}`;
              return `${invLabel} › MPPT ${sd.mpptId}`;
            })
          )];

          return (
            <div className="mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-[9px] text-amber-400 font-bold uppercase tracking-wider">
              ⚠ {assignedModules.length} módulo(s) de {sourceStrings.join(', ')} serão reassociados
            </div>
          );
        })()}
        {techInverters.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-4">
            Nenhum inversor configurado. Vá para a aba Inversores.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
            {techInverters.map(inv => {
              const cat = catalogInvertersList.find(c => c.id === inv.catalogId);
              return (
                <div key={inv.id} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {cat?.model ?? inv.snapshot?.model ?? inv.id}
                  </div>
                  <div className="flex flex-wrap gap-1 p-2">
                    {inv.mpptConfigs.map(mppt => {
                      const assignedCount = placedModules.filter(
                        m => m.stringData?.inverterId === inv.id && m.stringData?.mpptId === mppt.mpptId
                      ).length;
                      const stringCount = mppt.strings?.length ?? 0;
                      const configuredCapacity = (mppt.strings || []).reduce((acc, s) => acc + (s.modulesCount || mppt.modulesPerString || 0), 0);
                      const remaining = Math.max(0, configuredCapacity - assignedCount);
                      return (
                        <button
                          key={mppt.mpptId}
                          onClick={() => {
                            // Compute next available stringId within this MPPT
                            const existingStringIds = new Set(
                              placedModules
                                .filter(m => m.stringData?.inverterId === inv.id && m.stringData?.mpptId === mppt.mpptId && m.stringData?.stringId)
                                .map(m => m.stringData!.stringId as string)
                            );
                            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                            let nextStringId = 'String A';
                            for (let i = 0; i < letters.length; i++) {
                              const candidate = `String ${letters[i]}`;
                              if (!existingStringIds.has(candidate)) { nextStringId = candidate; break; }
                            }
                            assignModulesToString(selectedModuleIds, inv.id, mppt.mpptId, nextStringId);
                            setSelectedModuleIds([]);
                            setActiveTool('SELECT');
                            setStringingPickerOpen(false);
                          }}
                          className="px-2 py-1 text-[9px] font-black uppercase rounded border border-slate-700 bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-slate-400 transition-all"
                        >
                          <span>MPPT {mppt.mpptId}</span>
                          {stringCount > 0 && <span className="opacity-60"> · {stringCount} str</span>}
                          <span className="ml-1 flex items-center gap-0.5">
                            {assignedCount > 0 && (
                              <span className="px-1 rounded bg-indigo-500/20 text-indigo-300 text-[8px] font-mono">
                                {assignedCount}↑
                              </span>
                            )}
                            {configuredCapacity > 0 && remaining > 0 && (
                              <span className="px-1 rounded bg-slate-600/40 text-slate-400 text-[8px] font-mono">
                                {remaining}↓
                              </span>
                            )}
                            {configuredCapacity > 0 && remaining === 0 && assignedCount > 0 && (
                              <span className="px-1 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-mono">✓</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={() => setStringingPickerOpen(false)}
          className="mt-3 w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors border border-slate-800 rounded-md"
        >
          Cancelar
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* ── D1: TopRibbon local ELIMINADO — canvas começa direto ── */}

      <div className="flex-1 flex min-h-0 relative bg-slate-950/20">
        {/* C1: SearchIsland — só em CONTEXT/BLUEPRINT */}
        {(canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT') && <SearchIsland />}

        {/* ── STACK DE ILHAS (Lado Esquerdo) ── */}
        <div className="absolute left-6 top-24 flex flex-col gap-3 items-center z-[1100]">
          {(canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT') && <ManipulationIsland />}
          {(canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT') && <NavigationIsland />}
          {(canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT') && <VisionIsland />}
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

          <div className={cn(
            "absolute inset-0 transition-all duration-700 ease-in-out", 
            (canvasViewMode === 'BLUEPRINT') ? "brightness-[0.4] saturate-0 opacity-60" : 
            (canvasViewMode === 'DIAGRAM' || canvasViewMode === 'UNIFILAR') ? "brightness-0 opacity-0" :
            "brightness-100 saturate-100 opacity-100"
          )}>
            <MapCore activeTool={activeTool}>
              <WebGLOverlay />
              <DrawingEngine activeTool={activeTool} points={drawingPoints} setPoints={setDrawingPoints} />
              <SafeEdgeOverlay points={drawingPoints} />
              <ObstacleLayer areas={installationAreas} />
              <DropPointLayer />
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

          <div className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500", 
            canvasViewMode === 'BLUEPRINT' ? "opacity-10" : "opacity-0"
          )} style={{ backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
          
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

          {/* Fix 1: HUD: Status de Stringing por MPPT - wrapped in conditional */}
          {(canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT') && (() => {
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

          {/* Fix 1: Camera button - wrapped in conditional */}
          {(canvasViewMode === 'CONTEXT' || canvasViewMode === 'BLUEPRINT') && (
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
        </div>
      </div>

      {StringingMpptPicker}

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
              <button
                onClick={() => setStringingPickerOpen(true)}
                className="px-3 py-0.5 text-[9px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 rounded-sm transition-all"
              >Atribuir a MPPT…</button>
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
        ) : (
          /* Estado padrão: telemetria passiva com todos os KPIs */
          <div className="flex-1 flex items-center gap-6 font-mono text-[11px] tabular-nums tracking-wider h-full">
            <div className="flex items-center gap-2">
              <Hash size={12} className="text-slate-600" />
              <div className="flex gap-3">
                {/* [R4-10] LOW: LAT/LNG show dynamic centroid of installation areas */}
                <div className="flex gap-1.5"><span className="text-slate-600 font-black">LAT</span><span className="text-indigo-400 font-bold">{(() => {
                  if (!installationAreas || installationAreas.length === 0) {
                    return clientData.lat?.toFixed(6) ?? '--';
                  }
                  const latSum = installationAreas.reduce((sum, a) => sum + (a.center?.[0] ?? 0), 0);
                  return (latSum / installationAreas.length).toFixed(6);
                })()}</span></div>
                <div className="flex gap-1.5"><span className="text-slate-600 font-black">LNG</span><span className="text-indigo-400 font-bold">{(() => {
                  if (!installationAreas || installationAreas.length === 0) {
                    return clientData.lng?.toFixed(6) ?? '--';
                  }
                  const lngSum = installationAreas.reduce((sum, a) => sum + (a.center?.[1] ?? 0), 0);
                  return (lngSum / installationAreas.length).toFixed(6);
                })()}</span></div>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Área</span><span className="text-slate-300 font-bold">{stats.areaTot.toFixed(1)}m²</span></div>
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Útil</span><span className="text-emerald-400 font-bold">{stats.areaUtil.toFixed(1)}m²</span></div>
              <div className="flex gap-1.5 items-center">
                <span className="text-slate-600 font-black uppercase text-[9px]">Mods</span>
                <span className={cn("font-bold", stats.modulos < modulosMeta ? "text-amber-400" : "text-indigo-400")}>{stats.modulos}/{modulosMeta}</span>
              </div>
              {/* Fix 5: FDI health semaphore */}
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

                // U03: Limit to 2 issues + "+N mais" suffix
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
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Trilhos</span><span className="text-indigo-300 font-bold">--</span></div>
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
