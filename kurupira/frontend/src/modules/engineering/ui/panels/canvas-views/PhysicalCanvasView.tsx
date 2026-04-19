import React, { useState, useEffect, useMemo } from 'react';
import { 
  Hash,
  X,
  Lock,
  Eye,
  type LucideIcon
} from 'lucide-react';
import { useMapEvents, Polyline, Marker as LeafletMarker, Tooltip, Polygon as LeafletPolygon } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { MapCore } from '../../../components/MapCore';
import { WebGLOverlay } from '../../../components/WebGLOverlay';
import { CanvasViewModes } from '../../components/CanvasViewModes';
import { SiteToolbar } from './toolbars/SiteToolbar';
import { ArrangementToolbar } from './toolbars/ArrangementToolbar';
import { ElectricalToolbar } from './toolbars/ElectricalToolbar';
import { GlobalLayerToolbar } from './toolbars/GlobalLayerToolbar';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================


interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  shortcut?: string;
  className?: string;
}

// =============================================================================
// SUB-COMPONENTS: RIBBONS
// =============================================================================

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, label, active, disabled, onClick, shortcut, className }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    className={cn(
      "group relative flex items-center justify-center w-8 h-8 rounded-[4px] transition-all duration-150 outline-none",
      active 
        ? "bg-indigo-500 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] scale-[0.98]" 
        : "text-slate-500 hover:bg-slate-800 hover:text-slate-200 active:scale-95",
      disabled && "opacity-20 grayscale cursor-not-allowed scale-[0.9]",
      className
    )}
  >
    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    {active && (
      <div className="absolute -left-1.5 w-[2px] h-4 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
    )}
  </button>
);

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
      if (activeTool !== 'POLYGON') return;
      let pos = e.latlng;
      if (points.length > 0) {
        pos = getSnappedPos(pos, points[points.length - 1]);
      }
      setPoints(prev => [...prev, [pos.lat, pos.lng]]);
    },
    mousemove: (e) => {
      if (activeTool !== 'POLYGON') return;
      let pos = e.latlng;
      if (points.length > 0) {
        pos = getSnappedPos(pos, points[points.length - 1]);
      }
      setMousePos([pos.lat, pos.lng]);
    }
  });

  if (activeTool !== 'POLYGON' || points.length === 0) return null;

  return (
    <>
      <Polyline positions={points} color="#6366f1" weight={3} dashArray="5, 10" />
      {mousePos && (
        <Polyline positions={[points[points.length - 1], mousePos]} color="#6366f1" weight={2} opacity={0.5} dashArray="2, 4">
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
            <LeafletMarker position={p} icon={L.divIcon({ className: 'bg-white border-2 border-indigo-600 rounded-full', iconSize: [8, 8], iconAnchor: [4, 4] })} />
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

// =============================================================================
// SUB-COMPONENTS: DRAWING LAYER (HUD)
// =============================================================================

const PhysicalDrawingLayer: React.FC<{ activeTool: string; pointsCount: number; onReset: () => void }> = ({ activeTool, pointsCount, onReset }) => {
  if (activeTool !== 'POLYGON') return null;
  
  return (
    <div className="absolute inset-0 z-[1100] pointer-events-none">
      <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-sm shadow-2xl flex items-center gap-4 pointer-events-auto animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest font-mono">
            CAD Mode: {pointsCount} vértices marcados
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onReset}
            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 rounded-sm transition-all"
          >
            Cancelar
          </button>
          <button 
            disabled={pointsCount < 3}
            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Finalizar (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS: STRINGING LAYERS
// =============================================================================

const StringHUD: React.FC<{ selectedCount: number; vocTotal: number; iscMax: number; onClear: () => void; onFinalize: () => void }> = ({ selectedCount, vocTotal, iscMax, onClear, onFinalize }) => {
  if (selectedCount === 0) return null;
  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 rounded-sm shadow-2xl flex items-center gap-6 pointer-events-auto animate-in fade-in slide-in-from-top-4 z-[2000]">
      <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter leading-none">Configurando String</span>
          <span className="text-cyan-400 font-black text-xs uppercase font-mono tracking-widest">{selectedCount} Módulos</span>
        </div>
      </div>
      <div className="flex items-center gap-6 font-mono tabular-nums">
        <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Voc Total</span><span className={cn("font-bold text-xs", vocTotal > 800 ? "text-rose-400" : "text-slate-200")}>{vocTotal.toFixed(2)}V</span></div>
        <div className="flex flex-col"><span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Isc</span><span className="text-slate-200 font-bold text-xs">{iscMax.toFixed(2)}A</span></div>
      </div>
      <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
        <button onClick={onClear} className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-400 transition-colors">Limpar</button>
        <button onClick={onFinalize} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 rounded-sm transition-all shadow-lg">Finalizar</button>
      </div>
    </div>
  );
};

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
  if (!isOpen) return null;

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
    <div className="absolute top-4 right-4 w-72 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-sm shadow-2xl z-[2000] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/50">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Anatomia do Suporte</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-4">
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
             const types = ['Cerâmica', 'Metálico', 'Fibrocimento', 'Laje'];
             const next = types[(types.indexOf(surfaceType) + 1) % types.length];
             onSurfaceChange(next);
          }}
          className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-all"
        >
          Trocar Fixação
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
  const isSatelliteHighVis = useUIStore(s => s.isSatelliteHighVis);

  const [isAnatomyOpen, setIsAnatomyOpen] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const placedModules = useSolarStore(s => s.project.placedModules);
  const installationAreas = useSolarStore(s => s.project.installationAreas) || [];
  const selectedEntityId = useUIStore(s => s.selectedEntity.id);
  const focusedBlock = useUIStore(s => s.activeFocusedBlock);
  
  const moduleSpecs = useSolarStore(s => s.modules);
  const assignModulesToString = useSolarStore(s => s.assignModulesToString);
  const spawnFreeformArea = useSolarStore(s => s.spawnFreeformArea);
  const autoLayoutArea = useSolarStore(s => s.autoLayoutArea);
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
    // If drawing, show drawing stats
    if (drawingPoints.length >= 3) {
      const r = 6371000;
      const p0 = drawingPoints[0];
      const localCoords = drawingPoints.map(p => {
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
      area = Math.abs(area) / 2;
      
      return {
        areaTot: area,
        areaUtil: area * 0.9,
        modulos: Math.floor(area / 2.3), 
        modulosMeta: 20,
        fdi: 1.15
      };
    }
    
    // Otherwise, aggregate from all stored areas
    let totalArea = 0;
    for (const area of installationAreas) {
      // Simple area calculation from localVertices
      let a = 0;
      const v = area.localVertices;
      for (let i = 0; i < v.length; i++) {
        const j = (i + 1) % v.length;
        a += v[i].x * v[j].y;
        a -= v[j].x * v[i].y;
      }
      totalArea += Math.abs(a) / 2;
    }

    return {
      areaTot: totalArea,
      areaUtil: totalArea * 0.9,
      modulos: placedModules.length,
      modulosMeta: 20,
      fdi: totalArea > 0 ? (placedModules.length * 0.55) / (totalArea * 0.15) : 0 // heuristic
    };
  }, [drawingPoints, installationAreas, placedModules.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawingPoints([]); setActiveTool('SELECT'); }
      if (e.key === '1') setCanvasViewMode('CONTEXT');
      if (e.key === '2') setCanvasViewMode('BLUEPRINT');
      if (e.key === '3') setCanvasViewMode('DIAGRAM');
      if (e.key === '4') setCanvasViewMode('UNIFILAR');
      if (e.key === 'Enter' && drawingPoints.length >= 3) { 
        spawnFreeformArea(drawingPoints);
        setDrawingPoints([]); 
        setActiveTool('SELECT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingPoints, setActiveTool]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      <div className="h-10 shrink-0 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-4 z-[1100] backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
            <span className="text-[11px] font-black text-slate-200 uppercase tracking-[0.2em] font-mono">Arranjo Físico</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-6 font-mono text-[11px] tabular-nums">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Área Total</span>
              <span className="text-slate-300 font-bold">{stats.areaTot.toFixed(1)}m²</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Módulos</span>
              <div className="flex items-baseline gap-1">
                <span className={cn("font-bold", stats.modulos < stats.modulosMeta ? "text-amber-400" : "text-indigo-400")}>{stats.modulos}/{stats.modulosMeta}</span>
                <span className="text-[9px] text-slate-600">UN</span>
              </div>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-slate-600 font-black uppercase text-[9px]">FDI Est.</span>
              <span className="text-emerald-500 font-bold">{stats.fdi.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {focusedBlock === 'arrangement' && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/50 border border-slate-800 rounded-sm mr-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Superfície</span>
              <div className="flex items-center gap-1">
                {['Cerâmica', 'Metálico', 'Fibrocimento', 'Laje'].map(type => (
                  <button
                    key={type}
                    onClick={() => updateClientData({ roofType: type as any })}
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-black uppercase tracking-tight rounded-[2px] transition-all",
                      (clientData.roofType === type || (!clientData.roofType && type === 'Cerâmica'))
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/50 border border-slate-800 rounded-sm">
            <button 
              disabled={!selectedEntityId}
              onClick={() => selectedEntityId && autoLayoutArea(selectedEntityId)}
              className={cn("px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1", selectedEntityId ? "text-indigo-400 hover:bg-indigo-500/10" : "text-slate-600 opacity-50 cursor-not-allowed")}
            >
              <Lock size={10} /> Auto-Layout
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative bg-slate-950/20">
        {/* Floating Toolbar Island */}
        <div className="absolute left-4 top-4 bottom-4 w-10 bg-slate-900/90 border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.6),0_10px_15px_-3px_rgba(0,0,0,0.4)] flex flex-col items-center py-3 gap-4 z-[1100] custom-scrollbar overflow-y-auto backdrop-blur-md rounded-lg select-none">
          <GlobalLayerToolbar />
          
          <div className="w-6 h-px bg-slate-800/60 my-1 shrink-0" />

          {focusedBlock === 'site' && <SiteToolbar />}
          {focusedBlock === 'arrangement' && <ArrangementToolbar />}
          {(focusedBlock === 'module' || focusedBlock === 'inverter' || focusedBlock === 'simulation') && <ElectricalToolbar />}
          
          <div className="w-6 h-px bg-slate-800/60 my-1 shrink-0" />

          <RibbonSection>
            <ToolbarButton 
               icon={Eye} 
               label="Anatomia" 
               active={isAnatomyOpen} 
               onClick={() => setIsAnatomyOpen(!isAnatomyOpen)} 
            />
          </RibbonSection>
        </div>

        <div className="flex-1 relative min-w-0 bg-slate-950 overflow-hidden">
          <div className={cn(
            "absolute inset-0 transition-all duration-700 ease-in-out", 
            (canvasViewMode === 'BLUEPRINT' && !isSatelliteHighVis) ? "brightness-[0.4] saturate-0 opacity-60" : 
            (canvasViewMode === 'BLUEPRINT' && isSatelliteHighVis) ? "brightness-100 saturate-100 opacity-80" :
            (canvasViewMode === 'DIAGRAM' || canvasViewMode === 'UNIFILAR') ? "brightness-0 opacity-0" :
            "brightness-100 saturate-100 opacity-100"
          )}>
            <MapCore activeTool={activeTool} isNavigating={drawingPoints.length > 1}>
              <WebGLOverlay />
              <DrawingEngine activeTool={activeTool} points={drawingPoints} setPoints={setDrawingPoints} />
              <SafeEdgeOverlay points={drawingPoints} />
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
          
          <CanvasViewModes />
          
          <PhysicalDrawingLayer activeTool={activeTool} pointsCount={drawingPoints.length} onReset={() => setDrawingPoints([])} />
          <StringHUD 
            selectedCount={selectedModuleIds.length} 
            vocTotal={stringElectrical.voc} 
            iscMax={stringElectrical.isc} 
            onClear={() => setSelectedModuleIds([])}
            onFinalize={() => {
              assignModulesToString(selectedModuleIds, 'GENERIC_INV', 1);
              setSelectedModuleIds([]);
              setActiveTool('SELECT');
            }}
          />
          <AnatomyView 
            isOpen={isAnatomyOpen} 
            onClose={() => setIsAnatomyOpen(false)} 
            surfaceType={clientData.roofType || 'Cerâmica'} 
            onSurfaceChange={(type) => updateClientData({ roofType: type as any })}
          />
          <div className="absolute bottom-4 right-4 z-[1100]">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-sm hover:border-indigo-500/50 transition-all group">
              <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400 uppercase tracking-widest font-mono">Bancada de Fotos</span>
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">0</div>
            </button>
          </div>
        </div>
      </div>

      <div className="h-10 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center px-4 z-[1100]">
        <div className="flex-1 flex items-center gap-8 font-mono text-[11px] tabular-nums tracking-wider h-full">
          <div className="flex items-center gap-2 h-full">
            <Hash size={12} className="text-slate-600" />
            <div className="flex gap-4">
              <div className="flex gap-1.5"><span className="text-slate-600 font-black">LAT</span><span className="text-indigo-400 font-bold">{clientData.lat?.toFixed(6) ?? '-3.1316'}</span></div>
              <div className="flex gap-1.5"><span className="text-slate-600 font-black">LNG</span><span className="text-indigo-400 font-bold">{clientData.lng?.toFixed(6) ?? '-60.0233'}</span></div>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-6">
            <div className="flex gap-1.5 items-center">
              <span className="text-slate-600 font-black uppercase text-[9px]">Área Útil</span>
              <span className="text-emerald-400 font-bold">{stats.areaUtil.toFixed(1)}m²</span>
              <span className="text-slate-600 text-[9px]">({((stats.areaUtil / (stats.areaTot || 1)) * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <span className="text-slate-600 font-black uppercase text-[9px]">Trilhos</span>
              <span className="text-indigo-300 font-bold">~{stats.areaTot > 0 ? (stats.areaTot * 0.8).toFixed(1) : '0'}m</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 border-l border-slate-800 pl-4 h-full">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Motor On-Thread</span>
           </div>
        </div>
      </div>
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; } `}</style>
    </div>
  );
};
