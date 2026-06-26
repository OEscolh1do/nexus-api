/**
 * symbolEditorUtils — utility functions + JSX code generator
 *
 * Extracted from SymbolEditorCanvas.tsx (H2).
 * Pure functions — no React, no side effects.
 */

import type { SymElem, SymbolDef, Handle, PathAnchor } from './symbolEditorTypes';

export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Converte pts[] para SVG points string: "x1,y1 x2,y2 ..." */
export function serializePts(pts: Array<[number, number]>): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

/** Resolve var(--name, fallback) usando themeVars + symbolDefaults */
export function resolveVar(
  expr: string | undefined,
  themeVars: Record<string, string>,
  defaults: Record<string, string>,
): string {
  if (!expr) return '';
  return expr.replace(/var\(--([^,)]+)(?:,([^)]+))?\)/g, (_, name, fallback) => {
    return themeVars[`--${name}`] ?? defaults[`--${name}`] ?? fallback ?? '';
  });
}

/** Retorna defaults de CSS vars do símbolo */
export function getSymbolDefaults(sym: SymbolDef): Record<string, string> {
  const out: Record<string, string> = {};
  sym.cssVars.forEach(v => { out[v.name] = v.default; });
  return out;
}

/** Remove um elemento da árvore pelo id (incluindo filhos de grupos) */
export function removeElem(elements: SymElem[], id: string): SymElem[] {
  return elements
    .filter(el => el.id !== id)
    .map(el => el.tag === 'g' && el.children
      ? { ...el, children: removeElem(el.children, id) }
      : el,
    );
}

/** Move o elemento com `id` para o topo da pilha de renderização (frente) */
export function bringToFront(elements: SymElem[], id: string): SymElem[] {
  const idx = elements.findIndex(el => el.id === id);
  if (idx === -1 || idx === elements.length - 1) return elements;
  const next = [...elements];
  next.push(next.splice(idx, 1)[0]);
  return next;
}

/** Move o elemento com `id` para o fundo da pilha de renderização (trás) */
export function sendToBack(elements: SymElem[], id: string): SymElem[] {
  const idx = elements.findIndex(el => el.id === id);
  if (idx <= 0) return elements;
  const next = [...elements];
  next.unshift(next.splice(idx, 1)[0]);
  return next;
}

/** Snap para múltiplos de 0.5 */
export function snap(v: number): number {
  return Math.round(v * 2) / 2;
}

/** Computa o viewBox inicial (com padding) para um dado símbolo */
export function computeInitVB(s: SymbolDef): { x: number; y: number; w: number; h: number } {
  const pad = Math.max(s.vbW, s.vbH) * 0.25;
  return { x: -pad, y: -pad, w: s.vbW + pad * 2, h: s.vbH + pad * 2 };
}

/**
 * Gera a string `d` de um <path> a partir de âncoras.
 * Âncoras com `cpOut` geram segmentos Bézier cúbicos (C);
 * âncoras sem `cpOut` geram linhas retas (L).
 * Se `cursor` for fornecido, adiciona um segmento de preview até ele.
 */
export function buildPathD(
  anchors: PathAnchor[],
  cursor?: { x: number; y: number },
  close = false,
): string {
  if (!anchors.length) return '';
  const parts: string[] = [`M ${r2(anchors[0].x)},${r2(anchors[0].y)}`];
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    if (prev.cpOut) {
      const [cpx1, cpy1] = prev.cpOut;
      const cpIn: [number, number] = curr.cpOut
        ? [curr.x - (curr.cpOut[0] - curr.x), curr.y - (curr.cpOut[1] - curr.y)]
        : [curr.x, curr.y];
      parts.push(`C ${r2(cpx1)},${r2(cpy1)} ${r2(cpIn[0])},${r2(cpIn[1])} ${r2(curr.x)},${r2(curr.y)}`);
    } else {
      parts.push(`L ${r2(curr.x)},${r2(curr.y)}`);
    }
  }
  if (cursor && anchors.length > 0) {
    const last = anchors[anchors.length - 1];
    if (last.cpOut) {
      const [cpx1, cpy1] = last.cpOut;
      parts.push(`C ${r2(cpx1)},${r2(cpy1)} ${r2(cursor.x)},${r2(cursor.y)} ${r2(cursor.x)},${r2(cursor.y)}`);
    } else {
      parts.push(`L ${r2(cursor.x)},${r2(cursor.y)}`);
    }
  }
  if (close) parts.push('Z');
  return parts.join(' ');
}

