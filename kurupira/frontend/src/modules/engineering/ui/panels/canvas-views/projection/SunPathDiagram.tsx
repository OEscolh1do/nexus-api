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
import { MapContainer } from 'react-leaflet';
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import {
  calculateSolarDay,
  monthToDayOfYear,
  inferTimezone,
  type SolarDayInfo,
} from '../../../../utils/solarPosition';

const GOOGLE_MAPS_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

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

function getSunColor(elevation: number) {
  if (elevation < 0) return 'rgba(100,116,139,0.2)';
  if (elevation < 10) return '#ea580c'; // Laranja profundo (amanhecer/entardecer)
  if (elevation < 25) return '#f59e0b'; // Âmbar
  if (elevation < 45) return '#fbbf24'; // Amarelo
  return '#fef08a'; // Branco amarelado intenso (zênite)
}

function getSunGlow(elevation: number) {
  if (elevation < 0) return 'transparent';
  if (elevation < 10) return 'rgba(234,88,12,0.3)';
  if (elevation < 25) return 'rgba(245,158,11,0.3)';
  if (elevation < 45) return 'rgba(251,191,36,0.3)';
  return 'rgba(254,240,138,0.4)';
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

  // Posição e dados do sol no scrubber
  const sunData = useMemo(() => {
    const idx = Math.min(95, Math.round(scrubHour * 4));
    const pt  = selectedDay.points[idx];
    if (!pt || pt.elevation < 0) return null;
    const pos = toSVG(pt.elevation, pt.azimuth);
    return { ...pos, elevation: pt.elevation, azimuth: pt.azimuth };
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
      {/* ── Visualização Combinada (Mapa Satélite + SVG Overlay) ──────────────── */}
      <div 
        className="relative w-full max-w-[280px] aspect-square mx-auto flex items-center justify-center"
        style={{
          maskImage: 'radial-gradient(circle, black 75%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(circle, black 75%, transparent 95%)'
        }}
      >
        
        {/* Mapa de Fundo */}
        {lat !== 0 && lng !== 0 && (
          <div 
            className="absolute inset-0 pointer-events-none rounded-full overflow-hidden opacity-60 mix-blend-screen"
            style={{ 
              clipPath: 'circle(42.14% at 50% 50%)', // 118px / 280px
              filter: 'grayscale(0.6) contrast(1.2)'
            }}
          >
            <MapContainer
              center={[lat, lng]}
              zoom={20}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              boxZoom={false}
              keyboard={false}
              attributionControl={false}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
              <ReactLeafletGoogleLayer apiKey={GOOGLE_MAPS_TOKEN || ''} type="hybrid" />
            </MapContainer>
          </div>
        )}

        {/* SVG Principal */}
        <svg viewBox="0 0 280 280" className="absolute inset-0 w-full h-full" role="img" aria-label="Trajetória solar anual">
          {/* Fundo (mais transparente para mostrar o mapa) */}
          <circle cx={CX} cy={CY} r={R} fill="rgba(15,23,42,0.65)" stroke="rgba(100,116,139,0.3)" strokeWidth="1" />

        {/* Anéis de elevação (30° e 60°) - Disclosure Sutil */}
        {[30, 60].map(elev => (
          <circle key={elev}
            cx={CX} cy={CY}
            r={R * (1 - elev / 90)}
            fill="none"
            stroke="rgba(100,116,139,0.05)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        ))}

        {/* Labels dos anéis */}
        <text x={CX + 4} y={CY - R * (1 - 30/90) + 3} fontSize="6" fill="rgba(100,116,139,0.3)">30°</text>
        <text x={CX + 4} y={CY - R * (1 - 60/90) + 3} fontSize="6" fill="rgba(100,116,139,0.3)">60°</text>

        {/* Linhas cardinais */}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="rgba(100,116,139,0.05)" strokeWidth="1" />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="rgba(100,116,139,0.05)" strokeWidth="1" />

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
          fontWeight="700"
        >
          Sua Placa
        </text>

        {/* Feixe de Luz (Light Beam) */}
        {sunData && (
          <polygon
            points={`${sunData.x},${sunData.y} ${CX - 8},${CY + 8} ${CX + 8},${CY - 8}`}
            fill={getSunGlow(sunData.elevation)}
            style={{ mixBlendMode: 'screen', opacity: 0.6 }}
          />
        )}

        {/* Sol (posição no horário do scrubber com Gradiente Térmico) */}
        {sunData && (
          <g>
            {/* Glow halo */}
            <circle cx={sunData.x} cy={sunData.y} r="12" fill={getSunColor(sunData.elevation)} opacity="0.1" />
            <circle cx={sunData.x} cy={sunData.y} r="7" fill={getSunColor(sunData.elevation)} opacity="0.25" style={{ filter: 'blur(1px)' }} />
            {/* Core */}
            <circle cx={sunData.x} cy={sunData.y} r="3" fill={getSunColor(sunData.elevation)} />
          </g>
        )}

          {/* Ponto central (zênite) */}
          <circle cx={CX} cy={CY} r="2" fill="rgba(100,116,139,0.5)" />
        </svg>
      </div>

      {/* ── Legenda ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
        <LegendItem color="rgba(251,191,36,0.8)"  label={isSouthern ? 'Verão (Dez)' : 'Verão (Jun)'} />
        <LegendItem color="rgba(100,116,139,0.6)" label="Equinócio" dashed />
        <LegendItem color="rgba(99,102,241,0.7)"  label={isSouthern ? 'Inverno (Jun)' : 'Inverno (Dez)'} dashed />
        <LegendItem color="rgba(56,189,248,0.8)"  label="Azimute Painel" dashed />
      </div>

      {/* ── Scrubber de Hora Cinemático ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 px-4 mt-2">
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
          <span>Nascer do Sol</span>
          <span className="text-[12px] text-amber-400 font-black" style={{ textShadow: '0 0 10px rgba(245,158,11,0.3)' }}>
            {decimalToHM(scrubHour)}
          </span>
          <span>Pôr do Sol</span>
        </div>
        <div className="relative flex items-center py-2 group cursor-pointer">
          <input
            type="range" min={Math.max(0, selectedDay.sunrise - 1)} max={Math.min(24, selectedDay.sunset + 1)} step="0.25"
            value={scrubHour}
            onChange={onScrub}
            className="w-full h-1 appearance-none bg-slate-800 rounded-full z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(245,158,11,0.8)]
              [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing
              [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110"
          />
          {/* Trilha ativa simulada */}
          <div 
            className="absolute h-1 bg-gradient-to-r from-orange-500/50 to-amber-400/80 rounded-full pointer-events-none"
            style={{ 
              width: `${((scrubHour - Math.max(0, selectedDay.sunrise - 1)) / (Math.min(24, selectedDay.sunset + 1) - Math.max(0, selectedDay.sunrise - 1))) * 100}%`,
              left: 0
            }} 
          />
        </div>
        {/* Info do ponto atual */}
        <div className="flex justify-center gap-4 text-[9px] font-mono text-slate-500 tabular-nums h-3">
          {sunData ? (
            <>
              <span className="flex items-center gap-1">
                Elevação: <span style={{ color: getSunColor(sunData.elevation) }}>{sunData.elevation.toFixed(1)}°</span>
              </span>
              <span className="flex items-center gap-1">
                Azimute: <span style={{ color: getSunColor(sunData.elevation) }}>{sunData.azimuth.toFixed(1)}°</span>
              </span>
            </>
          ) : (
            <span className="text-slate-700 italic">Sol abaixo do horizonte</span>
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
