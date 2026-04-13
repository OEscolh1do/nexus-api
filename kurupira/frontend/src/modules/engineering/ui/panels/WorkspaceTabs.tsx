import React from 'react';
import { usePanelStore, type PanelGroupId } from '../../store/panelStore';
import { MapPin, BarChart2, Zap, ShieldCheck, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mesmas Canvas Views que tínhamos no TopRibbon, agora no estilo Excel
const SHEET_TABS: { id: 'map' | PanelGroupId; icon: LucideIcon; label: string }[] = [
  { id: 'map',           icon: MapPin,         label: 'Modelo Sítio' },
  { id: 'simulation',    icon: BarChart2,      label: 'Layout Simulação' },
  { id: 'electrical',    icon: Zap,            label: 'Diagrama Elétrico' },
  { id: 'documentation', icon: ShieldCheck,    label: 'Relatórios' },
  { id: 'proposal',      icon: LayoutDashboard,label: 'Proposta' },
];

export const WorkspaceTabs: React.FC = () => {
  const centerContent = usePanelStore(s => s.centerContent);
  const promoteToCenter = usePanelStore(s => s.promoteToCenter);
  const restoreMap = usePanelStore(s => s.restoreMap);

  const handleTabSwitch = (viewId: 'map' | PanelGroupId) => {
    if (viewId === 'map') {
      restoreMap();
    } else {
      promoteToCenter(viewId as PanelGroupId);
    }
  };

  return (
    <div className="w-full flex items-end px-1 bg-slate-950 border-t border-slate-800 z-40 shrink-0">
      <div className="flex items-end gap-0.5 pt-1">
        {SHEET_TABS.map(({ id, icon: Icon, label }) => {
          const isActive = centerContent === id;
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
