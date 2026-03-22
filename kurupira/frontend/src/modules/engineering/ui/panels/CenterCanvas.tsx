/**
 * =============================================================================
 * CENTER CANVAS — Fronteira WebGL/Leaflet (UX-001 Fase 3)
 * =============================================================================
 *
 * Área de renderização principal (70% do ecrã).
 * Envolvido em React.memo() para criar uma "zona de escape" onde a
 * performance visual é ditada pela GPU e não pelo motor virtual do React.
 *
 * NOTA: Nesta fase inicial, renderiza um placeholder visual.
 * Na integração real, esta área receberá o motor Leaflet/WebGL.
 * =============================================================================
 */

import React from 'react';
import { MapPin, Pentagon, MousePointer2, Ruler, LayoutGrid } from 'lucide-react';
import type { ActiveTool } from '../layout/WorkspaceLayout';
import type { SelectedEntity } from '../layout/WorkspaceLayout';

// =============================================================================
// PROPS
// =============================================================================

interface CenterCanvasProps {
  activeTool: ActiveTool;
  selectedEntity: SelectedEntity;
  onSelectEntity: (entity: SelectedEntity) => void;
}

// =============================================================================
// TOOL CURSOR MAPPING
// =============================================================================

const TOOL_CURSORS: Record<ActiveTool, string> = {
  SELECT: 'default',
  POLYGON: 'crosshair',
  MEASURE: 'crosshair',
  PLACE_MODULE: 'cell',
};

const TOOL_LABELS: Record<ActiveTool, { icon: React.ElementType; label: string }> = {
  SELECT: { icon: MousePointer2, label: 'Selecionar elementos' },
  POLYGON: { icon: Pentagon, label: 'Desenhar polígono de telhado' },
  MEASURE: { icon: Ruler, label: 'Medir distância entre pontos' },
  PLACE_MODULE: { icon: LayoutGrid, label: 'Colocar módulos solares' },
};

// =============================================================================
// COMPONENT
// =============================================================================

const CenterCanvasInner: React.FC<CenterCanvasProps> = ({
  activeTool,
  selectedEntity: _selectedEntity,
  onSelectEntity: _onSelectEntity,
}) => {
  const toolInfo = TOOL_LABELS[activeTool];
  const ToolIcon = toolInfo.icon;

  return (
    <div
      className="w-full h-full bg-slate-950 relative overflow-hidden"
      style={{ cursor: TOOL_CURSORS[activeTool] }}
    >
      {/* Grid visual de fundo (simula mapa de satélite / viewport) */}
      <div className="absolute inset-0">
        {/* Linhas de grade */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(100, 200, 150, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 200, 150, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        {/* Cruzeta central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-px h-8 bg-emerald-500/20 absolute left-1/2 -translate-x-1/2 -top-4" />
          <div className="h-px w-8 bg-emerald-500/20 absolute top-1/2 -translate-y-1/2 -left-4" />
          <div className="w-2 h-2 border border-emerald-500/30 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Placeholder central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-4">
            <MapPin size={32} className="text-emerald-500/30" />
          </div>
          <p className="text-xs font-bold text-slate-600 mb-1">Canvas de Engenharia</p>
          <p className="text-[10px] text-slate-700 max-w-[240px]">
            Motor de renderização Leaflet/WebGL será integrado aqui.
            O mapa interativo do sítio ocupará 100% desta área.
          </p>
        </div>
      </div>

      {/* Tool indicator (bottom-left) */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
        <ToolIcon size={12} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-slate-400">{toolInfo.label}</span>
      </div>

      {/* Coordinates (bottom-right) */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
        <span className="text-[9px] font-mono text-slate-600">
          -3.1316°S  60.0233°W  |  Zoom: 18
        </span>
      </div>
    </div>
  );
};

// React.memo: Cria "zona de escape" do ciclo React — performance via GPU
export const CenterCanvas = React.memo(CenterCanvasInner);
