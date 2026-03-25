/**
 * =============================================================================
 * PROPERTIES DRAWER — Painel colapsável de propriedades do componente
 * =============================================================================
 *
 * Aparece entre o Left Outliner e o Canvas central quando um componente
 * (módulo, inversor, string) é selecionado na árvore ou no mapa.
 *
 * Fecha ao clicar no botão "✕" ou ao limpar a seleção.
 * =============================================================================
 */

import React from 'react';
import { X, Layers } from 'lucide-react';
import { useSelectedEntity, useUIStore } from '@/core/state/uiStore';
import { ModuleProperties } from './ModuleProperties';
import { InverterProperties } from './InverterProperties';
import { StringProperties } from './StringProperties';
import { AreaProperties } from './AreaProperties';

export const PropertiesDrawer: React.FC = () => {
  const selectedEntity = useSelectedEntity();
  const clearSelection = useUIStore(state => state.clearSelection);

  if (selectedEntity.type === 'none') return null;

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layers size={12} className="text-indigo-400" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Propriedades
          </h3>
        </div>
        <button
          onClick={clearSelection}
          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          title="Fechar painel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content — Polymorphic rendering */}
      <div className="flex-1 overflow-y-auto w-72">
        {selectedEntity.type === 'module' && <ModuleProperties entity={selectedEntity} />}
        {selectedEntity.type === 'inverter' && <InverterProperties entity={selectedEntity} />}
        {selectedEntity.type === 'string' && <StringProperties entity={selectedEntity} />}
        {(selectedEntity.type === 'polygon' || selectedEntity.type === 'area') && <AreaProperties entity={selectedEntity} />}
      </div>
    </div>
  );
};
