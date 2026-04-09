/**
 * =============================================================================
 * PANEL GROUP — Container Colapsável Reutilizável (UX-002 SPEC-002)
 * =============================================================================
 *
 * Wrapper que envolve cada grupo semântico do dock (Site, Simulação, etc.).
 * Consome panelStore para estado de colapso (SPEC-000 §Conflito 1: SSoT).
 *
 * Props especiais:
 * - `contextual`: Se true, o grupo inteiro só renderiza se children emitir conteúdo.
 *   Usado pelo PropertiesGroup que depende de seleção.
 * - `onDismiss`: Se definido, mostra ✕ ao invés de chevron de colapso.
 *   Usado pelo PropertiesGroup para limpar seleção.
 *
 * O botão maximize (↗) está presente mas desabilitado na Fase 1.
 * Na Fase 2, será ativado via prop `onMaximize`.
 * =============================================================================
 */

import React from 'react';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import { usePanelStore, useIsCollapsed, type PanelGroupId } from '../../../store/panelStore';

// =============================================================================
// TYPES
// =============================================================================

interface PanelGroupProps {
  /** Identificador único do grupo (deve corresponder a PanelGroupId) */
  id: PanelGroupId;
  /** Texto do header */
  label: string;
  /** Ícone Lucide no header */
  icon: React.ReactNode;
  /** Tailwind class para cor de destaque */
  accentColor?: string;
  /** Badge opcional ao lado do label (ex: PR badge) */
  badge?: React.ReactNode;
  /** Callback para swap ao center (Fase 2 — null na Fase 1) */
  onMaximize?: () => void;
  /** Se true, o grupo só renderiza quando children produzem conteúdo */
  contextual?: boolean;
  /** Se definido, mostra ✕ ao invés de chevron. Callback de dismiss. */
  onDismiss?: () => void;
  /** Conteúdo do painel */
  children: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const PanelGroup: React.FC<PanelGroupProps> = ({
  id,
  label,
  icon,
  accentColor = 'text-slate-400',
  badge,
  onMaximize,
  contextual,
  onDismiss,
  children,
}) => {
  const isCollapsed = useIsCollapsed(id);
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);

  // Contextual mode: se não há children renderizáveis, não mostra nada
  // O componente filho (ex: PropertiesGroup) retorna null quando não há seleção.
  // Nesse caso, o PanelGroup com contextual=true simplesmente não aparece.
  // Verificamos isso via ref callback que checa childElementCount.
  const [hasContent, setHasContent] = React.useState(!contextual);
  const contentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (contextual && node) {
        // Observa changes no conteúdo do grupo
        const observer = new MutationObserver(() => {
          setHasContent(node.childElementCount > 0);
        });
        observer.observe(node, { childList: true });
        setHasContent(node.childElementCount > 0);
        return () => observer.disconnect();
      }
    },
    [contextual],
  );

  if (contextual && !hasContent) {
    // Monta invisível para detectar quando children aparecem
    return (
      <div className="hidden">
        <div ref={contentRef}>{children}</div>
      </div>
    );
  }

  const hasDismiss = !!onDismiss;
  const isExpanded = !isCollapsed;

  return (
    <div
      className={`rounded-lg border border-slate-800 overflow-hidden transition-all duration-200 ${
        isExpanded ? 'bg-slate-950' : 'bg-slate-900/30'
      }`}
      role="region"
      aria-label={label}
    >
      {/* ── HEADER ── */}
      <button
        type="button"
        onClick={() => (hasDismiss ? undefined : toggleCollapse(id))}
        className={`w-full flex items-center justify-between px-3 py-2 transition-colors ${
          hasDismiss ? 'cursor-default' : 'cursor-pointer hover:bg-slate-900/50'
        }`}
        aria-expanded={isExpanded}
        aria-controls={`panel-${id}-content`}
      >
        <div className="flex items-center gap-2">
          <span className={accentColor}>{icon}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {badge && <span className="ml-1">{badge}</span>}
        </div>

        <div className="flex items-center gap-1">
          {/* Maximize button — disabled in Phase 1 */}
          <span
            className={`p-0.5 rounded transition-colors ${
              onMaximize
                ? 'text-slate-500 hover:text-white hover:bg-slate-800 cursor-pointer'
                : 'text-slate-700 cursor-not-allowed'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onMaximize?.();
            }}
            title={onMaximize ? 'Expandir no centro' : 'Disponível em breve'}
          >
            <Maximize2 size={10} />
          </span>

          {/* Dismiss (✕) or Collapse chevron */}
          {hasDismiss ? (
            <span
              className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              title="Fechar"
            >
              <X size={12} />
            </span>
          ) : (
            <ChevronDown
              size={12}
              className={`text-slate-600 transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : ''
              }`}
            />
          )}
        </div>
      </button>

      {/* ── CONTENT ── */}
      <div
        id={`panel-${id}-content`}
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-slate-800/50" ref={contextual ? contentRef : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
};
