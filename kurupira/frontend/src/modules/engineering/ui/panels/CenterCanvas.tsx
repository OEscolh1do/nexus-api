/**
 * =============================================================================
 * CENTER CANVAS — Slot Polimórfico (UX-002 SPEC-006)
 * =============================================================================
 *
 * Área de renderização principal (~70% do ecrã).
 * Quando centerContent === 'map' → Leaflet/WebGL (comportamento padrão).
 * Quando centerContent === PanelGroupId → Renderiza o grupo promovido.
 *
 * O mapa Leaflet NUNCA desmonta — usa display:none para preservar estado.
 * React.memo protege contra re-renders por props do pai.
 * O hook useCenterContent() é intencional: triggers re-render apenas em
 * swap events (raros), não em cada interação do mapa (SPEC-000 §Conflito 3).
 *
 * P0-GFX: MapCore (Leaflet) + WebGLOverlay (R3F).
 * =============================================================================
 */

import React, { useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MousePointer2, Pentagon, Ruler, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useUIStore, useSelectedEntity, type Tool } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import { useCenterContent, usePanelStore, type PanelGroupId } from '../../store/panelStore';
import { VoltageRangeChart } from '../../components/VoltageRangeChart';
import { MapCore } from '../../components/MapCore';
import { WebGLOverlay } from '../../components/WebGLOverlay';

// Canvas Views (for promoted rendering)
import { SiteCanvasView } from './canvas-views/SiteCanvasView';
import { SimulationCanvasView } from './canvas-views/SimulationCanvasView';
import { ElectricalCanvasView } from './canvas-views/ElectricalCanvasView';
import { PropertiesGroup } from './groups/PropertiesGroup'; // Fallback contextual

// =============================================================================
// REGISTRY — Grupos renderizáveis no center
// =============================================================================

const CANVAS_VIEWS_REGISTRY: Partial<Record<PanelGroupId, React.FC>> = {
  site: SiteCanvasView,
  simulation: SimulationCanvasView,
  electrical: ElectricalCanvasView,
  properties: PropertiesGroup,
};

const GROUP_LABELS: Partial<Record<PanelGroupId, string>> = {
  site: 'Contexto do Site',
  simulation: 'Simulação de Geração',
  electrical: 'Configuração Elétrica',
  properties: 'Propriedades do Componente',
};

const GROUP_ICONS: Partial<Record<PanelGroupId, string>> = {
  site: '📍',
  simulation: '📊',
  electrical: '⚡',
  properties: '📋',
};

// =============================================================================
// TOOL HUD CONFIG
// =============================================================================

interface ToolConfig {
  id: Tool;
  icon: LucideIcon;
  label: string;
  shortcut: string;
}

const TOOLS: ToolConfig[] = [
  { id: 'SELECT', icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
  { id: 'POLYGON', icon: Pentagon, label: 'Desenhar Polígono', shortcut: 'P' },
  { id: 'MEASURE', icon: Ruler, label: 'Medir Distância', shortcut: 'M' },
  { id: 'PLACE_MODULE', icon: LayoutGrid, label: 'Colocar Módulos', shortcut: 'L' },
];

// =============================================================================
// MAP LAYER — Memoizado separadamente (SPEC-000 §Conflito 3)
// =============================================================================

const MapLayer = React.memo<{ activeTool: Tool }>(({ activeTool }) => (
  <>
    <MapCore activeTool={activeTool} />
    <WebGLOverlay />
  </>
));
MapLayer.displayName = 'MapLayer';

// =============================================================================
// PROMOTED PANEL VIEW — Grupo expandido no center
// =============================================================================

const PromotedPanelView: React.FC<{ groupId: PanelGroupId }> = ({ groupId }) => {
  const GroupComponent = CANVAS_VIEWS_REGISTRY[groupId];

  if (!GroupComponent) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 animate-in fade-in duration-200">
      {/* Restore bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm">{GROUP_ICONS[groupId]}</span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {GROUP_LABELS[groupId] || 'Painel'}
          </span>
        </div>

      </div>

      {/* Group content — full viewport with container query */}
      <div className="flex-1 overflow-y-auto" style={{ containerType: 'inline-size', containerName: 'panel' }}>
        <div className="max-w-4xl mx-auto">
          <GroupComponent />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CenterCanvasInner: React.FC = () => {
  const centerContent = useCenterContent();
  const activeTool = useUIStore(s => s.activeTool);
  const setActiveTool = useUIStore(s => s.setActiveTool);
  const selectedEntity = useSelectedEntity();

  const isMapVisible = centerContent === 'map';
  const isMinimap = !isMapVisible;

  // SPEC-003: Alvo do portal assíncrono
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Escuta montagem segura do target
  useLayoutEffect(() => {
    if (isMinimap) {
      const target = document.getElementById('minimap-portal-target');
      if (target) setPortalTarget(target);
    } else {
      setPortalTarget(null);
    }
  }, [isMinimap, centerContent]);

  // SPEC-000 §Inconsistência 2: Escape restaura mapa (só se nenhum input está em foco)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'SELECT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        const store = usePanelStore.getState();
        if (store.centerContent !== 'map') {
          store.restoreMap();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // O motor pesado WebGL+Leaflet
  const MapPayload = (
    <React.Fragment>
      <MapLayer activeTool={activeTool} />

      {/* HUD Overlay — flutuante sobre o mapa (só visível quando mapa é o center) */}
      {isMapVisible && (
        <>
          {/* 
            SPEC-005: Floating Vertical Toolbar (AutoCAD/BIM Style)
            Ancorado ao viewport do leafet — sai da tela magicamente se for pro dock
          */}
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
                className={cn(
                  "p-2 rounded-lg transition-all flex items-center justify-center group relative",
                  activeTool === tool.id
                    ? "bg-emerald-500 text-slate-900 shadow-md scale-105"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <tool.icon size={18} />
              </button>
            ))}
          </div>

          {/* Voltage Range HUD (P2-2) */}
          {selectedEntity.type === 'string' && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[340px] z-[1000] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <VoltageRangeChart entityId={selectedEntity.id || undefined} />
            </div>
          )}
        </>
      )}

    </React.Fragment>
  );

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950">
      {/* 
        PORTAL GATING (Integração Física)
        Se isMapVisible: renderiza normalmente em absolute inset-0.
        Se isMinimap e o target carregou (portalTarget): dispara via Portal pro Sidebar.
        Se isMinimap e o target NÃO carregou (Fallback temporário): div oculta (hidden) p/ evitar Unmount.
      */}
      {isMapVisible ? (
        <div className="absolute inset-0 z-0">
          {MapPayload}
        </div>
      ) : portalTarget ? (
        createPortal(MapPayload, portalTarget)
      ) : (
        <div className="hidden">{MapPayload}</div>
      )}

      {/* Painel Promovido — renderiza o grupo expandido no center */}
      {isMinimap && (
        <PromotedPanelView groupId={centerContent as PanelGroupId} />
      )}
    </div>
  );
};

// React.memo: Protege contra re-renders por props do pai.
// useCenterContent() é hook interno que bypassa memo intencionalmente.
export const CenterCanvas = React.memo(CenterCanvasInner);
