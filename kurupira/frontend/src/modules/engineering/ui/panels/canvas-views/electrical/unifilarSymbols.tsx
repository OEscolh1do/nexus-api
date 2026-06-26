/**
 * unifilarSymbols — IEC 60617 SVG symbol components for UnifilarSchematicCanvas
 *
 * Extracted from UnifilarSchematicCanvas.tsx (H1).
 * Contains: SymbolCatalogDefs, all IEC symbol sub-components, wire renderer, label & marker layers.
 * All components are pure presentational (no local state).
 */

import React from 'react';
import type { InverterState, MPPTConfig } from '../../../../store/useTechStore';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import {
  type SchematicNode, type SchematicWire, type SchematicLabel, type SchematicMarker,
  type CSSV, getMpptColor,
} from './unifilarTypes';

// =============================================================================
// SYMBOL CATALOG — <defs> block injected into the SVG canvas
//    Each <symbol> uses CSS Custom Properties so callers control colour/weight
//    via style={{ '--s': mpptColor, '--sw': '1.4', ... } as CSSV} on <use>.
//
//    Radiation arrow coordinates (pre-computed in local space 0 0 62 46):
//      shaftLen=11, headSz=3.4, spacing=6.5, dir=(-1/√2, 1/√2), barbs=285°/345°
// =============================================================================

