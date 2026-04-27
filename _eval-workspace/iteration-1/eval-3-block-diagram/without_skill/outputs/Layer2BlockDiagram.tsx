/**
 * Layer2BlockDiagram.tsx — WITHOUT SKILL (baseline genérico)
 *
 * Diagrama de blocos para módulo de Arranjo FV — versão sem guia de skill.
 * Nomes genéricos, sem referência à spec do Kurupira.
 */

import React, { useMemo, useState, useCallback } from 'react';

// ─── STUBS ────────────────────────────────────────────────────────────────────

export interface MPPTConfig {
  mpptId: number;
  stringIds: string[];
  stringsCount: number;
  modulesPerString: number;
  azimuth?: number;
  inclination?: number;
  cableLength: number;
  cableSection: number;
}

export interface InverterState {
  id: string;
  catalogId: string;
  quantity: number;
  mpptConfigs: MPPTConfig[];
  snapshot: {
    model: string;
    nominalPower: number;
    mppts: number;
    maxInputVoltage: number;
    minMpptVoltage: number;
    maxMpptVoltage: number;
    maxCurrentPerMPPT: number;
  };
}

export interface LogicalString {
  id: string;
  name: string;
  mpptId: string | null;
  moduleIds: string[];
  azimuth?: number;
  inclination?: number;
}

export type ValidationStatus = 'ok' | 'warning' | 'error';

export interface MPPTValidationEntry {
  inverterId: string;
  mpptId: number;
  status: ValidationStatus;
  vocMax: number;
  vmpMin: number;
  vmpMax: number;
  iscMax: number;
  messages: string[];
}

