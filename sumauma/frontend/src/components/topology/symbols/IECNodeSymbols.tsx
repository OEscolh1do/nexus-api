/**
 * IECNodeSymbols.tsx — SVG symbols for each TopologyNode kind.
 *
 * Each symbol renders within a 32×32 coordinate space.
 * Caller provides a <svg viewBox="0 0 32 32"> wrapper.
 *
 * Visual references: IEC 60617 / NBR 5410.
 * Corners are straight (butt/miter) per project standard.
 */

import React from 'react';
import type { NodeKind } from '@/lib/types/topology';

export interface SymbolProps {
  stroke: string;
  fill:   string;
  sw?:    number;
}

// ─── Individual symbols ───────────────────────────────────────────────────────

/** Photovoltaic panel — rectangle crossed diagonally (simplified IEC cell) */
export function PVPanelSymbol({ stroke, fill, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <rect x="3" y="9" width="26" height="14" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      <line x1="3" y1="23" x2="29" y2="9" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
      <line x1="12" y1="23" x2="20" y2="23" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="butt" />
    </>
  );
}

/** String of PV panels — three stacked cells */
export function PVStringSymbol({ stroke, fill, sw = 1.5 }: SymbolProps) {
  return (
    <>
      {[0, 7, 14].map(dy => (
        <g key={dy} transform={`translate(0, ${dy - 7})`}>
          <rect x="3" y="9" width="26" height="6" fill={fill} stroke={stroke} strokeWidth={sw * 0.8} strokeLinejoin="miter" />
          <line x1="3" y1="15" x2="29" y2="9" stroke={stroke} strokeWidth={sw * 0.8} strokeLinecap="butt" />
        </g>
      ))}
    </>
  );
}

/** String combiner / junction box — box with N inputs and 1 output */
export function StringCombinerSymbol({ stroke, fill, sw = 1.5, inputCount = 3 }: SymbolProps & { inputCount?: number }) {
  const boxX = 10, boxW = 14, boxY = 3, boxH = 26;
  const n = Math.min(inputCount, 6);
  const step = boxH / (n + 1);
  return (
    <>
      <rect x={boxX} y={boxY} width={boxW} height={boxH} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      {Array.from({ length: n }, (_, i) => {
        const y = boxY + step * (i + 1);
        return <line key={i} x1="0" y1={y} x2={boxX} y2={y} stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />;
      })}
      <line x1={boxX + boxW} y1="16" x2="32" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
    </>
  );
}

/** DPS (surge arrester) — zigzag arrow + discharge bar */
export function DPSSymbol({ stroke, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <polyline
        points="16,3 10,13 16,13 10,26"
        fill="none" stroke={stroke} strokeWidth={sw}
        strokeLinejoin="miter" strokeLinecap="butt"
      />
      <line x1="6"  y1="26" x2="26" y2="26" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="butt" />
      <line x1="9"  y1="29" x2="23" y2="29" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="butt" />
    </>
  );
}

/** Fuse — IEC: rectangle between two horizontal lines */
export function FuseSymbol({ stroke, fill, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <line x1="0"  y1="16" x2="8"  y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
      <rect x="8" y="10" width="16" height="12" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      <line x1="24" y1="16" x2="32" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
    </>
  );
}

/** MPPT input — labeled small block */
export function MPPTInputSymbol({ stroke, fill, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <rect x="6" y="8" width="20" height="16" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      <text x="16" y="19" textAnchor="middle" fontSize="6" fill={stroke} fontFamily="monospace" fontWeight="bold">
        MPPT
      </text>
    </>
  );
}

/** Inverter — rectangle with DC→AC wave symbol */
export function InverterSymbol({ stroke, fill, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <rect x="3" y="4" width="26" height="24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      {/* DC mark left */}
      <text x="6" y="13" fontSize="4.5" fill={stroke} fontFamily="monospace" fontWeight="bold">DC</text>
      {/* AC wave right */}
      <path
        d="M 14 20 Q 16.5 14 19 20 Q 21.5 26 24 20"
        fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="miter"
      />
      {/* divider */}
      <line x1="14" y1="4" x2="14" y2="28" stroke={stroke} strokeWidth={0.8} strokeLinecap="butt" strokeDasharray="2 2" />
    </>
  );
}

/** AC circuit breaker — IEC: switch blade inside box */
export function ACBreakerSymbol({ stroke, fill, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <line x1="0"  y1="16" x2="8"  y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
      <rect x="8" y="8" width="16" height="16" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
      {/* Switch blade diagonal */}
      <line x1="10" y1="22" x2="22" y2="10" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
      <line x1="24" y1="16" x2="32" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
    </>
  );
}

/** Energy meter — circle with kWh label */
export function MeterSymbol({ stroke, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <circle cx="16" cy="16" r="12" fill="none" stroke={stroke} strokeWidth={sw} />
      <text x="16" y="18.5" textAnchor="middle" fontSize="6" fill={stroke} fontFamily="monospace" fontWeight="bold">
        kWh
      </text>
      {/* Input and output ticks */}
      <line x1="0"  y1="16" x2="4"  y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
      <line x1="28" y1="16" x2="32" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
    </>
  );
}

/** Grid / utility connection — IEC earth symbol */
export function GridSymbol({ stroke, sw = 1.5 }: SymbolProps) {
  return (
    <>
      <line x1="16" y1="3"  x2="16" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="butt" />
      <line x1="4"  y1="16" x2="28" y2="16" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="butt" />
      <line x1="8"  y1="21" x2="24" y2="21" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="butt" />
      <line x1="12" y1="26" x2="20" y2="26" stroke={stroke} strokeWidth={sw + 0.5} strokeLinecap="butt" />
    </>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const SYMBOL_MAP: Partial<Record<NodeKind, (props: SymbolProps & { inputCount?: number; mpptCount?: number }) => React.ReactElement>> = {
  'pv-panel':        PVPanelSymbol,
  'pv-string':       PVStringSymbol,
  'string-combiner': StringCombinerSymbol,
  'dps-dc':          DPSSymbol,
  'dps-ac':          DPSSymbol,
  'fuse-dc':         FuseSymbol,
  'mppt-input':      MPPTInputSymbol,
  'inverter':        InverterSymbol,
  'ac-breaker':      ACBreakerSymbol,
  'meter':           MeterSymbol,
  'grid':            GridSymbol,
};

export interface IECNodeSymbolProps extends SymbolProps {
  kind:        NodeKind;
  inputCount?: number;
  mpptCount?:  number;
  size?:       number;  // rendered width/height in px; default 32
}

/** Renders the IEC symbol for a given NodeKind inside a square SVG. */
export function IECNodeSymbol({ kind, size = 32, ...rest }: IECNodeSymbolProps) {
  const Sym = SYMBOL_MAP[kind];
  if (!Sym) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      overflow="visible"
      style={{ display: 'block' }}
    >
      <Sym {...rest} />
    </svg>
  );
}
