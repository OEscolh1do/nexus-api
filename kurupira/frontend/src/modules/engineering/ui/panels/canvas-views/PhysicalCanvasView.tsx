import React, { useEffect, useMemo, useState } from 'react';
import { 
  Hash,
  X,
  Camera,
  MapPin,
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
import { useSolarStore } from '@/core/state/solarStore';
import { MapCore } from '../../../components/MapCore';
import { WebGLOverlay } from '../../../components/WebGLOverlay';
import { ViewLayerSelector } from '../../components/ViewLayerSelector';
import { ManipulationIsland } from './toolbars/ManipulationIsland';
import { NavigationIsland } from './toolbars/NavigationIsland';
import { VisionIsland } from './toolbars/VisionIsland';
import { DraftingIsland } from './toolbars/DraftingIsland';
import { SearchIsland } from './toolbars/SearchIsland';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';

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


const StringPathOverlay: React.FC<{ moduleIds: string[]; placedModules: any[] }> = ({ moduleIds, placedModules }) => {
  if (moduleIds.length < 2) return null;
  const positions = moduleIds.map(id => {
    const mod = placedModules.find(m => m.id === id);
    return mod?.center || [0, 0];
  }).filter(p => p[0] !== 0);

  return <Polyline positions={positions as any} color="#22d3ee" weight={2} dashArray="5, 5" opacity={0.8} />;
};

const ModuleInteractionLayer: React.FC<{ activeTool: string; placedModules: any[]; selectedIds: string[]; onToggle: (id: string) => void }> = ({ activeTool, placedModules, selectedIds, onToggle }) => {
  if (activeTool !== 'STRINGING') return null;
  return (
    <>
      {placedModules.map(mod => (
        <LeafletPolygon 
          key={mod.id}
          positions={mod.polygon}
          fillColor={selectedIds.includes(mod.id) ? "#22d3ee" : "#4f46e5"}
          fillOpacity={selectedIds.includes(mod.id) ? 0.6 : 0.2}
          color={selectedIds.includes(mod.id) ? "#22d3ee" : "#6366f1"}
          weight={selectedIds.includes(mod.id) ? 2 : 1}
          eventHandlers={{ click: () => onToggle(mod.id) }}
        />
      ))}
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

  // Electrical Calculation for String
  const stringElectrical = useMemo(() => {
    if (!selectedModuleIds || selectedModuleIds.length === 0) return { voc: 0, isc: 0 };
    
    const firstMod = placedModules.find(m => m.id === selectedModuleIds[0]);
    if (!firstMod) return { voc: 0, isc: 0 };
    
    const spec = moduleSpecs.entities[firstMod.moduleSpecId];
    if (!spec) return { voc: 0, isc: 0 };

    // Basic Series String Logic (Sum Voc, Keep Isc)
    const vocBase = spec.voc || 49.5;
    const iscBase = spec.isc || 13.5;
    
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
      modulosMeta: (clientData as any).estimatedModules || 20,
      fdi: totalArea > 0 ? (placedModules.length * 0.55) / 10 : 0, // Placeholder FDI
      currentDraw: {
        area: drawingArea,
        length: drawingLen
      }
    };
  }, [drawingPoints, installationAreas, placedModules, clientData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      if (k === 's') setActiveTool('SUBTRACT');
      if (k === 'd') setActiveTool('DROP_POINT');
      if (k === 'm') setActiveTool('MEASURE');

      if (e.key === 'Enter' && drawingPoints.length >= 3) { 
        if (activeTool === 'POLYGON') {
          spawnFreeformArea(drawingPoints);
        } else if (activeTool === 'SUBTRACT' && selectedAreaId) {
          spawnObstacle(selectedAreaId, drawingPoints);
        }
        setDrawingPoints([]); 
        setActiveTool('SELECT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingPoints, setActiveTool]);

  const isDrawingActive = activeTool === 'POLYGON' || activeTool === 'SUBTRACT';
  const isDropPointActive = activeTool === 'DROP_POINT';
  const isMeasureActive = activeTool === 'MEASURE';
  const isStringingActive = selectedModuleIds.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* ── D1: TopRibbon local ELIMINADO — canvas começa direto ── */}

      <div className="flex-1 flex min-h-0 relative bg-slate-950/20">
        <SearchIsland />
        
        {/* ── STACK DE ILHAS (Lado Esquerdo) ── */}
        <div className="absolute left-6 top-24 flex flex-col gap-3 items-center z-[1100]">
          <ManipulationIsland />
          <NavigationIsland />
          <VisionIsland />
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
                onToggle={(id) => {
                  setSelectedModuleIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                }} 
              />
              <StringPathOverlay moduleIds={selectedModuleIds} placedModules={placedModules} />
            </MapCore>
          </div>
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

          <div className="absolute bottom-4 right-4 z-[1100]">
            <button 
              title="Bancada de Fotos"
              className="flex items-center justify-center p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg hover:border-indigo-500/50 transition-all group relative"
            >
              <Camera size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[7px] font-black text-white shadow-lg">0</div>
            </button>
          </div>
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
                <span className={cn("font-bold text-xs", stringElectrical.voc > 800 ? "text-rose-400" : "text-slate-200")}>{stringElectrical.voc.toFixed(2)}V</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Isc</span>
                <span className="text-slate-200 font-bold text-xs">{stringElectrical.isc.toFixed(2)}A</span>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedModuleIds([])} className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-colors">Limpar</button>
              <button
                onClick={() => { assignModulesToString(selectedModuleIds, 'GENERIC_INV', 1); setSelectedModuleIds([]); setActiveTool('SELECT'); }}
                className="px-3 py-0.5 text-[9px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 rounded-sm transition-all"
              >Finalizar</button>
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
                <div className="flex gap-1.5"><span className="text-slate-600 font-black">LAT</span><span className="text-indigo-400 font-bold">{clientData.lat?.toFixed(6) ?? '-3.1316'}</span></div>
                <div className="flex gap-1.5"><span className="text-slate-600 font-black">LNG</span><span className="text-indigo-400 font-bold">{clientData.lng?.toFixed(6) ?? '-60.0233'}</span></div>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Área</span><span className="text-slate-300 font-bold">{stats.areaTot.toFixed(1)}m²</span></div>
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Útil</span><span className="text-emerald-400 font-bold">{stats.areaUtil.toFixed(1)}m²</span></div>
              <div className="flex gap-1.5 items-center">
                <span className="text-slate-600 font-black uppercase text-[9px]">Mods</span>
                <span className={cn("font-bold", stats.modulos < stats.modulosMeta ? "text-amber-400" : "text-indigo-400")}>{stats.modulos}/{stats.modulosMeta}</span>
              </div>
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">FDI</span><span className="text-emerald-500 font-bold">{stats.fdi.toFixed(2)}</span></div>
              <div className="flex gap-1.5 items-center"><span className="text-slate-600 font-black uppercase text-[9px]">Trilhos</span><span className="text-indigo-300 font-bold">~{stats.areaTot > 0 ? (stats.areaTot * 0.8).toFixed(1) : '0'}m</span></div>
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
