/**
 * symbolEditorTypes — Types for SymbolEditorCanvas
 *
 * Extracted from SymbolEditorCanvas.tsx (H2).
 * Pure TypeScript — no React, no runtime dependencies.
 */

export type ElemTag = 'rect' | 'line' | 'circle' | 'polyline' | 'polygon' | 'text' | 'g' | 'path';

export interface SymElem {
  id: string;
  tag: ElemTag;
  // Geométricos (editáveis via handles / inspector)
  x?: number; y?: number; w?: number; h?: number; rx?: number;
  cx?: number; cy?: number; r?: number;
  x1?: number; y1?: number; x2?: number; y2?: number;
  pts?: Array<[number, number]>;
  // Estilos fixos
  fill?: string;
  sw?: number;
  sdash?: string;
  scap?: string;
  sjoin?: string;
  // CSS Custom Properties (dinâmicas)
  varFill?: string;
  varStroke?: string;
  varSw?: string;
  varOpacity?: string;
  // Texto
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  anchor?: string;
  baseline?: string;
  // Path (d string — gerado por buildPathD)
  d?: string;
  // Grupo aninhado
  children?: SymElem[];
}

export interface CSSVarDef {
  name: string;   // '--s'
  label: string;
  default: string;
}

export interface SymbolDef {
  id: string;
  label: string;
  norm: string;
  vbW: number; vbH: number;
  elements: SymElem[];
  cssVars: CSSVarDef[];
}

export type ThemeKey = 'default' | 'mppt-0' | 'mppt-1' | 'selected';

export interface Handle {
  id: string;
  elemId: string;
  cx: number; cy: number;
  xKey?: string;
  yKey?: string;
  ptIdx?: number;
}

export interface DragState {
  handle: Handle;
  startSVG: { x: number; y: number };
}

/** Modos de ferramenta da prancheta */
export type ToolMode = 'SELECT' | 'LINE' | 'RECT' | 'CIRCLE' | 'POLYLINE' | 'POLYGON' | 'TEXT' | 'PATH';

/** Âncora de path: ponto + handle de saída opcional (Bézier) */
export type PathAnchor = { x: number; y: number; cpOut?: [number, number] };

/** Estado em progresso de uma operação de desenho */
export interface DrawPhase {
  tool: ToolMode;
  p1?: { x: number; y: number };
  pts?: Array<[number, number]>;
  cursor?: { x: number; y: number };
  // PATH-specific
  pathAnchors?:    PathAnchor[];
  pathDragHandle?: { x: number; y: number };
}

/** Propriedades padrão para novos elementos criados */
export interface NewElemProps {
  varStroke?: string;
  varFill?: string;
  sw: number;
}

/** Entrada salva na biblioteca do usuário */
export interface LibraryEntry {
  id: string;
  name: string;
  symId: string;
  vbW: number;
  vbH: number;
  elements: SymElem[];
  savedAt: number;
}