export const SymbolCatalogDefs: React.FC = () => (
  <>
    {/* ── sym-pv — IEC 60617 módulo/string fotovoltaica ──────────────────── */}
    {/* CSS vars: --s (stroke), --sw (stroke-width), --f (fill),              */}
    {/*           --rad (arrow color), --rad-op (arrow opacity)               */}
    <symbol id="sym-pv" viewBox="0 0 62 46">
      <rect width={62} height={46} rx={2}
        style={{ fill: 'var(--f,#0f172a)', stroke: 'var(--s,#475569)', strokeWidth: 'var(--sw,0.9)' } as CSSV} />
      <line x1={8} y1={38} x2={54} y2={8} strokeWidth={1} strokeLinecap="round"
        style={{ stroke: 'var(--s,#475569)' } as CSSV} />
      {/* 3 radiation arrows at 45° pointing lower-left */}
      <g style={{ opacity: 'var(--rad-op,0.75)' } as CSSV}>
        <line x1={42.7} y1={7.6}  x2={34.9} y2={15.4} strokeWidth={1.1} strokeLinecap="round" style={{ stroke: 'var(--rad,#34d399)' } as CSSV} />
        <polyline points="35.8,12.1 34.9,15.4 38.2,14.5" fill="none" strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: 'var(--rad,#34d399)' } as CSSV} />
        <line x1={47.3} y1={12.2} x2={39.5} y2={20.0} strokeWidth={1.1} strokeLinecap="round" style={{ stroke: 'var(--rad,#34d399)' } as CSSV} />
        <polyline points="40.4,16.7 39.5,20.0 42.8,19.1" fill="none" strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: 'var(--rad,#34d399)' } as CSSV} />
        <line x1={51.9} y1={16.8} x2={44.1} y2={24.6} strokeWidth={1.1} strokeLinecap="round" style={{ stroke: 'var(--rad,#34d399)' } as CSSV} />
        <polyline points="45.0,21.3 44.1,24.6 47.4,23.7" fill="none" strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: 'var(--rad,#34d399)' } as CSSV} />
      </g>
      {/* Terminal polarity marks — fixed per IEC convention */}
      <text x={3} y={9}  fill="#f87171" fontSize={8} fontFamily="monospace" fontWeight="bold" style={{ userSelect: 'none' }}>+</text>
      <text x={3} y={44} fill="#93c5fd" fontSize={8} fontFamily="monospace" fontWeight="bold" style={{ userSelect: 'none' }}>−</text>
    </symbol>

    {/* ── sym-fuse — IEC 60617 fusível CC classe gPV ──────────────────────── */}
    {/* CSS vars: --s (stroke/dots), --sw (stroke-width), --el (element line) */}
    <symbol id="sym-fuse" viewBox="0 0 22 13">
      <rect x={0} y={0} width={22} height={13} rx={2} fill="none"
        style={{ stroke: 'var(--s,#475569)', strokeWidth: 'var(--sw,0.8)' } as CSSV} />
      <line x1={3} y1={6.5} x2={19} y2={6.5} strokeWidth={0.8} strokeDasharray="2 1"
        style={{ stroke: 'var(--el,#47556999)' } as CSSV} />
      <circle cx={0}  cy={6.5} r={1.2} style={{ fill: 'var(--s,#475569)' } as CSSV} />
      <circle cx={22} cy={6.5} r={1.2} style={{ fill: 'var(--s,#475569)' } as CSSV} />
    </symbol>

    {/* ── sym-dps — IEC 61643 DPS Tipo II (triângulo varistor + terra) ───── */}
    {/* CSS vars: --s (stroke), --s-bg (triangle fill, translucent on hover)  */}
    <symbol id="sym-dps" viewBox="0 0 14 24">
      <line x1={7} y1={0}    x2={7}  y2={5.1}  strokeWidth={1.5} style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <polygon points="0,5.1 14,5.1 7,18.1" strokeWidth={1.5}
        style={{ fill: 'var(--s-bg,none)', stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={0} y1={20.1} x2={14} y2={20.1} strokeWidth={1.5} style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={7} y1={20.1} x2={7}  y2={12}   strokeWidth={1.5} style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={2}   y1={16} x2={12} y2={16}   strokeWidth={1.5} style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={4}   y1={19} x2={10} y2={19}   strokeWidth={1}   style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={6}   y1={22} x2={8}  y2={22}   strokeWidth={0.8} style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
    </symbol>

    {/* ── sym-dc-sw — IEC 60617 chave seccionadora CC (blade switch) ──────── */}
    {/* CSS vars: --s (all lines/dots)                                         */}
    <symbol id="sym-dc-sw" viewBox="0 0 16 16">
      <circle cx={0}  cy={8} r={2} style={{ fill: 'var(--s,#64748b)' } as CSSV} />
      <circle cx={16} cy={8} r={2} style={{ fill: 'var(--s,#64748b)' } as CSSV} />
      <line x1={0}   y1={8} x2={4.8}  y2={8}   strokeWidth={1.2} strokeLinecap="round" style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={4.8} y1={8} x2={10.4} y2={0.8} strokeWidth={1.2} strokeLinecap="round" style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <line x1={16}  y1={8} x2={12.8} y2={8}   strokeWidth={1.2} strokeLinecap="round" style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
    </symbol>

    {/* ── sym-ac-breaker — IEC 60617 disjuntor CA (círculo + diagonal) ───── */}
    {/* CSS vars: --s (stroke + diagonal), --sw (stroke-width), --f (fill)    */}
    <symbol id="sym-ac-breaker" viewBox="0 0 18 18">
      <circle cx={9} cy={9} r={7}
        style={{ fill: 'var(--f,#0f172a)', stroke: 'var(--s,#94a3b8)', strokeWidth: 'var(--sw,1.5)' } as CSSV} />
      <line x1={5.5} y1={12.5} x2={12.5} y2={5.5} strokeWidth={1.8} strokeLinecap="round"
        style={{ stroke: 'var(--s,#94a3b8)' } as CSSV} />
    </symbol>

    {/* ── sym-meter — Medidor bidirecional kWh (NT.020.EQTL Rev.05) ────────  */}
    {/* CSS vars: --s (stroke/text/arrows), --sw (stroke-width), --f (fill)   */}
    <symbol id="sym-meter" viewBox="0 0 22 22">
      <circle cx={11} cy={11} r={10}
        style={{ fill: 'var(--f,#0f172a)', stroke: 'var(--s,#64748b)', strokeWidth: 'var(--sw,1.2)' } as CSSV} />
      <text x={11} y={9} textAnchor="middle" dominantBaseline="middle"
        fontSize={5} fontFamily="monospace" fontWeight="bold"
        style={{ fill: 'var(--s,#64748b)', userSelect: 'none' } as CSSV}>kWh</text>
      <line x1={5.5} y1={14} x2={16.5} y2={14} strokeWidth={0.8}
        style={{ stroke: 'var(--s,#64748b)' } as CSSV} />
      <polygon points="16.5,14 14,12.5 14,15.5" style={{ fill: 'var(--s,#64748b)' } as CSSV} />
      <polygon points="5.5,14 8,12.5 8,15.5"    style={{ fill: 'var(--s,#64748b)' } as CSSV} />
    </symbol>

    {/* ── sym-earth — IEC 60617-2 terra de proteção (3 barras decrescentes) ─ */}
    {/* CSS vars: --s (stroke color)                                           */}
    <symbol id="sym-earth" viewBox="0 0 16 12">
      <line x1={0}   y1={0} x2={16}  y2={0} strokeWidth={1.5} strokeLinecap="round" style={{ stroke: 'var(--s,#22c55e)' } as CSSV} />
      <line x1={2.5} y1={4} x2={13.5} y2={4} strokeWidth={1.5} strokeLinecap="round" style={{ stroke: 'var(--s,#22c55e)' } as CSSV} />
      <line x1={5}   y1={8} x2={11}  y2={8} strokeWidth={1.5} strokeLinecap="round" style={{ stroke: 'var(--s,#22c55e)' } as CSSV} />
    </symbol>
  </>
);

// =============================================================================
// IEC 60617 SYMBOL SUB-COMPONENTS
// =============================================================================

// ── PV String ─────────────────────────────────────────────────────────────────
export const PVStringSymbol = React.memo<{
  node: SchematicNode;
  isHovered: boolean; isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}>(({ node, isHovered, isSelected, onHover, onSelect }) => {
  if (node.data.type !== 'pv-string') return null;
  const { string, mpptColor, unitPmax, moduleModel } = node.data;
  const stroke  = isSelected ? '#6366f1' : isHovered ? mpptColor : '#475569';
  const strokeW = isHovered || isSelected ? 1.4 : 0.9;
  const { x, y, w, h } = node;

  const nameLabel  = string.name || 'STR';
  const unitWp     = unitPmax > 0 ? Math.round(unitPmax) : 0;
  const totalKwp   = unitPmax > 0 && string.modulesCount > 0
    ? (string.modulesCount * unitPmax / 1000).toFixed(2) : null;
  const shortModel = moduleModel
    ? (moduleModel.length > 11 ? moduleModel.substring(0, 10) + '…' : moduleModel) : null;

  return (
    <g
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(node.id)}
      onPointerDown={e => e.stopPropagation()}
      style={{ cursor: 'pointer' }}
    >
      <use href="#sym-pv" x={x} y={y} width={w} height={h}
        style={{ '--s': stroke, '--sw': strokeW, '--rad': mpptColor, '--rad-op': isHovered ? 1 : 0.75 } as CSSV} />
      <text x={x + w / 2} y={y - 5}
        textAnchor="middle" fill={mpptColor}
        fontSize={7.5} fontFamily="monospace" fontWeight="bold"
        style={{ userSelect: 'none' }}>
        {nameLabel}
      </text>
      {string.modulesCount > 0 && (
        <text x={x + w / 2} y={y + h + 11}
          textAnchor="middle" fill={unitWp > 0 ? '#e2e8f0' : '#64748b'}
          fontSize={6.5} fontFamily="monospace"
          style={{ userSelect: 'none' }}>
          {string.modulesCount} × {unitWp > 0 ? `${unitWp} Wp` : ''}
        </text>
      )}
      {totalKwp && (
        <text x={x + w / 2} y={y + h + 21}
          textAnchor="middle" fill="#64748b"
          fontSize={6} fontFamily="monospace"
          style={{ userSelect: 'none' }}>
          = <tspan fill="#34d399">{totalKwp} kWp</tspan>{shortModel ? ` · ${shortModel}` : ''}
        </text>
      )}
    </g>
  );
}, (prev, next) => {
  if (prev.node.id !== next.node.id) return false;
  if (prev.isHovered !== next.isHovered) return false;
  if (prev.isSelected !== next.isSelected) return false;
  // Type-safe comparisons for pv-string specific data
  if (prev.node.data.type === 'pv-string' && next.node.data.type === 'pv-string') {
    return prev.node.data.string?.name === next.node.data.string?.name &&
           prev.node.data.string?.modulesCount === next.node.data.string?.modulesCount &&
           prev.node.data.mpptColor === next.node.data.mpptColor;
  }
  return true;
});