/** Extrai handles de um elemento */
export function getHandles(elem: SymElem): Handle[] {
  const h: Handle[] = [];
  if (elem.tag === 'g' && elem.children) {
    elem.children.forEach(c => h.push(...getHandles(c)));
    return h;
  }
  switch (elem.tag) {
    case 'line':
      h.push({ id: `${elem.id}.p0`, elemId: elem.id, cx: elem.x1!, cy: elem.y1!, xKey: 'x1', yKey: 'y1' });
      h.push({ id: `${elem.id}.p1`, elemId: elem.id, cx: elem.x2!, cy: elem.y2!, xKey: 'x2', yKey: 'y2' });
      break;
    case 'circle':
      h.push({ id: `${elem.id}.c`, elemId: elem.id, cx: elem.cx!, cy: elem.cy!, xKey: 'cx', yKey: 'cy' });
      break;
    case 'rect':
      h.push({ id: `${elem.id}.tl`, elemId: elem.id, cx: elem.x!, cy: elem.y!, xKey: 'x', yKey: 'y' });
      h.push({ id: `${elem.id}.br`, elemId: elem.id, cx: elem.x! + elem.w!, cy: elem.y! + elem.h!, xKey: 'w', yKey: 'h' });
      break;
    case 'polyline':
    case 'polygon':
      (elem.pts ?? []).forEach(([px, py], i) => {
        h.push({ id: `${elem.id}.v${i}`, elemId: elem.id, cx: px, cy: py, ptIdx: i });
      });
      break;
    case 'text':
      h.push({ id: `${elem.id}.o`, elemId: elem.id, cx: elem.x!, cy: elem.y!, xKey: 'x', yKey: 'y' });
      break;
    case 'path':
      // Handles individuais de path exigiriam um editor de Bézier completo;
      // por ora retornamos vazio — o elemento é selecionável mas não tem handles.
      break;
  }
  return h;
}

/** Aplica um delta de drag a um elemento */
export function applyDrag(elem: SymElem, handle: Handle, dx: number, dy: number): SymElem {
  const e = { ...elem };
  if (handle.ptIdx !== undefined && (e.tag === 'polyline' || e.tag === 'polygon')) {
    const pts = [...(e.pts ?? [])];
    pts[handle.ptIdx] = [snap(pts[handle.ptIdx][0] + dx), snap(pts[handle.ptIdx][1] + dy)];
    return { ...e, pts };
  }
  if (handle.xKey === 'w') {
    return { ...e, w: snap(e.w! + dx), h: snap(e.h! + dy) };
  }
  if (handle.xKey === 'x' && e.tag === 'rect') {
    return { ...e,
      x: snap(e.x! + dx), y: snap(e.y! + dy),
      w: snap(e.w! - dx), h: snap(e.h! - dy),
    };
  }
  if (handle.xKey) { (e as Record<string, unknown>)[handle.xKey] = snap(((e as Record<string, unknown>)[handle.xKey] as number) + dx); }
  if (handle.yKey) { (e as Record<string, unknown>)[handle.yKey] = snap(((e as Record<string, unknown>)[handle.yKey] as number) + dy); }
  return e;
}

/** Atualiza um elemento na árvore (incluindo filhos de grupos) */
export function updateElemInTree(elements: SymElem[], handle: Handle, dx: number, dy: number): SymElem[] {
  return elements.map(el => {
    if (el.id === handle.elemId) return applyDrag(el, handle, dx, dy);
    if (el.tag === 'g' && el.children) {
      const newChildren = updateElemInTree(el.children, handle, dx, dy);
      if (newChildren !== el.children) return { ...el, children: newChildren };
    }
    return el;
  });
}

