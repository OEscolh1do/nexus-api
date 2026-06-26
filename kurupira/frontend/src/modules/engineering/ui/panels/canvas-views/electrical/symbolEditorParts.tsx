/**
 * symbolEditorParts — RenderElem + ElementInspector sub-components
 *
 * Extracted from SymbolEditorCanvas.tsx (H2).
 */

import React from 'react';
import { Shapes } from 'lucide-react';
import type { SymElem } from './symbolEditorTypes';
import { resolveVar, serializePts } from './symbolEditorUtils';

// =============================================================================
// RenderElem — renders a single SymElem onto the editing canvas
// =============================================================================

export function RenderElem({
  el, themeVars, symDefaults, selectedId, onSelect,
}: {
  el: SymElem;
  themeVars: Record<string, string>;
  symDefaults: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}): React.ReactElement | null {
  const rv = (v?: string) => resolveVar(v, themeVars, symDefaults);
  const isSelected = el.id === selectedId;

  const baseStyle: React.CSSProperties = {};
  if (el.varFill)    baseStyle.fill        = rv(el.varFill);
  if (el.varStroke)  baseStyle.stroke      = rv(el.varStroke);
  if (el.varSw)      baseStyle.strokeWidth = rv(el.varSw);
  if (el.varOpacity) baseStyle.opacity     = rv(el.varOpacity) as React.CSSProperties['opacity'];

  // Bug fix: CSS `style.stroke` overrides presentation attribute `stroke`.
  // Inject selection colour directly into the style object so it wins.
  const style: React.CSSProperties = isSelected
    ? { ...baseStyle, stroke: '#6366f1', strokeWidth: baseStyle.strokeWidth ?? el.sw ?? 1 }
    : baseStyle;

  // stopPropagation garante que clicar num filho não dispara também o onClick do <g> pai
  const sel = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(el.id); };

  if (el.tag === 'g') {
    const groupStyle: React.CSSProperties = isSelected
      ? { ...baseStyle, filter: 'drop-shadow(0 0 1.5px #6366f1)' }
      : baseStyle;
    return (
      <g style={groupStyle} onClick={sel} cursor="pointer">
        {(el.children ?? []).map(c => (
          <RenderElem key={c.id} el={c} themeVars={themeVars} symDefaults={symDefaults} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </g>
    );
  }
  if (el.tag === 'text') {
    const textStyle: React.CSSProperties = {
      ...baseStyle,
      userSelect: 'none',
      ...(isSelected ? { stroke: '#6366f1', strokeWidth: 0.3 } : {}),
    };
    return (
      <text x={el.x} y={el.y} fill={el.fill} fontSize={el.fontSize} fontWeight={el.fontWeight ?? 'normal'}
        fontFamily="monospace" textAnchor={el.anchor as React.SVGProps<SVGTextElement>['textAnchor']} dominantBaseline={el.baseline as React.SVGProps<SVGTextElement>['dominantBaseline']}
        style={textStyle} onClick={sel} cursor="pointer">
        {el.text}
      </text>
    );
  }
  if (el.tag === 'line') {
    return (
      <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2}
        strokeWidth={el.sw} strokeDasharray={el.sdash}
        strokeLinecap={el.scap as React.SVGProps<SVGLineElement>['strokeLinecap']} fill="none"
        style={style} onClick={sel} cursor="pointer" />
    );
  }
  if (el.tag === 'circle') {
    return (
      <circle cx={el.cx} cy={el.cy} r={el.r} strokeWidth={el.sw}
        style={style} onClick={sel} cursor="pointer" />
    );
  }
  if (el.tag === 'rect') {
    return (
      <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.rx}
        fill={el.fill} strokeWidth={el.sw}
        style={style} onClick={sel} cursor="pointer" />
    );
  }
  if (el.tag === 'polyline') {
    return (
      <polyline points={serializePts(el.pts ?? [])} fill={el.fill ?? 'none'}
        strokeWidth={el.sw} strokeLinecap={el.scap as React.SVGProps<SVGPolylineElement>['strokeLinecap']} strokeLinejoin={el.sjoin as React.SVGProps<SVGPolylineElement>['strokeLinejoin']}
        style={style} onClick={sel} cursor="pointer" />
    );
  }
  if (el.tag === 'polygon') {
    return (
      <polygon points={serializePts(el.pts ?? [])} strokeWidth={el.sw}
        style={style} onClick={sel} cursor="pointer" />
    );
  }
  if (el.tag === 'path') {
    return (
      <path d={el.d ?? ''} fill={el.fill ?? 'none'}
        strokeWidth={el.sw} strokeLinecap={el.scap as React.SVGProps<SVGPathElement>['strokeLinecap']} strokeLinejoin={el.sjoin as React.SVGProps<SVGPathElement>['strokeLinejoin']}
        strokeDasharray={el.sdash}
        style={style} onClick={sel} cursor="pointer" />
    );
  }
  return null;
}