// ── DC Fuse ───────────────────────────────────────────────────────────────────
export const FuseSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  if (node.data.type !== 'fuse') return null;
  const { mpptColor } = node.data;
  const color          = isActive ? mpptColor : '#475569';
  const fuseElemColor  = isActive ? `${mpptColor}99` : '#47556999';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <use href="#sym-fuse" x={node.x} y={node.y} width={node.w} height={node.h}
        style={{ '--s': color, '--sw': isActive ? 1.2 : 0.8, '--el': fuseElemColor } as CSSV} />
    </g>
  );
};

// ── Bus Bar ───────────────────────────────────────────────────────────────────
export const BusBarSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  if (node.data.type !== 'bus-bar') return null;
  const { mpptColor } = node.data;
  const cx = node.x + node.w / 2;
  const busColor = isActive ? mpptColor : '#94a3b8';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <line x1={cx - 4} y1={node.y} x2={cx + 4} y2={node.y}
        stroke={busColor} strokeWidth={1} strokeLinecap="square" />
      <line x1={cx - 4} y1={node.y + node.h} x2={cx + 4} y2={node.y + node.h}
        stroke={busColor} strokeWidth={1} strokeLinecap="square" />
      <line x1={cx} y1={node.y} x2={cx} y2={node.y + node.h}
        stroke={busColor} strokeWidth={2} strokeLinecap="square" />
      <circle cx={cx} cy={node.y + node.h / 2} r={2.5}
        fill="#0f172a" stroke={isActive ? mpptColor : '#6366f1'} strokeWidth={1} />
    </g>
  );
};

