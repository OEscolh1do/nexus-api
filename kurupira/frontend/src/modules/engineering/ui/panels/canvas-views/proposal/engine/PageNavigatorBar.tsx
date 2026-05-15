import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasPage } from './types';

// ─── Tiny orientation icons ───────────────────────────────────────────────────

const PortraitMini = () => (
  <svg width="6" height="8" viewBox="0 0 6 8" fill="none" aria-hidden="true" style={{ opacity: 0.5 }}>
    <rect x="0.5" y="0.5" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const LandscapeMini = () => (
  <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true" style={{ opacity: 0.5 }}>
    <rect x="0.5" y="0.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface PageNavigatorBarProps {
  pages: CanvasPage[];
  activeIdx: number;
  /** ID da página em rename; null quando nenhuma renomeação está ativa. */
  renamingPageId: string | null;
  onNavigate: (idx: number) => void;
  onAddPage: () => void;
  onDuplicate: (id: string) => void;
  /** Recebe ID (não índice) — imune a shifts de array assíncronos. */
  onRemove: (id: string) => void;
  /** O pai só precisa do ID; o label draft vive internamente no componente. */
  onStartRename: (id: string) => void;
  onCommitRename: (id: string, label: string) => void;
  onCancelRename: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageNavigatorBar({
  pages, activeIdx,
  renamingPageId,
  onNavigate, onAddPage, onDuplicate, onRemove,
  onStartRename, onCommitRename, onCancelRename,
}: PageNavigatorBarProps) {
  // chipRefs is HTMLButtonElement[] because chips are now <button> elements,
  // which gives keyboard focus, implicit role="button", and correct aria-current.
  const stripRef     = useRef<HTMLDivElement>(null);
  const chipRefs     = useRef<(HTMLButtonElement | null)[]>([]);
  // Guards onBlur from double-committing after Enter/Escape already handled the rename.
  const committedRef = useRef(false);
  // Tracks the current rename draft. Uncontrolled (no state) avoids the flash-of-empty
  // bug where a controlled input renders '' before the initialisation runs.
  const draftLabelRef = useRef('');
  // Stable ref to pages so the rename-init effect can read the current label without
  // adding `pages` to the dep array (which would reset the draft on every page change).
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  // Initialise draft and reset committedRef whenever a new rename session opens.
  // Using pagesRef avoids re-running on every unrelated pages change while still
  // reading the up-to-date label at the moment the rename session begins.
  useEffect(() => {
    if (renamingPageId !== null) {
      committedRef.current = false;
      const page = pagesRef.current.find((p) => p.id === renamingPageId);
      draftLabelRef.current = page?.label ?? '';
    }
  }, [renamingPageId]);

  // Trim stale refs first, then scroll the active chip into view.
  // Dep on pages[activeIdx]?.id (not pages.length) so the scroll only fires when
  // the active chip's identity actually changes — adding a page far from the active
  // one no longer causes a spurious snap.
  useEffect(() => {
    chipRefs.current.length = pages.length;
    const chip  = chipRefs.current[activeIdx];
    const strip = stripRef.current;
    if (!chip || !strip) return;
    // getBoundingClientRect gives position relative to the strip's visible area,
    // correct regardless of where the strip sits in the positioned ancestor tree.
    const chipLeft  = chip.getBoundingClientRect().left
                    - strip.getBoundingClientRect().left
                    + strip.scrollLeft;
    const chipRight = chipLeft + chip.offsetWidth;
    const { scrollLeft, offsetWidth } = strip;
    if (chipLeft < scrollLeft + 8) {
      strip.scrollTo({ left: chipLeft - 8, behavior: 'smooth' });
    } else if (chipRight > scrollLeft + offsetWidth - 8) {
      strip.scrollTo({ left: chipRight - offsetWidth + 8, behavior: 'smooth' });
    }
  }, [activeIdx, pages[activeIdx]?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Native (non-passive) wheel listener so e.preventDefault() actually fires,
  // preventing the parent canvas from intercepting vertical scroll as a zoom gesture.
  // React's synthetic onWheel is passive in React 17+ and silently ignores preventDefault.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const handler = (e: WheelEvent) => {
      // Always stop propagation to prevent canvas from receiving wheel events.
      e.stopPropagation();
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // Convert vertical scroll to horizontal; normalise deltaMode so mouse wheels
        // (deltaMode=1, units=lines) scroll as expected.
        e.preventDefault();
        const LINE_PX = 40;
        const raw = e.deltaMode === 1 ? e.deltaY * LINE_PX
                  : e.deltaMode === 2 ? e.deltaY * strip.clientWidth
                  : e.deltaY;
        strip.scrollLeft += raw * 0.6;
      }
      // Horizontal scroll (trackpad): browser handles natively, propagation stopped above.
    };
    strip.addEventListener('wheel', handler, { passive: false });
    return () => strip.removeEventListener('wheel', handler);
  }, []);

  // Returns focus to the chip button after a rename session ends.
  // rAF ensures the input has unmounted before focus() is called.
  function returnFocusToChip(idx: number) {
    requestAnimationFrame(() => { chipRefs.current[idx]?.focus(); });
  }

  return (
    // <nav> carries the landmark role natively and is more reliably announced by AT.
    <nav
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(51,65,85,0.9)',
        borderRadius: 14,
        padding: '4px 6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        maxWidth: 'min(560px, calc(100% - 64px))',
        pointerEvents: 'auto',
      }}
      aria-label="Navegador de páginas"
      // Prevent clicks from deselecting canvas elements
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Prev ── */}
      <button
        type="button"
        disabled={activeIdx === 0}
        onClick={() => onNavigate(activeIdx - 1)}
        // disabled:hover:bg-transparent prevents the hover highlight firing on disabled buttons.
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors shrink-0"
        aria-label="Página anterior"
        title="Página anterior (←)"
      >
        <ChevronLeft size={13} />
      </button>

      {/* ── Chip strip with overflow fade ── */}
      <div style={{ position: 'relative', minWidth: 0, flex: '1 1 auto' }}>
        {/* Left fade mask — width:20 ensures partially-visible chips are fully covered */}
        <div
          aria-hidden
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 20, zIndex: 1,
            background: 'linear-gradient(to right, rgba(15,23,42,0.92), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Right fade mask */}
        <div
          aria-hidden
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, zIndex: 1,
            background: 'linear-gradient(to left, rgba(15,23,42,0.92), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div
          ref={stripRef}
          // [&::-webkit-scrollbar]:hidden hides the scrollbar in Chrome/Safari;
          // scrollbarWidth:none covers Firefox. Both needed for cross-browser hiding.
          className="[&::-webkit-scrollbar]:hidden"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            overflowX: 'auto',
            maxWidth: 'min(480px, 55vw)',
            scrollbarWidth: 'none',
            padding: '0 4px',
          }}
          // onWheel removed — handled via native addEventListener (passive:false) above.
        >
          {pages.map((page, idx) => {
            const isActive    = idx === activeIdx;
            const isRenaming  = renamingPageId === page.id;
            const isLandscape = page.orientation === 'landscape';

            return (
              // Chip is a <button> so it's natively keyboard-focusable, carries
              // implicit role="button", and propagates aria-current correctly to AT.
              <button
                type="button"
                key={page.id}
                ref={(el) => { chipRefs.current[idx] = el; }}
                className={cn(
                  'group relative flex items-center gap-1.5 rounded-lg select-none shrink-0',
                  // transition-colors (not transition-all) excludes width — prevents the
                  // label→input width change from animating and shifting chips.
                  'pl-2 pr-1.5 py-1.5 transition-colors',
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200',
                )}
                onClick={() => { if (!isRenaming) onNavigate(idx); }}
                onKeyDown={(e) => {
                  if (isRenaming) return;
                  // F2 (platform rename convention) or Enter-on-active starts rename.
                  if (e.key === 'F2' || (e.key === 'Enter' && isActive)) {
                    e.preventDefault();
                    onStartRename(page.id);
                  }
                }}
                title={isRenaming ? undefined : page.label}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${page.label}, página ${idx + 1}`}
              >
                {/* Orientation + number badge */}
                <div className="flex items-center gap-1 shrink-0">
                  {isLandscape ? <LandscapeMini /> : <PortraitMini />}
                  <span className={cn(
                    'text-[10px] font-bold tabular-nums leading-none',
                    isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400',
                  )}>
                    {idx + 1}
                  </span>
                </div>

                {/* Fixed-width wrapper keeps chip width stable when switching label↔input.
                    Both children fill the wrapper so the chip never shifts horizontally. */}
                <div className="w-20 overflow-hidden">
                  {isRenaming ? (
                    <input
                      autoFocus
                      defaultValue={page.label}
                      placeholder="Nome"
                      aria-label="Nome da página"
                      onChange={(e) => { draftLabelRef.current = e.target.value; }}
                      // Select all on focus so user can immediately type the new name.
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.stopPropagation()}
                      // Guard: when Enter/Escape already handled the rename, onBlur must not
                      // commit again — input unmounting fires onBlur, causing double-commit.
                      // Fallback to page.label if user cleared the field — prevents empty labels.
                      onBlur={() => {
                        if (!committedRef.current) {
                          onCommitRename(page.id, draftLabelRef.current.trim() || page.label);
                          returnFocusToChip(idx);
                        }
                        committedRef.current = false;
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          committedRef.current = true;
                          onCommitRename(page.id, draftLabelRef.current.trim() || page.label);
                          returnFocusToChip(idx);
                        }
                        if (e.key === 'Escape') {
                          committedRef.current = true;
                          onCancelRename();
                          returnFocusToChip(idx);
                        }
                      }}
                      // focus:ring-2 provides a WCAG 2.4.11-compliant focus indicator.
                      className="w-full bg-slate-800 text-slate-200 text-[11px] px-1 py-0.5 rounded outline-none border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors"
                    />
                  ) : (
                    <span
                      className="text-[11px] font-medium block truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onStartRename(page.id);
                      }}
                    >
                      {page.label}
                    </span>
                  )}
                </div>

                {/* Hover actions — pointer-events-none when not visible to prevent ghost
                    clicks; tabIndex=-1 during rename so Tab doesn't escape into them. */}
                <div
                  className={cn(
                    'flex items-center gap-0.5 shrink-0 transition-opacity',
                    isRenaming
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
                  )}
                >
                  <button
                    type="button"
                    tabIndex={isRenaming ? -1 : undefined}
                    onClick={(e) => { e.stopPropagation(); onDuplicate(page.id); }}
                    className="p-0.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/15 transition-colors"
                    aria-label="Duplicar página"
                    title="Duplicar página"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    type="button"
                    tabIndex={isRenaming ? -1 : undefined}
                    onClick={(e) => { e.stopPropagation(); if (pages.length > 1) onRemove(page.id); }}
                    className={cn(
                      'p-0.5 rounded text-slate-500 transition-colors',
                      pages.length > 1
                        ? 'hover:text-rose-400 hover:bg-rose-500/15'
                        : 'opacity-30 cursor-not-allowed',
                    )}
                    aria-label={pages.length > 1 ? 'Remover página' : 'Não é possível remover a única página'}
                    title={pages.length > 1 ? 'Remover página' : 'Não é possível remover a única página'}
                    disabled={pages.length <= 1}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Add page ── */}
      <div className="w-px h-4 bg-slate-700/70 mx-1 shrink-0" />
      <button
        type="button"
        onClick={onAddPage}
        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0"
        aria-label="Nova página"
        title="Nova página"
      >
        <Plus size={13} />
      </button>

      {/* ── Next ── */}
      <button
        type="button"
        disabled={activeIdx >= pages.length - 1}
        onClick={() => onNavigate(activeIdx + 1)}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors shrink-0"
        aria-label="Próxima página"
        title="Próxima página (→)"
      >
        <ChevronRight size={13} />
      </button>
    </nav>
  );
}