/** Encontra um elemento na árvore pelo id */
export function findElem(elements: SymElem[], id: string): SymElem | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findElem(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Atualiza atributo numérico de um elemento */
export function updateAttr(elements: SymElem[], elemId: string, key: string, value: number): SymElem[] {
  return elements.map(el => {
    if (el.id === elemId) {
      if (key.startsWith('pts[')) {
        const m = key.match(/pts\[(\d+)\]\.(x|y)/);
        if (m) {
          const i = parseInt(m[1]); const axis = m[2] as 'x' | 'y';
          const pts = [...(el.pts ?? [])];
          pts[i] = axis === 'x' ? [value, pts[i][1]] : [pts[i][0], value];
          return { ...el, pts };
        }
      }
      return { ...el, [key]: value };
    }
    if (el.tag === 'g' && el.children) {
      const newChildren = updateAttr(el.children, elemId, key, value);
      if (newChildren !== el.children) return { ...el, children: newChildren };
    }
    return el;
  });
}

// =============================================================================
// JSX code generator
// =============================================================================

/** Arredonda para 2 casas decimais, remove zeros à direita */
export function r2(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

export function elemToJSX(el: SymElem, depth = 6): string {
  const pad = ' '.repeat(depth);
  const styleEntries: string[] = [];
  if (el.varFill)    styleEntries.push(`fill: '${el.varFill}'`);
  if (el.varStroke)  styleEntries.push(`stroke: '${el.varStroke}'`);
  if (el.varSw)      styleEntries.push(`strokeWidth: '${el.varSw}'`);
  if (el.varOpacity) styleEntries.push(`opacity: '${el.varOpacity}'`);
  const styleStr = styleEntries.length
    ? ` style={{ ${styleEntries.join(', ')} } as CSSV}`
    : '';

  if (el.tag === 'g') {
    const children = (el.children ?? []).map(c => elemToJSX(c, depth + 2)).join('\n');
    return `${pad}<g${styleStr}>\n${children}\n${pad}</g>`;
  }
  if (el.tag === 'text') {
    const textStyleEntries = [...styleEntries, `userSelect: 'none'`];
    const textStyleStr = ` style={{ ${textStyleEntries.join(', ')} } as CSSV}`;
    const attrs = [
      el.x !== undefined ? `x={${r2(el.x)}}` : '',
      el.y !== undefined ? `y={${r2(el.y)}}` : '',
      el.anchor          ? `textAnchor="${el.anchor}"` : '',
      el.baseline        ? `dominantBaseline="${el.baseline}"` : '',
      el.fill            ? `fill="${el.fill}"` : '',
      el.fontSize        ? `fontSize={${el.fontSize}}` : '',
      el.fontWeight      ? `fontWeight="${el.fontWeight}"` : '',
      'fontFamily="monospace"',
      textStyleStr.trimStart(),
    ].filter(Boolean).join(' ');
    return `${pad}<text ${attrs}>${el.text ?? ''}</text>`;
  }
  if (el.tag === 'polyline' || el.tag === 'polygon') {
    const pts = (el.pts ?? []).map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
    const attrs = [
      `points="${pts}"`,
      el.fill !== undefined ? `fill="${el.fill}"` : '',
      el.sw   !== undefined ? `strokeWidth={${el.sw}}` : '',
      el.sdash ? `strokeDasharray="${el.sdash}"` : '',
      el.scap  ? `strokeLinecap="${el.scap}"` : '',
      el.sjoin ? `strokeLinejoin="${el.sjoin}"` : '',
      styleStr.trimStart(),
    ].filter(Boolean).join(' ');
    return `${pad}<${el.tag} ${attrs} />`;
  }
  if (el.tag === 'line') {
    const attrs = [
      `x1={${r2(el.x1!)}} y1={${r2(el.y1!)}} x2={${r2(el.x2!)}} y2={${r2(el.y2!)}}`,
      el.sw   !== undefined ? `strokeWidth={${el.sw}}` : '',
      el.sdash ? `strokeDasharray="${el.sdash}"` : '',
      el.scap  ? `strokeLinecap="${el.scap}"` : '',
      styleStr.trimStart(),
    ].filter(Boolean).join(' ');
    return `${pad}<line ${attrs} />`;
  }
  if (el.tag === 'circle') {
    const attrs = [
      `cx={${r2(el.cx!)}} cy={${r2(el.cy!)}} r={${r2(el.r!)}}`,
      el.sw !== undefined ? `strokeWidth={${el.sw}}` : '',
      styleStr.trimStart(),
    ].filter(Boolean).join(' ');
    return `${pad}<circle ${attrs} />`;
  }
  if (el.tag === 'rect') {
    const attrs = [
      el.x  !== undefined ? `x={${r2(el.x)}}` : '',
      el.y  !== undefined ? `y={${r2(el.y)}}` : '',
      `width={${r2(el.w!)}} height={${r2(el.h!)}}`,
      el.rx !== undefined ? `rx={${r2(el.rx)}}` : '',
      el.fill !== undefined ? `fill="${el.fill}"` : '',
      el.sw   !== undefined ? `strokeWidth={${el.sw}}` : '',
      styleStr.trimStart(),
    ].filter(Boolean).join(' ');
    return `${pad}<rect ${attrs} />`;
  }
  if (el.tag === 'path') {
    const attrs = [
      `d="${el.d ?? ''}"`,
      el.fill !== undefined ? `fill="${el.fill}"` : 'fill="none"',
      el.sw    !== undefined ? `strokeWidth={${el.sw}}` : '',
      el.scap  ? `strokeLinecap="${el.scap}"` : '',
      el.sjoin ? `strokeLinejoin="${el.sjoin}"` : '',
      el.sdash ? `strokeDasharray="${el.sdash}"` : '',
      styleStr.trimStart(),
    ].filter(Boolean).join(' ');
    return `${pad}<path ${attrs} />`;
  }
  return '';
}

export function generateJSX(sym: SymbolDef, elements: SymElem[]): string {
  const body = elements.map(el => elemToJSX(el, 6)).join('\n');
  return `{/* ── ${sym.id} — ${sym.label} ── */}\n` +
    `<symbol id="${sym.id}" viewBox="0 0 ${sym.vbW} ${sym.vbH}">\n` +
    body + '\n' +
    `</symbol>`;
}