export interface SystemValidationReport {
  globalStatus: ValidationStatus;
  entries: MPPTValidationEntry[];
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_STRINGS: LogicalString[] = [
  { id: 'str-1', name: 'String 1', mpptId: 'inv-a:1', moduleIds: Array.from({ length: 12 }, (_, i) => `mod-${i}`), azimuth: 180, inclination: 15 },
  { id: 'str-2', name: 'String 2', mpptId: 'inv-a:1', moduleIds: Array.from({ length: 12 }, (_, i) => `mod-${i+12}`), azimuth: 180, inclination: 15 },
  { id: 'str-3', name: 'String 3', mpptId: 'inv-a:2', moduleIds: Array.from({ length: 10 }, (_, i) => `mod-${i+24}`), azimuth: 270, inclination: 15 },
  { id: 'str-4', name: 'String 4', mpptId: 'inv-a:2', moduleIds: Array.from({ length: 12 }, (_, i) => `mod-${i+34}`), azimuth: 180, inclination: 15 },
  { id: 'str-5', name: 'String 5', mpptId: 'inv-a:3', moduleIds: Array.from({ length: 11 }, (_, i) => `mod-${i+46}`), azimuth: 90,  inclination: 10 },
  { id: 'str-6', name: 'String 6', mpptId: null,       moduleIds: Array.from({ length: 8  }, (_, i) => `mod-${i+57}`) },
];

const DEMO_INVERTERS: InverterState[] = [{
  id: 'inv-a', catalogId: 'cat-001', quantity: 1,
  snapshot: { model: 'SMA Sunny Tripower 15000TL', nominalPower: 15, mppts: 3, maxInputVoltage: 1000, minMpptVoltage: 150, maxMpptVoltage: 800, maxCurrentPerMPPT: 22 },
  mpptConfigs: [
    { mpptId: 1, stringIds: ['str-1','str-2'], stringsCount: 2, modulesPerString: 12, azimuth: 180, inclination: 15, cableLength: 30, cableSection: 4 },
    { mpptId: 2, stringIds: ['str-3','str-4'], stringsCount: 2, modulesPerString: 11, azimuth: 180, inclination: 15, cableLength: 40, cableSection: 4 },
    { mpptId: 3, stringIds: ['str-5'],         stringsCount: 1, modulesPerString: 11, azimuth: 90,  inclination: 10, cableLength: 20, cableSection: 6 },
  ],
}];

const DEMO_VALIDATION: SystemValidationReport = {
  globalStatus: 'warning',
  entries: [
    { inverterId: 'inv-a', mpptId: 1, status: 'ok',      vocMax: 512, vmpMin: 380, vmpMax: 480, iscMax: 18.2, messages: [] },
    { inverterId: 'inv-a', mpptId: 2, status: 'warning',  vocMax: 480, vmpMin: 360, vmpMax: 460, iscMax: 20.1, messages: ['Strings com orientações diferentes — perda estimada 3–5%'] },
    { inverterId: 'inv-a', mpptId: 3, status: 'ok',       vocMax: 468, vmpMin: 350, vmpMax: 440, iscMax: 9.8,  messages: [] },
  ],
};

function useInverters(): InverterState[] { return useMemo(() => DEMO_INVERTERS, []); }
function useStrings(): LogicalString[] { return useMemo(() => DEMO_STRINGS, []); }
function useElectricalReport(): SystemValidationReport | null { return useMemo(() => DEMO_VALIDATION, []); }
function useNavigateToElectrical(): () => void {
  return useCallback(() => { console.info('[Layer2BlockDiagram] → Electrical Validation'); }, []);
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

const STRING_COLORS = [
  { bg: 'bg-sky-500/15',     border: 'border-sky-500/40',     text: 'text-sky-300',     dot: 'bg-sky-400' },
  { bg: 'bg-violet-500/15',  border: 'border-violet-500/40',  text: 'text-violet-300',  dot: 'bg-violet-400' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  { bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    text: 'text-rose-300',    dot: 'bg-rose-400' },
  { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-300',   dot: 'bg-amber-400' },
] as const;

type StringColor = typeof STRING_COLORS[number];

function getStringColor(index: number): StringColor {
  return STRING_COLORS[index % STRING_COLORS.length];
}

function hasMismatch(mpptCfg: MPPTConfig, stringsMap: Map<string, LogicalString>): boolean {
  const assigned = mpptCfg.stringIds.map(id => stringsMap.get(id)).filter(Boolean) as LogicalString[];
  if (assigned.length < 2) return false;
  const azimuths = assigned.map(s => s.azimuth ?? null).filter((v): v is number => v !== null);
  if (azimuths.length < 2) return false;
  return azimuths.some(az => Math.abs(az - azimuths[0]) > 15);
}

type StringStatus = 'ok' | 'mismatch' | 'error' | 'unassigned';

function getStringStatus(str: LogicalString, entry: MPPTValidationEntry | undefined, isMismatch: boolean): StringStatus {
  if (!str.mpptId) return 'unassigned';
  if (entry?.status === 'error') return 'error';
  if (isMismatch) return 'mismatch';
  return 'ok';
}

// ─── SUBCOMPONENTES ──────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: StringStatus }> = ({ status }) => {
  const map: Record<StringStatus, { label: string; cls: string }> = {
    ok:         { label: '✅ OK',      cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    mismatch:   { label: '⚠ Mismatch', cls: 'text-amber-300  bg-amber-500/10  border-amber-500/30' },
    error:      { label: '🔴 Erro',    cls: 'text-red-300    bg-red-500/10    border-red-500/30' },
    unassigned: { label: 'Livre',      cls: 'text-slate-400  bg-slate-700/50  border-slate-600/40' },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
};

interface StringBlockProps {
  str: LogicalString;
  colorIndex: number;
  status: StringStatus;
  isSelected: boolean;
  onClick: (str: LogicalString) => void;
}

const StringBlock: React.FC<StringBlockProps> = ({ str, colorIndex, status, isSelected, onClick }) => {
  const color = getStringColor(colorIndex);
  const borderCls = isSelected
    ? 'ring-2 ring-white/60 border-white/30'
    : status === 'error' ? 'border-red-500/50'
    : status === 'mismatch' ? 'border-amber-500/50'
    : color.border;

  return (
    <button
      type="button"
      onClick={() => onClick(str)}
      className={`flex flex-col gap-1.5 px-3 py-2.5 rounded border transition-all text-left cursor-pointer hover:brightness-110 focus:outline-none ${color.bg} ${borderCls}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
        <span className={`text-[11px] font-bold font-mono ${color.text}`}>{str.name}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 font-mono">{str.moduleIds.length} módulos</span>
        <StatusBadge status={status} />
      </div>
    </button>
  );
};

// ─── PAINEL LATERAL ──────────────────────────────────────────────────────────

interface StringDetailPanelProps {
  str: LogicalString;
  colorIndex: number;
  status: StringStatus;
  validationEntry: MPPTValidationEntry | undefined;
  inverterId: string;
  mpptId: number;
  onClose: () => void;
  onNavigateToElectrical: () => void;
}

const StringDetailPanel: React.FC<StringDetailPanelProps> = ({
  str, colorIndex, status, validationEntry, mpptId, onClose, onNavigateToElectrical,
}) => {
  const color = getStringColor(colorIndex);
  const n = str.moduleIds.length;
  const vocStr = (41.3 * n).toFixed(1);
  const iscStr = '10.1';

  return (
    <aside
      className="flex flex-col h-full w-72 bg-slate-950 border-l border-slate-800"
      style={{ animation: 'slideIn 0.25s ease' }}
    >
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-800 ${color.bg}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
        <span className={`text-sm font-bold ${color.text}`}>{str.name}</span>
        <StatusBadge status={status} />
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white p-1 rounded hover:bg-white/10">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Elétrico</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-900 rounded border border-slate-800 p-2">
              <span className="text-slate-500 text-[9px]">Voc (STC)</span>
              <p className="text-slate-200 font-bold">{vocStr} V</p>
            </div>
            <div className="bg-slate-900 rounded border border-slate-800 p-2">
              <span className="text-slate-500 text-[9px]">Isc</span>
              <p className="text-slate-200 font-bold">{iscStr} A</p>
            </div>
            <div className="bg-slate-900 rounded border border-slate-800 p-2">
              <span className="text-slate-500 text-[9px]">Módulos</span>
              <p className="text-slate-200 font-bold">{n}</p>
            </div>
            <div className="bg-slate-900 rounded border border-slate-800 p-2">
              <span className="text-slate-500 text-[9px]">MPPT</span>
              <p className="text-slate-200 font-bold">MPPT {mpptId}</p>
            </div>
          </div>
        </div>

        {validationEntry && validationEntry.messages.length > 0 && (
          <div>
            <p className="text-[10px] text-amber-500 uppercase tracking-widest mb-2">Alertas</p>
            {validationEntry.messages.map((msg, i) => (
              <p key={i} className="text-xs text-amber-300 bg-amber-950/30 border border-amber-700/30 rounded p-2">
                ⚠ {msg}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 flex flex-col gap-2">
        <button
          onClick={onNavigateToElectrical}
          className="w-full py-2 px-3 rounded border border-indigo-700/40 bg-indigo-900/20 text-indigo-300 text-xs font-bold hover:bg-indigo-800/30 transition-colors"
        >
          → Validação elétrica
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </aside>
  );
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export const Layer2BlockDiagram: React.FC = () => {
  const inverters            = useInverters();
  const allStrings           = useStrings();
  const validationReport     = useElectricalReport();
  const navigateToElectrical = useNavigateToElectrical();

  const [selectedString, setSelectedString] = useState<LogicalString | null>(null);

  const stringColorMap = useMemo<Map<string, number>>(() => {
    const m = new Map<string, number>();
    allStrings.forEach((s, i) => m.set(s.id, i));
    return m;
  }, [allStrings]);

  const stringsMap = useMemo<Map<string, LogicalString>>(() => {
    const m = new Map<string, LogicalString>();
    allStrings.forEach(s => m.set(s.id, s));
    return m;
  }, [allStrings]);

  const validationMap = useMemo<Map<string, MPPTValidationEntry>>(() => {
    const m = new Map<string, MPPTValidationEntry>();
    validationReport?.entries.forEach(e => m.set(`${e.inverterId}:${e.mpptId}`, e));
    return m;
  }, [validationReport]);

  const anyMismatch = useMemo(
    () => inverters.some(inv => inv.mpptConfigs.some(cfg => hasMismatch(cfg, stringsMap))),
    [inverters, stringsMap]
  );

  const hasErrors = validationReport?.globalStatus === 'error';

  const handleSelect = useCallback((str: LogicalString) => {
    setSelectedString(prev => prev?.id === str.id ? null : str);
  }, []);

  const selectedMeta = useMemo(() => {
    if (!selectedString?.mpptId) return null;
    const [inverterId, mpptIdStr] = selectedString.mpptId.split(':');
    const mpptId = parseInt(mpptIdStr, 10);
    return {
      inverterId,
      mpptId,
      colorIdx: stringColorMap.get(selectedString.id) ?? 0,
      validationEntry: validationMap.get(selectedString.mpptId),
    };
  }, [selectedString, stringColorMap, validationMap]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.10) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Mismatch banner */}
      {anyMismatch && (
        <div className="relative shrink-0 flex items-center gap-2 px-4 py-3 bg-amber-950/40 border-b border-amber-700/30 text-amber-200 text-xs">
          <span>⚠</span>
          <span>
            <strong>Mismatch detectado</strong> — MPPTs com strings de orientações diferentes causam perdas.
          </span>
        </div>
      )}

      <div className="relative flex flex-1 min-h-0">
        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {inverters.map(inv => (
            <section key={inv.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded border border-slate-700 bg-slate-900/70 w-fit">
                <span className="text-xs font-bold text-slate-200">⚡ {inv.snapshot.model}</span>
                <span className="text-[10px] text-slate-500 font-mono">{inv.snapshot.nominalPower} kW CA</span>
              </div>

              <div className="ml-3 pl-3 flex flex-col gap-3 border-l border-slate-700/50">
                {inv.mpptConfigs.map(cfg => {
                  const key = `${inv.id}:${cfg.mpptId}`;
                  const entry = validationMap.get(key);
                  const isMismatch = hasMismatch(cfg, stringsMap);
                  const mpptStrings = cfg.stringIds
                    .map(id => stringsMap.get(id))
                    .filter(Boolean) as LogicalString[];

                  const mpptBorderCls = entry?.status === 'error'
                    ? 'border-red-600/50 bg-red-950/20'
                    : isMismatch
                    ? 'border-amber-500/40 bg-amber-950/15'
                    : 'border-slate-700/50 bg-slate-900/50';

                  return (
                    <div key={cfg.mpptId} className={`rounded border overflow-hidden ${mpptBorderCls}`}>
                      <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-800/40 bg-black/20">
                        <span className={`text-[11px] font-bold font-mono ${isMismatch ? 'text-amber-400' : 'text-emerald-400'}`}>
                          MPPT {cfg.mpptId}
                        </span>
                        {isMismatch && (
                          <span className="ml-auto text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            ⚠ Mismatch
                          </span>
                        )}
                        {!isMismatch && !entry?.status && (
                          <span className="ml-auto text-[9px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            ✅ Compatível
                          </span>
                        )}
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {mpptStrings.map(str => (
                          <StringBlock
                            key={str.id}
                            str={str}
                            colorIndex={stringColorMap.get(str.id) ?? 0}
                            status={getStringStatus(str, entry, isMismatch)}
                            isSelected={selectedString?.id === str.id}
                            onClick={handleSelect}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Detail panel */}
        {selectedString && selectedMeta && (
          <StringDetailPanel
            str={selectedString}
            colorIndex={selectedMeta.colorIdx}
            status={getStringStatus(
              selectedString,
              selectedMeta.validationEntry,
              inverters
                .flatMap(inv => inv.mpptConfigs)
                .find(cfg => cfg.stringIds.includes(selectedString.id))
                ? hasMismatch(
                    inverters.flatMap(inv => inv.mpptConfigs).find(cfg => cfg.stringIds.includes(selectedString.id))!,
                    stringsMap
                  )
                : false
            )}
            validationEntry={selectedMeta.validationEntry}
            inverterId={selectedMeta.inverterId}
            mpptId={selectedMeta.mpptId}
            onClose={() => setSelectedString(null)}
            onNavigateToElectrical={navigateToElectrical}
          />
        )}
      </div>

      {/* Footer CTA */}
      <div className="relative shrink-0 px-5 py-4 border-t border-slate-800 bg-slate-950/90">
        {hasErrors ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded border border-red-900/50 bg-red-950/20 text-red-300 text-xs">
            🔴 <strong>Erros elétricos impeditivos.</strong> Corrija antes de avançar.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded border border-emerald-800/30 bg-emerald-950/15">
            <span className="text-xs text-emerald-300">
              {anyMismatch ? '⚠ Topologia com avisos' : '✅ Topologia OK'}
            </span>
            <button
              onClick={navigateToElectrical}
              className="flex items-center gap-2 px-5 py-2 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition-colors"
            >
              Ir para Validação Elétrica →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layer2BlockDiagram;
