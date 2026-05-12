import React from 'react';
import { Plus, Navigation, Split, Zap, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StringRow } from './components/StringRow';
import { ModulePickerIsland } from './components/ModulePickerIsland';
import { OrientationModal } from './components/OrientationModal';
import { StringPropertiesModal } from './components/StringPropertiesModal';
import { MPPTConfig, StringDef } from '../../../../store/useTechStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

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
  maxModulesLimit?: number;
  module?: any;
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
  maxModulesLimit = 40,
  module,
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
  }, [availableModules]);

  if (mpptConfigs.length === 0) return null;

  return (
    <div
      className="bg-slate-950 px-4 py-4 border-b border-slate-800 shrink-0"
      role="region"
      aria-label="Cockpit de MPPTs"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {mpptConfigs.map((mppt) => {
          const metrics   = mpptMetrics[mppt.mpptId];
          const hasVoc    = metrics && metrics.vocFrio > 0;
          const vocErr    = hasVoc && metrics.vocFrio > limitVMax;
          const vmpErr    = hasVoc && metrics.vmpCalor > 0 && metrics.vmpCalor < limitVMpptMin;
          const iscErr    = hasVoc && metrics.iscTotal > limitIscMaxMppt;
          const hasMism   = metrics?.hasMismatch;
          const hasError  = vocErr || vmpErr || iscErr;
          const sectionOk = hasVoc && !hasError && !hasMism;
          const strings   = mppt.strings ?? [];
          const isEmpty   = strings.length === 0;

          // ── Cor do status ──────────────────────────────────────────────
          const statusDotClass = hasError ? 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]'
            : hasMism            ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
            : sectionOk          ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
            : 'bg-slate-600';

          const cardBorderClass = hasError ? 'border-red-500/30 bg-red-500/[0.02]'
            : hasMism            ? 'border-amber-500/30 bg-amber-500/[0.02]'
            : sectionOk          ? 'border-slate-700 hover:border-sky-500/40'
            : 'border-slate-800';

          return (
            <div
              key={mppt.mpptId}
              className={cn(
                'flex flex-col rounded-lg border transition-all duration-300',
                cardBorderClass
              )}
            >
              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800/60 bg-slate-900/40">
                
                {/* 1. Identidade & 2. Contexto (Esquerda/Centro) */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 transition-all', statusDotClass)} />
                    <span className="text-[12px] font-black font-mono tracking-widest text-slate-200 uppercase">
                      MPPT {mppt.mpptId}
                    </span>
                  </div>

                  {/* Identidade do Módulo (Neurodesign: Marca + Potência para menor esforço mental) */}
                  <div className="relative module-picker-container">
                    {(() => {
                      const selObj = mppt.moduleModel 
                        ? (availableModules as any[]).find(m => m.model === mppt.moduleModel)
                        : module;
                      
                      return (
                        <div 
                          onClick={() => setOpenPickerId(openPickerId === mppt.mpptId ? null : mppt.mpptId)}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer",
                            mppt.moduleModel 
                              ? "bg-sky-500/10 border border-sky-500/20 text-sky-400" 
                              : "bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:bg-slate-800/60"
                          )}
                        >
                           <Sun size={9} className={mppt.moduleModel ? "text-sky-400" : "text-amber-500/70"} />
                           <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
                             <span className="opacity-70">{selObj?.manufacturer?.split(' ')[0] || 'Módulo'}</span>
                             <span className={mppt.moduleModel ? "text-sky-300" : "text-slate-200"}>{selObj?.power}W</span>
                           </span>
                        </div>
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

                  {/* Alertas sem caixa (Redução de Carga Cognitiva) */}
                  <div className="flex items-center gap-2">
                    {metrics.powerKwp === 0 ? (
                      <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        Ocioso
                      </span>
                    ) : metrics.vmpCalor < limitVMpptMin ? (
                      <span className="text-amber-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="animate-pulse">⚠️</span> Sub-dimensionado
                      </span>
                    ) : null}

                    {metrics.hasMismatch && (
                      <span 
                        className="text-amber-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                        title="Mismatch: Este MPPT possui orientação discrepante do restante do sistema."
                      >
                        <Split size={10} className="rotate-180" /> Mismatch
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Ação & Resultado (Direita) */}
                <div className="flex items-center gap-3">
                  
                  {/* Botão de Orientação */}
                  <button 
                    onClick={() => setOrientationModalMppt(mppt.mpptId)}
                    className={cn(
                      "group/orient flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[10px] font-bold tracking-tight transition-all",
                      mppt.azimuth !== undefined 
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                    )}
                    title={mppt.azimuth !== undefined ? "Orientação Customizada" : "Orientação Herdada do Projeto"}
                  >
                    <Navigation size={11} className={cn(
                      "transition-transform group-hover/orient:rotate-12",
                      mppt.azimuth !== undefined ? "text-amber-400" : "text-slate-500"
                    )} />
                    <span className="font-mono tabular-nums tracking-tighter">
                      {mppt.azimuth ?? globalAzimuth}° <span className="opacity-40 font-sans font-normal mx-[1px]">/</span> {mppt.inclination ?? globalInclination}°
                    </span>
                  </button>

                  {/* Métrica de Saída (kWp) - Neurodesign: O Outcome é o mais importante */}
                  {hasVoc && (
                    <div className="flex items-baseline gap-1 pl-3 border-l border-slate-700/50">
                      <span 
                        key={metrics.powerKwp}
                        className={cn(
                          'text-[17px] font-black font-mono tabular-nums tracking-tighter drop-shadow-sm leading-none animate-in fade-in zoom-in duration-300',
                          sectionOk ? 'text-emerald-400' : hasError ? 'text-red-400' : 'text-slate-100'
                        )}
                      >
                        {metrics.powerKwp.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">kWp</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── The Twin Engines (Inline Telemetry) ── */}
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

              {/* ── Modal de Ajuste Fino ── */}
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
              <div className="px-3 py-2 flex flex-col gap-2">
                {/* Header da seção */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                    Strings
                    {strings.length > 0 && (
                      <span className="ml-1.5 text-slate-600">({strings.length})</span>
                    )}
                  </span>
                  {addStringToMPPT && (
                    <button
                      onClick={() => addStringToMPPT(inverterId, mppt.mpptId)}
                      className="flex items-center gap-1 text-[9px] font-black text-sky-500 hover:text-sky-300 transition-colors active:scale-95"
                    >
                      <Plus size={10} strokeWidth={3} />
                      Nova String
                    </button>
                  )}
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

                {/* ── Configurações de String ───────────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-2 p-3 bg-slate-900/40">
                  {isEmpty ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/20 rounded-lg py-8 opacity-40">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Aguardando Módulos</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {strings.map((str, idx) => {
                        // Encontrar a maior string para normalizar o unitVoc
                        const maxStrModules = Math.max(...strings.map(s => s.modulesCount || 0), 1);
                        const unitVoc = metrics ? metrics.vocFrio / maxStrModules : 0;

                        // Cálculo do Mínimo e Máximo
                        const unitVmpForCalc = metrics?.unitVmp || 1;
                        const minModules = limitVMpptMin > 0 ? Math.ceil(limitVMpptMin / unitVmpForCalc) : 0;

                        return (
                          <StringRow
                            key={str.id}
                            str={str}
                            index={idx}
                            maxModules={maxModulesLimit}
                            minModules={minModules}
                            unitVoc={unitVoc}
                            unitVmp={metrics?.unitVmp}
                            unitImp={metrics?.unitImp}
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
