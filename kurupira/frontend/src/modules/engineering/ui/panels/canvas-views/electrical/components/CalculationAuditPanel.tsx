import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, CheckCircle, XCircle, Info } from 'lucide-react';
import { MPPTConfig } from '../../../../../store/useTechStore';
import { StringTopologyViewer } from '../StringTopologyViewer';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type DiagnosisStatus = 'ok' | 'warn' | 'error' | 'neutral';

interface MetricAuditCardProps {
  title: string;          // rótulo técnico (ex: "Voc (Frio Extremo)")
  conclusionTitle: string; // S1: frase com conclusão (ex: "Voc dentro do limite — 18% de folga")
  subtitle: string;
  formula: React.ReactNode;
  narrativeText?: string;  // S3: explicação do impacto em caso de falha
  value: string | number;
  unit: string;
  limitText: string;
  diagnosisText: string;
  diagnosisStatus: DiagnosisStatus;
  valueRaw?: number;
  limitRaw?: number;
  limitDirection?: 'max' | 'min';
}

// ── S2/S Tier: Bullet Graph (Storytelling) ──────────────────────────────────

const BulletGraph: React.FC<{
  valuePct: number; // 0-N
  status: DiagnosisStatus;
}> = ({ valuePct, status }) => {
  // A escala visual do gráfico vai de 0% a 125% lógico.
  // Valores lógicos acima de 125% são clipados na borda física.
  const MAX_LOGICAL = 125;
  const pct = Math.min(valuePct, MAX_LOGICAL);
  
  // Mapeia valor Lógico (0-125) para percentual Físico (0-100%) da DIV
  const toPhysical = (logical: number) => `${(logical / MAX_LOGICAL) * 100}%`;

  const barColor = 
    status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
    status === 'warn' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
    'bg-emerald-500';

  return (
    <div className="relative w-full h-2.5 bg-slate-800/30 rounded-sm overflow-visible mt-3 mb-1">
      {/* Zonas de Fundo Qualitativas */}
      <div className="absolute top-0 left-0 h-full bg-emerald-500/5 rounded-l-sm border-r border-emerald-500/10" 
           style={{ width: toPhysical(75) }} />
      
      <div className="absolute top-0 h-full bg-amber-500/10 border-r border-amber-500/30" 
           style={{ left: toPhysical(75), width: toPhysical(20) }} />
      
      <div className="absolute top-0 h-full bg-rose-500/10 rounded-r-sm" 
           style={{ left: toPhysical(95), width: toPhysical(30) }} />

      {/* Medida Principal (Preenchimento) */}
      <div 
        className={cn("absolute top-[2px] bottom-[2px] left-0 rounded-sm transition-all duration-500", barColor)}
        style={{ width: toPhysical(pct) }} 
      />

      {/* Pino Marcador */}
      <div 
        className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] z-10 transition-all duration-500"
        style={{ left: toPhysical(pct) }}
      />

      {/* Limite Rígido (100% da métrica) */}
      <div className="absolute top-[-5px] bottom-[-5px] w-[1.5px] bg-red-500/90 z-0" 
           style={{ left: toPhysical(100) }}>
        <span className="absolute -top-3.5 -translate-x-1/2 text-[7.5px] text-red-500 font-bold tracking-widest opacity-90">LIM</span>
      </div>
    </div>
  );
};


// ── MetricAuditCard ───────────────────────────────────────────────────────────

