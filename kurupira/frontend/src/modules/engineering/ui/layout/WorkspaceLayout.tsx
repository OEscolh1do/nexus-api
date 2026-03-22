/**
 * =============================================================================
 * WORKSPACE LAYOUT — Esqueleto CSS Grid (Fase 3 do UX-001)
 * =============================================================================
 *
 * Esqueleto rígido e absoluto que organiza os 4 órgãos vitais do workspace
 * de engenharia em áreas fixas de CSS Grid (100vh, 100vw, overflow: hidden).
 *
 * NÃO guarda estado de domínio. Seu único trabalho é manter os painéis
 * fixos e gerenciar o redimensionamento.
 *
 * Layout:
 * ┌────────────────────────────────────────────┐
 * │              TOP RIBBON                     │
 * ├────────┬───────────────────────┬────────────┤
 * │  LEFT  │                       │   RIGHT    │
 * │OUTLINER│    CENTER CANVAS      │ INSPECTOR  │
 * │        │                       │            │
 * ├────────┴───────────────────────┴────────────┤
 * └────────────────────────────────────────────┘
 *
 * =============================================================================
 */

import React, { useState } from 'react';
import { TopRibbon } from '../panels/TopRibbon';
import { CenterCanvas } from '../panels/CenterCanvas';
import { LeftOutliner } from '../panels/LeftOutliner';
import { RightInspector } from '../panels/RightInspector';

// =============================================================================
// TYPES
// =============================================================================

export type ActiveTool = 'SELECT' | 'POLYGON' | 'MEASURE' | 'PLACE_MODULE';

export interface SelectedEntity {
  type: 'none' | 'module' | 'inverter' | 'string';
  id: string | null;
  label: string;
}

const EMPTY_SELECTION: SelectedEntity = { type: 'none', id: null, label: '' };

// =============================================================================
// COMPONENT
// =============================================================================

export const WorkspaceLayout: React.FC = () => {
  // Layout state (panels visibility)
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Tool state (consumed by TopRibbon and CenterCanvas)
  const [activeTool, setActiveTool] = useState<ActiveTool>('SELECT');

  // Selection state (bidirectional sync between Canvas and Outliner)
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(EMPTY_SELECTION);

  // Grid template columns — dynamic based on panel visibility
  const gridCols = [
    leftOpen ? '240px' : '0px',
    '1fr',
    rightOpen ? '300px' : '0px',
  ].join(' ');

  return (
    <div
      className="w-full h-full overflow-hidden bg-slate-950"
      style={{
        display: 'grid',
        gridTemplateRows: '40px 1fr',
        gridTemplateColumns: gridCols,
        gridTemplateAreas: `
          "ribbon ribbon ribbon"
          "outliner canvas inspector"
        `,
      }}
    >
      {/* ── TOP RIBBON (row 1, spans all columns) ── */}
      <div style={{ gridArea: 'ribbon' }} className="z-20">
        <TopRibbon
          activeTool={activeTool}
          onToolChange={setActiveTool}
          leftOpen={leftOpen}
          rightOpen={rightOpen}
          onToggleLeft={() => setLeftOpen(!leftOpen)}
          onToggleRight={() => setRightOpen(!rightOpen)}
        />
      </div>

      {/* ── LEFT OUTLINER (row 2, col 1) ── */}
      {leftOpen && (
        <div
          style={{ gridArea: 'outliner' }}
          className="overflow-hidden border-r border-slate-800/50 z-10"
        >
          <LeftOutliner
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
          />
        </div>
      )}

      {/* ── CENTER CANVAS (row 2, col 2) ── */}
      <div style={{ gridArea: 'canvas' }} className="overflow-hidden relative z-0">
        <CenterCanvas
          activeTool={activeTool}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
        />
      </div>

      {/* ── RIGHT INSPECTOR (row 2, col 3) ── */}
      {rightOpen && (
        <div
          style={{ gridArea: 'inspector' }}
          className="overflow-hidden border-l border-slate-800/50 z-10"
        >
          <RightInspector selectedEntity={selectedEntity} />
        </div>
      )}
    </div>
  );
};
