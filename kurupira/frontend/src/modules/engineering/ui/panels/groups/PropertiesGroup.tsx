/**
 * =============================================================================
 * PROPERTIES GROUP — Painel Contextual de Propriedades (UX-002)
 * =============================================================================
 *
 * Absorve o conteúdo do antigo PropertiesDrawer.tsx.
 * Polimórfico: renderiza Module/Inverter/String/Area Properties baseado
 * na entidade selecionada no uiStore.
 *
 * Renderizado dentro de PanelGroup com props `contextual` e `onDismiss`
 * (SPEC-000 §Conflito 2).
 * =============================================================================
 */

import React from 'react';
import { useSelectedEntity } from '@/core/state/uiStore';
import { ModuleProperties } from '../properties/ModuleProperties';
import { InverterProperties } from '../properties/InverterProperties';
import { StringProperties } from '../properties/StringProperties';
import { AreaProperties } from '../properties/AreaProperties';

// =============================================================================
// COMPONENT
// =============================================================================

export const PropertiesGroup: React.FC = () => {
  const selectedEntity = useSelectedEntity();

  if (selectedEntity.type === 'none') return null;

  return (
    <div className="w-full">
      {selectedEntity.type === 'module' && <ModuleProperties entity={selectedEntity} />}
      {selectedEntity.type === 'inverter' && <InverterProperties entity={selectedEntity} />}
      {selectedEntity.type === 'string' && <StringProperties entity={selectedEntity} />}
      {(selectedEntity.type === 'polygon' || selectedEntity.type === 'area') && (
        <AreaProperties entity={selectedEntity} />
      )}
    </div>
  );
};
