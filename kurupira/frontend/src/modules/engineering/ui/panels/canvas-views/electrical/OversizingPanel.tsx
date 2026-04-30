import React, { useMemo } from 'react';
import { TrendingUp, Zap, Activity, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// OVERSIZING PANEL — Análise de FDI e Taxa CC/CA
// Equivalente ao ModuleInsightsArea, mas para a dimensão de oversizing.
// Baseado na skill /oversizing-cc-ca do Kurupira.
// =============================================================================

// ── Faixas de FDI ────────────────────────────────────────────────────────────

interface FdiZone {
  label: string;
  desc: string;
  color: string;
  dotColor: string;
  barColor: string;
  severity: 'error' | 'warn' | 'ok' | 'ideal';
}

const getFdiZone = (fdi: number): FdiZone => {
  if (fdi <= 0)    return { label: '—',         desc: 'Nenhum inversor configurado',            color: 'text-slate-500',  dotColor: 'bg-slate-600',   barColor: 'bg-slate-700',   severity: 'warn' };
  if (fdi < 1.05)  return { label: 'Sub',        desc: 'Inversor superdimensionado',             color: 'text-rose-400',   dotColor: 'bg-rose-500',    barColor: 'bg-rose-500',    severity: 'error' };
  if (fdi <= 1.20) return { label: 'Conservador', desc: 'Ótimo para climas temperados',          color: 'text-emerald-400',dotColor: 'bg-emerald-500', barColor: 'bg-emerald-500', severity: 'ok' };
  if (fdi <= 1.35) return { label: 'Ideal',       desc: 'Faixa recomendada para o Brasil',       color: 'text-emerald-300',dotColor: 'bg-emerald-400', barColor: 'bg-emerald-400', severity: 'ideal' };
  if (fdi <= 1.50) return { label: 'Elevado',     desc: 'Verificar clipping — aceitável',        color: 'text-amber-400',  dotColor: 'bg-amber-500',   barColor: 'bg-amber-500',   severity: 'warn' };
  return              { label: 'Crítico',     desc: 'Risco de estresse térmico no inversor',color: 'text-rose-400',   dotColor: 'bg-rose-500',    barColor: 'bg-rose-500',    severity: 'error' };
};

// Heurística linear de clipping: segue comportamento esperado para Brasil
// Fonte: canal-solar oversizing references (skill /oversizing-cc-ca)
const estimateClippingPct = (fdi: number): number => {
  if (fdi <= 1.05) return 0;
  if (fdi <= 1.20) return (fdi - 1.05) / (1.20 - 1.05) * 1;      // 0% → ~1%
  if (fdi <= 1.35) return 1 + (fdi - 1.20) / (1.35 - 1.20) * 3;  // 1% → ~4%
  if (fdi <= 1.50) return 4 + (fdi - 1.35) / (1.50 - 1.35) * 4;  // 4% → ~8%
  return 8 + (fdi - 1.50) * 20;                                     // > 8%
};

// ── Topologia recomendada ─────────────────────────────────────────────────────

interface TopologyRec {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const getTopologyRec = (fdi: number, hasShading: boolean = false): TopologyRec => {
  if (hasShading || fdi > 1.35) {
    return {
      label: 'String + Otimizadores',
      desc: 'MPPT individual por módulo — recupera yield em sombreamento e alto FDI',
      icon: <Activity size={12} />,
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    };
  }
  if (fdi <= 1.20) {
    return {
      label: 'Inversor de String',
      desc: 'Topologia padrão — ótima para FDI conservador e sem sombreamento',
      icon: <Zap size={12} />,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    };
  }
  return {
    label: 'Inversor de String',
    desc: 'Adequado para este FDI — considere otimizadores se houver sombreamento',
    icon: <Zap size={12} />,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  };
};

// ── KPI micro-card (padrão ModuleInsightsArea) ────────────────────────────────

const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  colorClass: string;
}> = ({ icon, label, value, unit, colorClass }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60">
    <span className={cn('shrink-0', colorClass)}>{icon}</span>
    <div className="flex flex-col min-w-0">
      <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.15em] truncate">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-[12px] font-mono font-black tabular-nums leading-none', colorClass)}>
          {value}
        </span>
        {unit && <span className="text-[8px] text-slate-600 font-bold">{unit}</span>}
      </div>
    </div>
  </div>
);

