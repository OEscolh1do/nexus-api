/**
 * =============================================================================
 * CANVAS CONTAINER — Re-export (PGFX-01)
 * =============================================================================
 *
 * Re-exporta o componente unificado de `../../components/CanvasContainer`.
 * Este arquivo existe apenas para manter compatibilidade de imports em
 * `WorkspaceLayout.tsx` que importa de `../panels/CanvasContainer`.
 *
 * NOTA: A versão canônica está em `components/CanvasContainer.tsx`.
 * =============================================================================
 */

export { CanvasContainer, useCanvasSize } from '../../components/CanvasContainer';
export type { CanvasSize } from '../../components/CanvasContainer';