// ── DPS (IEC 60364-5-54 / IEC 61643) ─────────────────────────────────────────
export const DPSSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const color  = isActive ? '#f59e0b' : '#64748b';
  const triBg  = isActive ? 'rgba(245,158,11,0.15)' : 'none';
  const cx     = node.x + node.w / 2;
  const midY   = node.y + node.h * 0.38;
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <use href="#sym-dps" x={node.x} y={node.y} width={node.w} height={node.h}
        style={{ '--s': color, '--s-bg': triBg } as CSSV} />
      {/* ±PE label — posicionado externamente pois ultrapassa o viewBox do símbolo */}
      <text x={cx + 9} y={midY + 5}
        fill={isActive ? '#f59e0b80' : '#47556960'} fontSize={5.5} fontFamily="monospace"
        style={{ userSelect: 'none' }}>±PE</text>
    </g>
  );
};

// ── DC Disconnect Switch (IEC 60617) ─────────────────────────────────────────
export const DCSwitchSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const color = isActive ? '#f59e0b' : '#64748b';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <use href="#sym-dc-sw" x={node.x} y={node.y} width={node.w} height={node.h}
        style={{ '--s': color } as CSSV} />
      <text x={node.x + node.w / 2} y={node.y + node.h + 7}
        textAnchor="middle" fill="#475569" fontSize={6} fontFamily="monospace"
        style={{ userSelect: 'none' }}>CC</text>
    </g>
  );
};

