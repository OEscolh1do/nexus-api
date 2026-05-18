import React from 'react';
import { Plus, Navigation, Zap, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StringRow } from './components/StringRow';
import { ModulePickerIsland } from './components/ModulePickerIsland';
import { OrientationModal } from './components/OrientationModal';
import { StringPropertiesModal } from './components/StringPropertiesModal';
import { MPPTConfig, StringDef } from '../../../../store/useTechStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { ENGINEERING_CONSTANTS } from '../../../../constants/engineeringConstants';
import { calculateStringMetrics } from '../../../../utils/electricalMath';
import { getModuleSpecs } from '../../../../utils/specAdapter';

// ─────────────────────────────────────────────────────────────────────────────
// MPPT CONFIG STRIP — Cockpit de Engenharia v3
// Design inteligente: feedback visual imediato, controles de 1-clique,
// ─────────────────────────────────────────────────────────────────────────────

interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
  unitVmp: number;
  unitImp: number;
}

interface MPPTConfigStripProps {
  inverterId: string;
  mpptConfigs: MPPTConfig[];
  mpptMetrics: Record<number, MPPTMiniMetrics>;
  updateMPPT: (inverterId: string, mpptId: number, config: Partial<MPPTConfig>) => void;
  addStringToMPPT?: (inverterId: string, mpptId: number) => void;
  removeStringFromMPPT?: (inverterId: string, mpptId: number, stringId: string) => void;
  updateStringInMPPT?: (inverterId: string, mpptId: number, stringId: string, data: Partial<StringDef>) => void;
  limitVMax: number;
  limitVMpptMin: number;
  limitIscMaxMppt: number;
  startupVoltage: number;
  tmin: number;
  module?: any;
  /** Quando true, força grid de 1 coluna — usado pelo MPPTInspectorPanel (280px) para
   *  evitar distorção causada pelos breakpoints de viewport (md:grid-cols-2) */
  forceSingleColumn?: boolean;
  /** C02: Limite máximo de strings por MPPT (do catálogo). Fallback: 4 strings. */
  maxStringsPerMppt?: number;
}

// ─── Sub-componente: Barra de Telemetria ─────────────────────────────────────

interface TelemetryBarProps {
  label: string;
  value: number;
  limit: number;
  unit: string;
  errorThreshold?: number; // % em que vira vermelho (default: 100)
  warnThreshold?: number;  // % em que vira âmbar (default: 85)
}

