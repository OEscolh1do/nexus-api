/**
 * =============================================================================
 * WORKSPACE LAYOUT — Esqueleto CSS Grid (UX-002 SPEC-004)
 * =============================================================================
 *
 * Esqueleto rígido que organiza os 3 órgãos vitais do workspace de engenharia
 * em áreas fixas de CSS Grid.
 *
 * REFATORADO: Grid simplificado de 4 → 3 colunas.
 * O PropertiesDrawer foi absorvido como PanelGroup dentro do dock (RightInspector).
 *
 * Layout:
 * ┌────────────────────────────────────────────┐
 * │              TOP RIBBON                     │
 * ├────────┬───────────────────────┬────────────┤
 * │  LEFT  │                       │   DOCK     │
 * │OUTLINER│    CENTER CANVAS      │ (Inspector)│
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
import { WorkspaceTabs } from '../panels/WorkspaceTabs';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore } from '../../store/useTechStore';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useUIStore } from '@/core/state/uiStore';
import { SettingsModule } from '@/modules/settings/SettingsModule';

// =============================================================================
// COMPONENT
// =============================================================================

export const WorkspaceLayout: React.FC = () => {
  // Layout state (panels visibility) - Continues local
  const [leftOpen] = useState(true);
  
  const isSettingsOpen = useUIStore(s => s.isSettingsDrawerOpen);
  const closeSettings = useUIStore(s => s.closeSettingsDrawer);

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

  const gridCols = [
    leftOpen ? '240px' : '0px',
    '1fr',
  ].join(' ');

  return (
    <div
      className="w-full h-full overflow-hidden bg-slate-950"
      style={{
        display: 'grid',
        gridTemplateRows: '40px 1fr',
        gridTemplateColumns: gridCols,
        gridTemplateAreas: `
          "ribbon ribbon"
          "outliner canvas"
        `,
      }}
    >
      {/* ── TOP RIBBON (row 1, spans all columns) ── */}
      <div style={{ gridArea: 'ribbon' }} className="z-20">
        <TopRibbon />
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

      {/* ── CENTER CANVAS (row 2, col 2) ── */}
      <div id="engineering-viewport" style={{ gridArea: 'canvas' }} className="overflow-hidden relative z-0 flex flex-col">
        <div className="flex-1 overflow-hidden relative">
            <CanvasContainer>
              <CenterCanvas />
            </CanvasContainer>
        </div>
        <WorkspaceTabs />
      </div>

      {/* ── SETTINGS / PREMISSAS DRAWER OVERLAY ── */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-sm pointer-events-auto">
           {/* Dismiss Background */}
           <div className="absolute inset-0 cursor-pointer" onClick={closeSettings} />
           
           {/* Drawer Container */}
           <div className="relative w-full max-w-4xl h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
                <h2 className="text-sm font-bold text-slate-200">Premissas do Projeto</h2>
                <button onClick={closeSettings} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs">
                   Descartar / Fechar
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                 <SettingsModule />
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
