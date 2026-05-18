import React, { useMemo, useRef } from 'react';
import { Plus, Trash2, Copy, EyeOff } from 'lucide-react';
import { CanvasElementRenderer } from './CanvasElementRenderer';
import { getPageDimensions, parseBackgroundImageUrl } from './types';
import type { CanvasPage, CanvasElement } from './types';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const THUMB_W = 116; // thumbnail display width in px

// These types are inexpensive to render at thumbnail scale.
// Heavy types (page-*, chart-*, kpi-capacity-badge, etc.) get a colored placeholder
// instead to avoid spinning up Recharts / full page components per thumbnail.
const CHEAP_TYPES = new Set([
  'text', 'box', 'image', 'logo', 'watermark', 'divider', 'icon', 'placeholder',
]);

// Accent color used in the placeholder block for expensive element types.
function placeholderColor(type: string): string {
  if (type.startsWith('page-'))          return '#1e293b';
  if (type.startsWith('chart-'))         return '#0ea5e9';
  if (type.startsWith('kpi-'))           return '#10b981';
  if (type.startsWith('table-'))         return '#6366f1';
  if (type === 'section-header')         return '#94a3b8';
  if (type === 'equipment-panel')        return '#f59e0b';
  if (type === 'guarantees-list')        return '#22c55e';
  return '#64748b';
}

// ─── Lightweight element renderer for thumbnails ───────────────────────────────

function ThumbnailEl({ el }: { el: CanvasElement }) {
  if (CHEAP_TYPES.has(el.type)) {
    return <CanvasElementRenderer element={el} />;
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: placeholderColor(el.type),
        opacity: el.type.startsWith('page-') ? 0.85 : 0.18,
        borderRadius: 2,
      }}
    />
  );
}

// ─── Individual page card ─────────────────────────────────────────────────────

interface PageCardProps {
  page: CanvasPage;
  index: number;
  isActive: boolean;
  isExcluded: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

const PageCard = React.memo(function PageCard({
  page, index, isActive, isExcluded, canRemove,
  onSelect, onDuplicate, onRemove,
}: PageCardProps) {
  const { width: pageW, height: pageH } = getPageDimensions(page.orientation);
  const thumbScale = THUMB_W / pageW;
  const thumbH = Math.round(pageH * thumbScale);

  const background = useMemo(() => {
    if (page.background.gradient) return page.background.gradient;
    if (page.background.imageUrl) {
      const { url, size } = parseBackgroundImageUrl(page.background.imageUrl);
      return `url(${url}) center/${size} no-repeat`;
    }
    return page.background.color ?? '#ffffff';
  }, [page.background]);

  const sortedElements = useMemo(
    () => [...page.elements].sort((a, b) => a.zIndex - b.zIndex),
    [page.elements],
  );

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center gap-1.5 px-2.5 py-2 cursor-pointer rounded transition-colors select-none',
        isActive ? 'bg-indigo-500/10' : 'hover:bg-slate-800/50',
      )}
      onClick={onSelect}
    >
      {/* Thumbnail frame */}
      <div
        className={cn(
          'relative rounded overflow-hidden shadow-lg transition-all shrink-0',
          isActive
            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950'
            : 'ring-1 ring-white/10 group-hover:ring-slate-600',
        )}
        style={{ width: THUMB_W, height: thumbH }}
      >
        {/* Scaled page content */}
        <div
          style={{
            width: pageW,
            height: pageH,
            transform: `scale(${thumbScale})`,
            transformOrigin: 'top left',
            background,
            position: 'relative',
            pointerEvents: 'none',
          }}
        >
          {sortedElements.map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                opacity: el.visible ? (el.opacity ?? 1) : 0,
                zIndex: el.zIndex,
                overflow: 'hidden',
                transform: `rotate(${el.rotation ?? 0}deg) scaleX(${el.flipX ? -1 : 1}) scaleY(${el.flipY ? -1 : 1})`,
                transformOrigin: 'center center',
              }}
            >
              <ThumbnailEl el={el} />
            </div>
          ))}
        </div>

        {/* Excluded-from-PDF overlay */}
        {isExcluded && (
          <div className="absolute inset-0 bg-slate-950/55 flex flex-col items-center justify-center gap-1">
            <EyeOff size={13} className="text-amber-400" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400/80">
              Excluída
            </span>
          </div>
        )}

        {/* Page number badge */}
        <div
          className={cn(
            'absolute bottom-1 left-1 text-[8px] font-black tabular-nums px-1 py-0.5 rounded',
            isActive ? 'bg-indigo-500 text-white' : 'bg-black/50 text-slate-300',
          )}
        >
          {index + 1}
        </div>

        {/* Hover action buttons */}
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Duplicar página"
            aria-label="Duplicar página"
            onClick={onDuplicate}
            className="p-0.5 rounded bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Copy size={9} />
          </button>
          {canRemove && (
            <button
              type="button"
              title="Remover página"
              aria-label="Remover página"
              onClick={onRemove}
              className="p-0.5 rounded bg-slate-900/80 text-slate-300 hover:text-red-400 hover:bg-red-950/60 transition-colors"
            >
              <Trash2 size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-[10px] font-medium truncate w-full text-center leading-none',
          isActive ? 'text-indigo-400' : 'text-slate-500',
          isExcluded && 'opacity-50',
        )}
      >
        {page.label || `Página ${index + 1}`}
      </span>
    </div>
  );
});

// ─── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  pages: CanvasPage[];
  activeIdx: number;
  excludedPages?: number[];
  onNavigate: (idx: number) => void;
  onAddPage: () => void;
  onDuplicate: (pageId: string) => void;
  onRemove: (pageId: string) => void;
}

export function PagesThumbnailPanel({
  pages,
  activeIdx,
  excludedPages = [],
  onNavigate,
  onAddPage,
  onDuplicate,
  onRemove,
}: Props) {
  const activeRef = useRef<HTMLDivElement>(null);

  // Scroll the active card into view whenever the active page changes.
  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeIdx]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800 bg-slate-900/20">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
        </span>
      </div>

      {/* Scrollable thumbnail list */}
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {pages.map((page, idx) => (
          <div
            key={page.id}
            ref={idx === activeIdx ? activeRef : undefined}
          >
            <PageCard
              page={page}
              index={idx}
              isActive={idx === activeIdx}
              isExcluded={excludedPages.includes(idx)}
              canRemove={pages.length > 1}
              onSelect={() => onNavigate(idx)}
              onDuplicate={(e) => { e.stopPropagation(); onDuplicate(page.id); }}
              onRemove={(e) => { e.stopPropagation(); onRemove(page.id); }}
            />
          </div>
        ))}
      </div>

      {/* Add page footer */}
      <div className="shrink-0 px-3 py-2 border-t border-slate-800 bg-slate-900/10">
        <button
          type="button"
          onClick={onAddPage}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 rounded-sm border border-dashed border-slate-700 hover:border-indigo-500/40 transition-colors"
        >
          <Plus size={11} />
          Nova página
        </button>
      </div>
    </div>
  );
}
