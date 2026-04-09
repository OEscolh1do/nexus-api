/**
 * =============================================================================
 * RIGHT INSPECTOR — Orquestrador de Panel Groups (UX-002 SPEC-003 + SPEC-007)
 * =============================================================================
 *
 * Monta os 4 PanelGroups em sequência vertical no dock lateral direito.
 * Na Fase 2: suporta swap com center via onMaximize + placeholder card.
 *
 * Quando um grupo está promovido ao center, ele desaparece do dock e é
 * substituído por um MapPlaceholderCard.
 * =============================================================================
 */

import React from 'react';
import { MapPin, BarChart3, Activity, Layers, Map } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { usePanelStore, useIsPromoted, type PanelGroupId } from '../../store/panelStore';

// Panel Groups
import { PanelGroup } from './groups/PanelGroup';
import { SiteContextGroup } from './groups/SiteContextGroup';
import { SimulationGroup } from './groups/SimulationGroup';
import { ElectricalGroup } from './groups/ElectricalGroup';
import { PropertiesGroup } from './groups/PropertiesGroup';



// =============================================================================
// PANEL GROUP SLOT — Grupo ou Placeholder
// =============================================================================

interface PanelSlotProps {
  id: PanelGroupId;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  contextual?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

const PanelSlot: React.FC<PanelSlotProps> = ({
  id,
  label,
  icon,
  accentColor,
  contextual,
  onDismiss,
  children,
}) => {
  const isPromoted = useIsPromoted(id);
  const promoteToCenter = usePanelStore((s) => s.promoteToCenter);

  const restoreMap = usePanelStore((s) => s.restoreMap);

  if (isPromoted) {
    return (
      <PanelGroup
        id="minimap"
        label="Mapa e Topologia"
        icon={<Map size={10} />}
        accentColor="text-emerald-500"
        onMaximize={restoreMap}
      >
        <div className="shrink-0 p-2 animate-in fade-in">
          {/* Container âncora para o Portal do Leaflet */}
          <div 
            id="minimap-portal-target" 
            className="w-full h-48 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative shadow-inner pointer-events-none"
          />
        </div>
      </PanelGroup>
    );
  }

  return (
    <PanelGroup
      id={id}
      label={label}
      icon={icon}
      accentColor={accentColor}
      onMaximize={() => promoteToCenter(id)}
      contextual={contextual}
      onDismiss={onDismiss}
    >
      {children}
    </PanelGroup>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

export const RightInspector: React.FC = () => {
  const clearSelection = useUIStore((state) => state.clearSelection);

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">

      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        <PanelSlot id="site" label="Site" icon={<MapPin size={10} />} accentColor="text-emerald-400">
          <SiteContextGroup />
        </PanelSlot>

        <PanelSlot
          id="simulation"
          label="Simulação"
          icon={<BarChart3 size={10} />}
          accentColor="text-teal-400"
        >
          <SimulationGroup />
        </PanelSlot>

        <PanelSlot id="electrical" label="Elétrico" icon={<Activity size={10} />} accentColor="text-indigo-400">
          <ElectricalGroup />
        </PanelSlot>

        {/* Properties — contextual: aparece apenas com seleção ativa */}
        <PanelSlot
          id="properties"
          label="Propriedades"
          icon={<Layers size={10} />}
          accentColor="text-violet-400"
          contextual
          onDismiss={clearSelection}
        >
          <PropertiesGroup />
        </PanelSlot>
      </div>
    </div>
  );
};
