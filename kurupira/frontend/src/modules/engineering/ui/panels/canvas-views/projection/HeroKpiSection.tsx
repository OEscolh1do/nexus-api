/**
 * =============================================================================
 * HERO KPI SECTION — Seção de Impacto Principal (Tier S2 + S3)
 * =============================================================================
 * O primeiro elemento que o cliente vê ao abrir a view de Projeção.
 *
 * Estrutura narrativa (Framework Neurodesign — Camadas 1+3):
 *   → Contador animado de economia/mês  (dopamina — centro de recompensa)
 *   → 3 KPIs de suporte compactos       (cobertura, payback, 25 anos)
 *   → Âncora Reversa ("o vilão")        (aversão a risco — Kahneman)
 *
 * Fontes:
 *   - Schultz, 1997: dopamina e contadores ascendentes
 *   - Kahneman, 2011: ancoragem e aversão à perda
 *   - Ariely, 2010: "Efeito Dan Ariely" de reframing de preço
 * =============================================================================
 */

import React from 'react';
import { TrendingUp, Zap, Clock, AlertTriangle } from 'lucide-react';
import { useCountUp } from '../../../../hooks/useCountUp';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number, decimals = 0): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface HeroKpiSectionProps {
  /** Economia mensal estimada (R$) */
  economiaMes: number;
  /** Economia anual (R$) */
  economiaAno: number;
  /** Cobertura solar (%) — geração / consumo × 100 */
  cobertura: number;
  /** Payback em anos */
  paybackAnos: number;
  /** Benefício líquido acumulado em 25 anos (R$) */
  beneficio25anos: number;
  /** Custo total da fatura original mensal (R$) — base para "custo da inação" */
  faturaOriginal: number;
  /** Taxa de inflação tarifária anual (0–1) para projetar custo em 25 anos */
  inflacaoTarifaria?: number;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const HeroKpiSection: React.FC<HeroKpiSectionProps> = ({
  economiaMes,
  economiaAno,
  cobertura,
  paybackAnos,
  beneficio25anos,
  faturaOriginal,
  inflacaoTarifaria = 0.05,
}) => {

  // ── Calculando o "custo da inação" (S3 — Âncora Reversa) ──────────────────
  // Soma da progressão geométrica: FV = PMT × [(1+i)^n - 1] / i
  const custoInacao = useMemo25(faturaOriginal, inflacaoTarifaria, 25);

  // ── Contadores animados ────────────────────────────────────────────────────
  const { value: animEconomiaMes }    = useCountUp({ target: economiaMes,    duration: 1400, easing: 'easeOut', decimals: 0 });
  const { value: animCobertura }      = useCountUp({ target: cobertura,      duration: 1000, easing: 'easeOut', decimals: 1, delay: 300 });
  const { value: animPayback }        = useCountUp({ target: paybackAnos,    duration: 800,  easing: 'easeOut', decimals: 1, delay: 600 });
  const { value: animBeneficio }      = useCountUp({ target: beneficio25anos, duration: 1600, easing: 'easeOut', decimals: 0, delay: 800 });

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-emerald-950/40"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #052e16 60%, #020617 100%)',
      }}
      aria-label="Resumo do benefício do sistema solar"
    >
      {/* Glow decorativo de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 px-6 py-8 flex flex-col items-center gap-6">

        {/* ── Label superior ─────────────────────────────────────────────────── */}
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 text-center">
          ☀ Economia Projetada com Solar
        </p>

        {/* ── Contador principal: economia mensal ────────────────────────────── */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="font-black tabular-nums text-center leading-none"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              color: '#4ADE80',
              textShadow: '0 0 40px rgba(74,222,128,0.35)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(animEconomiaMes)}
          </div>
          <span className="text-[13px] font-bold text-emerald-600/80">/mês</span>
          <span className="text-[10px] text-slate-600 font-bold">
            ({formatCurrency(economiaAno)}/ano)
          </span>
        </div>

        {/* ── Trio de KPIs de suporte ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
          <SupportKpi
            icon={<Zap size={12} className="text-amber-400" />}
            label="Cobertura Solar"
            value={`${animCobertura.toFixed(1)}%`}
            valueColor="text-amber-400"
          />
          <SupportKpi
            icon={<Clock size={12} className="text-sky-400" />}
            label="Payback"
            value={`${animPayback.toFixed(1)} anos`}
            valueColor="text-sky-400"
          />
          <SupportKpi
            icon={<TrendingUp size={12} className="text-emerald-400" />}
            label="Retorno em 25 anos"
            value={formatCurrency(animBeneficio, 0)}
            valueColor="text-emerald-400"
          />
        </div>

        {/* ── Âncora Reversa: o Vilão (S3) ───────────────────────────────────── */}
        {custoInacao > 0 && (
          <div
            className="flex items-start gap-3 rounded-lg border border-rose-950/40 px-4 py-3 w-full max-w-lg"
            style={{ background: 'rgba(239,68,68,0.05)' }}
          >
            <AlertTriangle size={14} className="text-rose-500/80 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-black text-rose-400/80 uppercase tracking-wider">
                Custo da Inação — Sem Solar
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sem esse sistema, você pagará aproximadamente{' '}
                <span className="font-black text-rose-400">
                  {formatCurrency(custoInacao)}
                </span>{' '}
                à concessionária nos próximos 25 anos
                {inflacaoTarifaria > 0 && (
                  <span className="text-slate-600">
                    {' '}(com inflação tarifária de {(inflacaoTarifaria * 100).toFixed(0)}%/ano)
                  </span>
                )}.
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

// ─── MICRO-COMPONENTES ────────────────────────────────────────────────────────

const SupportKpi: React.FC<{
  icon:       React.ReactNode;
  label:      string;
  value:      string;
  valueColor: string;
}> = ({ icon, label, value, valueColor }) => (
  <div
    className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-800/40 p-3"
    style={{ background: 'rgba(15,23,42,0.6)' }}
  >
    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
      {icon}
      <span>{label}</span>
    </div>
    <p className={`text-[15px] font-black tabular-nums ${valueColor}`}>{value}</p>
  </div>
);

// ─── HELPER PURO ─────────────────────────────────────────────────────────────

/**
 * Calcula o custo total da concessionária em `anos` anos com inflação composta.
 * FV = PMT × [(1+i)^n - 1] / i  (valor futuro de anuidade)
 */
function useMemo25(faturaOriginal: number, inflacao: number, anos: number): number {
  if (faturaOriginal <= 0) return 0;
  if (inflacao <= 0) return faturaOriginal * 12 * anos;
  // Anualidade × progressão geométrica (pagamento mensal → anual × fator de crescimento)
  const faturaAno = faturaOriginal * 12;
  const total = faturaAno * ((Math.pow(1 + inflacao, anos) - 1) / inflacao);
  return Math.round(total);
}
