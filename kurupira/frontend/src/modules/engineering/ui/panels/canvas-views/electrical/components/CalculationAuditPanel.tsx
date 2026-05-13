import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { MPPTConfig } from '../../../../../store/useTechStore';

import { StringTopologyViewer } from '../StringTopologyViewer';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type DiagnosisStatus = 'ok' | 'warn' | 'error' | 'neutral';

interface MetricAuditCardProps {
  title: string;
  subtitle: string;
  formula: React.ReactNode;
  value: string | number;
  unit: string;
  limitText: string;
  diagnosisText: string;
  diagnosisStatus: DiagnosisStatus;
  valueRaw?: number;
  limitRaw?: number;
  limitDirection?: 'max' | 'min';
}

// ── MetricAuditCard ───────────────────────────────────────────────────────────

const StatusIcon = ({ status }: { status: DiagnosisStatus }) => {
  if (status === 'ok') return <CheckCircle size={10} className="shrink-0" />;
  if (status === 'error') return <XCircle size={10} className="shrink-0" />;
  return null;
};

const MetricAuditCard: React.FC<MetricAuditCardProps> = ({
  title, subtitle, formula, value, unit, limitText,
  diagnosisText, diagnosisStatus,
  valueRaw, limitRaw, limitDirection,
}) => {
  // Progresso relativo ao limite
  let progressPct: number | null = null;
  if (valueRaw != null && limitRaw != null && limitRaw > 0) {
    progressPct = limitDirection === 'max'
      ? Math.min((valueRaw / limitRaw) * 100, 120)
      : Math.min(((limitRaw - valueRaw) / limitRaw) * 100 + 50, 100); // piso: quanto acima do min
  }

  const barColor =
    diagnosisStatus === 'error' ? 'bg-red-500' :
    diagnosisStatus === 'warn'  ? 'bg-amber-500' :
    'bg-emerald-500';

  return (
    <div className="flex flex-col p-3 bg-slate-900/40 rounded-md border border-slate-800 hover:border-slate-700 transition-colors">
      {/* Cabeçalho do card */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
          <span className="text-[9px] text-slate-500 uppercase">{subtitle}</span>
        </div>
        <span className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold text-[10px] uppercase tracking-wider",
          diagnosisStatus === 'error'   ? "bg-red-500/20 text-red-400" :
          diagnosisStatus === 'warn'    ? "bg-amber-500/20 text-amber-400" :
          diagnosisStatus === 'neutral' ? "bg-slate-800 text-slate-400" :
          "bg-emerald-500/20 text-emerald-400"
        )}>
          <StatusIcon status={diagnosisStatus} />
          {diagnosisText}
        </span>
      </div>

      {/* Valor hero */}
      <div className="flex items-end gap-1 mb-1">
        <span className="text-xl font-mono font-black tabular-nums text-slate-200 leading-none">{value}</span>
        <span className="text-[10px] font-bold text-slate-500 mb-0.5">{unit}</span>
        <span className="text-[10px] font-mono text-slate-600 ml-auto mb-0.5">Lim: {limitText}</span>
      </div>

      {/* Micro-barra de progresso */}
      {progressPct != null && (
        <div className="w-full h-0.5 bg-slate-800 rounded-full mb-2 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      )}

      {/* Fórmula (Progressive Disclosure) */}
      <div className="mt-auto pt-2 border-t border-slate-800/50">
        <div className="font-mono text-[9px] text-slate-500 leading-relaxed break-words">
          {formula}
        </div>
      </div>
    </div>
  );
};

// ── Barra de Saúde Global ─────────────────────────────────────────────────────

const HealthBar = ({ ok, warn, error }: { ok: number; warn: number; error: number }) => {
  const total = ok + warn + error;
  return (
    <div className="flex items-center gap-4 text-[10px] font-mono font-bold">
      <span className="flex items-center gap-1 text-emerald-400">
        <CheckCircle size={10} /> {ok} OK
      </span>
      {error > 0 && (
        <span className="flex items-center gap-1 text-red-400">
          <XCircle size={10} /> {error} Violação{error > 1 ? 'ões' : ''}
        </span>
      )}
      <span className="text-slate-600 ml-auto">{total} verificações</span>
    </div>
  );
};

// ── Interfaces ────────────────────────────────────────────────────────────────

interface MPPTMiniMetrics {
  vocFrio: number;
  vmpCalor: number;
  iscTotal: number;
  impTotal: number;
  powerKwp: number;
  hasMismatch?: boolean;
}

interface CalculationAuditPanelProps {
  mpptConfigs: MPPTConfig[];
  mpptMetrics: Record<number, MPPTMiniMetrics>;
  dashboardData: any;
  activeInverterSnapshot: any;
  moduleSpecs: any;
  fdi: number;
  totalKwpCC: number;
  totalKwCA: number;
  tmin: number;
  tambMax: number;
  highlightMpptId?: number | null;
}

// ── Painel Principal ──────────────────────────────────────────────────────────

export const CalculationAuditPanel: React.FC<CalculationAuditPanelProps> = ({
  mpptConfigs, mpptMetrics, dashboardData, activeInverterSnapshot,
  moduleSpecs, fdi, totalKwpCC, totalKwCA, tmin, tambMax, highlightMpptId,
}) => {
  if (!dashboardData || !activeInverterSnapshot || !moduleSpecs) return null;

  const tcelulaMax = tambMax + (moduleSpecs.noct - 20) * (1000 / 800);
  const inverterOpTemp = tambMax + 5; // Offset térmico conservador do invólucro do inversor (5°C)

  // ── Contadores globais de saúde ───────────────────────────────────────────
  let healthOk = 0, healthWarn = 0, healthError = 0;

  // FDI
  if (fdi > 1.5 || fdi < 1.05) healthError++; else healthOk++;

  mpptConfigs.forEach((mppt) => {
    const metrics = mpptMetrics[mppt.mpptId];
    if (!metrics || metrics.powerKwp === 0) return;

    const limitVmaxSafety = dashboardData.limitInverterVMax * 0.95;
    const vocSafety = metrics.vocFrio <= dashboardData.limitInverterVMax;
    const voc95Safety = metrics.vocFrio <= limitVmaxSafety;
    const vmpSafety = metrics.vmpCalor >= dashboardData.limitMpptVMin;
    const iscLimit = dashboardData.limitIscMaxMppt;
    const iscFatorSafety = metrics.iscTotal <= iscLimit;
    const impClipping = metrics.impTotal > iscLimit;
    
    if (!vocSafety) healthError++; else if (!voc95Safety) healthWarn++; else healthOk++;
    if (!vmpSafety) healthWarn++; else healthOk++;
    if (!iscFatorSafety) healthError++; else healthOk++;
    if (impClipping) healthWarn++; else healthOk++;
  });

  // Novo alerta de derating térmico (Global do Inversor)
  const deratingLimit = activeInverterSnapshot.deratingTempC || 50;
  const thermalDerating = inverterOpTemp > deratingLimit;
  if (thermalDerating) healthWarn++; else healthOk++;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-6 text-slate-300">

      {/* Header e Premissas */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">
              Memorial de Cálculo Elétrico — NBR 16690
            </h3>
          </div>
        </div>

        {/* Barra de Saúde Global */}
        <HealthBar ok={healthOk} warn={healthWarn} error={healthError} />

        {/* Premissas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/50 p-3 rounded-md border border-slate-800">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Temp. Mín Histórica (Voc)</div>
            <div className="font-mono text-sm font-bold tabular-nums text-slate-300">{tmin.toFixed(1)} °C</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Temp. Máx Célula (Vmp)</div>
            <div className="font-mono text-sm font-bold tabular-nums text-slate-300">{tcelulaMax.toFixed(1)} °C</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Coeficiente Térmico β (Voc)</div>
            <div className="font-mono text-sm font-bold tabular-nums text-slate-300">{moduleSpecs.tempCoeffVoc.toFixed(2)} %/°C</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Módulo Fotovoltaico</div>
            <div className="font-mono text-sm font-bold text-slate-300">{moduleSpecs.pmax}W {moduleSpecs.isBifacial ? '(Bifacial)' : '(Monofacial)'}</div>
          </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 gap-6">

        {/* Parâmetros Globais */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
            1. Parâmetros Globais do Inversor
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(() => {
              const pmaxCA = (activeInverterSnapshot.maxOutputPowerW || (totalKwCA * 1000)) / 1000;
              const realOversize = totalKwpCC / pmaxCA;
              return (
                <MetricAuditCard
                  title="FDI (Taxa CC/CA)"
                  subtitle="Oversizing / Clipping CA"
                  value={fdi.toFixed(2)}
                  unit=""
                  limitText={activeInverterSnapshot.maxOutputPowerW ? `Max Real CA: ${pmaxCA.toFixed(1)} kW` : "1.05 a 1.35"}
                  diagnosisText={realOversize > 1.35 ? 'Clipping Severo' : realOversize < 1.05 ? 'Subdimensionado' : 'Adequado'}
                  diagnosisStatus={realOversize > 1.35 ? 'error' : realOversize < 1.05 ? 'neutral' : 'ok'}
                  formula={<>{totalKwpCC.toFixed(2)} kWp ÷ {totalKwCA.toFixed(2)} kW</>}
                />
              );
            })()}
            <MetricAuditCard
              title="Tensão Máx Entrada"
              subtitle="Hardware"
              value={activeInverterSnapshot.maxInputVoltage}
              unit="V"
              limitText="—"
              diagnosisText="Fixo"
              diagnosisStatus="neutral"
              formula={<>Vmax Inversor (Datasheet)</>}
            />
          </div>
        </div>

        {/* Cards por MPPT */}
        {mpptConfigs.map((mppt) => {
          const metrics = mpptMetrics[mppt.mpptId];
          if (!metrics || metrics.powerKwp === 0) return null;

          const activeStrings = mppt.strings?.length ? mppt.strings :
            Array.from({ length: mppt.stringsCount || 0 }).map((_, i) => ({
              name: `String ${i + 1}`,
              modulesCount: mppt.modulesPerString || 0,
              cableLength: mppt.cableLength || 0,
              cableSection: mppt.cableSection || 0,
            }));

          const n_paralelo = activeStrings.length;
          const maxModules = n_paralelo > 0 ? Math.max(...activeStrings.map(s => s.modulesCount)) : 0;
          const n_serie = maxModules;
          const limitVmaxSafety = dashboardData.limitInverterVMax * 0.95;

          const vocSafety = metrics.vocFrio <= dashboardData.limitInverterVMax;
          const voc95Safety = metrics.vocFrio <= limitVmaxSafety;
          const vmpSafety = metrics.vmpCalor >= dashboardData.limitMpptVMin;
          const iscLimit = dashboardData.limitIscMaxMppt;
          const iscFatorSafety = metrics.iscTotal <= iscLimit;
          const impClipping = metrics.impTotal > iscLimit;

          const tCoeffVmp = moduleSpecs.tempCoeffVmp ?? moduleSpecs.tempCoeffPmax ?? moduleSpecs.tempCoeffVoc;
          const formulaVoc = `${n_serie} × ${moduleSpecs.voc.toFixed(1)}V × [1 + (${moduleSpecs.tempCoeffVoc}% × (${tmin}°C − 25°C))]`;
          const formulaVmp = `${n_serie} × ${moduleSpecs.vmp.toFixed(1)}V × [1 + (${tCoeffVmp}% × (${tcelulaMax.toFixed(0)}°C − 25°C))]`;
          const formulaIsc = `${n_paralelo} × ${moduleSpecs.isc.toFixed(2)}A ${moduleSpecs.isBifacial ? '× Bifacial' : ''} × 1.25 (NBR)`;
          const formulaImp = `${n_paralelo} × ${moduleSpecs.imp.toFixed(2)}A ${moduleSpecs.isBifacial ? '× Bifacial' : ''}`;



          return (
            <div key={mppt.mpptId} className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  MPPT {mppt.mpptId} — Strings: {n_paralelo} × (Até {n_serie} Módulos)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <MetricAuditCard
                  title="Voc (Frio Extremo)"
                  subtitle="Teto Térmico"
                  value={metrics.vocFrio.toFixed(1)}
                  unit="V"
                  limitText={`< ${limitVmaxSafety.toFixed(0)}V`}
                  diagnosisText={!vocSafety ? 'Risco de Queima' : !voc95Safety ? 'Atenção' : 'Seguro'}
                  diagnosisStatus={!vocSafety ? 'error' : !voc95Safety ? 'warn' : 'ok'}
                  formula={<>{formulaVoc}</>}
                  valueRaw={metrics.vocFrio}
                  limitRaw={limitVmaxSafety}
                  limitDirection="max"
                />

                <MetricAuditCard
                  title="Vmp (Calor Extremo)"
                  subtitle="Piso MPPT"
                  value={metrics.vmpCalor.toFixed(1)}
                  unit="V"
                  limitText={`> ${dashboardData.limitMpptVMin}V`}
                  diagnosisText={vmpSafety ? 'Na Janela MPPT' : 'Perda Eficiência'}
                  diagnosisStatus={vmpSafety ? 'ok' : 'warn'}
                  formula={<>{formulaVmp}</>}
                  valueRaw={metrics.vmpCalor}
                  limitRaw={dashboardData.limitMpptVMin}
                  limitDirection="min"
                />

                <MetricAuditCard
                  title="Derating Térmico"
                  subtitle="Lim. Operação Inversor"
                  value={inverterOpTemp.toFixed(1)}
                  unit="°C"
                  limitText={`< ${activeInverterSnapshot.deratingTempC || 50}°C (TPLim1)`}
                  diagnosisText={inverterOpTemp > (activeInverterSnapshot.deratingTempC || 50) ? 'Em Derating' : 'Operação Normal'}
                  diagnosisStatus={inverterOpTemp > (activeInverterSnapshot.deratingTempC || 50) ? 'warn' : 'ok'}
                  formula={<>{tambMax.toFixed(1)}°C (Amb) + 5°C (Chassi)</>}
                  valueRaw={inverterOpTemp}
                  limitRaw={activeInverterSnapshot.deratingTempC || 50}
                  limitDirection="max"
                />

                <MetricAuditCard
                  title="Isc (Corrente Falta)"
                  subtitle="Hardware Inversor"
                  value={metrics.iscTotal.toFixed(1)}
                  unit="A"
                  limitText={`< ${iscLimit}A`}
                  diagnosisText={iscFatorSafety ? 'Dentro do Limite' : 'Violação Hardw.'}
                  diagnosisStatus={iscFatorSafety ? 'ok' : 'error'}
                  formula={<>{formulaIsc}</>}
                  valueRaw={metrics.iscTotal}
                  limitRaw={iscLimit}
                  limitDirection="max"
                />

                <MetricAuditCard
                  title="Imp (Corrente Max)"
                  subtitle="Operação / Clipping"
                  value={metrics.impTotal.toFixed(1)}
                  unit="A"
                  limitText={`Limitada a ${iscLimit}A`}
                  diagnosisText={!impClipping ? 'Sem Restrição' : 'Geração Limitada'}
                  diagnosisStatus={!impClipping ? 'ok' : 'warn'}
                  formula={<>{formulaImp}</>}
                  valueRaw={metrics.impTotal}
                  limitRaw={iscLimit}
                  limitDirection="max"
                />

                {/* Queda de Tensão por String */}
                {activeStrings.map(str => {
                  if (!str.cableLength || !str.cableSection || str.modulesCount <= 0) return null;
                  const strVmpNominal = str.modulesCount * moduleSpecs.vmp;
                  const operationalCurrent = moduleSpecs.imp || (moduleSpecs.isc * 0.95);
                  const dropV = (2 * str.cableLength * operationalCurrent) / (56 * str.cableSection);
                  const dropPercent = (dropV / strVmpNominal) * 100;

                  return (
                    <MetricAuditCard
                      key={str.name}
                      title={`ΔV% (${str.name})`}
                      subtitle={`Cabo: ${str.cableLength}m @ ${str.cableSection}mm²`}
                      value={dropV.toFixed(2)}
                      unit="V"
                      limitText="< 2.0%"
                      diagnosisText={dropPercent > 2 ? 'Excessivo' : dropPercent > 1 ? 'Elevado' : 'Adequado'}
                      diagnosisStatus={dropPercent > 2 ? 'error' : dropPercent > 1 ? 'warn' : 'ok'}
                      formula={<>ΔV = [2×{str.cableLength}m×{operationalCurrent.toFixed(1)}A] ÷ [56×{str.cableSection}mm²] = {dropV.toFixed(2)}V ({dropPercent.toFixed(2)}%)</>}
                      valueRaw={dropPercent}
                      limitRaw={2}
                      limitDirection="max"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>

      {/* Topologia Visual (aberta por padrão para ART) */}
      <details open className="group/topology">
        <summary className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-md cursor-pointer list-none hover:bg-slate-900/80 transition-colors">
          <ChevronDown
            size={12}
            className="text-slate-500 transition-transform duration-200 group-open/topology:rotate-180 shrink-0"
          />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Topologia Visual de Strings
          </span>
          <span className="ml-auto text-[9px] font-mono text-slate-600">
            {mpptConfigs.length} MPPT{mpptConfigs.length !== 1 ? 's' : ''}
          </span>
        </summary>
        <div className="mt-3">
          <StringTopologyViewer
            mpptConfigs={mpptConfigs}
            mpptMetrics={mpptMetrics}
            highlightMpptId={highlightMpptId}
          />
        </div>
      </details>

    </div>
  );
};
