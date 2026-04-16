import React from 'react';
import { usePanelStore } from '../../store/panelStore';
import { MapPin, BarChart2, Zap, ShieldCheck, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useUIStore, useFocusedBlock, type FocusedBlock } from '@/core/state/uiStore';

// Mesmas Canvas Views que tínhamos no TopRibbon, refletindo a nova sincrônica dos blocos
const SHEET_TABS: { id: FocusedBlock; icon: LucideIcon; label: string }[] = [
  { id: 'consumption',   icon: Zap,            label: 'Consumo' },
  { id: 'module',        icon: LayoutDashboard,label: 'Módulos' }, // Mantive as equivalências
  { id: 'inverter',      icon: ShieldCheck,    label: 'Elétrica' },
  { id: 'simulation',    icon: BarChart2,      label: 'Simulação' },
  { id: 'map',           icon: MapPin,         label: 'Mapa' },
];

export const WorkspaceTabs: React.FC = () => {
  const focusedBlock = useFocusedBlock();
  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
  const restoreMap = usePanelStore(s => s.restoreMap);

  const handleTabSwitch = (viewId: FocusedBlock) => {
    setFocusedBlock(viewId);
    // As views da Jornada (consumption, module, inverter, simulation) vivem como
    // FrozenViewContainer sobrepostos ao MapCore. Para elas aparecerem, o
    // centerContent PRECISA estar em 'map' (isMapVisible = true).
    // Apenas abas que promovem um painel externo (settings, docs etc.) vão para isMinimap.
    restoreMap(); // garante centerContent === 'map' para TODAS as abas da Jornada
  };

  return (
    <div className="w-full flex items-end px-1 bg-slate-950 border-t border-slate-800 z-40 shrink-0">
      <div className="flex items-end gap-0.5 pt-1">
        {SHEET_TABS.map(({ id, icon: Icon, label }) => {
          // A tab está ativa se o ID corresponder, com exceção de map quando null
          const isActive = focusedBlock === id || (focusedBlock === null && id === 'map');
          return (
            <button
              key={id}
              onClick={() => handleTabSwitch(id)}
              className={cn(
                'group flex items-center gap-1.5 px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-t-md border-x border-t transition-all',
                isActive
                  ? 'bg-slate-800 text-neonorte-green border-slate-700 shadow-[0_-2px_6px_rgba(0,0,0,0.1)] relative z-10 h-8'
                  : 'bg-slate-900/80 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300 h-7 opacity-80 hover:opacity-100'
              )}
            >
              <Icon size={12} className={isActive ? 'text-neonorte-green' : 'opacity-70 group-hover:opacity-100'} />
              <span>{label}</span>
              
              {/* Highlight superior na aba ativa */}
              {isActive && (
                 <div className="absolute top-0 left-0 right-0 h-[2px] bg-neonorte-green rounded-t-md" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
