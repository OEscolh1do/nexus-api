/**
 * =============================================================================
 * SUN PATH DIAGRAM — Trajetória Solar em Projeção Gnômica Polar
 * =============================================================================
 * Visualiza os arcos solares ao longo do ano (solstícios + equinócio +
 * mês selecionado) em uma abóbada celeste SVG interativa.
 *
 * Projeção gnômica equidistante:
 *   Centro = zênite (elevação 90°)
 *   Borda  = horizonte (elevação 0°)
 *   Norte  = topo (azimute 0°)
 *
 * Motor: solarPosition.ts (PSA/NOAA, sem dependências externas)
 * =============================================================================
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  calculateSolarDay,
  monthToDayOfYear,
  inferTimezone,
  type SolarDayInfo,
} from '../../../../utils/solarPosition';

// ─── CONSTANTES DE LAYOUT ─────────────────────────────────────────────────────
const CX = 140;
const CY = 140;
const R  = 118; // raio do horizonte
const CARDINALS = [
  { label: 'N', az: 0,   x: CX,         y: CY - R - 12 },
  { label: 'S', az: 180, x: CX,         y: CY + R + 12 },
  { label: 'L', az: 90,  x: CX + R + 12, y: CY + 4     },
  { label: 'O', az: 270, x: CX - R - 12, y: CY + 4     },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toSVG(elevation: number, azimuth: number): { x: number; y: number } | null {
  if (elevation < 0) return null;
  const dist    = R * (1 - elevation / 90);
  const az_rad  = (azimuth * Math.PI) / 180;
  return {
    x: +(CX + dist * Math.sin(az_rad)).toFixed(1),
    y: +(CY - dist * Math.cos(az_rad)).toFixed(1),
  };
}

function buildPolyline(day: SolarDayInfo): string {
  return day.points
    .filter(p => p.elevation >= 0)
    .map(p => {
      const pt = toSVG(p.elevation, p.azimuth);
      return pt ? `${pt.x},${pt.y}` : null;
    })
    .filter(Boolean)
    .join(' ');
}

function decimalToHM(h: number): string {
  const hh = Math.floor(Math.max(0, h));
  const mm = Math.round((Math.max(0, h) % 1) * 60);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

interface SunPathDiagramProps {
  lat:          number;
  lng:          number;
  panelAzimuth: number; // azimute do painel (0=N, 180=S)
  currentMonth: number; // 0-11 (-1 = média anual → usa mês atual do calendário)
}

export const SunPathDiagram: React.FC<SunPathDiagramProps> = ({
  lat, lng, panelAzimuth, currentMonth,
}) => {
  const [scrubHour, setScrubHour] = useState(12);

  const timezone = useMemo(() => inferTimezone(lng), [lng]);

  // Arcos-chave: solstício de verão (SH=Dez), equinócio, solstício de inverno (SH=Jun)
  const isSouthern = lat <= 0;
  const summerDay  = useMemo(() => calculateSolarDay(lat, lng, monthToDayOfYear(isSouthern ? 12 : 6),  timezone), [lat, lng, timezone, isSouthern]);
  const winterDay  = useMemo(() => calculateSolarDay(lat, lng, monthToDayOfYear(isSouthern ? 6  : 12), timezone), [lat, lng, timezone, isSouthern]);
  const equinoxDay = useMemo(() => calculateSolarDay(lat, lng, 80, timezone), [lat, lng, timezone]);

  // Mês selecionado (ou mês corrente do sistema)
  const selectedMonthIdx = currentMonth >= 0 ? currentMonth : new Date().getMonth();
  const selectedDay = useMemo(() =>
    calculateSolarDay(lat, lng, monthToDayOfYear(selectedMonthIdx + 1), timezone),
    [lat, lng, selectedMonthIdx, timezone]
  );

  // Posição do sol no scrubber
  const sunPos = useMemo(() => {
    const idx = Math.min(95, Math.round(scrubHour * 4));
    const pt  = selectedDay.points[idx];
    if (!pt || pt.elevation < 0) return null;
    return toSVG(pt.elevation, pt.azimuth);
  }, [scrubHour, selectedDay]);

  // Linha do azimute do painel (do centro até a borda)
  const panelLineEnd = useMemo(() => {
    const az_rad = (panelAzimuth * Math.PI) / 180;
    return {
      x: +(CX + R * Math.sin(az_rad)).toFixed(1),
      y: +(CY - R * Math.cos(az_rad)).toFixed(1),
    };
  }, [panelAzimuth]);

  // Polilinha de cada arco
  const summerPath  = useMemo(() => buildPolyline(summerDay),  [summerDay]);
  const winterPath  = useMemo(() => buildPolyline(winterDay),  [winterDay]);
  const equinoxPath = useMemo(() => buildPolyline(equinoxDay), [equinoxDay]);
  const selectedPath = useMemo(() => buildPolyline(selectedDay), [selectedDay]);

  const onScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubHour(parseFloat(e.target.value));
  }, []);

  return (
    <div className="flex flex-col gap-2 select-none">
      {/* ── SVG Principal ────────────────────────────────────────────────────── */}
      <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto" role="img" aria-label="Trajetória solar anual">
        {/* Fundo */}
        <circle cx={CX} cy={CY} r={R} fill="rgba(15,23,42,0.6)" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />

        {/* Anéis de elevação (30° e 60°) */}
        {[30, 60].map(elev => (
          <circle key={elev}
            cx={CX} cy={CY}
            r={R * (1 - elev / 90)}
            fill="none"
            stroke="rgba(100,116,139,0.12)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}

        {/* Labels dos anéis */}
        <text x={CX + 4} y={CY - R * (1 - 30/90) + 3} fontSize="7" fill="rgba(100,116,139,0.5)">30°</text>
        <text x={CX + 4} y={CY - R * (1 - 60/90) + 3} fontSize="7" fill="rgba(100,116,139,0.5)">60°</text>

        {/* Linhas cardinais */}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="rgba(100,116,139,0.15)" strokeWidth="1" />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="rgba(100,116,139,0.15)" strokeWidth="1" />

        {/* Labels cardinais */}
        {CARDINALS.map(c => (
          <text key={c.label} x={c.x} y={c.y} textAnchor="middle" fontSize="9" fontWeight="700"
            fill="rgba(148,163,184,0.6)" fontFamily="system-ui">
            {c.label}
          </text>
        ))}

        {/* Arco — solstício de inverno (SH = Jun) */}
        {winterPath && (
          <polyline points={winterPath}
            fill="none" stroke="rgba(99,102,241,0.45)" strokeWidth="1.5"
            strokeLinejoin="round" strokeDasharray="4 3"
          />
        )}

        {/* Arco — equinócio */}
        {equinoxPath && (
          <polyline points={equinoxPath}
            fill="none" stroke="rgba(100,116,139,0.4)" strokeWidth="1.5"
            strokeLinejoin="round" strokeDasharray="2 4"
          />
        )}

        {/* Arco — solstício de verão (SH = Dez) */}
        {summerPath && (
          <polyline points={summerPath}
            fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}

        {/* Arco — mês selecionado (destaque) */}
        {selectedPath && (
          <polyline points={selectedPath}
            fill="none" stroke="rgba(245,158,11,0.9)" strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Linha do azimute do painel */}
        <line
          x1={CX} y1={CY}
          x2={panelLineEnd.x} y2={panelLineEnd.y}
          stroke="rgba(56,189,248,0.7)" strokeWidth="1.5"
          strokeDasharray="5 3"
        />
        <circle cx={panelLineEnd.x} cy={panelLineEnd.y} r="3" fill="rgba(56,189,248,0.8)" />
        {/* Label do painel */}
        <text
          x={CX + (panelLineEnd.x - CX) * 0.65}
          y={CY + (panelLineEnd.y - CY) * 0.65 - 5}
          fontSize="7" fill="rgba(56,189,248,0.8)" textAnchor="middle" fontFamily="system-ui"
        >
          Painel
        </text>

        {/* Sol (posição no horário do scrubber) */}
        {sunPos && (
          <>
            <circle cx={sunPos.x} cy={sunPos.y} r="9" fill="rgba(251,191,36,0.12)" />
            <circle cx={sunPos.x} cy={sunPos.y} r="5" fill="rgba(251,191,36,0.25)" />
            <circle cx={sunPos.x} cy={sunPos.y} r="3" fill="#FBBF24" />
          </>
        )}

        {/* Ponto central (zênite) */}
        <circle cx={CX} cy={CY} r="2" fill="rgba(100,116,139,0.3)" />
      </svg>

      {/* ── Legenda ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
        <LegendItem color="rgba(251,191,36,0.8)"  label={isSouthern ? 'Verão (Dez)' : 'Verão (Jun)'} />
        <LegendItem color="rgba(100,116,139,0.6)" label="Equinócio" dashed />
        <LegendItem color="rgba(99,102,241,0.7)"  label={isSouthern ? 'Inverno (Jun)' : 'Inverno (Dez)'} dashed />
        <LegendItem color="rgba(56,189,248,0.8)"  label="Azimute Painel" dashed />
      </div>

      {/* ── Scrubber de Hora ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 px-2 mt-1">
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
          <span>00:00</span>
          <span className="text-amber-400 font-black">{decimalToHM(scrubHour)}</span>
          <span>24:00</span>
        </div>
        <input
          type="range" min="0" max="24" step="0.25"
          value={scrubHour}
          onChange={onScrub}
          className="w-full h-1 appearance-none bg-slate-800 rounded-full
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
        {/* Info do ponto atual */}
        <div className="flex justify-center gap-4 text-[8px] font-mono text-slate-500 tabular-nums">
          {sunPos ? (
            <>
              <span>Elevação:
                <span className="text-amber-400 ml-1">
                  {selectedDay.points[Math.min(95, Math.round(scrubHour * 4))]?.elevation.toFixed(1)}°
                </span>
              </span>
              <span>Azimute:
                <span className="text-amber-400 ml-1">
                  {selectedDay.points[Math.min(95, Math.round(scrubHour * 4))]?.azimuth.toFixed(1)}°
                </span>
              </span>
            </>
          ) : (
            <span className="text-slate-700">Sol abaixo do horizonte</span>
          )}
        </div>
      </div>

      {/* ── Efemérides do mês ─────────────────────────────────────────────────── */}
      <div className="flex justify-around px-2 py-2 border-t border-slate-800/40 mt-1">
        <Ephemeris label="Nascer" value={decimalToHM(selectedDay.sunrise)} icon="☀" />
        <Ephemeris label="Meio-dia Solar" value={decimalToHM(selectedDay.solarNoon)} icon="↑" accent />
        <Ephemeris label="Pôr" value={decimalToHM(selectedDay.sunset)} icon="☽" />
        <Ephemeris label="Duração" value={`${selectedDay.daylength.toFixed(1)}h`} icon="⏱" />
      </div>
    </div>
  );
};

// ─── MICRO-COMPONENTES ────────────────────────────────────────────────────────

const LegendItem: React.FC<{ color: string; label: string; dashed?: boolean }> = ({ color, label, dashed }) => (
  <div className="flex items-center gap-1">
    <svg width="18" height="4" viewBox="0 0 18 4">
      <line x1="0" y1="2" x2="18" y2="2"
        stroke={color} strokeWidth="2"
        strokeDasharray={dashed ? '4 2' : undefined}
      />
    </svg>
    <span className="text-[8px] text-slate-500">{label}</span>
  </div>
);

const Ephemeris: React.FC<{ label: string; value: string; icon: string; accent?: boolean }> = ({
  label, value, icon, accent,
}) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-[8px] text-slate-600">{label}</span>
    <span className={`text-[11px] font-black font-mono tabular-nums ${accent ? 'text-amber-400' : 'text-slate-400'}`}>
      {icon} {value}
    </span>
  </div>
);
