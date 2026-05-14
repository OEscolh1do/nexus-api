/**
 * TemperatureTab — Aba Consolidada de Análise Térmica
 * =====================================================
 * Unifica em um único painel:
 *   1. Premissas Térmicas (origem e valores de Tmin / Tmax / Tcell)
 *   2. Gráfico de Tensão Térmica por MPPT (VoltageRangeChart)
 *   3. Derating Térmico do Inversor
 *   4. Tabela de Referência NBR 16690:2019 Tabela 1
 *
 * Norma: NBR 16690:2019, §4.3.1.2
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThermalPremises, TMIN_POR_UF } from '../../../../hooks/useThermalPremises';
import { VoltageRangeChart, type MpptThermalProfile } from './VoltageRangeChart';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface TemperatureTabProps {
  mpptProfiles: MpptThermalProfile[];
  mpptMetrics: Record<number, any>;
  mpptConfigs: any[];
  moduleSpecs: any;
  activeInverterSnapshot: any;
  dashboardData: any;
  fdi: number;
  totalKwpCC: number;
  totalKwCA: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB: KPI Card Térmico
// ─────────────────────────────────────────────────────────────────────────────

const ThermalKpiCard: React.FC<{
  label: string;
  value: string;
  unit: string;
  sublabel?: string;
  status?: 'ok' | 'warn' | 'neutral' | 'fallback';
  tooltip?: string;
}> = ({ label, value, unit, sublabel, status = 'neutral', tooltip }) => {
  const valueColor =
    status === 'ok'       ? 'text-emerald-400' :
    status === 'warn'     ? 'text-amber-400'   :
    status === 'fallback' ? 'text-amber-400'   :
    'text-slate-300';
  const borderColor =
    status === 'ok'       ? 'border-emerald-500/20' :
    status === 'warn'     ? 'border-amber-500/20'   :
    status === 'fallback' ? 'border-amber-500/20'   :
    'border-slate-800';

  return (
    <div className={cn('flex flex-col gap-1 px-3 py-2.5 bg-slate-900/60 border rounded-sm', borderColor)} title={tooltip}>
      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-[15px] font-mono font-black tabular-nums leading-none', valueColor)}>{value}</span>
        <span className="text-[9px] text-slate-600 font-bold">{unit}</span>
        {status === 'fallback' && <AlertTriangle size={9} className="text-amber-500 ml-auto shrink-0" />}
      </div>
      {sublabel && <span className="text-[8px] text-slate-600 leading-tight">{sublabel}</span>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: Seção de Premissas
// ─────────────────────────────────────────────────────────────────────────────

const PremissasSection: React.FC<{ moduleSpecs: any }> = ({ moduleSpecs }) => {
  const { tmin, tambMax, tcellMax, noct, uf, isTropical, usingFallbackTmin, usingFallbackTmax } = useThermalPremises();
  const tCoeffVmp = moduleSpecs?.tempCoeffVmp ?? moduleSpecs?.tempCoeffPmax ?? moduleSpecs?.tempCoeffVoc;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          1. Premissas Térmicas — NBR 16690:2019 §4.3.1.2
        </span>
        {(usingFallbackTmin || usingFallbackTmax) && (
          <span className="flex items-center gap-1 text-[9px] text-amber-500 font-bold uppercase tracking-wider">
            <AlertTriangle size={9} />
            Valores padrão ativos — configure em Premissas Térmicas
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <ThermalKpiCard
          label="Tmin Histórica"
          value={tmin.toFixed(1)}
          unit="°C"
          sublabel={usingFallbackTmin ? (uf ? `Padrão ${uf}` : 'Fallback genérico') : 'Configurado'}
          status={usingFallbackTmin ? 'fallback' : 'ok'}
          tooltip={usingFallbackTmin
            ? uf ? `Fallback automático por UF (${uf}): ${TMIN_POR_UF[uf] ?? 10}°C.` : 'UF não informada — usando 10°C genérico.'
            : 'Temperatura mínima histórica configurada manualmente.'}
        />
        <ThermalKpiCard
          label="Tamb Máxima"
          value={tambMax.toFixed(1)}
          unit="°C"
          sublabel={usingFallbackTmax ? (isTropical ? 'Padrão tropical' : 'Padrão temperado') : 'Configurado'}
          status={usingFallbackTmax ? 'fallback' : 'ok'}
          tooltip={usingFallbackTmax
            ? isTropical ? 'Padrão regional tropical: 35°C.' : 'Padrão regional temperado: 30°C.'
            : 'Temperatura máxima configurada manualmente.'}
        />
        <ThermalKpiCard
          label="NOCT Módulo"
          value={noct.toFixed(0)}
          unit="°C"
          sublabel="800 W/m² | 20°C | 1 m/s"
          status="neutral"
        />
        <ThermalKpiCard
          label="Tcell Máxima"
          value={tcellMax.toFixed(1)}
          unit="°C"
          sublabel={`Tamb(${tambMax}°C) + (NOCT−20)×1.25`}
          status={tcellMax > 75 ? 'warn' : 'ok'}
          tooltip="Temperatura máx. da célula FV. Fórmula NBR 16690: Tamb_max + (NOCT − 20) × (1000/800)"
        />
      </div>

      {moduleSpecs && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <ThermalKpiCard
            label="β Voc"
            value={(moduleSpecs.tempCoeffVoc ?? 0).toFixed(3)}
            unit="%/°C"
            sublabel="Coef. Voc — usado em Voc(frio)"
            status="neutral"
          />
          <ThermalKpiCard
            label="β Vmp / Pmax"
            value={(tCoeffVmp ?? 0).toFixed(3)}
            unit="%/°C"
            sublabel="Coef. Vmp — usado em Vmp(calor)"
            status="neutral"
            tooltip="Coeficiente correto para Vmp(calor) — diferente de β(Voc). NBR 16690 §4.3.1.2."
          />
          <ThermalKpiCard
            label="Módulo"
            value={`${moduleSpecs.pmax ?? '—'}W`}
            unit=""
            sublabel={moduleSpecs.isBifacial ? 'Bifacial' : 'Monofacial'}
            status="neutral"
          />
        </div>
      )}

      <div className="flex items-start gap-2 px-3 py-2 bg-slate-900/40 border border-slate-800 rounded-sm">
        <Info size={10} className="text-slate-600 shrink-0 mt-0.5" />
        <p className="text-[9px] text-slate-600 leading-relaxed">
          <span className="text-slate-500 font-bold">Fórmulas aplicadas:</span>{' '}
          Voc(frio) = N × Voc_stc × [1 + (β_Voc/100) × (Tmin − 25)] ≤ Vmax_inv &nbsp;|&nbsp;
          Tcell = Tamb + (NOCT − 20) × (1000/800) &nbsp;|&nbsp;
          Vmp(calor) = N × Vmp_stc × [1 + (β_Vmp/100) × (Tcell − 25)] ≥ Vmppt_min
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB: Derating do Inversor
// ─────────────────────────────────────────────────────────────────────────────

const DeratingSection: React.FC<{ activeInverterSnapshot: any }> = ({ activeInverterSnapshot }) => {
  const { tambMax } = useThermalPremises();
  const inverterOpTemp = tambMax + 5;
  const deratingLimit = activeInverterSnapshot?.deratingTempC || 50;
  const inDerating = inverterOpTemp > deratingLimit;
  const usagePct = Math.min(100, (inverterOpTemp / deratingLimit) * 100);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
        2. Derating Térmico do Inversor
      </span>
      <div className="flex flex-col gap-2 p-3 bg-slate-900/40 border border-slate-800 rounded-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Temp. Operação Estimada</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={cn('text-xl font-mono font-black tabular-nums', inDerating ? 'text-amber-400' : 'text-emerald-400')}>
                {inverterOpTemp.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-600 font-bold">°C</span>
            </div>
            <span className="text-[8px] text-slate-600 mt-0.5">Tamb({tambMax}°C) + 5°C offset chassi</span>
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[10px] font-black uppercase tracking-wider',
            inDerating
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          )}>
            {inDerating ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
            {inDerating ? 'Em Derating' : 'Operação Normal'}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[8px] text-slate-600">
            <span>0°C</span>
            <span className={inDerating ? 'text-amber-500 font-bold' : ''}>Limite: {deratingLimit}°C (TPLim1)</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', inDerating ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {inDerating && (
            <p className="text-[9px] text-amber-500/80 mt-1 leading-tight">
              ⚠ Temperatura acima do limite de derating — o inversor reduzirá a potência CA para se proteger. Considere ventilação forçada no local de instalação.
            </p>
          )}
          {!activeInverterSnapshot?.deratingTempC && (
            <p className="text-[8px] text-slate-600 italic mt-1">TPLim1 não informado no catálogo — usando 50°C conservador. Verifique o datasheet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export const TemperatureTab: React.FC<TemperatureTabProps> = ({
  mpptProfiles,
  moduleSpecs,
  activeInverterSnapshot,
  dashboardData,
}) => {
  const { tmin } = useThermalPremises();
  const configuredProfiles = mpptProfiles.filter(p => p.vmpMin > 0 || p.vocMax > 0);

  return (
    <div className="w-full flex flex-col gap-8 text-slate-300 pb-6">

      {/* 1 — Premissas Térmicas */}
      <PremissasSection moduleSpecs={moduleSpecs} />

      {/* 2 — Derating */}
      <DeratingSection activeInverterSnapshot={activeInverterSnapshot} />

      {/* 3 — Mapa de Tensão por MPPT */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
          3. Mapa de Tensão Térmica Multi-MPPT
        </span>
        {configuredProfiles.length > 0 ? (
          <VoltageRangeChart
            mpptProfiles={mpptProfiles}
            limitInversorVMax={dashboardData.limitInverterVMax}
            limitMpptVMin={dashboardData.limitMpptVMin}
            limitMpptVMax={dashboardData.limitMpptVMax}
            limitVStart={dashboardData.limitMpptVMin}
          />
        ) : (
          <div className="flex items-center justify-center h-24 bg-slate-900/40 border border-slate-800 rounded-sm">
            <span className="text-[11px] text-slate-600 font-mono">Configure strings nos MPPTs para visualizar o mapa térmico</span>
          </div>
        )}
      </div>

      {/* 4 — Tabela NBR 16690:2019, Tabela 1 */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">
          4. Fator de Correção de Voc — NBR 16690:2019, Tabela 1
        </span>
        <div className="overflow-hidden border border-slate-800 rounded-sm">
          <table className="w-full text-[10px] font-mono">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-3 py-2 text-slate-500 font-black uppercase tracking-wider">Faixa Tmin</th>
                <th className="text-right px-3 py-2 text-slate-500 font-black uppercase tracking-wider">Fator Voc</th>
                <th className="text-right px-3 py-2 text-slate-500 font-black uppercase tracking-wider">Aplicável</th>
              </tr>
            </thead>
            <tbody>
              {([
                { range: '20°C a 24°C', factor: 1.02, lo: 20, hi: 24 },
                { range: '10°C a 14°C', factor: 1.06, lo: 10, hi: 14 },
                { range: '0°C a 4°C',   factor: 1.10, lo: 0,  hi: 4  },
                { range: '-10°C a -6°C', factor: 1.14, lo: -10, hi: -6 },
              ] as const).map((row, i) => {
                const active = tmin >= row.lo && tmin <= row.hi;
                return (
                  <tr key={i} className={cn('border-t border-slate-800/50', active ? 'bg-emerald-950/30' : 'hover:bg-slate-900/40')}>
                    <td className={cn('px-3 py-2', active ? 'text-emerald-400 font-bold' : 'text-slate-400')}>
                      {row.range}{active ? ' ← Este projeto' : ''}
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', active ? 'text-emerald-400 font-black' : 'text-slate-400')}>
                      ×{row.factor.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {active
                        ? <span className="inline-flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle size={9} /> Sim</span>
                        : <span className="text-slate-700">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-3 py-2 bg-slate-900/40 border-t border-slate-800">
            <p className="text-[8px] text-slate-600">
              Tabela 1 aplica-se quando β(Voc) do módulo não é fornecido pelo fabricante.
              {moduleSpecs?.tempCoeffVoc ? ` Neste projeto, β(Voc) = ${moduleSpecs.tempCoeffVoc.toFixed(3)} %/°C (fornecido) — a fórmula direta é aplicada.` : ''}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