// ── Inverter Block (G1, G3, G5) ──────────────────────────────────────────────
export const InverterSchematicBlock: React.FC<{
  node: SchematicNode; isHovered: boolean; onSelect: (id: string) => void;
}> = ({ node, isHovered, onSelect }) => {
  const { inverter, catalogItem, mpptCount } = node.data as {
    inverter: InverterState;
    catalogItem: InverterCatalogItem | undefined;
    mpptCount: number;
  };
  // G3: AC port offset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acOffset = (catalogItem as any)?.symbolConfig?.ports?.['ac_out']?.offset;
  const acPortY = acOffset != null ? node.y + acOffset * node.h : node.y + node.h / 2;

  return (
    <g onPointerDown={e => e.stopPropagation()}
       onClick={() => onSelect(node.id)}
       style={{ cursor: 'pointer' }}>
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={2}
        fill="#0f172a" stroke={isHovered ? '#60a5fa' : '#334155'} strokeWidth={1.5}
        filter={isHovered ? 'url(#inverter-glow-svg)' : undefined} />
      <line x1={node.x} y1={node.y + node.h} x2={node.x + node.w} y2={node.y}
        stroke="#1e293b" strokeWidth={1} opacity={0.8} />
      {/* DC input indicator on left */}
      <g transform={`translate(${node.x + 16}, ${node.y + 14})`}>
        <line x1={-5} y1={-2} x2={5} y2={-2} stroke="#475569" strokeWidth={1.2} />
        <line x1={-5} y1={2}  x2={5} y2={2}  stroke="#475569" strokeWidth={1.2} />
      </g>
      {/* AC output indicator on right */}
      <g transform={`translate(${node.x + node.w - 16}, ${node.y + node.h - 14})`}>
        <path d="M-5,0 C-5,-4 -1.5,-4 0,0 C1.5,4 5,4 5,0"
          fill="none" stroke="#94a3b8" strokeWidth={1.2} />
        <text x={-12} y={1} fill="#94a3b8" fontSize={7} fontWeight="bold" textAnchor="end">~</text>
      </g>
      <text x={node.x + node.w / 2} y={node.y + node.h / 2 - 4}
        textAnchor="middle" dominantBaseline="middle"
        fill="#475569" fontSize={11} fontWeight="bold" fontFamily="monospace">
        {catalogItem?.model || inverter.snapshot.model}
      </text>
      <text x={node.x + node.w / 2} y={node.y + node.h / 2 + 9}
        textAnchor="middle" dominantBaseline="middle"
        fill="#94a3b8" fontSize={9} fontFamily="monospace">
        {catalogItem?.nominalPowerW ? `${(catalogItem.nominalPowerW / 1000).toFixed(1)} kW` : ''}
      </text>
      {(() => {
        const symbolConfig = catalogItem?.symbolConfig;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const footprintChannels = (catalogItem as any)?.blockDiagramFootprint?.mpptChannels;

        return inverter.mpptConfigs.map((mppt: MPPTConfig, idx: number) => {
          const posPortKey = `mppt_${mppt.mpptId}_pos`;
          const symbolPort = symbolConfig?.ports?.[posPortKey];
          const portY = symbolPort
            ? node.y + symbolPort.offset * node.h
            : node.y + (node.h / (mpptCount + 1)) * (idx + 1);
          const portLabel = symbolPort?.label ?? `M${mppt.mpptId}`;
          const color = getMpptColor(idx);

          // G1: Multi-input sub-ports
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const footprintChannel = footprintChannels?.find((ch: any) => ch.mpptIndex === mppt.mpptId);
          const inputCount = Math.max(1, footprintChannel?.inputCount ?? 1);
          const PIN_SPAN = Math.min(12, (inputCount - 1) * 5);

          if (inputCount > 1) {
            const subPortYs = Array.from({ length: inputCount }, (_, j) =>
              portY + (j / Math.max(1, inputCount - 1) - 0.5) * 2 * PIN_SPAN
            );
            // SWEEP8-AREA8 fix: guard against sub-ports exceeding inverter block bounds
            const minSubPortY = Math.min(...subPortYs);
            const maxSubPortY = Math.max(...subPortYs);
            const portOverflow = minSubPortY < node.y || maxSubPortY > node.y + node.h;
            if (portOverflow) {
              console.warn(`[UnifilarSchematic] MPPT ${mppt.mpptId} sub-ports exceed inverter block bounds — consider reducing inputCount or increasing block height`);
            }
            return (
              <g key={mppt.mpptId}>
                <line x1={node.x - 8} y1={subPortYs[0]} x2={node.x - 8} y2={subPortYs[inputCount - 1]}
                  stroke={color} strokeWidth={1} />
                {subPortYs.map((spY, j) => (
                  <g key={j}>
                    <polygon
                      points={`${node.x - 5},${spY - 3} ${node.x - 5},${spY + 3} ${node.x},${spY}`}
                      fill={color} stroke="none" />
                    <circle cx={node.x} cy={spY} r={2.5}
                      fill="#0f172a" stroke={color} strokeWidth={1.5} />
                    <text x={node.x + 4} y={spY} dominantBaseline="middle"
                      fill={color} fontSize={5} fontFamily="monospace" fontWeight="bold">
                      {footprintChannel?.inputLabels?.[j] ?? `PV${j+1}`}
                    </text>
                  </g>
                ))}
                <text x={node.x + 6} y={portY - PIN_SPAN - 4} dominantBaseline="middle"
                  fill={color} fontSize={6} fontFamily="monospace" fontWeight="bold">
                  {portLabel}
                </text>
              </g>
            );
          } else {
            return (
              <g key={mppt.mpptId}>
                <line x1={node.x - 12} y1={portY} x2={node.x} y2={portY}
                  stroke={color} strokeWidth={1.5} />
                <polygon
                  points={`${node.x - 7},${portY - 4} ${node.x - 7},${portY + 4} ${node.x},${portY}`}
                  fill={color} stroke="none" />
                <circle cx={node.x} cy={portY} r={3.5}
                  fill="#0f172a" stroke={color} strokeWidth={1.5} />
                <text x={node.x + 6} y={portY} dominantBaseline="middle"
                  fill={color} fontSize={6} fontFamily="monospace" fontWeight="bold">
                  {portLabel}
                </text>
              </g>
            );
          }
        });
      })()}
      {/* AC port (G3) */}
      <circle cx={node.x + node.w} cy={acPortY} r={4}
        fill="#0f172a" stroke="#94a3b8" strokeWidth={1.5} />
      <circle cx={node.x + node.w / 2} cy={node.y + node.h} r={3}
        fill="#0f172a" stroke="#22c55e" strokeWidth={1.5} />
    </g>
  );
};