const InlineTelemetry: React.FC<TelemetryBarProps> = ({
  label,
  value,
  limit,
  unit,
  errorThreshold = 100,
  warnThreshold = 85,
}) => {
  if (limit <= 0) return null;
  const pct = Math.min(110, (value / limit) * 100);
  const isError = pct >= errorThreshold;
  const isWarn  = !isError && pct >= warnThreshold;

  const barColor = isError ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                 : isWarn ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                 : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
  const textColor = isError ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-300';
  
  const shortLabel = label.split(' ').pop() || label;

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 justify-center hover:bg-slate-800/20 transition-colors" title={`${label}: ${value.toFixed(1)}${unit} (Limite: ${limit.toFixed(0)}${unit})`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          {label.includes('Voc') ? <Zap size={9} className="text-amber-400" /> : <div className="w-2.5 h-[2px] bg-sky-400 rounded-full" />}
          {shortLabel}
        </span>
        <div className="flex items-baseline gap-[1px]">
          <span className={cn('text-[11px] font-black font-mono tabular-nums tracking-tighter', textColor)}>
            {value.toFixed(0)}
          </span>
          <span className="text-[8px] text-slate-600 font-mono tracking-tighter">
            /{limit.toFixed(0)}<span className="font-bold opacity-70 ml-[1px]">{unit}</span>
          </span>
        </div>
      </div>
      <div className="h-[3px] bg-slate-900 rounded-full overflow-hidden flex shadow-inner border border-slate-800/80">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export const MPPTConfigStrip: React.FC<MPPTConfigStripProps> = ({
  inverterId,
  mpptConfigs,
  mpptMetrics,
  updateMPPT,
  addStringToMPPT,
  removeStringFromMPPT,
  updateStringInMPPT,
  limitVMax,
  limitVMpptMin,
  limitIscMaxMppt,
  startupVoltage,
  tmin,
  module,
  forceSingleColumn = false,
  maxStringsPerMppt = 4,
}) => {
  const [orientationModalMppt, setOrientationModalMppt] = React.useState<number | null>(null);
  const [configString, setConfigString] = React.useState<{ mpptId: number, str: StringDef } | null>(null);
  const [openPickerId, setOpenPickerId] = React.useState<number | null>(null);

  const globalAzimuth = useSolarStore(s => s.engineeringData.azimute);
  const globalInclination = useSolarStore(s => s.engineeringData.roofTilt);

  // Fechar picker ao clicar fora
  React.useEffect(() => {
    if (openPickerId === null) return;
    const handleDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.module-picker-container')) {
        setOpenPickerId(null);
      }
    };
    window.addEventListener('mousedown', handleDown);
    return () => window.removeEventListener('mousedown', handleDown);
  }, [openPickerId]);

  // ── Lista de Módulos Únicos para Seleção ──
  const availableModules = useSolarStore(selectModules);

  // [R5-08] LOW: Add availableModules.length to detect content changes
  const uniqueModuleModels = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    (availableModules as any[]).forEach((m: any) => {
      if (m && m.model && !seen.has(m.model)) {
        seen.add(m.model);
        unique.push(m);
      }
    });
    return unique;
  }, [availableModules, availableModules.length]);

  if (mpptConfigs.length === 0) return null;

  return (
    <div
      className="bg-slate-950 px-4 py-4 border-b border-slate-800 shrink-0"
      role="region"
      aria-label="Cockpit de MPPTs"
    >
      <div className={cn(
        'grid gap-3',
        forceSingleColumn
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
      )}>
        {mpptConfigs.map((mppt) => {
          const metrics   = mpptMetrics[mppt.mpptId];
          // [R4-12] LOW: Separate "has metrics" from "has active modules"
          const hasMetrics = !!metrics;
          // Note: hasActiveModules would be: hasMetrics && (metrics.powerKwp ?? 0) > 0
          // Currently not used for UI decisions, but kWp display uses hasMetrics
          const hasVoc    = hasMetrics && metrics.vocFrio > 0;
          const vocErr    = hasVoc && metrics.vocFrio > limitVMax;
          const vmpErr    = hasVoc && metrics.vmpCalor > 0 && metrics.vmpCalor < limitVMpptMin;
          const iscErr    = hasVoc && metrics.iscTotal > limitIscMaxMppt;
          const hasMism   = metrics?.hasMismatch;
          const hasError  = vocErr || vmpErr || iscErr;
          const sectionOk = hasVoc && !hasError && !hasMism;
          const strings   = mppt.strings ?? [];
          const isEmpty   = strings.length === 0;

          const statusDotClass = hasError
            ? 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]'
            : sectionOk || hasMism
            ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
            : 'bg-slate-600';

          // A1: Status bar lateral (ISA-101 pré-atentivo)
          const statusBarClass = hasError
            ? 'bg-red-500'
            : sectionOk || hasMism
            ? 'bg-emerald-500'
            : 'bg-slate-700';

          const cardBorderClass = hasError
            ? 'border-red-500/30'
            : sectionOk || hasMism
            ? 'border-slate-700 hover:border-sky-500/30'
            : 'border-slate-800';

          // B1: kWp hero color
          const kWpColor = sectionOk ? 'text-emerald-400' : hasError ? 'text-red-400' : 'text-slate-300';


          return (
            <div
              key={mppt.mpptId}
              id={`mppt-inspector-${mppt.mpptId}`}
              className={cn(
                'flex flex-col rounded-md border transition-all duration-300 relative overflow-hidden',
                cardBorderClass
              )}
            >
              {/* A1: Status Bar Lateral — atributo pré-atentivo ISA-101 */}
              <div className={cn('absolute left-0 inset-y-0 w-[3px] rounded-l-sm transition-colors duration-300', statusBarClass)} />

              {/* ── HEADER DENSE: Identidade + Config + kWp Hero ────────── */}
              <div className="flex items-center justify-between pl-5 pr-3 py-1.5 border-b border-slate-800/60 bg-slate-950/40">
                
                {/* Esquerda: Identidade e Config */}
                <div className="flex items-center gap-2 overflow-hidden">
                  {/* Status Dot + ID */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300', statusDotClass)} />
                    <span className="text-[11px] font-black font-mono tracking-widest text-slate-200 uppercase">
                      MPPT {mppt.mpptId}
                    </span>
                  </div>

                  {/* Separator */}
                  <div className="w-[1px] h-3 bg-slate-800 shrink-0 hidden sm:block" />

                  {/* Config (Módulo + Orientação) inline */}
                  <div className="flex items-center gap-0.5 min-w-0">
                    {/* B2: Module Picker ghost */}
                    <div className="relative module-picker-container shrink-0">
                      {(() => {
                        const selObj = mppt.moduleModel
                          ? (availableModules as any[]).find(m => m.model === mppt.moduleModel)
                          : module;
                        return (
                          <button
                            onClick={() => setOpenPickerId(openPickerId === mppt.mpptId ? null : mppt.mpptId)}
                            className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded transition-all',
                              mppt.moduleModel
                                ? 'text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                            )}
                            title={selObj?.model ?? 'Selecionar módulo'}
                          >
                            <Sun size={9} className={mppt.moduleModel ? 'text-sky-400' : 'text-amber-500/60'} />
                            <span className="text-[9px] font-bold font-mono tracking-tight whitespace-nowrap">
                              {selObj?.power ?? '—'}W
                            </span>
                          </button>
                        );
                      })()}
                      {openPickerId === mppt.mpptId && (
                        <ModulePickerIsland
                          options={uniqueModuleModels}
                          selectedValue={mppt.moduleModel}
                          defaultModule={module}
                          onSelect={(model) => updateMPPT(inverterId, mppt.mpptId, { moduleModel: model })}
                          onClose={() => setOpenPickerId(null)}
                        />
                      )}
                    </div>

                    <span className="text-slate-700 select-none shrink-0">·</span>

                    {/* Orientação ghost */}
                    <button
                      onClick={() => setOrientationModalMppt(mppt.mpptId)}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-tight transition-all shrink-0',
                        mppt.azimuth !== undefined
                          ? 'text-amber-400 hover:bg-amber-500/10'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                      )}
                      title={mppt.azimuth !== undefined ? 'Orientação customizada' : 'Orientação herdada do projeto'}
                    >
                      <Navigation size={9} className={mppt.azimuth !== undefined ? 'text-amber-400' : 'text-slate-600'} />
                      <span className="tabular-nums">
                        {mppt.azimuth ?? globalAzimuth}° / {mppt.inclination ?? globalInclination}°
                      </span>
                    </button>
                  </div>
                </div>

                {/* [R4-12] B1: kWp como Hero Metric — show "0.00" when hasMetrics but no active modules */}
                <div className="flex items-baseline gap-1 shrink-0 ml-2">
                  {hasMetrics ? (
                    <span
                      key={metrics.powerKwp}
                      className={cn(
                        'text-[18px] font-black font-mono tabular-nums tracking-tighter leading-none animate-in fade-in duration-300',
                        kWpColor
                      )}
                    >
                      {metrics.powerKwp.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[13px] font-black font-mono text-slate-600">———</span>
                  )}
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">kWp</span>
                </div>
              </div>

              {/* ── Twin Telemetry (só quando tem dados) ─────────────── */}
              {hasVoc && (
                <div
                  key={mppt.moduleModel || 'default'}
                  className="grid grid-cols-2 divide-x divide-slate-800/60 border-b border-slate-800/60 bg-slate-900/20 animate-in fade-in duration-500"
                >
                  <InlineTelemetry
                    label="Tensão Voc"
                    value={metrics.vocFrio}
                    limit={limitVMax}
                    unit="V"
                    errorThreshold={100}
                    warnThreshold={88}
                  />
                  <InlineTelemetry
                    label="Corrente Isc"
                    value={metrics.iscTotal}
                    limit={limitIscMaxMppt}
                    unit="A"
                    errorThreshold={100}
                    warnThreshold={85}
                  />
                </div>
              )}

              {/* ── Modal de Orientação ──────────────────────────────── */}
              <OrientationModal
                isOpen={orientationModalMppt === mppt.mpptId}
                onClose={() => setOrientationModalMppt(null)}
                azimuth={mppt.azimuth ?? globalAzimuth}
                inclination={mppt.inclination ?? globalInclination}
                isCustom={mppt.azimuth !== undefined}
                title={`Ajuste Fino — MPPT ${mppt.mpptId}`}
                onSave={(az, inc) => {
                  updateMPPT(inverterId, mppt.mpptId, { azimuth: az, inclination: inc });
                  setOrientationModalMppt(null);
                }}
              />

              {/* ── Seção de Strings ────────────────────────────────────── */}
              <div className="px-2 py-2 flex flex-col gap-1.5">
                {/* Header da seção */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                    Strings
                    {strings.length > 0 && (
                      <span className="ml-1.5 text-slate-600">({strings.length})</span>
                    )}
                  </span>
                  {addStringToMPPT && (() => {
                    const currentStrings = strings.length;
                    const canAddString = currentStrings < maxStringsPerMppt;
                    return (
                      <button
                        onClick={() => canAddString && addStringToMPPT(inverterId, mppt.mpptId)}
                        disabled={!canAddString}
                        className={cn(
                          "flex items-center gap-1 text-[9px] font-black transition-colors active:scale-95",
                          canAddString
                            ? "text-sky-500 hover:text-sky-300"
                            : "text-slate-700 cursor-not-allowed"
                        )}
                        title={canAddString ? 'Adicionar nova string' : `Limite de ${maxStringsPerMppt} string(s) por MPPT atingido`}
                      >
                        <Plus size={10} strokeWidth={3} />
                        Nova String
                      </button>
                    );
                  })()}
                </div>

                {/* Banner de conversão de dados legados */}
                {isEmpty && (mppt.stringsCount ?? 0) > 0 && (
                  <div className="flex items-center justify-between gap-2 bg-amber-500/5 border border-amber-500/20 rounded p-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-amber-400 font-bold">Dados legados</p>
                      <p className="text-[9px] text-slate-500 truncate">
                        {mppt.stringsCount}× {mppt.modulesPerString ?? '?'} módulos
                      </p>
                    </div>
                    {addStringToMPPT && (
                      <button
                        onClick={() => {
                          if (addStringToMPPT) {
                            for (let i = 0; i < (mppt.stringsCount ?? 0); i++) {
                              addStringToMPPT(inverterId, mppt.mpptId);
                            }
                          }
                        }}
                        className="shrink-0 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded text-[9px] font-black transition-all whitespace-nowrap"
                      >
                        Converter
                      </button>
                    )}
                  </div>
                )}

                {/* B: String list sem container extra (sem double padding) */}
                {isEmpty ? (
                  <div className="flex items-center gap-1.5 py-1.5 px-1 opacity-30">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Aguardando módulos</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {strings.map((str, idx) => {
                      const selObj = mppt.moduleModel
                        ? (availableModules as any[]).find(m => m.model === mppt.moduleModel)
                        : module;
                      const repSpecs = getModuleSpecs(selObj);

                      // A02: Guard null repSpecs to prevent crash when module not found
                      if (!repSpecs) {
                        return (
                          <div key={str.id} className="text-[9px] text-amber-400 px-2 py-1.5 border border-amber-500/20 rounded bg-amber-500/5">
                            ⚠ Módulo &quot;{mppt.moduleModel ?? 'desconhecido'}&quot; não encontrado. Selecione outro módulo para este MPPT.
                          </div>
                        );
                      }

                      let mpptMaxModules = 40;
                      let mpptMinModules = 0;
                      let unitVoc = 0;
                      let unitVmp = metrics?.unitVmp || 0;
                      let unitImp = metrics?.unitImp || 0;

                      if (repSpecs) {
                        // Limites baseados no Módulo real deste MPPT
                        const metrics1 = calculateStringMetrics(repSpecs, 1, tmin);
                        unitVoc = metrics1.vocMax;
                        const vmpCalor1 = metrics1.vmpMin;

                        mpptMaxModules = unitVoc > 0 ? Math.floor(limitVMax / unitVoc) : 40;
                        const effectiveMinVoltage = Math.max(limitVMpptMin, startupVoltage);
                        // R8-06: Fallback conservador para CC_VOLTAGE_DROP_FACTOR se for 0 ou undefined
                        const dropFactor = (ENGINEERING_CONSTANTS.CC_VOLTAGE_DROP_FACTOR > 0)
                          ? ENGINEERING_CONSTANTS.CC_VOLTAGE_DROP_FACTOR
                          : 0.98; // Fallback conservador NBR 16690
                        mpptMinModules = vmpCalor1 > 0 ? Math.ceil(effectiveMinVoltage / (vmpCalor1 * dropFactor)) : 0;
                        unitVmp = repSpecs.vmp;
                        unitImp = repSpecs.imp;
                      }

                      return (
                        <StringRow
                          key={str.id}
                          str={str}
                          index={idx}
                          mpptAzimuth={mppt.azimuth}
                          mpptInclination={mppt.inclination}
                          maxModules={mpptMaxModules}
                          minModules={mpptMinModules}
                          unitVoc={unitVoc}
                          unitVmp={unitVmp}
                          unitImp={unitImp}
                          onUpdate={(data) =>
                            updateStringInMPPT?.(inverterId, mppt.mpptId, str.id, data)
                          }
                          onOpenProperties={() => setConfigString({ mpptId: mppt.mpptId, str })}
                          onRemove={
                            strings.length > 1
                              ? () => removeStringFromMPPT?.(inverterId, mppt.mpptId, str.id)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Modal de Propriedades da String ── */}
              {configString && configString.mpptId === mppt.mpptId && (
                <StringPropertiesModal
                  isOpen={true}
                  onClose={() => setConfigString(null)}
                  title={`Propriedades — String S${strings.findIndex(s => s.id === configString.str.id) + 1}`}
                  data={{
                    azimuth: configString.str.azimuth,
                    inclination: configString.str.inclination,
                    cableLength: configString.str.cableLength,
                    cableSection: configString.str.cableSection,
                    modulesCount: configString.str.modulesCount
                  }}
                  onSave={(updates) => {
                    updateStringInMPPT?.(inverterId, mppt.mpptId, configString.str.id, updates);
                    // Atualiza o estado local para refletir no modal aberto (se não fechar)
                    setConfigString(prev => prev ? { ...prev, str: { ...prev.str, ...updates } } : null);
                  }}
                />
              )}

              {/* A telemetria ficava aqui no rodapé. Foi movida para o topo. */}
            </div>
          );
        })}
      </div>
    </div>
  );
};