const MetricAuditCard: React.FC<MetricAuditCardProps> = ({
  title, conclusionTitle, subtitle, formula, narrativeText,
  value, unit, limitText, diagnosisText, diagnosisStatus,
  valueRaw, limitRaw, limitDirection,
}) => {
  let valuePct: number | null = null;
  if (valueRaw != null && limitRaw != null && limitRaw > 0) {
    valuePct = limitDirection === 'max'
      ? (valueRaw / limitRaw) * 100
      : limitDirection === 'min'
        ? (limitRaw / Math.max(valueRaw, 0.001)) * 100  // inverte: quanto acima do mín
        : null;
  }

  const badgeCls =
    diagnosisStatus === 'error'   ? 'bg-red-500/20 text-red-400' :
    diagnosisStatus === 'warn'    ? 'bg-amber-500/20 text-amber-400' :
    diagnosisStatus === 'neutral' ? 'bg-slate-800 text-slate-400' :
    'bg-emerald-500/20 text-emerald-400';

  const bgGlow = 
    diagnosisStatus === 'error' ? 'bg-rose-950/10 border-rose-900/30 shadow-[inset_0_0_20px_rgba(225,29,72,0.05)]' :
    diagnosisStatus === 'warn' ? 'bg-amber-950/10 border-amber-900/30 shadow-[inset_0_0_20px_rgba(217,119,6,0.05)]' :
    'bg-slate-900/40 border-slate-800/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]';

  const titleCls =
    diagnosisStatus === 'error'   ? 'text-rose-400' :
    diagnosisStatus === 'warn'    ? 'text-amber-400' :
    diagnosisStatus === 'neutral' ? 'text-slate-400' :
    'text-emerald-400';

  const heroValueCls =
    diagnosisStatus === 'error' ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
    diagnosisStatus === 'warn' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' :
    'text-slate-200';

  return (
    <div className={cn("flex flex-col p-3 rounded-md transition-colors gap-2 border", bgGlow)}>
      {/* S1 — Título com Conclusão */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-0.5">
          <span className={cn('text-[11px] font-black leading-tight', titleCls)}>
            {conclusionTitle}
          </span>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">{title} · {subtitle}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider', badgeCls)}>
            {diagnosisStatus === 'ok' && <CheckCircle size={9} />}
            {diagnosisStatus === 'error' && <XCircle size={9} />}
            {diagnosisText}
          </span>

          {/* S Tier: Hint Popover (Progressive Disclosure) */}
          {(formula || narrativeText) && (
            <div className="relative group/hint flex items-center justify-center">
              <button className="w-5 h-5 rounded-sm bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors">
                <Info size={11} />
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-md shadow-2xl shadow-black/50 p-3.5 opacity-0 invisible group-hover/hint:opacity-100 group-hover/hint:visible transition-all z-50 origin-top-right">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 border-b border-slate-700 pb-2 text-[10px] font-black uppercase text-slate-300 tracking-wider">
                    <Info size={12} className="text-sky-400" />
                    Memória de Cálculo
                  </div>
                  {formula && (
                    <div className="font-mono text-[9.5px] text-slate-300 bg-slate-900 p-2 rounded-sm break-words border border-slate-700/50 leading-relaxed">
                      {formula}
                    </div>
                  )}
                  {narrativeText && (
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">⚠️ Se falhar:</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {narrativeText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Valor hero e Bullet Graph */}
      <div className="flex items-end gap-1 mt-0.5">
        <span className={cn("text-xl font-mono font-black tabular-nums leading-none", heroValueCls)}>
          {value}
        </span>
        <span className="text-[10px] font-bold text-slate-500 mb-0.5">{unit}</span>
        <span className="text-[10px] font-mono text-slate-600 ml-auto mb-0.5">Lim: {limitText}</span>
      </div>

      {/* Tier S — Bullet Graph */}
      {valuePct != null && (
        <BulletGraph valuePct={valuePct} status={diagnosisStatus} />
      )}
    </div>
  );
};

// ── S4: MetricGroup — Agrupamento Semântico por Categoria ─────────────────────

type GroupColor = 'sky' | 'amber' | 'slate' | 'violet';

const GROUP_STYLES: Record<GroupColor, { border: string; title: string; badge: string }> = {
  sky:    { border: 'border-sky-500/20',    title: 'text-sky-400',    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  amber:  { border: 'border-amber-500/20',  title: 'text-amber-400',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  slate:  { border: 'border-slate-600/30',  title: 'text-slate-400',  badge: 'bg-slate-800 text-slate-400 border-slate-700' },
  violet: { border: 'border-violet-500/20', title: 'text-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
};

const MetricGroup: React.FC<{
  label: string;
  color: GroupColor;
  ok: number;
  total: number;
  children: React.ReactNode;
}> = ({ label, color, ok, total, children }) => {
  const s = GROUP_STYLES[color];
  const allOk = ok === total;
  return (
    <div className="flex flex-col gap-3">
      <div className={cn('flex items-center justify-between border-b pb-1', s.border)}>
        <span className={cn('text-[10px] font-black uppercase tracking-widest', s.title)}>{label}</span>
        <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-sm border', s.badge)}>
          {ok}/{total} {allOk ? 'OK' : 'Alertas'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
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
  iscTotal: number;      // Corrente de curto sem fator de proteção — para hardware do MPPT
  iscProtection: number; // Corrente majorada ×1.25 NBR — para dimensionar fusíveis/DPS
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

      {/* Cards Agrupados — S4 */}
      <div className="grid grid-cols-1 gap-8">

        {/* INVERSOR CA — Global */}
        {(() => {
          const pmaxCA = (activeInverterSnapshot.maxOutputPowerW || (totalKwCA * 1000)) / 1000;
          const realOversize = totalKwpCC / pmaxCA;
          const fdiOk = realOversize >= 1.05 && realOversize <= 1.35;
          return (
            <MetricGroup label="Inversor CA — Parâmetros Globais" color="violet"
              ok={[fdiOk, !thermalDerating].filter(Boolean).length} total={2}>
              <MetricAuditCard
                title="FDI (Taxa CC/CA)"
                conclusionTitle={realOversize > 1.35 ? `Clipping severo — FDI ${realOversize.toFixed(2)} acima de 1.35` : realOversize < 1.05 ? `Inversor superdimensionado — FDI ${realOversize.toFixed(2)}` : `FDI adequado — ${realOversize.toFixed(2)} dentro da faixa`}
                subtitle="Oversizing / Clipping CA"
                value={fdi.toFixed(2)} unit=""
                limitText="1.05 a 1.35"
                diagnosisText={realOversize > 1.35 ? 'Clipping Severo' : realOversize < 1.05 ? 'Subdimensionado' : 'Adequado'}
                diagnosisStatus={realOversize > 1.35 ? 'error' : realOversize < 1.05 ? 'neutral' : 'ok'}
                formula={
                  <div className="flex flex-col gap-2 font-sans">
                    <div>Fórmula: <span className="text-emerald-400 font-medium">Pot. Módulos (CC)</span> ÷ <span className="text-sky-400 font-medium">Pot. Inversor (CA)</span></div>
                    <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{totalKwpCC.toFixed(2)} kWp</span> ÷ <span className="text-sky-400">{pmaxCA.toFixed(2)} kW</span> = <span className="text-white font-bold">{realOversize.toFixed(2)}</span></div>
                  </div>
                }
                narrativeText="O Fator de Dimensionamento (FDI) mede o 'Oversizing'. Um FDI de 1.30 significa que você instalou 30% a mais de painéis do que a potência nominal do inversor. Isso maximiza a geração de manhã e no fim da tarde. Porém, um FDI exagerado (acima de 1.35) faz o inversor cortar a energia extra nos picos de meio-dia (Clipping CA), dissipando-a como calor em vez de injetar na rede."
                valueRaw={realOversize} limitRaw={1.35} limitDirection="max"
              />
              <MetricAuditCard
                title="Derating Térmico"
                conclusionTitle={thermalDerating ? `Em derating — ${inverterOpTemp.toFixed(1)}°C excede TPLim1 (${deratingLimit}°C)` : `Operação normal — ${inverterOpTemp.toFixed(1)}°C dentro do limite`}
                subtitle="Lim. Operação Inversor"
                value={inverterOpTemp.toFixed(1)} unit="°C"
                limitText={`< ${deratingLimit}°C (TPLim1)`}
                diagnosisText={thermalDerating ? 'Em Derating' : 'Operação Normal'}
                diagnosisStatus={thermalDerating ? 'warn' : 'ok'}
                formula={
                  <div className="flex flex-col gap-2 font-sans">
                    <div>Fórmula: <span className="text-emerald-400 font-medium">T. Ambiente Máx</span> + <span className="text-rose-400 font-medium">Aquecimento do Chassi</span></div>
                    <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{tambMax.toFixed(1)}°C</span> + <span className="text-rose-400">5.0°C</span> = <span className="text-white font-bold">{inverterOpTemp.toFixed(1)}°C</span></div>
                  </div>
                }
                narrativeText="Inversores perdem eficiência no calor extremo. A temperatura operacional soma a máxima histórica da cidade com o calor gerado pelo equipamento (offset 5°C). Se esse valor ultrapassar o Limite Térmico de Potência (TPLim1), o firmware cortará gradativamente a energia CA para proteger a eletrônica interna. Resultado: perda financeira direta no verão."
                valueRaw={inverterOpTemp} limitRaw={deratingLimit} limitDirection="max"
              />
            </MetricGroup>
          );
        })()}

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



          // contadores por grupo
          const tensaoOk = [vocSafety && voc95Safety, vmpSafety].filter(Boolean).length;
          const correnteOk = [iscFatorSafety, true, !impClipping].filter(Boolean).length;
          const activeStringsCables = activeStrings.filter(s => s.cableLength && s.cableSection && s.modulesCount > 0);

          const cablesOkCount = activeStringsCables.filter(str => {
            if (str.modulesCount === 0) return false;
            const dropPct = ((2 * str.cableLength * (moduleSpecs.imp || moduleSpecs.isc * 0.95)) / (56 * str.cableSection)) / (str.modulesCount * moduleSpecs.vmp) * 100;
            return dropPct <= 1;
          }).length;

          // Status Global do Inset
          const totalChecks = 5 + activeStringsCables.length;
          const passedChecks = tensaoOk + correnteOk + cablesOkCount;
          const hasError = !vocSafety || !iscFatorSafety || activeStringsCables.some(str => {
            if (str.modulesCount === 0) return false;
            return (((2 * str.cableLength * (moduleSpecs.imp || moduleSpecs.isc * 0.95)) / (56 * str.cableSection)) / (str.modulesCount * moduleSpecs.vmp) * 100) > 2;
          });
          
          const headerStatusCls = hasError ? 'bg-rose-950/40 text-rose-400 border-rose-500/30' : (passedChecks < totalChecks) ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
          const headerStatusText = hasError ? 'COM ERRO' : (passedChecks < totalChecks) ? 'ATENÇÃO' : 'STATUS OK';

          return (
            <div key={mppt.mpptId} className="flex flex-col bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden mt-2">
              {/* Cabeçalho Inset - Gestalt de Fechamento */}
              <div className="flex items-center justify-between bg-slate-800/80 px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-700 shadow-inner text-slate-200 font-black text-sm">
                    {mppt.mpptId}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase tracking-widest text-slate-200 leading-none">
                      MPPT
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {n_paralelo} string{n_paralelo !== 1 ? 's' : ''} × {n_serie} módulos
                    </span>
                  </div>
                </div>
                <div className={cn("px-2 py-1 rounded border text-[9px] font-bold tracking-widest", headerStatusCls)}>
                  {headerStatusText}
                </div>
              </div>

              {/* Corpo do Inset */}
              <div className="flex flex-col gap-6 p-5">
                {/* TENSÃO CC */}
                <MetricGroup label="Tensão CC" color="sky" ok={tensaoOk} total={2}>
                <MetricAuditCard
                  title="Voc (Frio Extremo)"
                  conclusionTitle={!vocSafety ? `⚠ Voc excede o inversor — ${metrics.vocFrio.toFixed(0)}V > ${dashboardData.limitInverterVMax}V` : !voc95Safety ? `Atenção: Voc em ${((metrics.vocFrio/dashboardData.limitInverterVMax)*100).toFixed(0)}% do limite` : `Voc seguro — ${((1 - metrics.vocFrio/dashboardData.limitInverterVMax)*100).toFixed(0)}% de folga`}
                  subtitle="Teto Térmico NBR 16690"
                  value={metrics.vocFrio.toFixed(1)} unit="V"
                  limitText={`< ${limitVmaxSafety.toFixed(0)}V (95% de ${dashboardData.limitInverterVMax}V)`}
                  diagnosisText={!vocSafety ? 'Risco de Queima' : !voc95Safety ? 'Atenção (95%)' : 'Seguro'}
                  diagnosisStatus={!vocSafety ? 'error' : !voc95Safety ? 'warn' : 'ok'}
                  formula={
                    <div className="flex flex-col gap-2 font-sans">
                      <div>Fórmula: <span className="text-emerald-400 font-medium">Nº Série</span> × <span className="text-sky-400 font-medium">Voc Módulo</span> × <span className="text-rose-400 font-medium">Fator Frio</span></div>
                      <div className="text-slate-400 text-[8px] leading-tight">Fator = 1 + (<span className="text-amber-400">{moduleSpecs.tempCoeffVoc.toFixed(2)}%/°C</span> × (<span className="text-sky-400">{tmin}°C</span> - 25°C))</div>
                      <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{n_serie}</span> × <span className="text-sky-400">{moduleSpecs.voc.toFixed(1)}V</span> × <span className="text-rose-400">{(metrics.vocFrio / (n_serie * moduleSpecs.voc)).toFixed(3)}</span> = <span className="text-white font-bold">{metrics.vocFrio.toFixed(1)}V</span></div>
                    </div>
                  }
                  narrativeText="Nas madrugadas/manhãs muito frias, a tensão (Voltagem) dos painéis de silício sobe drasticamente. Se essa Tensão Máxima no inverno ultrapassar o Vmax do inversor, o equipamento sofrerá uma sobretensão destrutiva, queimando a placa MPPT e anulando a garantia instantaneamente (Norma NBR 16690:2019)."
                  valueRaw={metrics.vocFrio} limitRaw={limitVmaxSafety} limitDirection="max"
                />
                <MetricAuditCard
                  title="Vmp (Calor Extremo)"
                  conclusionTitle={vmpSafety ? `Vmp na janela MPPT — rastreamento garantido` : `Risco: Vmp(${metrics.vmpCalor.toFixed(0)}V) abaixo do mínimo MPPT (${dashboardData.limitMpptVMin}V)`}
                  subtitle="Piso MPPT — NBR 16690"
                  value={metrics.vmpCalor.toFixed(1)} unit="V"
                  limitText={`> ${dashboardData.limitMpptVMin}V`}
                  diagnosisText={vmpSafety ? 'Na Janela MPPT' : 'Risco Desligamento'}
                  diagnosisStatus={vmpSafety ? 'ok' : 'warn'}
                  formula={
                    <div className="flex flex-col gap-2 font-sans">
                      <div>Fórmula: <span className="text-emerald-400 font-medium">Nº Série</span> × <span className="text-sky-400 font-medium">Vmp Módulo</span> × <span className="text-rose-400 font-medium">Fator Calor</span></div>
                      <div className="text-slate-400 text-[8px] leading-tight">Fator = 1 + (<span className="text-amber-400">{tCoeffVmp.toFixed(2)}%/°C</span> × (<span className="text-sky-400">{tcelulaMax.toFixed(0)}°C</span> - 25°C))</div>
                      <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{n_serie}</span> × <span className="text-sky-400">{moduleSpecs.vmp.toFixed(1)}V</span> × <span className="text-rose-400">{(metrics.vmpCalor / (n_serie * moduleSpecs.vmp)).toFixed(3)}</span> = <span className="text-white font-bold">{metrics.vmpCalor.toFixed(1)}V</span></div>
                    </div>
                  }
                  narrativeText="O calor extremo derruba a tensão dos painéis. Se durante os dias mais quentes do ano a tensão da string cair abaixo do mínimo suportado pelo rastreador (Janela MPPT Mínima), o inversor perderá a eficiência e gerará muito menos energia do que deveria exatamente nas horas de sol mais forte."
                  valueRaw={metrics.vmpCalor} limitRaw={dashboardData.limitMpptVMin} limitDirection="min"
                />
              </MetricGroup>

              {/* CORRENTE CC */}
              <MetricGroup label="Corrente CC" color="amber" ok={correnteOk} total={3}>
                <MetricAuditCard
                  title="Isc (Hardware MPPT)"
                  conclusionTitle={iscFatorSafety ? `Corrente dentro do hardware — ${metrics.iscTotal.toFixed(1)}A de ${iscLimit}A` : `Violação: Isc(${metrics.iscTotal.toFixed(1)}A) excede hardware do MPPT (${iscLimit}A)`}
                  subtitle="Limite Entrada Inversor"
                  value={metrics.iscTotal.toFixed(1)} unit="A"
                  limitText={`< ${iscLimit}A`}
                  diagnosisText={iscFatorSafety ? 'Dentro do Limite' : 'Violação Hardw.'}
                  diagnosisStatus={iscFatorSafety ? 'ok' : 'error'}
                  formula={
                    <div className="flex flex-col gap-2 font-sans">
                      <div>Fórmula: <span className="text-emerald-400 font-medium">Nº Strings Paralelas</span> × <span className="text-sky-400 font-medium">Isc do Módulo</span></div>
                      <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{n_paralelo}</span> × <span className="text-sky-400">{moduleSpecs.isc.toFixed(2)}A</span> = <span className="text-white font-bold">{metrics.iscTotal.toFixed(1)}A</span></div>
                      {moduleSpecs.isBifacial && <div className="text-amber-500 text-[8px] italic">*Ganho bifacial aplicado.</div>}
                    </div>
                  }
                  narrativeText="A Corrente de Curto-Circuito (Isc) é a corrente máxima absoluta gerada pela placa. Se a soma dessa corrente nas strings paralelas ultrapassar o Limite de Hardware do MPPT, o inversor entra em proteção e corta a geração para evitar arco elétrico interno. É uma limitação física inegociável da engenharia de inversores."
                  valueRaw={metrics.iscTotal} limitRaw={iscLimit} limitDirection="max"
                />
                <MetricAuditCard
                  title="Isc Proteção (Fusível)"
                  conclusionTitle="Referência para dimensionamento de fusíveis e DPS"
                  subtitle="NBR 16690 §5.3.11.1"
                  value={(metrics.iscProtection ?? metrics.iscTotal * 1.25).toFixed(1)} unit="A"
                  limitText="×1.25 (Majoração NBR)"
                  diagnosisText="Dim. Proteções"
                  diagnosisStatus="neutral"
                  formula={
                    <div className="flex flex-col gap-2 font-sans">
                      <div>Fórmula: <span className="text-emerald-400 font-medium">Isc Máx Módulo</span> × <span className="text-rose-400 font-medium">Fator Segurança NBR</span></div>
                      <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{metrics.iscTotal.toFixed(1)}A</span> × <span className="text-rose-400">1.25</span> = <span className="text-white font-bold">{(metrics.iscProtection ?? metrics.iscTotal * 1.25).toFixed(1)}A</span></div>
                    </div>
                  }
                  narrativeText="Para dimensionar cabos CC, DPS e fusiveis na Stringbox, a NBR 16690:2019 exige que utilizemos a corrente de curto-circuito majorada em 25%. Esse fator garante que a proteção não desarme equivocadamente durante picos anormais de sol (como o Efeito Borda de Nuvem). Atenção: Esse valor NÃO deve ser comparado ao limite do inversor, apenas aos equipamentos de proteção."
                />
                <MetricAuditCard
                  title="Imp (Corrente Operacional)"
                  conclusionTitle={!impClipping ? `Sem clipping — Imp dentro da faixa` : `Clipping ativo — geração limitada a ${iscLimit}A`}
                  subtitle="Operação / Clipping"
                  value={metrics.impTotal.toFixed(1)} unit="A"
                  limitText={`Limitada a ${iscLimit}A`}
                  diagnosisText={!impClipping ? 'Sem Restrição' : 'Geração Limitada'}
                  diagnosisStatus={!impClipping ? 'ok' : 'warn'}
                  formula={
                    <div className="flex flex-col gap-2 font-sans">
                      <div>Fórmula: <span className="text-emerald-400 font-medium">Nº Strings Paralelas</span> × <span className="text-sky-400 font-medium">Imp do Módulo</span></div>
                      <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Cálculo: <span className="text-emerald-400">{n_paralelo}</span> × <span className="text-sky-400">{moduleSpecs.imp.toFixed(2)}A</span> = <span className="text-white font-bold">{metrics.impTotal.toFixed(1)}A</span></div>
                    </div>
                  }
                  narrativeText="A Corrente de Máxima Potência (Imp) é o fluxo normal de energia no sol do meio-dia. Diferente do Isc, se o Imp exceder o limite do inversor não há risco de queima: o inversor simplesmente fará um gargalo (Clipping de Corrente) dissipando o excedente térmico. Sua curva de geração ficará 'achatada', o que representa perda puramente financeira de kWh."
                  valueRaw={metrics.impTotal} limitRaw={iscLimit} limitDirection="max"
                />
              </MetricGroup>

              {/* CABOS CC */}
              {activeStringsCables.length > 0 && (
                <MetricGroup label="Cabos CC — Queda de Tensão" color="slate"
                  ok={cablesOkCount} total={activeStringsCables.length}>
                  {activeStringsCables.map(str => {
                      const operationalCurrent = moduleSpecs.imp || (moduleSpecs.isc * 0.95);
                      const strVmpNominal = str.modulesCount * moduleSpecs.vmp;
                      const dropV = (2 * str.cableLength * operationalCurrent) / (56 * str.cableSection);
                      const dropPercent = (dropV / strVmpNominal) * 100;
                      return (
                        <MetricAuditCard
                          key={str.name}
                          title={`ΔV% (${str.name})`}
                          conclusionTitle={dropPercent > 2 ? `Queda excessiva — ${dropPercent.toFixed(1)}% (máx 2%)` : dropPercent > 1 ? `Queda elevada — ${dropPercent.toFixed(1)}% (atenção)` : `Queda adequada — ${dropPercent.toFixed(1)}% dentro do limite`}
                          subtitle={`Cabo: ${str.cableLength}m @ ${str.cableSection}mm²`}
                          value={dropV.toFixed(2)} unit="V"
                          limitText="< 2.0%"
                          diagnosisText={dropPercent > 2 ? 'Excessivo' : dropPercent > 1 ? 'Elevado' : 'Adequado'}
                          diagnosisStatus={dropPercent > 2 ? 'error' : dropPercent > 1 ? 'warn' : 'ok'}
                          formula={
                            <div className="flex flex-col gap-2 font-sans">
                              <div>Fórmula: [<span className="text-emerald-400 font-medium">2 × Comp (m)</span> × <span className="text-sky-400 font-medium">Corrente</span>] ÷ [<span className="text-amber-400 font-medium">56</span> × <span className="text-rose-400 font-medium">Cabo (mm²)</span>]</div>
                              <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded mb-1">Volts: [<span className="text-emerald-400">2 × {str.cableLength}</span> × <span className="text-sky-400">{operationalCurrent.toFixed(1)}</span>] ÷ [<span className="text-amber-400">56</span> × <span className="text-rose-400">{str.cableSection}</span>] = <span className="text-white">{dropV.toFixed(2)}V</span></div>
                              <div className="text-slate-300 font-mono text-[9px] bg-slate-900/50 p-1.5 rounded">Perc.: <span className="text-white">{dropV.toFixed(2)}V</span> ÷ <span className="text-white font-medium">{strVmpNominal.toFixed(1)}V (Vmp)</span> = <span className="text-white font-bold">{dropPercent.toFixed(2)}%</span></div>
                            </div>
                          }
                          narrativeText="Os elétrons encontram resistência ao viajar pelo cabo, convertendo eletricidade em calor (Efeito Joule). Uma Queda de Tensão (ΔV) acima de 2% significa que você está desperdiçando muita geração no trajeto até o inversor, aquecendo os cabos e perdendo dinheiro. Para corrigir, engrosse a bitola do cabo (mm²) ou reposicione o inversor para encurtar a distância (m)."
                          valueRaw={dropPercent} limitRaw={2} limitDirection="max"
                        />
                      );
                    })}
                  </MetricGroup>
              )}
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