// ── AC Breaker ────────────────────────────────────────────────────────────────
export const ACBreakerSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const color = isActive ? '#e2e8f0' : '#94a3b8';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <use href="#sym-ac-breaker" x={node.x} y={node.y} width={node.w} height={node.h}
        style={{ '--s': color, '--sw': isActive ? 2 : 1.5 } as CSSV} />
    </g>
  );
};

// ── Medidor bidirecional (kWh) ────────────────────────────────────────────────
export const BidirectionalMeterSymbol: React.FC<{ node: SchematicNode; isActive: boolean; onSelect: (id: string) => void }> = ({ node, isActive, onSelect }) => {
  const color = isActive ? '#a78bfa' : '#64748b';
  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <use href="#sym-meter" x={node.x} y={node.y} width={node.w} height={node.h}
        style={{ '--s': color, '--sw': isActive ? 1.6 : 1.2 } as CSSV} />
    </g>
  );
};

// ── Grid Symbol ───────────────────────────────────────────────────────────────
export const GridSymbol: React.FC<{ node: SchematicNode; onSelect: (id: string) => void }> = ({ node, onSelect }) => {
  if (node.data.type !== 'grid') return null;
  const phase = node.data.phase;
  const lines = phase === 'tri' ? 3 : 1;
  const sinW = node.w - 8;
  const x0 = node.x + 8;
  const groupH = (lines - 1) * 13 + 12;
  const groupStartY = node.y + (node.h - groupH) / 2;

  return (
    <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
      <circle cx={node.x} cy={node.y + node.h / 2} r={4}
        fill="#0f172a" stroke="#94a3b8" strokeWidth={1.5} />
      {Array.from({ length: lines }).map((_, i) => {
        const midY = groupStartY + i * 13 + 6;
        const hw = sinW / 2;
        return (
          <path key={i}
            d={`M ${x0} ${midY} C ${x0+hw*0.3} ${midY-6} ${x0+hw*0.7} ${midY-6} ${x0+hw} ${midY} C ${x0+hw*1.3} ${midY+6} ${x0+hw*1.7} ${midY+6} ${x0+sinW} ${midY}`}
            fill="none" stroke="#94a3b8" strokeWidth={1.2} />
        );
      })}
      <text x={node.x + node.w / 2 + 4} y={node.y + node.h + 9}
        textAnchor="middle" fill="#64748b" fontSize={6.5}
        fontFamily="monospace" fontWeight="bold">
        {phase === 'tri' ? '3φ' : '1φ'} REDE
      </text>
    </g>
  );
};

// ── Earth Symbol (IEC 60617-2) ────────────────────────────────────────────────
export const EarthSymbol: React.FC<{ node: SchematicNode }> = ({ node }) => {
  const cx = node.x + node.w / 2;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <use href="#sym-earth" x={cx - 8} y={node.y} width={16} height={12}
        style={{ '--s': '#22c55e' } as CSSV} />
    </g>
  );
};

// =============================================================================
// RENDERING LAYERS
// =============================================================================