// ── Tabela de fatores de perda ────────────────────────────────────────────────

interface LossFactor {
  label: string;
  ref: string;
  value: number; // %
  editable?: boolean;
}

const getLossFactors = (uf?: string): LossFactor[] => {
  const isTropical = uf && ['AM','PA','RR','AP','AC','RO','TO','MA','PI','CE','RN','PB','PE','AL','SE','BA'].includes(uf);
  return [
    { label: 'Temperatura',    ref: '5–15%',  value: isTropical ? 12 : 8 },
    { label: 'Sujeira',        ref: '2–5%',   value: 3 },
    { label: 'Mismatch',       ref: '1–3%',   value: 1.5 },
    { label: 'Cabos DC',       ref: '1–2%',   value: 1.5 },
    { label: 'Inversor',       ref: '1–2%',   value: 1.5 },
    { label: 'Disponibilidade',ref: '0.5–1%', value: 0.8 },
  ];
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

interface OversizingPanelProps {
  fdi: number;
  totalKwpCC: number;
  totalKwCA: number;
  uf?: string; // UF do projeto para calibrar perdas por temperatura
}

export const OversizingPanel: React.FC<OversizingPanelProps> = ({
  fdi,
  totalKwpCC,
  totalKwCA,
  uf,
}) => {
  const zone         = useMemo(() => getFdiZone(fdi), [fdi]);
  const clipping     = useMemo(() => estimateClippingPct(fdi), [fdi]);
  const topology     = useMemo(() => getTopologyRec(fdi), [fdi]);
  const lossFactors  = useMemo(() => getLossFactors(uf), [uf]);
  const prEstimated  = useMemo(() => {
    const totalLoss = lossFactors.reduce((acc, f) => acc + f.value / 100, 0);
    return Math.max(0, 1 - totalLoss);
  }, [lossFactors]);

  // Posição do marcador de FDI na barra (0–100%), escala 0 a 1.6
  const FDI_SCALE_MAX = 1.6;
  const markerPct = Math.min(100, (fdi / FDI_SCALE_MAX) * 100);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-900/20 border border-slate-800/40 rounded-sm overflow-hidden shadow-2xl">

      {/* KPI Row — padrão ModuleInsightsArea */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800/40 border-b border-slate-800/60 shrink-0 overflow-hidden">
        <KpiCard
          icon={<TrendingUp size={10} />}
          label="FDI (CC/CA)"
          value={fdi > 0 ? `${(fdi * 100).toFixed(0)}%` : '—'}
          colorClass={zone.color}
        />
        <KpiCard
          icon={<Zap size={10} />}
          label="P_CC Instalada"
          value={totalKwpCC > 0 ? totalKwpCC.toFixed(2) : '—'}
          unit="kWp"
          colorClass="text-amber-400"
        />
        <KpiCard
          icon={<Cpu size={10} />}
          label="P_CA Inversor"
          value={totalKwCA > 0 ? totalKwCA.toFixed(1) : '—'}
          unit="kW"
          colorClass="text-emerald-400"
        />
        <KpiCard
          icon={<Activity size={10} />}
          label="Clipping Est."
          value={fdi > 0 ? clipping.toFixed(1) : '—'}
          unit="%"
          colorClass={clipping > 5 ? 'text-rose-400' : clipping > 2 ? 'text-amber-400' : 'text-slate-400'}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">

        {/* ── Barra de FDI ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">
              Taxa CC / CA
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', zone.dotColor)} />
              <span className={cn('text-[10px] font-black uppercase tracking-widest', zone.color)}>
                {zone.label}
              </span>
            </div>
          </div>

          {/* Barra de zonas coloridas */}
          <div className="relative h-5 flex rounded-sm overflow-hidden border border-slate-800">
            {/* Sub: 0–1.05 (6.5% do eixo) */}
            <div className="h-full bg-rose-500/20 border-r border-rose-500/20" style={{ width: `${(1.05/FDI_SCALE_MAX)*100}%` }}>
              <span className="absolute top-1/2 -translate-y-1/2 left-1 text-[7px] text-rose-500/50 font-bold">Sub</span>
            </div>
            {/* Cons: 1.05–1.20 */}
            <div className="h-full bg-emerald-500/10 border-r border-emerald-500/20" style={{ width: `${((1.20-1.05)/FDI_SCALE_MAX)*100}%` }}>
              <span className="absolute top-1/2 -translate-y-1/2 text-[7px] text-emerald-500/60 font-bold" style={{ left: `${((1.05+0.05)/FDI_SCALE_MAX)*100}%` }}>Cons.</span>
            </div>
            {/* Ideal: 1.20–1.35 */}
            <div className="h-full bg-emerald-500/20 border-r border-emerald-400/30" style={{ width: `${((1.35-1.20)/FDI_SCALE_MAX)*100}%` }}>
              <span className="absolute top-1/2 -translate-y-1/2 text-[7px] text-emerald-400/80 font-black" style={{ left: `${((1.20+0.05)/FDI_SCALE_MAX)*100}%` }}>Ideal</span>
            </div>
            {/* Elevado: 1.35–1.50 */}
            <div className="h-full bg-amber-500/15 border-r border-amber-500/20" style={{ width: `${((1.50-1.35)/FDI_SCALE_MAX)*100}%` }}>
              <span className="absolute top-1/2 -translate-y-1/2 text-[7px] text-amber-500/60 font-bold" style={{ left: `${((1.35+0.04)/FDI_SCALE_MAX)*100}%` }}>Elev.</span>
            </div>
            {/* Crítico: 1.50+ */}
            <div className="h-full bg-rose-500/15 flex-1">
              <span className="absolute top-1/2 -translate-y-1/2 text-[7px] text-rose-500/50 font-bold" style={{ left: `${((1.50+0.03)/FDI_SCALE_MAX)*100}%` }}>Crít.</span>
            </div>

            {/* Marcador do FDI atual */}
            {fdi > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 z-10 shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                style={{ left: `${markerPct}%`, backgroundColor: zone.dotColor.replace('bg-', '').includes('emerald') ? '#10b981' : zone.dotColor.includes('amber') ? '#f59e0b' : '#f43f5e' }}
              >
                {/* Label flutuante */}
                <div
                  className={cn(
                    'absolute -top-5 -translate-x-1/2 px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-black whitespace-nowrap border',
                    zone.severity === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' :
                    zone.severity === 'warn'  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                    'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  )}
                >
                  {(fdi * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>

          {/* Eixo de referência */}
          <div className="relative flex justify-between text-[7px] text-slate-700 font-mono px-0">
            <span>0%</span>
            <span style={{ position: 'absolute', left: `${(1.05/FDI_SCALE_MAX)*100}%` }}>105</span>
            <span style={{ position: 'absolute', left: `${(1.20/FDI_SCALE_MAX)*100}%` }}>120</span>
            <span style={{ position: 'absolute', left: `${(1.35/FDI_SCALE_MAX)*100}%` }}>135</span>
            <span style={{ position: 'absolute', left: `${(1.50/FDI_SCALE_MAX)*100}%` }}>150</span>
            <span>160%</span>
          </div>

          {/* Mensagem de zona */}
          <p className={cn('text-[10px] font-medium', zone.color)}>{zone.desc}</p>
        </div>

        {/* ── Tabela de Fatores de Perda ──────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Activity size={9} className="text-sky-500/60" />
            Fatores de Perda (Performance Ratio)
          </span>

          <div className="border border-slate-800/60 rounded-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 px-3 py-1.5 bg-slate-900/60 border-b border-slate-800">
              <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest">Fator</span>
              <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest text-right">Referência</span>
              <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest text-right">Adotado</span>
            </div>

            {lossFactors.map((f, i) => (
              <div
                key={f.label}
                className={cn(
                  'grid grid-cols-3 px-3 py-1.5 border-b border-slate-900 hover:bg-slate-900/40 transition-colors',
                  i === lossFactors.length - 1 && 'border-b-0'
                )}
              >
                <span className="text-[9px] text-slate-400 font-medium">{f.label}</span>
                <span className="text-[9px] font-mono text-slate-600 text-right tabular-nums">{f.ref}</span>
                <span className={cn(
                  'text-[9px] font-mono font-black text-right tabular-nums',
                  f.value > 8 ? 'text-rose-400' : f.value > 5 ? 'text-amber-400' : 'text-slate-400'
                )}>
                  {f.value.toFixed(1)}%
                </span>
              </div>
            ))}

            {/* PR Total */}
            <div className="grid grid-cols-3 px-3 py-2 bg-slate-900/40 border-t border-slate-700/50">
              <span className="text-[9px] text-slate-300 font-black uppercase tracking-wider">PR Estimado</span>
              <span className="text-[9px] text-slate-600 text-right font-mono">0.75–0.82</span>
              <span className={cn(
                'text-[10px] font-mono font-black text-right tabular-nums',
                prEstimated >= 0.78 ? 'text-emerald-400' :
                prEstimated >= 0.72 ? 'text-amber-400' : 'text-rose-400'
              )}>
                {(prEstimated * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Topologia Recomendada ───────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
            <Cpu size={9} className="text-emerald-500/60" />
            Topologia Recomendada
          </span>

          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 border rounded-sm',
            topology.color
          )}>
            <span className="shrink-0">{topology.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-tight leading-none">{topology.label}</span>
              <span className="text-[8px] font-medium mt-0.5 opacity-80 leading-snug">{topology.desc}</span>
            </div>
          </div>
        </div>

        {/* ── Gráfico de Rendimento vs Clipping ────────────────────────────── */}
        {fdi > 0 && totalKwpCC > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={9} className="text-amber-500/60" />
              Perfil de Geração Diária Estimado
            </span>
            
            <div className="relative w-full h-28 bg-slate-950/60 border border-slate-800/60 rounded-sm p-3 overflow-hidden">
              {/* O viewBox do SVG é coordenado logicamente. Y=0 é o topo, Y=50 é o fundo. */}
              {(() => {
                const yBase = 45;
                const yPeak = 5;
                const totalH = yBase - yPeak; // 40
                const yCa = Math.max(yPeak, yBase - (totalH / fdi));
                
                // Curva de sino suave
                const curvePath = "M 5,45 C 30,45 35,5 50,5 C 65,5 70,45 95,45 Z";

                return (
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <pattern id="clippingPattern" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="2" stroke="currentColor" strokeWidth="1" className={clipping > 5 ? "text-rose-500/50" : "text-amber-500/50"} />
                      </pattern>
                      <clipPath id="rendimentoClip">
                        <rect x="0" y={yCa} width="100" height={50 - yCa} />
                      </clipPath>
                      <clipPath id="clippingClip">
                        <rect x="0" y="0" width="100" height={yCa} />
                      </clipPath>
                    </defs>
                    
                    {/* Linha do Eixo X */}
                    <line x1="5" y1="45" x2="95" y2="45" className="stroke-slate-700" strokeWidth="0.5" />
                    
                    {/* Sombra da curva */}
                    <path d={curvePath} className="fill-slate-800/30 stroke-slate-700/50 stroke-[0.3]" />
                    
                    {/* Área Útil (Abaixo da linha CA) */}
                    <path d={curvePath} className="fill-emerald-500/20" clipPath="url(#rendimentoClip)" />
                    <path d={curvePath} className="stroke-emerald-500/50 stroke-[0.8] fill-none" clipPath="url(#rendimentoClip)" />
                    
                    {/* Área Cortada (Acima da linha CA) */}
                    {fdi > 1 && (
                      <>
                        <path d={curvePath} fill="url(#clippingPattern)" clipPath="url(#clippingClip)" />
                        <path d={curvePath} className={cn("stroke-[0.8] fill-none", clipping > 5 ? "stroke-rose-500/50" : "stroke-amber-500/50")} clipPath="url(#clippingClip)" />
                      </>
                    )}
                    
                    {/* Limite do Inversor (P_CA) */}
                    <line x1="15" y1={yCa} x2="85" y2={yCa} strokeDasharray="1 1" className="stroke-emerald-400" strokeWidth="0.5" />
                    
                  </svg>
                );
              })()}
              
              {/* Overlay de Labels */}
              {(() => {
                const yBase = 45;
                const yPeak = 5;
                const totalH = yBase - yPeak;
                const yCa = Math.max(yPeak, yBase - (totalH / fdi));
                const topPct = (yCa / 50) * 100;

                return (
                  <div className="absolute inset-0 pointer-events-none p-3">
                    {/* Inversor Limit Label */}
                    <div className="absolute left-4 flex items-center gap-1.5" style={{ top: `calc(${topPct}% - 4px)`, transform: 'translateY(-50%)' }}>
                      <span className="bg-slate-900/90 px-1.5 py-0.5 rounded text-[8px] text-emerald-400 font-mono font-black border border-emerald-500/30 shadow-md">
                        {totalKwCA.toFixed(1)} kW CA
                      </span>
                      <span className="text-[7px] text-slate-500 font-bold tracking-widest uppercase">Limite Inv.</span>
                    </div>

                    {/* Peak CC Label */}
                    {fdi > 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: '5%' }}>
                        <span className={cn(
                          "bg-slate-900/90 px-1.5 py-0.5 rounded text-[8px] font-mono font-black border shadow-md",
                          clipping > 5 ? "text-rose-400 border-rose-500/30" : "text-amber-400 border-amber-500/30"
                        )}>
                          {totalKwpCC.toFixed(1)} kWp CC
                        </span>
                        <span className={cn(
                          "text-[7px] font-bold tracking-widest uppercase mt-0.5",
                          clipping > 5 ? "text-rose-500/80" : "text-amber-500/80"
                        )}>
                          Pico Cortado
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Alerta de Clipping ──────────────────────────────────────────── */}
        {fdi > 0 && (
          <div className={cn(
            'flex items-start gap-2.5 px-3 py-2.5 border rounded-sm',
            clipping < 1 ? 'bg-emerald-500/5 border-emerald-500/20' :
            clipping < 5 ? 'bg-amber-500/5 border-amber-500/20' :
            'bg-rose-500/5 border-rose-500/20'
          )}>
            {clipping < 1
              ? <CheckCircle2 size={12} className="text-emerald-500/60 shrink-0 mt-0.5" />
              : <AlertTriangle size={12} className={cn('shrink-0 mt-0.5', clipping < 5 ? 'text-amber-500' : 'text-rose-500')} />
            }
            <div className="flex flex-col">
              <span className={cn(
                'text-[9px] font-black uppercase tracking-wide leading-none',
                clipping < 1 ? 'text-emerald-400' : clipping < 5 ? 'text-amber-400' : 'text-rose-400'
              )}>
                {clipping < 1
                  ? 'Clipping negligenciável'
                  : clipping < 5
                    ? `Clipping estimado: ${clipping.toFixed(1)}%`
                    : `Clipping elevado: ${clipping.toFixed(1)}%`
                }
              </span>
              <span className="text-[8px] text-slate-600 mt-0.5 leading-snug">
                {clipping < 1
                  ? 'O inversor não limita a geração de forma significativa.'
                  : clipping < 5
                    ? 'Verifique se o ganho de kWh pelo oversizing compensa a perda no pico.'
                    : 'Considere reduzir o arranjo CC ou aumentar a capacidade CA do inversor.'
                }
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {fdi <= 0 && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-8">
            <Activity size={28} className="text-emerald-500 mb-2" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Configure um inversor para ver a análise de FDI
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