// =============================================================================
// ElementInspector — numeric attribute editor for selected element
// =============================================================================

export function ElementInspector({
  elem, onUpdate,
}: {
  elem: SymElem | null;
  onUpdate: (key: string, value: number) => void;
}) {
  if (!elem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
        <Shapes size={20} />
        <span className="text-[10px] font-mono">Selecione um elemento</span>
      </div>
    );
  }

  const numAttrs: { key: string; label: string; val: number }[] = [];

  if (elem.tag === 'line') {
    numAttrs.push(
      { key: 'x1', label: 'x1', val: elem.x1 ?? 0 },
      { key: 'y1', label: 'y1', val: elem.y1 ?? 0 },
      { key: 'x2', label: 'x2', val: elem.x2 ?? 0 },
      { key: 'y2', label: 'y2', val: elem.y2 ?? 0 },
      { key: 'sw', label: 'stroke-width', val: elem.sw ?? 1 },
    );
  } else if (elem.tag === 'circle') {
    numAttrs.push(
      { key: 'cx', label: 'cx', val: elem.cx ?? 0 },
      { key: 'cy', label: 'cy', val: elem.cy ?? 0 },
      { key: 'r',  label: 'r',  val: elem.r  ?? 0 },
    );
  } else if (elem.tag === 'rect') {
    numAttrs.push(
      { key: 'x',  label: 'x',       val: elem.x  ?? 0 },
      { key: 'y',  label: 'y',       val: elem.y  ?? 0 },
      { key: 'w',  label: 'width',   val: elem.w  ?? 0 },
      { key: 'h',  label: 'height',  val: elem.h  ?? 0 },
      { key: 'rx', label: 'rx',      val: elem.rx ?? 0 },
      { key: 'sw', label: 'stroke-width', val: elem.sw ?? 1 },
    );
  } else if (elem.tag === 'text') {
    numAttrs.push(
      { key: 'x',        label: 'x',          val: elem.x        ?? 0 },
      { key: 'y',        label: 'y',          val: elem.y        ?? 0 },
      { key: 'fontSize', label: 'font-size',  val: elem.fontSize ?? 8 },
    );
  } else if (elem.tag === 'polyline' || elem.tag === 'polygon') {
    (elem.pts ?? []).forEach(([px, py], i) => {
      numAttrs.push({ key: `pts[${i}].x`, label: `p${i}.x`, val: px });
      numAttrs.push({ key: `pts[${i}].y`, label: `p${i}.y`, val: py });
    });
    numAttrs.push({ key: 'sw', label: 'stroke-width', val: elem.sw ?? 1 });
  } else if (elem.tag === 'path') {
    numAttrs.push({ key: 'sw', label: 'stroke-width', val: elem.sw ?? 1 });
  }

  const isPath = elem.tag === 'path';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-2 border-b border-slate-800">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Inspector</span>
        <div className="mt-0.5 text-[10px] font-mono text-slate-300">
          <span className="text-indigo-400">&lt;{elem.tag}&gt;</span>
          {' '}
          <span className="text-slate-500">{elem.id}</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        {numAttrs.map(attr => (
          <div key={attr.key} className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-500 w-20 shrink-0 text-right">{attr.label}</span>
            <input
              type="number"
              step="0.5"
              value={attr.val}
              onChange={e => onUpdate(attr.key, parseFloat(e.target.value) || 0)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-200
                         focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        ))}
        {isPath && (
          <div className="mt-1 flex flex-col gap-1">
            <span className="text-[9px] font-mono text-slate-500">d (path data)</span>
            <textarea
              readOnly
              value={elem.d ?? ''}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[8px] font-mono text-slate-400
                         resize-none focus:outline-none select-all cursor-text"
              title="Clique e Ctrl+A para selecionar toda a string d"
            />
            <span className="text-[7px] text-slate-700">somente leitura — edite via ferramenta Path</span>
          </div>
        )}
      </div>

      {(elem.varFill || elem.varStroke || elem.varSw || elem.varOpacity) && (
        <div className="px-3 py-2 border-t border-slate-800 mt-auto">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">CSS vars</span>
          {[
            { k: 'fill', v: elem.varFill },
            { k: 'stroke', v: elem.varStroke },
            { k: 'stroke-width', v: elem.varSw },
            { k: 'opacity', v: elem.varOpacity },
          ].filter(e => e.v).map(e => (
            <div key={e.k} className="flex items-center gap-1 mt-0.5">
              <span className="text-[8px] text-slate-600 w-16 shrink-0">{e.k}</span>
              <span className="text-[8px] font-mono text-amber-400 truncate">{e.v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
