/**
 * symbolEditorCatalog — TOOLS, CATALOG, THEMES, THEME_LABELS
 *
 * Extracted from SymbolEditorCanvas.tsx (H2).
 * Pure data — no React runtime dependencies except icon components.
 */

import React from 'react';
import {
  MousePointer2, Minus, Square, Circle, Pencil, Hexagon, Spline, Type,
} from 'lucide-react';
import type { ToolMode, SymbolDef, ThemeKey } from './symbolEditorTypes';

export const TOOLS: { mode: ToolMode; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { mode: 'SELECT',   label: 'Sel',  Icon: MousePointer2 },
  { mode: 'LINE',     label: 'Lin',  Icon: Minus         },
  { mode: 'RECT',     label: 'Ret',  Icon: Square        },
  { mode: 'CIRCLE',   label: 'Circ', Icon: Circle        },
  { mode: 'POLYLINE', label: 'Poly', Icon: Pencil        },
  { mode: 'POLYGON',  label: 'Pgon', Icon: Hexagon       },
  { mode: 'PATH',     label: 'Path', Icon: Spline        },
  { mode: 'TEXT',     label: 'Text', Icon: Type          },
];

export const CATALOG: SymbolDef[] = [
  {
    id: 'sym-pv', label: 'Módulo PV', norm: 'IEC 60617-11 / NBR 16690',
    vbW: 62, vbH: 46,
    cssVars: [
      { name: '--s',      label: 'stroke',       default: '#475569' },
      { name: '--sw',     label: 'stroke-width',  default: '0.9' },
      { name: '--f',      label: 'fill (fundo)',  default: '#0f172a' },
      { name: '--rad',    label: 'setas radiaç.', default: '#34d399' },
      { name: '--rad-op', label: 'opac. setas',   default: '0.75' },
    ],
    elements: [
      { id: 'pv-rect', tag: 'rect', x: 0, y: 0, w: 62, h: 46, rx: 2, varFill: 'var(--f,#0f172a)', varStroke: 'var(--s,#475569)', varSw: 'var(--sw,0.9)' },
      { id: 'pv-diag', tag: 'line', x1: 8, y1: 38, x2: 54, y2: 8, sw: 1, scap: 'round', varStroke: 'var(--s,#475569)' },
      {
        id: 'pv-rad', tag: 'g', varOpacity: 'var(--rad-op,0.75)', children: [
          { id: 'pv-ra-l', tag: 'line', x1: 42.7, y1: 7.6,  x2: 34.9, y2: 15.4, sw: 1.1, scap: 'round', varStroke: 'var(--rad,#34d399)' },
          { id: 'pv-ra-h', tag: 'polyline', pts: [[35.8,12.1],[34.9,15.4],[38.2,14.5]], fill: 'none', sw: 1.1, scap: 'round', sjoin: 'round', varStroke: 'var(--rad,#34d399)' },
          { id: 'pv-rb-l', tag: 'line', x1: 47.3, y1: 12.2, x2: 39.5, y2: 20.0, sw: 1.1, scap: 'round', varStroke: 'var(--rad,#34d399)' },
          { id: 'pv-rb-h', tag: 'polyline', pts: [[40.4,16.7],[39.5,20.0],[42.8,19.1]], fill: 'none', sw: 1.1, scap: 'round', sjoin: 'round', varStroke: 'var(--rad,#34d399)' },
          { id: 'pv-rc-l', tag: 'line', x1: 51.9, y1: 16.8, x2: 44.1, y2: 24.6, sw: 1.1, scap: 'round', varStroke: 'var(--rad,#34d399)' },
          { id: 'pv-rc-h', tag: 'polyline', pts: [[45.0,21.3],[44.1,24.6],[47.4,23.7]], fill: 'none', sw: 1.1, scap: 'round', sjoin: 'round', varStroke: 'var(--rad,#34d399)' },
        ],
      },
      { id: 'pv-plus',  tag: 'text', x: 3, y: 9,  fill: '#f87171', fontSize: 8, fontWeight: 'bold', text: '+' },
      { id: 'pv-minus', tag: 'text', x: 3, y: 44, fill: '#93c5fd', fontSize: 8, fontWeight: 'bold', text: '−' },
    ],
  },
  {
    id: 'sym-fuse', label: 'Fusível gPV', norm: 'IEC 60617 / NBR 16690 §5.3',
    vbW: 22, vbH: 13,
    cssVars: [
      { name: '--s',  label: 'stroke',         default: '#475569' },
      { name: '--sw', label: 'stroke-width',   default: '0.8' },
      { name: '--el', label: 'elem. interno',  default: '#47556999' },
    ],
    elements: [
      { id: 'fuse-rect', tag: 'rect', x: 0, y: 0, w: 22, h: 13, rx: 2, fill: 'none', varStroke: 'var(--s,#475569)', varSw: 'var(--sw,0.8)' },
      { id: 'fuse-elem', tag: 'line', x1: 3, y1: 6.5, x2: 19, y2: 6.5, sw: 0.8, sdash: '2 1', varStroke: 'var(--el,#47556999)' },
      { id: 'fuse-t1',   tag: 'circle', cx: 0,  cy: 6.5, r: 1.2, varFill: 'var(--s,#475569)' },
      { id: 'fuse-t2',   tag: 'circle', cx: 22, cy: 6.5, r: 1.2, varFill: 'var(--s,#475569)' },
    ],
  },
  {
    id: 'sym-dps', label: 'DPS Tipo II', norm: 'IEC 61643-11 / NBR 16690 §5.5',
    vbW: 14, vbH: 24,
    cssVars: [
      { name: '--s',    label: 'stroke',          default: '#64748b' },
      { name: '--s-bg', label: 'fill triângulo',  default: 'none' },
    ],
    elements: [
      { id: 'dps-top',  tag: 'line',    x1: 7, y1: 0,    x2: 7,  y2: 5.1,  sw: 1.5, varStroke: 'var(--s,#64748b)' },
      { id: 'dps-tri',  tag: 'polygon', pts: [[0,5.1],[14,5.1],[7,18.1]],   sw: 1.5, varFill: 'var(--s-bg,none)', varStroke: 'var(--s,#64748b)' },
      { id: 'dps-base', tag: 'line',    x1: 0, y1: 20.1, x2: 14, y2: 20.1, sw: 1.5, varStroke: 'var(--s,#64748b)' },
      { id: 'dps-gnd',  tag: 'line',    x1: 7, y1: 20.1, x2: 7,  y2: 12,   sw: 1.5, varStroke: 'var(--s,#64748b)' },
      { id: 'dps-e1',   tag: 'line',    x1: 2, y1: 16,   x2: 12, y2: 16,   sw: 1.5, varStroke: 'var(--s,#64748b)' },
      { id: 'dps-e2',   tag: 'line',    x1: 4, y1: 19,   x2: 10, y2: 19,   sw: 1,   varStroke: 'var(--s,#64748b)' },
      { id: 'dps-e3',   tag: 'line',    x1: 6, y1: 22,   x2: 8,  y2: 22,   sw: 0.8, varStroke: 'var(--s,#64748b)' },
    ],
  },
  {
    id: 'sym-dc-sw', label: 'Seccionador CC', norm: 'IEC 60617-7 / NBR 16690 §5.4',
    vbW: 16, vbH: 16,
    cssVars: [
      { name: '--s', label: 'stroke / fill', default: '#64748b' },
    ],
    elements: [
      { id: 'sw-t1',    tag: 'circle', cx: 0,  cy: 8, r: 2,   varFill: 'var(--s,#64748b)' },
      { id: 'sw-t2',    tag: 'circle', cx: 16, cy: 8, r: 2,   varFill: 'var(--s,#64748b)' },
      { id: 'sw-stub1', tag: 'line',   x1: 0,   y1: 8, x2: 4.8,  y2: 8,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#64748b)' },
      { id: 'sw-blade', tag: 'line',   x1: 4.8, y1: 8, x2: 10.4, y2: 0.8, sw: 1.2, scap: 'round', varStroke: 'var(--s,#64748b)' },
      { id: 'sw-stub2', tag: 'line',   x1: 16,  y1: 8, x2: 12.8, y2: 8,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#64748b)' },
    ],
  },
  {
    id: 'sym-ac-breaker', label: 'Disjuntor CA', norm: 'IEC 60617-7 / NBR 5410 §6.3',
    vbW: 18, vbH: 18,
    cssVars: [
      { name: '--s',  label: 'stroke',       default: '#94a3b8' },
      { name: '--sw', label: 'stroke-width', default: '1.5' },
      { name: '--f',  label: 'fill (fundo)', default: '#0f172a' },
    ],
    elements: [
      { id: 'dj-body', tag: 'circle', cx: 9, cy: 9, r: 7,   varFill: 'var(--f,#0f172a)', varStroke: 'var(--s,#94a3b8)', varSw: 'var(--sw,1.5)' },
      { id: 'dj-diag', tag: 'line',   x1: 5.5, y1: 12.5, x2: 12.5, y2: 5.5, sw: 1.8, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
    ],
  },
  {
    id: 'sym-meter', label: 'Medidor Bidirecional', norm: 'NT.020.EQTL Rev.05 §4.2',
    vbW: 22, vbH: 22,
    cssVars: [
      { name: '--s',  label: 'stroke / texto', default: '#64748b' },
      { name: '--sw', label: 'stroke-width',   default: '1.2' },
      { name: '--f',  label: 'fill (fundo)',   default: '#0f172a' },
    ],
    elements: [
      { id: 'mt-body',  tag: 'circle',  cx: 11, cy: 11, r: 10, varFill: 'var(--f,#0f172a)', varStroke: 'var(--s,#64748b)', varSw: 'var(--sw,1.2)' },
      { id: 'mt-label', tag: 'text',    x: 11,  y: 9,   fontSize: 5, fontWeight: 'bold', anchor: 'middle', baseline: 'middle', text: 'kWh', varFill: 'var(--s,#64748b)' },
      { id: 'mt-line',  tag: 'line',    x1: 5.5, y1: 14, x2: 16.5, y2: 14, sw: 0.8, varStroke: 'var(--s,#64748b)' },
      { id: 'mt-arr-r', tag: 'polygon', pts: [[16.5,14],[14,12.5],[14,15.5]], varFill: 'var(--s,#64748b)' },
      { id: 'mt-arr-l', tag: 'polygon', pts: [[5.5,14],[8,12.5],[8,15.5]],   varFill: 'var(--s,#64748b)' },
    ],
  },
  {
    id: 'sym-earth', label: 'Terra PE', norm: 'IEC 60617-2 / NBR 5410 §6.1',
    vbW: 16, vbH: 12,
    cssVars: [
      { name: '--s', label: 'stroke (barras)', default: '#22c55e' },
    ],
    elements: [
      { id: 'ea-b1', tag: 'line', x1: 0,   y1: 0, x2: 16,   y2: 0, sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
      { id: 'ea-b2', tag: 'line', x1: 2.5, y1: 4, x2: 13.5, y2: 4, sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
      { id: 'ea-b3', tag: 'line', x1: 5,   y1: 8, x2: 11,   y2: 8, sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
    ],
  },
  {
    id: 'sym-earth-general', label: 'Terra Geral', norm: 'IEC 60617-2 ref. 02-15-02',
    vbW: 16, vbH: 16,
    cssVars: [
      { name: '--s', label: 'stroke', default: '#22c55e' },
    ],
    elements: [
      { id: 'eg-stem',   tag: 'line',    x1: 8,   y1: 0,    x2: 8,    y2: 4,    sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
      { id: 'eg-circle', tag: 'circle',  cx: 8,   cy: 10,   r: 6,     sw: 1.5,  fill: 'none', varStroke: 'var(--s,#22c55e)' },
      { id: 'eg-b1',     tag: 'line',    x1: 3,   y1: 7.5,  x2: 13,   y2: 7.5,  sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
      { id: 'eg-b2',     tag: 'line',    x1: 5,   y1: 11,   x2: 11,   y2: 11,   sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
      { id: 'eg-b3',     tag: 'line',    x1: 7,   y1: 14.5, x2: 9,    y2: 14.5, sw: 1.5, scap: 'round', varStroke: 'var(--s,#22c55e)' },
    ],
  },
  {
    id: 'sym-earth-chassis', label: 'Terra Chassi', norm: 'IEC 60617-2 ref. 02-15-03',
    vbW: 14, vbH: 9,
    cssVars: [
      { name: '--s', label: 'stroke', default: '#94a3b8' },
    ],
    elements: [
      { id: 'ec-stem', tag: 'line', x1: 7,    y1: 0,   x2: 7,    y2: 2,   sw: 1.5, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'ec-bar',  tag: 'line', x1: 0,    y1: 2,   x2: 14,   y2: 2,   sw: 1.5, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'ec-d1',   tag: 'line', x1: 2,    y1: 2,   x2: 0,    y2: 5,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'ec-d2',   tag: 'line', x1: 5,    y1: 2,   x2: 3,    y2: 5,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'ec-d3',   tag: 'line', x1: 8,    y1: 2,   x2: 6,    y2: 5,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'ec-d4',   tag: 'line', x1: 11,   y1: 2,   x2: 9,    y2: 5,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'ec-d5',   tag: 'line', x1: 14,   y1: 2,   x2: 12,   y2: 5,   sw: 1.2, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
    ],
  },
  {
    id: 'sym-inverter-body', label: 'Inversor CC/CA', norm: 'IEC 60617 / NBR 16690 §4',
    vbW: 24, vbH: 24,
    cssVars: [
      { name: '--s',  label: 'stroke / texto', default: '#64748b' },
      { name: '--sw', label: 'stroke-width',   default: '1.2' },
      { name: '--f',  label: 'fill (fundo)',   default: '#0f172a' },
    ],
    elements: [
      { id: 'inv-body', tag: 'rect',    x: 2,    y: 2,    w: 20,   h: 20,   rx: 1,
        varFill: 'var(--f,#0f172a)', varStroke: 'var(--s,#64748b)', varSw: 'var(--sw,1.2)' },
      { id: 'inv-diag', tag: 'line',    x1: 2,   y1: 2,   x2: 22,  y2: 22,
        scap: 'round', varStroke: 'var(--s,#64748b)', varSw: 'var(--sw,1.2)' },
      { id: 'inv-dc-1', tag: 'line', x1: 5,  y1: 11, x2: 10, y2: 11, sw: 1.2, scap: 'round', varStroke: 'var(--s,#64748b)' },
      { id: 'inv-dc-2', tag: 'line', x1: 5,  y1: 14, x2: 10, y2: 14, sw: 1.2, scap: 'round', varStroke: 'var(--s,#64748b)' },
      { id: 'inv-ac',   tag: 'polyline',
        pts: [[14,13],[15.5,11],[17,13],[18.5,11],[20,13]],
        fill: 'none', sw: 1.2, scap: 'round', sjoin: 'round', varStroke: 'var(--s,#64748b)' },
    ],
  },
  {
    id: 'sym-dc-breaker', label: 'Disjuntor CC', norm: 'IEC 60947-2 / NBR 16690 §5.3',
    vbW: 18, vbH: 26,
    cssVars: [
      { name: '--s',  label: 'stroke',       default: '#94a3b8' },
      { name: '--sw', label: 'stroke-width', default: '1.5' },
      { name: '--f',  label: 'fill (fundo)', default: '#0f172a' },
    ],
    elements: [
      { id: 'dcb-body', tag: 'circle', cx: 9,   cy: 8, r: 7,
        varFill: 'var(--f,#0f172a)', varStroke: 'var(--s,#94a3b8)', varSw: 'var(--sw,1.5)' },
      { id: 'dcb-diag', tag: 'line',   x1: 5.5, y1: 11.5, x2: 12.5, y2: 4.5,
        sw: 1.8, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'dcb-dc1',  tag: 'line',   x1: 4,   y1: 20,   x2: 14,   y2: 20,
        sw: 1.5, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
      { id: 'dcb-dc2',  tag: 'line',   x1: 4,   y1: 24,   x2: 14,   y2: 24,
        sw: 1.5, scap: 'round', varStroke: 'var(--s,#94a3b8)' },
    ],
  },
];

export const THEMES: Record<ThemeKey, Record<string, string>> = {
  'default':  {},
  'mppt-0':   { '--s': '#34d399', '--sw': '1.4', '--rad': '#34d399', '--rad-op': '1', '--el': '#34d39999' },
  'mppt-1':   { '--s': '#60a5fa', '--sw': '1.4', '--rad': '#60a5fa', '--rad-op': '1', '--el': '#60a5fa99' },
  'selected': { '--s': '#6366f1', '--sw': '1.4', '--rad': '#6366f1', '--rad-op': '1' },
};

export const THEME_LABELS: Record<ThemeKey, string> = {
  'default': 'Padrão', 'mppt-0': 'MPPT-0', 'mppt-1': 'MPPT-1', 'selected': 'Selecionado',
};
