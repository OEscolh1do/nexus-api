/**
 * =============================================================================
 * CLIMATE CONTEXT WIDGET — Perfil de Irradiância Mensal
 * =============================================================================
 * Exibe o perfil climático da localização do projeto: HSP mensal em
 * mini-barras coloridas por intensidade, com indicadores de melhor/pior
 * mês e média anual.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

interface ClimateContextWidgetProps {
  monthlyHsp:  number[];   // 12 valores de HSP (kWh/m²/dia)
  city:        string;     // Nome da cidade
  state?:      string;
  lat:         number;
  lng:         number;
}

export const ClimateContextWidget: React.FC<ClimateContextWidgetProps> = ({
  monthlyHsp, city, state, lat, lng,
}) => {
  const valid = useMemo(() => monthlyHsp.some(v => v > 0), [monthlyHsp]);

  const maxHsp  = useMemo(() => Math.max(...monthlyHsp, 1),   [monthlyHsp]);
  const minHsp  = useMemo(() => Math.min(...monthlyHsp.filter(v => v > 0), 99), [monthlyHsp]);
  const avgHsp  = useMemo(() =>
    valid
      ? (monthlyHsp.reduce((a, b) => a + b, 0) / monthlyHsp.filter(v => v > 0).length).toFixed(2)
      : '—',
    [monthlyHsp, valid]
  );

  const bestIdx  = useMemo(() => monthlyHsp.indexOf(maxHsp),  [monthlyHsp, maxHsp]);
  const worstIdx = useMemo(() => monthlyHsp.indexOf(minHsp),  [monthlyHsp, minHsp]);

  // Timezone inferido
  const timezone = Math.round(lng / 15);

  if (!valid) {
    return (
      <div className="flex items-center justify-center h-20 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
        Configure a irradiação no bloco Consumo
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header de localização ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[9px] text-slate-400">
        <MapPin size={10} className="text-amber-500 shrink-0" />
        <span className="font-bold truncate">
          {city || 'Localização não definida'}{state ? `, ${state}` : ''}
        </span>
        {lat !== 0 && (
          <span className="text-slate-600 font-mono text-[8px] shrink-0">
            {lat.toFixed(2)}°, {lng.toFixed(2)}° · UTC{timezone >= 0 ? '+' : ''}{timezone}
          </span>
        )}
      </div>

      {/* ── Mini barras de HSP ────────────────────────────────────────────────── */}
      <div className="flex items-end gap-1 h-14">
        {MONTHS.map((m, i) => {
          const hsp     = monthlyHsp[i] ?? 0;
          const pct     = hsp > 0 ? (hsp / maxHsp) * 100 : 0;
          const isBest  = i === bestIdx;
          const isWorst = i === worstIdx;
          // Cor interpolada: cinza (baixo) → âmbar (médio) → amarelo brilhante (alto)
          const intensity = maxHsp > 0 ? hsp / maxHsp : 0;
          const color = isBest
            ? '#FBBF24'
            : isWorst
              ? 'rgba(100,116,139,0.5)'
              : `rgba(${Math.round(245 * intensity)}, ${Math.round(158 * intensity)}, 11, ${0.4 + intensity * 0.5})`;

          return (
            <div key={m} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <div className="w-full flex flex-col justify-end" style={{ height: 44 }}>
                <div
                  style={{ height: `${Math.max(4, pct)}%`, backgroundColor: color, borderRadius: 2 }}
                  title={`${m}: ${hsp.toFixed(2)} kWh/m²/dia`}
                />
              </div>
              <span className={`text-[7px] font-bold tabular-nums ${
                isBest ? 'text-amber-400' : isWorst ? 'text-slate-600' : 'text-slate-600'
              }`}>
                {m}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center border-t border-slate-800/40 pt-2 text-[8px]">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-slate-600 uppercase tracking-wider font-bold">Melhor</span>
          <span className="text-amber-400 font-black font-mono">
            {MONTHS[bestIdx]} · {monthlyHsp[bestIdx]?.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-slate-600 uppercase tracking-wider font-bold">Média Anual</span>
          <span className="text-slate-300 font-black font-mono text-[11px]">
            {avgHsp} <span className="text-[7px] text-slate-600 font-bold">kWh/m²/dia</span>
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-slate-600 uppercase tracking-wider font-bold">Pior</span>
          <span className="text-slate-500 font-black font-mono">
            {MONTHS[worstIdx]} · {monthlyHsp[worstIdx]?.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