// ── Wire Renderer ─────────────────────────────────────────────────────────────
export const SchematicWireRenderer = React.memo<{
  wire: SchematicWire; isActive: boolean; dimmed?: boolean;
}>(({ wire, isActive, dimmed }) => {
  // Guard: skip rendering if path is empty or malformed
  if (!wire.path || wire.path.trim().length === 0) return null;

  const color =
    wire.polarity === 'gnd' ? '#22c55e' :
    wire.polarity === 'ac'  ? '#94a3b8' :
    getMpptColor(wire.mpptIdx);
  const strokeWidth =
    wire.polarity === 'gnd' ? (isActive ? 1.2 : 0.8) :
    wire.polarity === 'ac'  ? (isActive ? 1.8 : 1.4) :
    (isActive ? 1.6 : 1.2);
  // A: flow animation when wire is active (hovered circuit path)
  const isFlowing = isActive && wire.polarity !== 'gnd';
  // A: arrowhead at path end for DC and AC wires (shows current direction)
  const hasArrow = wire.polarity !== 'gnd';
  // SWEEP13-AREA1 fix: AC wires use dashed stroke per IEC 60617 / NBR 16690 distinction
  // AC conductors: dashed '6 4' (longer dash than ground's '4 3')
  // DC conductors: solid (no dash)
  // Ground: dashed '4 3' (shorter dash)
  const dashArray = isFlowing ? '10 5' :
    wire.polarity === 'gnd' ? '4 3' :
    wire.polarity === 'ac' ? '6 4' :
    undefined;
  return (
    <path d={wire.path} stroke={color}
      strokeWidth={strokeWidth} fill="none"
      strokeDasharray={dashArray}
      strokeLinecap="round"
      strokeLinejoin="round"
      markerEnd={hasArrow ? 'url(#arrowhead)' : undefined}
      opacity={dimmed ? 0.08 : isActive ? 1 : 0.65}
      style={{
        transition: 'stroke-width 0.1s, opacity 0.15s',
        ...(isFlowing ? { animation: 'schematic-flow 0.7s linear infinite' } : {}),
      }}
    />
  );
}, (prev, next) =>
  prev.wire.id === next.wire.id &&
  prev.wire.path === next.wire.path &&
  prev.isActive === next.isActive &&
  prev.dimmed === next.dimmed
);

// ── Wire / Node Labels ────────────────────────────────────────────────────────
// L3-H1: adiciona zoom prop para ajustar fontSize
export const LabelLayer: React.FC<{ labels: SchematicLabel[]; showElectrical: boolean; zoom?: number }> = ({ labels, showElectrical, zoom = 1 }) => (
  <>
    {labels.filter(lbl => {
      if (lbl.category === 'electrical') return showElectrical;
      return true;
    }).map(lbl => {
      // BUG-01 fix: Designator labels must never be hidden regardless of zoom
      const isDesignator = lbl.category === 'designator' || /^[A-Z]+\d/.test(lbl.text);
      // A2 fix: ajuste mais agressivo + oculta labels pequenas em zoom extremo (EXCEPT designators)
      if (!isDesignator && zoom < 0.25 && lbl.fontSize < 7) return null;
      const adjustedFontSize = Math.max(
        5,
        lbl.fontSize / Math.max(1, zoom / 1.5)
      );
      return (
        <text
          key={lbl.id}
          x={lbl.x} y={lbl.y}
          textAnchor={lbl.anchor}
          dominantBaseline="auto"
          fill={lbl.color}
          fontSize={adjustedFontSize}
          fontFamily="monospace"
          fontWeight={lbl.bold ? 'bold' : 'normal'}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
          transform={lbl.rotate ? `rotate(${lbl.rotate}, ${lbl.x}, ${lbl.y})` : undefined}
        >
          {lbl.text}
        </text>
      );
    })}
  </>
);

// ── Validation Markers ────────────────────────────────────────────────────────
export const ValidationMarker: React.FC<{
  marker: SchematicMarker;
  onSelect: (id: string) => void;
}> = ({ marker, onSelect }) => {
  const isError = marker.severity === 'error';
  const color = isError ? '#ef4444' : '#f59e0b';
  const r = 8;
  return (
    <g onClick={() => onSelect(marker.id)} style={{ cursor: 'pointer' }}>
      {/* L3-H3: tooltip com mensagens de validação */}
      <title>{marker.messages.join(' | ')}</title>
      {isError ? (
        <>
          <circle cx={marker.x} cy={marker.y} r={r}
            fill="#0f172a" stroke={color} strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
          <line x1={marker.x - 4} y1={marker.y - 4} x2={marker.x + 4} y2={marker.y + 4}
            stroke={color} strokeWidth={1.8} />
          <line x1={marker.x + 4} y1={marker.y - 4} x2={marker.x - 4} y2={marker.y + 4}
            stroke={color} strokeWidth={1.8} />
        </>
      ) : (
        <>
          <polygon
            points={`${marker.x},${marker.y - r} ${marker.x - r},${marker.y + r * 0.6} ${marker.x + r},${marker.y + r * 0.6}`}
            fill="#0f172a" stroke={color} strokeWidth={1.5}
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
          <text x={marker.x} y={marker.y + r * 0.4}
            textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize={8} fontWeight="bold" fontFamily="monospace">!</text>
        </>
      )}
    </g>
  );
};
