import React from 'react';
import { Sun, Map, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechKPIs } from '../../../../hooks/useTechKPIs';

export type MapMode = 'placement' | 'drawing' | 'neutral';

interface MapContextBarProps {
  mode: MapMode;
}

export const MapContextBar: React.FC<MapContextBarProps> = ({ mode }) => {
  const setFocusedBlock = useUIStore(s => s.setFocusedBlock);

  if (mode === 'placement') return <PlacementBar setFocusedBlock={setFocusedBlock} />;
  if (mode === 'drawing') return <DrawingBar setFocusedBlock={setFocusedBlock} />;
  return <NeutralBar />;
};

// ─── PLACEMENT BAR ──────────────────────────────────────────────────────────────

const PlacementBar: React.FC<{ setFocusedBlock: (b: any) => void }> = ({ setFocusedBlock }) => {
  const modules = useSolarStore(selectModules);
  const placedCount = modules.length;

  return (
    <div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-amber-500/20 flex items-center justify-between px-3 text-xs shrink-0">
      <div className="flex items-center gap-3 text-slate-400">
        <Sun size={12} className="text-amber-400" />
        <span>
          <span className="text-amber-400 font-medium font-mono tabular-nums">{placedCount}</span> módulos posicionados
        </span>
        {placedCount > 0 && (
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle size={10} /> inventário ativo
          </span>
        )}
      </div>

      {placedCount > 0 && (
        <button
          onClick={() => setFocusedBlock('inverter')}
          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          Ir para Inversor
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
};

// ─── DRAWING BAR ────────────────────────────────────────────────────────────────

const DrawingBar: React.FC<{ setFocusedBlock: (b: any) => void }> = ({ setFocusedBlock }) => {
  const { kpi } = useTechKPIs();

  return (
    <div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-indigo-500/20 flex items-center justify-between px-3 text-xs shrink-0">
      <div className="flex items-center gap-3 text-slate-400">
        <Map size={12} className="text-indigo-400" />
        <span className="text-indigo-400 font-medium">Arranjo Físico</span>
        {kpi.dcAcRatio > 0 && (
          <span className={cn(
            'font-mono tabular-nums',
            kpi.dcAcRatio >= 0.60 ? 'text-emerald-400' :
            kpi.dcAcRatio >= 0.40 ? 'text-amber-400' : 'text-red-400'
          )}>
            FDI {kpi.dcAcRatio.toFixed(2)}
          </span>
        )}
      </div>

      <button
        onClick={() => setFocusedBlock('module')}
        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
      >
        Posicionar módulos
        <ChevronRight size={12} />
      </button>
    </div>
  );
};

// ─── NEUTRAL BAR ────────────────────────────────────────────────────────────────

const NeutralBar: React.FC = () => {
  const clientData = useSolarStore(s => s.clientData);

  return (
    <div className="h-8 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/30 flex items-center px-3 text-xs text-slate-500 shrink-0">
      <MapPin size={12} className="mr-2" />
      {clientData?.city || 'Localização'}{clientData?.state ? `, ${clientData.state}` : ''}
      {clientData?.lat != null && (
        <span className="ml-3 font-mono text-slate-600 tabular-nums">
          {clientData.lat.toFixed(4)}°, {clientData.lng?.toFixed(4)}°
        </span>
      )}
    </div>
  );
};
