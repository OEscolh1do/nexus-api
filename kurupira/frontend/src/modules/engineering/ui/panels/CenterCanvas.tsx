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
import { useUIStore } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';
import { useCenterContent, usePanelStore, type PanelGroupId } from '../../store/panelStore';

// Canvas Views
import { MapCanvasView } from './canvas-views/MapCanvasView';
import { SiteCanvasView } from './canvas-views/SiteCanvasView';
import { ProjectionCanvasView } from './canvas-views/ProjectionCanvasView';
import { ElectricalCanvasView } from './canvas-views/ElectricalCanvasView';
import { ConsumptionCanvasView } from './canvas-views/ConsumptionCanvasView';
import { ModuleCanvasView } from './canvas-views/ModuleCanvasView';
import { PhysicalCanvasView } from './canvas-views/PhysicalCanvasView';
import { ProposalCanvasView } from './canvas-views/ProposalCanvasView';
import { PropertiesGroup } from './groups/PropertiesGroup';
import { SettingsModule } from '@/modules/settings/SettingsModule';
import { DocumentationModule } from '@/modules/documentation/DocumentationModule';

// =============================================================================
// REGISTRY — Grupos renderizáveis no center
// =============================================================================

const CANVAS_VIEWS_REGISTRY: Partial<Record<PanelGroupId, React.FC>> = {
  site: SiteCanvasView,
  projection: ProjectionCanvasView,
  electrical: ElectricalCanvasView,
  'module-selection': ModuleCanvasView,
  properties: PropertiesGroup,
  settings: SettingsModule,
  documentation: DocumentationModule,
  proposal: ProposalCanvasView,
};

// =============================================================================
// TOOL HUD CONFIG (legacy — kept for keyboard shortcut handling)
// =============================================================================

// =============================================================================
// MAP LAYER — Memoizado separadamente (SPEC-000 §Conflito 3)
// =============================================================================

// MapCanvasView already wraps MapCore + WebGLOverlay + ToolHUD + MapContextBar

// =============================================================================
// PROMOTED PANEL VIEW — Grupo expandido no center
// =============================================================================

const PromotedPanelView: React.FC<{ groupId: PanelGroupId }> = ({ groupId }) => {
  const GroupComponent = CANVAS_VIEWS_REGISTRY[groupId];

  if (!GroupComponent) return null;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 animate-in fade-in duration-200">
      {/* Group content — full viewport with container query */}
      <div className="flex-1 overflow-y-auto" style={{ containerType: 'inline-size', containerName: 'panel' }}>
        <GroupComponent />
      </div>
    </div>
  );
};

// =============================================================================
// FROZEN VIEW CONTAINER — A Estratégia Ouro (Performance de CAD Native)
// =============================================================================
// Congela componentes com `visibility: hidden` via throttle para não perder 
// o estado de inicialização mas salvar bateria e GPU de renders em background.

const FrozenViewContainer: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => {
  const [shouldRender, setShouldRender] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
    } else {
      const t = setTimeout(() => setShouldRender(false), 260); // 260ms (duração CSS p/ slide/fade)
      return () => clearTimeout(t);
    }
  }, [isActive]);

  return (
    <div
      className={cn(
        "absolute inset-0 transition-all duration-250 ease-in-out bg-slate-950 will-change-transform",
        isActive ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-12 pointer-events-none"
      )}
      style={{
        zIndex: isActive ? 9999 : 0,
        visibility: shouldRender ? 'visible' : 'hidden', // A magia
      }}
    >
      {shouldRender && children}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const CenterCanvasInner: React.FC = () => {
  const centerContent = useCenterContent();
  const focusedBlock = useUIStore(s => s.activeFocusedBlock); // O backbone da jornada

  const isMapVisible = centerContent === 'map';
  const isMinimap = !isMapVisible;

  // A Jornada: views sobrepostas ao MapCore (não incluem arrangement pois esse exibe o mapa)
  const activeOverlayView = focusedBlock === 'site'        ? 'site' :
                            focusedBlock === 'consumption' ? 'consumption' :
                            focusedBlock === 'module'      ? 'module-selection' :
                            focusedBlock === 'arrangement' ? 'arrangement' :
                            focusedBlock === 'inverter'    ? 'electrical' :
                            focusedBlock === 'projection'  ? 'projection' : 
                            focusedBlock === 'proposal'    ? 'proposal' :
                            'none';

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

  // O motor MapCanvasView engloba MapCore + WebGL + ToolHUD + ContextBar
  const MapPayload = <MapCanvasView />;

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
      {/* 
        PORTAL GATING (Integração Física)
      */}
      {isMapVisible ? (
        <div className="absolute inset-0 z-0">
          {MapPayload}
          
          {/* CAMADAS CONGELADAS DA JORNADA (Sobrepondo o Mapa sem desmontá-lo) */}
          <FrozenViewContainer isActive={activeOverlayView === 'site'}>
            <SiteCanvasView />
          </FrozenViewContainer>

          <FrozenViewContainer isActive={activeOverlayView === 'consumption'}>
            <ConsumptionCanvasView />
          </FrozenViewContainer>
          
          <FrozenViewContainer isActive={activeOverlayView === 'electrical'}>
            <ElectricalCanvasView />
          </FrozenViewContainer>

          <FrozenViewContainer isActive={activeOverlayView === 'module-selection'}>
            <ModuleCanvasView />
          </FrozenViewContainer>
          
          <FrozenViewContainer isActive={activeOverlayView === 'arrangement'}>
            <PhysicalCanvasView />
          </FrozenViewContainer>

          <FrozenViewContainer isActive={activeOverlayView === 'projection'}>
            <ProjectionCanvasView />
          </FrozenViewContainer>

          <FrozenViewContainer isActive={activeOverlayView === 'proposal'}>
            <ProposalCanvasView />
          </FrozenViewContainer>

        </div>
      ) : portalTarget ? (
        createPortal(MapPayload, portalTarget)
      ) : (
        <div className="hidden">{MapPayload}</div>
      )}

      {/* Painel Promovido — (Para documentação, proposta, engrenagens, que não fazem parte da árvore principal) */}
      {isMinimap && (
        <PromotedPanelView groupId={centerContent as PanelGroupId} />
      )}
    </div>
  );
};

// React.memo: Protege contra re-renders por props do pai.
// useCenterContent() é hook interno que bypassa memo intencionalmente.
export const CenterCanvas = React.memo(CenterCanvasInner);
