/**
 * =============================================================================
 * MAP CANVAS VIEW — Wrapper Contextual do MapCore (Spec MapCore §2–5)
 * =============================================================================
 *
 * Não invade o MapCore internamente. Envolve-o com:
 * 1. Derivação de modo (placement / drawing / neutral) via focusedBlock
 * 2. HUD de ferramentas filtrado por modo
 * 3. Barra contextual inferior (MapContextBar)
 * 4. Auto-ativação de DRAW_AREA ao entrar em 'arrangement' sem áreas
 * 5. Reset de ferramenta ao trocar de modo com tool incompatível
 * =============================================================================
 */

import React, { useEffect, useMemo } from 'react';
import { MousePointer2, Pentagon, Ruler, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useUIStore, useFocusedBlock, type Tool } from '@/core/state/uiStore';
import { useSelectedEntity } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';

import { MapCore } from '../../../components/MapCore';
import { WebGLOverlay } from '../../../components/WebGLOverlay';
import { VoltageRangeChart } from '../../../components/VoltageRangeChart';
import { MapContextBar, type MapMode } from './map/MapContextBar';

// =============================================================================
// TOOL CONFIG
// =============================================================================

interface ToolConfig {
  id: Tool;
  icon: LucideIcon;
  label: string;
  shortcut: string;
}

const ALL_TOOLS: ToolConfig[] = [
  { id: 'SELECT', icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
  { id: 'POLYGON', icon: Pentagon, label: 'Desenhar Área', shortcut: 'P' },
  { id: 'MEASURE', icon: Ruler, label: 'Medir Distância', shortcut: 'M' },
  { id: 'PLACE_MODULE', icon: LayoutGrid, label: 'Colocar Módulos', shortcut: 'L' },
];

const TOOLS_BY_MODE: Record<MapMode, Tool[]> = {
  placement: ['SELECT', 'PLACE_MODULE', 'MEASURE'],
  drawing:   ['SELECT', 'POLYGON', 'MEASURE'],
  neutral:   ['SELECT', 'MEASURE'],
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const MapCanvasView: React.FC = () => {
  const focusedBlock = useFocusedBlock();
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const selectedEntity = useSelectedEntity();

  // Derive map mode from journey state
  const mapMode: MapMode = 
    focusedBlock === 'arrangement' ? 'drawing' : 'neutral';

  const visibleTools = useMemo(() => 
    ALL_TOOLS.filter(t => TOOLS_BY_MODE[mapMode].includes(t.id)),
    [mapMode]
  );

  // §3: Reset tool when switching to a mode that doesn't support the current tool
  useEffect(() => {
    if (!TOOLS_BY_MODE[mapMode].includes(activeTool)) {
      setActiveTool('SELECT');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode]);

  // §5: Auto-activate DRAW_AREA when entering arrangement mode with no areas
  useEffect(() => {
    if (focusedBlock === 'arrangement') {
      // Use POLYGON as the drawing tool (it's the DRAW_AREA equivalent)
      setActiveTool('POLYGON');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBlock]);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Map Engine (preserves Leaflet state) */}
      <div className="relative flex-1 min-h-0">
        <MapCore activeTool={activeTool} />
        <WebGLOverlay />

        {/* Floating Vertical Toolbar (filtered by mode) */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1.5 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl">
          {visibleTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center",
                activeTool === tool.id
                  ? "bg-emerald-500 text-slate-900 shadow-md scale-105"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <tool.icon size={18} />
            </button>
          ))}
        </div>

        {/* Voltage Range HUD (P2-2) — only when a string entity is selected */}
        {selectedEntity.type === 'string' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[340px] z-[1000] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <VoltageRangeChart entityId={selectedEntity.id || undefined} />
          </div>
        )}
      </div>

      {/* Contextual Status Bar */}
      <MapContextBar mode={mapMode} />
    </div>
  );
};
