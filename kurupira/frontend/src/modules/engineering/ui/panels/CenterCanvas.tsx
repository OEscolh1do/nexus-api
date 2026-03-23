/**
 * =============================================================================
 * CENTER CANVAS — Motor Leaflet/WebGL Integrado (P0-GFX)
 * =============================================================================
 *
 * Área de renderização principal (70% do ecrã).
 * Envolvido em React.memo() para criar uma "zona de escape" onde a
 * performance visual é ditada pela GPU e não pelo motor virtual do React.
 *
 * P0-GFX: Placeholder substituído pelo MapCore (Leaflet).
 *         O CanvasContainer é aplicado externamente pelo WorkspaceLayout.
 * =============================================================================
 */

import React from 'react';
import { MousePointer2, Pentagon, Ruler, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useActiveTool, useSelectedEntity, type Tool } from '@/core/state/uiStore';
import { VoltageRangeChart } from '../../components/VoltageRangeChart';
import { MapCore } from '../../components/MapCore';
import { WebGLOverlay } from '../../components/WebGLOverlay';

// =============================================================================
// TOOL HUD CONFIG
// =============================================================================

const TOOL_LABELS: Record<Tool, { icon: LucideIcon; label: string }> = {
  SELECT: { icon: MousePointer2, label: 'Selecionar elementos' },
  POLYGON: { icon: Pentagon, label: 'Desenhar polígono de telhado' },
  MEASURE: { icon: Ruler, label: 'Medir distância entre pontos' },
  PLACE_MODULE: { icon: LayoutGrid, label: 'Colocar módulos solares' },
};

// =============================================================================
// COMPONENT
// =============================================================================

const CenterCanvasInner: React.FC = () => {
  const activeTool = useActiveTool();
  const selectedEntity = useSelectedEntity();
  const toolInfo = TOOL_LABELS[activeTool];
  const ToolIcon = toolInfo.icon;

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950">
      {/* Motor Leaflet — ocupa 100% do canvas */}
      <MapCore activeTool={activeTool} />

      {/* Motor WebGL (R3F) — overlay transparente sobre o Leaflet (P5-1) */}
      <WebGLOverlay />

      {/* HUD Overlay — flutuante sobre o mapa */}
      {/* Tool indicator (bottom-left) */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-sm pointer-events-none">
        <ToolIcon size={12} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-slate-400">{toolInfo.label}</span>
      </div>

      {/* Voltage Range HUD (P2-2) */}
      {selectedEntity.type === 'string' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[340px] z-[1000] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <VoltageRangeChart entityId={selectedEntity.id || undefined} />
        </div>
      )}
    </div>
  );
};

// React.memo: Cria "zona de escape" do ciclo React — performance via GPU
export const CenterCanvas = React.memo(CenterCanvasInner);
