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

import React, { useState, useEffect } from 'react';
import { TopRibbon } from '../panels/TopRibbon';
import { CenterCanvas } from '../panels/CenterCanvas';
import { CanvasContainer } from '../panels/CanvasContainer';
import { LeftOutliner } from '../panels/LeftOutliner';
import { MobileOutlinerSheet } from '../panels/MobileOutlinerSheet';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useUIStore } from '@/core/state/uiStore';
import { SettingsModule } from '@/modules/settings/SettingsModule';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';
import { cn } from '@/lib/utils';

// =============================================================================
// COMPONENT
// =============================================================================

export const WorkspaceLayout: React.FC = () => {
  // Layout state — colapsa automaticamente em mobile
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Detecta mudanças de viewport
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setLeftOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isSettingsOpen = useUIStore(s => s.isSettingsDrawerOpen);
  const closeSettings = useUIStore(s => s.closeSettingsDrawer);

  const { modules: catalogModules, inverters: catalogInverters, fetchCatalog, isLoading } = useCatalogStore();

  useEffect(() => {
    // Carrega a biblioteca visual do banco se ainda estiver vazia
    if (catalogModules.length === 0 && catalogInverters.length === 0 && !isLoading) {
      fetchCatalog();
    }
  }, [fetchCatalog, catalogModules.length, catalogInverters.length, isLoading]);

  // Em mobile, a sidebar some do grid (col 0px fixo) — o Bottom Sheet assume
  const gridCols = [
    (!isMobile && leftOpen) ? '280px' : '0px',
    '1fr',
  ].join(' ');

  const gridTransition = 'grid-template-columns 300ms ease-in-out';

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
        transition: gridTransition,
      }}
    >
      {/* ── TOP RIBBON (row 1, spans all columns) ── */}
      <div style={{ gridArea: 'ribbon' }} className="z-[100]">
        <TopRibbon />
      </div>

      {/* ── LEFT OUTLINER — Desktop only (row 2, col 1) ── */}
      {!isMobile && (
        <div
          style={{ gridArea: 'outliner' }}
          className={`overflow-hidden border-r border-slate-800/50 z-10 transition-all duration-300 ${leftOpen ? 'w-[280px]' : 'w-0'}`}
        >
          {leftOpen && <LeftOutliner onToggle={() => setLeftOpen(false)} />}
        </div>
      )}

      {/* ── EXPAND BUTTON — Desktop only, when sidebar is closed ── */}
      {!isMobile && !leftOpen && (
        <button
          onClick={() => setLeftOpen(true)}
          title="Expandir painel"
          className="absolute top-1/2 left-0 -translate-y-1/2 z-30 flex items-center justify-center w-4 h-12 bg-slate-800 border border-l-0 border-slate-700 text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all duration-200 rounded-r-sm shadow-lg"
          style={{ gridArea: 'canvas' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
        </button>
      )}

      {/* ── MOBILE OUTLINER — Bottom Sheet (overlay, fixed position) ── */}
      {isMobile && <MobileOutlinerSheet />}

      {/* ── CENTER CANVAS (row 2, col 2) ── */}
      <div 
        id="engineering-viewport" 
        style={{ gridArea: 'canvas' }} 
        className={cn(
          "overflow-hidden relative z-0 flex flex-col",
          isMobile && "pb-[52px]" // Reserva espaço para o MobileOutlinerSheet fixo na base
        )}
      >
        <div className="flex-1 overflow-hidden relative">
            <CanvasContainer>
              <CenterCanvas />
            </CanvasContainer>
            {/* Loader do catálogo — cobre o canvas enquanto módulos/inversores carregam do DB */}
            {isLoading && (
              <NeonorteLoader
                size="panel"
                message="Sincronizando catálogo..."
              />
            )}
        </div>
            {/* <WorkspaceTabs /> */}
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
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <SettingsModule />
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
