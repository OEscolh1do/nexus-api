/**
 * svgCoords.ts
 * Shared utility: converts a DOM pointer/mouse event to SVG user-space coordinates.
 * Used by SymbolEditorCanvas, DiagramCanvasView, and any other SVG canvas.
 */

export function toSVGCoords(
  e: { clientX: number; clientY: number },
  svg: SVGSVGElement,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const sp = pt.matrixTransform(ctm.inverse());
  return { x: sp.x, y: sp.y };
}
