/**
 * unifilarDetailCards — Inspection panels for UnifilarSchematicCanvas nodes
 *
 * Extracted from UnifilarSchematicCanvas.tsx (H1).
 * Each card is a slide-in panel that opens when the user clicks a schematic node.
 */

import React from 'react';
import { Zap, X, Info } from 'lucide-react';
import { type SchematicNode, type SchematicMarker, getMpptColor } from './unifilarTypes';

// =============================================================================
// STRING DETAIL CARD
// =============================================================================

export const StringDetailCard: React.FC<{
  node: SchematicNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mpptMetrics: Record<number, any>;
  onClose: () => void;
}> = ({ node, mpptMetrics, onClose }) => {
  if (node.data.type !== 'pv-string') return null;
  const { string, mpptId, mpptColor, fuseRef } = node.data;
  const metrics = mpptMetrics[mpptId];

  return (
    <div className="absolute top-0 right-0 h-full w-[264px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: mpptColor, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2 pl-1">
          <Zap className="h-3.5 w-3.5" style={{ color: mpptColor }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: mpptColor }}>
            {string.name}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 border border-slate-800  p-2.5">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">MPPT</div>
            <div className="text-sm font-mono font-bold" style={{ color: mpptColor }}>{mpptId}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800  p-2.5">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Módulos</div>
            <div className="text-sm font-mono text-emerald-400 font-bold">{string.modulesCount}</div>
          </div>
          {fuseRef && (
            <div className="bg-slate-900/50 border border-slate-800  p-2.5">
              <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Fusível</div>
              <div className="text-sm font-mono font-bold text-amber-400">{fuseRef}</div>
            </div>
          )}
        </div>

        {metrics && (
          <div className="bg-slate-900/30 border border-slate-800  p-3 space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-bold flex items-center justify-between">
              <span>Perfil Elétrico — MPPT {mpptId}</span>
            </div>

            {/* Voc cold with mini visual bar */}
            {metrics.vocFrio > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">Voc (frio extremo)</span>
                  <span className="text-[10px] font-mono text-sky-400 font-bold tabular-nums">{metrics.vocFrio.toFixed(1)} V</span>
                </div>
                <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500/60 rounded-full"
                    style={{ width: `${Math.min(100, (metrics.vocFrio / 1000) * 100)}%` }} />
                </div>
              </div>
            )}

            {/* Vmp hot with mini visual bar */}
            {metrics.vmpCalor > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">Vmp (calor máx.)</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold tabular-nums">{metrics.vmpCalor.toFixed(1)} V</span>
                </div>
                <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500/60 rounded-full"
                    style={{ width: `${Math.min(100, (metrics.vmpCalor / 1000) * 100)}%` }} />
                </div>
              </div>
            )}

            {metrics.iscTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Isc total MPPT</span>
                <span className="text-[10px] font-mono text-red-400 font-bold tabular-nums">{metrics.iscTotal.toFixed(2)} A</span>
              </div>
            )}

            {metrics.powerKwp > 0 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
                <span className="text-[9px] text-slate-500">Potência MPPT</span>
                <span className="text-[11px] font-mono text-emerald-400 font-black tabular-nums">{metrics.powerKwp.toFixed(2)} kWp</span>
              </div>
            )}

            {/* Derived: W per module */}
            {metrics.powerKwp > 0 && string.modulesCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600">W / módulo</span>
                <span className="text-[9px] font-mono text-slate-500 tabular-nums">
                  {Math.round((metrics.powerKwp * 1000) / string.modulesCount)} W
                </span>
              </div>
            )}
          </div>
        )}

        {(string.cableSection || string.cableLength) && (
          <div className="bg-slate-900/30 border border-slate-800  p-3 space-y-1.5">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Cabeamento</div>
            {string.cableSection > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Seção</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.cableSection} mm²</span>
              </div>
            )}
            {string.cableLength > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Comprimento</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.cableLength} m</span>
              </div>
            )}
          </div>
        )}

        {(string.azimuth !== undefined || string.inclination !== undefined) && (
          <div className="bg-slate-900/30 border border-slate-800  p-3 space-y-1.5">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Orientação</div>
            {string.azimuth !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Azimute</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.azimuth}°</span>
              </div>
            )}
            {string.inclination !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500">Inclinação</span>
                <span className="text-[10px] font-mono text-slate-300 font-bold">{string.inclination}°</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">
            NBR 16690:2019 · IEC 60617-11
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// INVERTER DETAIL PANEL (G5)
// =============================================================================

export const InverterDetailPanel: React.FC<{
  node: SchematicNode;
  onClose: () => void;
  // AREA7 fix: add mpptMetrics to show thermal voltages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mpptMetrics?: Record<number, any>;
}> = ({ node, onClose, mpptMetrics }) => {
  if (node.data.type !== 'inverter') return null;
  const { inverter, catalogItem } = node.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const footprint = (catalogItem as any)?.blockDiagramFootprint;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalInputs = footprint?.mpptChannels?.reduce((s: number, ch: any) => s + (ch.inputCount ?? 1), 0) ?? inverter.mpptConfigs.length;

  return (
    <div className="absolute top-0 right-0 h-full w-[264px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#6366f1', borderLeftWidth: 3 }}>
        <div className="flex items-center gap-2 pl-1">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400">INV-01</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/50 border border-slate-800  p-2.5 col-span-2">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Modelo</div>
            <div className="text-sm font-mono font-bold text-indigo-400">{catalogItem?.model ?? inverter.snapshot?.model ?? '—'}</div>
          </div>
          {catalogItem?.nominalPowerW && (
            <div className="bg-slate-900/50 border border-slate-800  p-2.5">
              <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Potência</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{(catalogItem.nominalPowerW / 1000).toFixed(1)} kW</div>
            </div>
          )}
          <div className="bg-slate-900/50 border border-slate-800  p-2.5">
            <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">MPPTs</div>
            <div className="text-sm font-mono font-bold text-sky-400">{inverter.mpptConfigs.length}</div>
          </div>
        </div>
        {footprint?.mpptChannels && footprint.mpptChannels.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800  p-3 space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Canais CC (Footprint)</div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {footprint.mpptChannels.map((ch: any) => (
              <div key={ch.mpptIndex} className="flex items-center justify-between">
                <span className="text-[9px] font-mono" style={{ color: getMpptColor(ch.mpptIndex - 1) }}>MPPT {ch.mpptIndex}</span>
                <span className="text-[9px] text-slate-400 font-mono">{ch.inputCount} entrad{ch.inputCount === 1 ? 'a' : 'as'}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
              <span className="text-[9px] text-slate-500">Total entradas CC</span>
              <span className="text-[10px] font-mono text-white font-bold">{totalInputs}</span>
            </div>
          </div>
        )}
        {/* AREA7 fix: Per-MPPT thermal voltages */}
        {mpptMetrics && inverter.mpptConfigs.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800  p-3 space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-bold">Tensões por MPPT</div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {inverter.mpptConfigs.map((mppt: any, idx: number) => {
              const m = mpptMetrics[mppt.mpptId];
              if (!m) return null;
              return (
                <div key={mppt.mpptId} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono" style={{ color: getMpptColor(idx) }}>MPPT {mppt.mpptId}</span>
                  </div>
                  {m.vocFrio > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-600">Voc (frio)</span>
                      <span className="text-[9px] font-mono text-sky-400 tabular-nums">{m.vocFrio.toFixed(1)} V</span>
                    </div>
                  )}
                  {m.vmpCalor > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-600">Vmp (quente)</span>
                      <span className="text-[9px] font-mono text-amber-400 tabular-nums">{m.vmpCalor.toFixed(1)} V</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {catalogItem?.maxInputVoltage && (
          <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">Vmáx entrada CC</span>
            <span className="text-[10px] font-mono font-bold text-sky-400">{catalogItem.maxInputVoltage} V</span>
          </div>
        )}
        {catalogItem?.minMpptVoltage && catalogItem?.maxMpptVoltage && (
          <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">Faixa MPPT</span>
            <span className="text-[10px] font-mono font-bold text-indigo-400">
              {catalogItem.minMpptVoltage}–{catalogItem.maxMpptVoltage} V
            </span>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">
            NBR 16690:2019 · IEC 60617-11
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// FUSE DETAIL CARD
// =============================================================================

export const FuseDetailCard: React.FC<{
  node: SchematicNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mpptMetrics: Record<number, any>;
  onClose: () => void;
}> = ({ node, mpptMetrics, onClose }) => {
  if (node.data.type !== 'fuse') return null;
  const { refDesig, mpptColor, mpptId } = node.data;
  const metrics = mpptMetrics[mpptId];
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: mpptColor, borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest pl-1" style={{ color: mpptColor }}>
          {refDesig}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Fusível de proteção CC — protege o condutor contra sobrecorrentes oriundas da string fotovoltaica.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Designador</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: mpptColor }}>{refDesig}</span>
        </div>
        {metrics?.unitIsc > 0 && (
          <>
            <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Isc string (unitário)</span>
              <span className="text-[10px] font-mono font-bold text-sky-400">{metrics.unitIsc.toFixed(2)} A</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30  p-2.5 flex items-center justify-between">
              <span className="text-[9px] text-amber-400">Mín. NBR 16690 (×1,56)</span>
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {(Math.ceil(1.56 * metrics.unitIsc * 10) / 10).toFixed(1)} A
              </span>
            </div>
          </>
        )}
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">IEC 60269 / NBR 13600</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 5.3</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BUS BAR DETAIL CARD
// =============================================================================

export const BusBarDetailCard: React.FC<{ node: SchematicNode; onClose: () => void }> = ({ node, onClose }) => {
  if (node.data.type !== 'bus-bar') return null;
  const { mpptId, mpptColor } = node.data;
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: mpptColor, borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest pl-1" style={{ color: mpptColor }}>
          Barramento CC — MPPT {mpptId}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Barramento de junção CC — agrega as strings do MPPT {mpptId} após os fusíveis individuais.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Canal MPPT</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: mpptColor }}>{mpptId}</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 5.2</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// DPS DETAIL CARD
// =============================================================================

export const DPSDetailCard: React.FC<{
  node: SchematicNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mpptMetrics: Record<number, any>;
  onClose: () => void;
}> = ({ node, mpptMetrics, onClose }) => {
  if (node.data.type !== 'dps-tap') return null;
  const { refDesig, mpptId } = node.data;
  const metrics = mpptMetrics[mpptId];
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#fbbf24', borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest text-amber-400 pl-1">{refDesig}</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Dispositivo de Proteção contra Surtos (DPS/SPD) — limita sobretensões transitórias de origem atmosférica ou de manobra no barramento CC.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Designador</span>
          <span className="text-[10px] font-mono font-bold text-amber-400">{refDesig}</span>
        </div>
        {metrics?.vocFrio > 0 && (
          <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500">Voc MPPT (ref. classe DPS)</span>
            <span className="text-[10px] font-mono font-bold text-sky-400">{metrics.vocFrio.toFixed(0)} V</span>
          </div>
        )}
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">IEC 61643 / NBR 61643</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Tipo (IEC 61643-31)</span>
          <span className="text-[10px] font-mono text-slate-300">
            {metrics?.vocFrio > 600 ? 'Classe I+II (DC)' : 'Classe II (DC)'}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 6.1</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// AC BREAKER DETAIL CARD
// =============================================================================

export const ACBreakerDetailCard: React.FC<{ node: SchematicNode; onClose: () => void }> = ({ node, onClose }) => {
  if (node.data.type !== 'ac-breaker') return null;
  const { refDesig } = node.data;
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#94a3b8', borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest text-slate-300 pl-1">{refDesig}</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Função</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Disjuntor de interligação CA — proteção e seccionamento da saída AC do inversor. Permite desconexão segura para manutenção.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Designador</span>
          <span className="text-[10px] font-mono font-bold text-slate-300">{refDesig}</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">IEC 60947-2 / NBR IEC 60947</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 6.3</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// GRID DETAIL CARD
// =============================================================================

export const GridDetailCard: React.FC<{ node: SchematicNode; onClose: () => void }> = ({ node, onClose }) => {
  if (node.data.type !== 'grid') return null;
  const phase = node.data.phase ?? 'mono'; // Defensive: default to mono if undefined
  return (
    <div className="absolute top-0 right-0 h-full w-[240px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: '#94a3b8', borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest text-slate-300 pl-1">Rede Elétrica</span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <div className="bg-slate-900/50 border border-slate-800  p-3 space-y-1.5">
          <div className="text-[8px] text-slate-500 uppercase font-bold">Ponto de Conexão</div>
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Barramento CA de interligação com a concessionária. Ponto de entrega da energia fotovoltaica gerada.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Sistema</span>
          <span className="text-[10px] font-mono font-bold text-slate-300">{phase === 'tri' ? 'Trifásico 3φ' : 'Monofásico 1φ'}</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800  p-2.5 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Norma</span>
          <span className="text-[10px] font-mono text-slate-400">ABNT NBR 16690 / ANEEL 482</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">NBR 16690 · Seção 7</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// VALIDATION ERROR PANEL
// =============================================================================

export const ValidationErrorPanel: React.FC<{
  marker: SchematicMarker;
  onClose: () => void;
}> = ({ marker, onClose }) => {
  const isError = marker.severity === 'error';
  const color = isError ? '#ef4444' : '#f59e0b';
  const label = isError ? 'Erro de Validação' : 'Aviso de Validação';

  return (
    <div className="absolute top-0 right-0 h-full w-[264px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0"
           style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
        <span className="text-xs font-black uppercase tracking-widest pl-1" style={{ color }}>
          {label}
        </span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {marker.messages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-900/50 border  p-3"
               style={{ borderColor: `${color}30` }}>
            <div className="w-1.5 h-1.5-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
            <p className="text-[10px] font-mono leading-relaxed" style={{ color }}>{msg}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-slate-700" />
          <span className="text-[7px] text-slate-700 font-mono uppercase tracking-widest">
            NBR 16690:2019 — Validação elétrica
          </span>
        </div>
      </div>
    </div>
  );
};
