/**
 * =============================================================================
 * WORKSPACE LAYOUT — Esqueleto CSS Grid (UX-002 SPEC-004)
 * =============================================================================
 * 
 * Esqueleto unificado que organiza o cockpit de engenharia.
 * Implementa o padrão "S-Tier Unified Header" (44px) mesclando
 * branding, navegação e telemetria.
 */

import React, { useEffect } from 'react';
import { CenterCanvas } from '../panels/CenterCanvas';
import { CanvasContainer } from '../panels/CanvasContainer';
import { EngineeringNavigation } from '../navigation/EngineeringNavigation';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useUIStore } from '@/core/state/uiStore';
import { SettingsModule } from '@/modules/settings/SettingsModule';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';

export const WorkspaceLayout: React.FC = () => {
  const isSettingsOpen = useUIStore(s => s.isSettingsDrawerOpen);
  const closeSettings = useUIStore(s => s.closeSettingsDrawer);

  const { modules: catalogModules, inverters: catalogInverters, fetchCatalog, isLoading } = useCatalogStore();

  useEffect(() => {
    if (catalogModules.length === 0 && catalogInverters.length === 0 && !isLoading) {
      fetchCatalog();
    }
  }, [fetchCatalog, catalogModules.length, catalogInverters.length, isLoading]);

  return (
    <div
      className="w-full h-full overflow-hidden bg-slate-950"
      style={{
        display: 'grid',
        gridTemplateRows: '44px 1fr',
        gridTemplateColumns: '1fr',
      }}
    >
      {/* ── UNIFIED HEADER (row 1) ── */}
      <EngineeringNavigation />

      {/* ── CENTER CANVAS (row 2) ── */}
      <div 
        id="engineering-viewport" 
        className="overflow-hidden relative z-0 flex flex-col"
      >
        <div className="flex-1 overflow-hidden relative">
            <CanvasContainer>
              <CenterCanvas />
            </CanvasContainer>
            {/* Loader do catálogo */}
            {isLoading && (
              <NeonorteLoader
                size="panel"
                message="Sincronizando catálogo..."
              />
            )}
        </div>
      </div>

      {/* ── SETTINGS DRAWER OVERLAY ── */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-sm pointer-events-auto">
           <div className="absolute inset-0 cursor-pointer" onClick={closeSettings} />
           <div className="relative w-full max-w-4xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Premissas do Projeto</h2>
                <button onClick={closeSettings} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-black uppercase">
                   Fechar
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
