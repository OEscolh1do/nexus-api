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

import React, { useState, useRef, useEffect } from 'react';
import { TopRibbon } from '../panels/TopRibbon';
import { CenterCanvas } from '../panels/CenterCanvas';
import { CanvasContainer } from '../panels/CanvasContainer';
import { LeftOutliner } from '../panels/LeftOutliner';
import { RightInspector } from '../panels/RightInspector';
import { PropertiesDrawer } from '../panels/properties/PropertiesDrawer';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../store/useTechStore';
import { useSelectedEntity } from '@/core/state/uiStore';
import { useCatalogStore } from '../../store/useCatalogStore';

// =============================================================================
// COMPONENT
// =============================================================================

export const WorkspaceLayout: React.FC = () => {
  // Layout state (panels visibility) - Continues local
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // ── Bootstrap: inject default equipment on empty project (Ação 4) ──
  const hasBootstrapped = useRef(false);
  const userModules = useSolarStore(selectModules);
  const addModule = useSolarStore(state => state.addModule);
  
  const { modules: catalogModules, inverters: catalogInverters, fetchCatalog, isLoading } = useCatalogStore();

  useEffect(() => {
    // Carrega a biblioteca visual do banco se ainda estiver vazia
    if (catalogModules.length === 0 && catalogInverters.length === 0 && !isLoading) {
      fetchCatalog();
    }
  }, [fetchCatalog, catalogModules.length, catalogInverters.length, isLoading]);

  useEffect(() => {
    const userModuleCount = userModules.length;
    const userInverterCount = useTechStore.getState().inverters.ids.length;

    // Só faz bootstrap se o catálogo do banco já carregou as opções
    if (userModuleCount === 0 && userInverterCount === 0 && !hasBootstrapped.current && catalogModules.length > 0 && catalogInverters.length > 0) {
      hasBootstrapped.current = true;

      const cat = catalogModules[0];
      if (cat) {
        addModule({
          id: Math.random().toString(36).substr(2, 9),
          quantity: 1,
          supplier: cat.manufacturer,
          manufacturer: cat.manufacturer,
          model: cat.model,
          type: 'Mono PERC',
          power: cat.electrical.pmax,
          efficiency: Number(((cat.electrical.efficiency || 0.2) * 100).toFixed(2)),
          cells: cat.physical.cells || 144,
          imp: cat.electrical.imp,
          vmp: cat.electrical.vmp,
          isc: cat.electrical.isc,
          voc: cat.electrical.voc,
          weight: cat.physical.weightKg,
          area: (cat.physical.widthMm * cat.physical.heightMm) / 1000000,
          dimensions: `${cat.physical.heightMm}x${cat.physical.widthMm}x${cat.physical.depthMm}`,
          inmetroId: 'Aprovado',
          maxFuseRating: cat.electrical.maxFuseRating || 20,
          tempCoeff: cat.electrical.tempCoeffVoc,
          annualDepreciation: 0.8,
        });
      }

      const inv = catalogInverters[0];
      if (inv) {
        useTechStore.getState().addInverter({
          id: inv.id,
          manufacturer: inv.manufacturer,
          model: inv.model,
          nominalPower: inv.nominalPowerW / 1000, // W → kW
          mppts: inv.mppts.length,
          connectionType: inv.connectionType || 'Trifásico',
          maxInputVoltage: inv.mppts?.[0]?.maxInputVoltage || 600,
        });
      }
    }
  }, [catalogModules, catalogInverters, userModules.length, addModule]);

  // Detect if an entity is selected to show the Properties Drawer
  const selectedEntity = useSelectedEntity();
  const isDrawerOpen = selectedEntity.type !== 'none';

  // Grid template columns — dynamic based on panel visibility + drawer
  const gridCols = [
    leftOpen ? '240px' : '0px',
    isDrawerOpen ? '280px' : '0px',
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
          "ribbon ribbon ribbon ribbon"
          "outliner drawer canvas inspector"
        `,
      }}
    >
      {/* ── TOP RIBBON (row 1, spans all columns) ── */}
      <div style={{ gridArea: 'ribbon' }} className="z-20">
        <TopRibbon
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
          <LeftOutliner />
        </div>
      )}

      {/* ── PROPERTIES DRAWER (row 2, col 2 — conditional) ── */}
      {isDrawerOpen && (
        <div
          style={{ gridArea: 'drawer' }}
          className="overflow-hidden border-r border-slate-800/50 z-10"
        >
          <PropertiesDrawer />
        </div>
      )}

      {/* ── CENTER CANVAS (row 2, col 3) ── */}
      <div id="engineering-viewport" style={{ gridArea: 'canvas' }} className="overflow-hidden relative z-0">
        <CanvasContainer>
          <CenterCanvas />
        </CanvasContainer>
      </div>

      {/* ── RIGHT INSPECTOR (row 2, col 3) ── */}
      {rightOpen && (
        <div
          style={{ gridArea: 'inspector' }}
          className="overflow-hidden border-l border-slate-800/50 z-10"
        >
          <RightInspector />
        </div>
      )}
    </div>
  );
};
