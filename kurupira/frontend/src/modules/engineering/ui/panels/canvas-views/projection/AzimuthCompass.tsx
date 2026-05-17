/**
 * =============================================================================
 * AZIMUTH COMPASS — Rosa dos Ventos + Orientação do Painel
 * =============================================================================
 * Visualiza o azimute configurado para o painel em relação ao Norte,
 * destaca a zona ótima (±30° do ótimo para a latitude) e exibe
 * a penalidade de geração por orientação subótima.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { calculateAzimuthLoss } from '../../../../utils/solarPosition';

const CX = 90;
const CY = 90;
const R  = 72;
const DEG = Math.PI / 180;

function polarToXY(az: number, r: number): { x: number; y: number } {
  return {
    x: +(CX + r * Math.sin(az * DEG)).toFixed(1),
    y: +(CY - r * Math.cos(az * DEG)).toFixed(1),
  };
}

/** Gera o path de um arco SVG no sentido horário de startAz até endAz */
function arcPath(startAz: number, endAz: number, r: number): string {
  const s  = polarToXY(startAz, r);
  const e  = polarToXY(endAz, r);
  const la = (endAz - startAz + 360) % 360 > 180 ? 1 : 0;
  return `M ${CX},${CY} L ${s.x},${s.y} A ${r},${r} 0 ${la} 1 ${e.x},${e.y} Z`;
}

interface AzimuthCompassProps {
  panelAzimuth: number; // 0=N, 90=E, 180=S, 270=O
  lat: number;
}

export const AzimuthCompass: React.FC<AzimuthCompassProps> = ({ panelAzimuth, lat }) => {
  const { optimalAzimuth, lossPct, isOptimal } = useMemo(
    () => calculateAzimuthLoss(panelAzimuth, lat),
    [panelAzimuth, lat]
  );

  const panelPt   = polarToXY(panelAzimuth, R);
  const panelMid  = polarToXY(panelAzimuth, R * 0.55);
  const optimalPt = polarToXY(optimalAzimuth, R * 0.88);

  // Zona ótima: setor ±30° a partir do azimute ótimo
  const zoneColor = isOptimal
    ? 'rgba(34,197,94,0.18)'
    : lossPct < 20
      ? 'rgba(251,191,36,0.15)'
      : 'rgba(239,68,68,0.12)';
  const zoneStroke = isOptimal ? 'rgba(34,197,94,0.4)' : 'rgba(251,191,36,0.3)';

  const arrowColor = isOptimal ? '#22C55E' : lossPct < 20 ? '#FBBF24' : '#F87171';

  const TICKS = [
    { az: 0,   label: 'N' },
    { az: 45,  label: 'NE' },
    { az: 90,  label: 'L' },
    { az: 135, label: 'SE' },
    { az: 180, label: 'S' },
    { az: 225, label: 'SO' },
    { az: 270, label: 'O' },
    { az: 315, label: 'NO' },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 180 180" className="w-full max-w-[180px]" role="img" aria-label="Bússola de azimute do painel">

        {/* Zona ótima (setor ±30°) */}
        <path
          d={arcPath(optimalAzimuth - 30, optimalAzimuth + 30, R * 0.92)}
          fill={zoneColor}
          stroke={zoneStroke}
          strokeWidth="1"
        />

        {/* Círculo de horizonte */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />

        {/* Ticks e labels */}
        {TICKS.map(({ az, label }) => {
          const inner = polarToXY(az, R - 8);
          const outer = polarToXY(az, R);
          const txt   = polarToXY(az, R + 10);
          const isCardinal = az % 90 === 0;
          return (
            <g key={az}>
              <line
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={isCardinal ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.25)'}
                strokeWidth={isCardinal ? 1.5 : 1}
              />
              {isCardinal && (
                <text
                  x={txt.x} y={txt.y + 3}
                  textAnchor="middle" fontSize="8" fontWeight="700"
                  fill="rgba(148,163,184,0.7)" fontFamily="system-ui"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Marcador de azimute ótimo */}
        <circle cx={optimalPt.x} cy={optimalPt.y} r="3" fill="rgba(34,197,94,0.4)" />
        <circle cx={optimalPt.x} cy={optimalPt.y} r="1.5" fill="#22C55E" />

        {/* Seta do painel (do centro até a borda) */}
        <line
          x1={CX} y1={CY}
          x2={panelPt.x} y2={panelPt.y}
          stroke={arrowColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Ponta da seta */}
        <circle cx={panelPt.x} cy={panelPt.y} r="4.5" fill={arrowColor} opacity="0.9" />

        {/* Label do painel */}
        <text
          x={panelMid.x} y={panelMid.y - 5}
          textAnchor="middle" fontSize="7" fontWeight="800"
          fill={arrowColor} fontFamily="system-ui"
        >
          {panelAzimuth}°
        </text>

        {/* Ponto central */}
        <circle cx={CX} cy={CY} r="3" fill="rgba(100,116,139,0.5)" />
        <circle cx={CX} cy={CY} r="1.5" fill="rgba(148,163,184,0.8)" />
      </svg>

      {/* ── Resultado ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 text-center px-2">
        <div className={`text-[18px] font-black font-mono tabular-nums ${
          isOptimal ? 'text-emerald-400' : lossPct < 20 ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {lossPct > 0 ? `-${lossPct}%` : '✓ Ótimo'}
        </div>
        <p className="text-[8px] text-slate-500 leading-relaxed">
          {isOptimal
            ? `Orientação excelente — dentro da zona ótima (±30° do ${optimalAzimuth === 0 ? 'Norte' : 'Sul'})`
            : `Desvio de ${Math.abs(panelAzimuth - optimalAzimuth) > 180
                ? 360 - Math.abs(panelAzimuth - optimalAzimuth)
                : Math.abs(panelAzimuth - optimalAzimuth)}° do ótimo — recomendado ${optimalAzimuth === 0 ? 'Norte (0°)' : 'Sul (180°)'}`
          }
        </p>
        <div className="flex gap-2 text-[7px] text-slate-600">
          <span className="text-emerald-600">━ Zona ótima (±30°)</span>
          <span style={{ color: arrowColor }}>━ Painel</span>
        </div>
      </div>
    </div>
  );
};
