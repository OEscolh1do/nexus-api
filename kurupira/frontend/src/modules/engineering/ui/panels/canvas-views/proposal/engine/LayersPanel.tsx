import React, { useMemo, useRef, useState } from 'react';
import {
  Eye, EyeOff, Lock, LockOpen, Trash2, Link2Off,
  Type, ImageIcon, Tag, Droplets, Minus, BarChart2, TrendingUp,
  Table, Map as MapIcon, FileText, Braces, Layers, Sun, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasElement } from './types';

// ─── Metadata per element type ────────────────────────────────────────────────

interface TypeMeta { label: string; icon: React.ReactNode }

const TYPE_META: Partial<Record<string, TypeMeta>> = {
  'page-cover':             { label: 'Capa',              icon: <FileText       size={11} /> },
  'page-investment':        { label: 'Investimento',      icon: <FileText       size={11} /> },
  'page-technical':         { label: 'Técnica',           icon: <FileText       size={11} /> },
  'page-schedule':          { label: 'Cronograma',        icon: <FileText       size={11} /> },
  'page-contact':           { label: 'Contato',           icon: <FileText       size={11} /> },
  'text':                   { label: 'Texto',             icon: <Type           size={11} /> },
  'image':                  { label: 'Imagem',            icon: <ImageIcon      size={11} /> },
  'logo':                   { label: 'Logo',              icon: <Tag            size={11} /> },
  'watermark':              { label: 'Marca d\'água',     icon: <Droplets       size={11} /> },
  'divider':                { label: 'Divisória',         icon: <Minus          size={11} /> },
  'kpi-box':                { label: 'KPI Box',           icon: <Layers         size={11} /> },
  'chart-generation':       { label: 'Gráfico Geração',  icon: <BarChart2      size={11} /> },
  'chart-financial':        { label: 'Gráfico Financ.',  icon: <TrendingUp     size={11} /> },
  'payment-table':          { label: 'Tabela Invest.',   icon: <Table          size={11} /> },
  'schedule-timeline':      { label: 'Cronograma',       icon: <FileText       size={11} /> },
  'map-static':             { label: 'Mapa',             icon: <MapIcon        size={11} /> },
  'chart-gen-consumption':  { label: 'Ger. vs Consumo',  icon: <BarChart2      size={11} /> },
  'chart-roi':              { label: 'ROI Acumulado',    icon: <TrendingUp     size={11} /> },
  'chart-financial-balance':{ label: 'Saldo Financeiro', icon: <TrendingUp     size={11} /> },
  'chart-credit-bank':      { label: 'Banco de Crédito', icon: <Wallet         size={11} /> },
  'chart-daily':            { label: 'Geração Diária',   icon: <Sun            size={11} /> },
  'chart-loss-waterfall':   { label: 'Perdas (Cascata)', icon: <BarChart2      size={11} /> },
  'kpi-projection':         { label: 'KPI Projeção',     icon: <Layers         size={11} /> },
  'table-analytics':        { label: 'Tabela Analítica', icon: <Table          size={11} /> },
  'placeholder':            { label: 'Campo Dinâmico',   icon: <Braces         size={11} /> },
};

function getMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? { label: type, icon: <Layers size={11} /> };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onRemove: (id: string) => void;
  /** Called when the user reorders layers via drag-and-drop.
   *  Receives all element IDs in the new desired order (descending z-index: index 0 = frontmost). */
  onReorderElements?: (orderedIds: string[]) => void;
}

// ─── Shared action buttons ────────────────────────────────────────────────────

function LayerRowActions({ el, onUpdate, onRemove, showRemove }: {
  el: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        title={el.visible ? 'Ocultar' : 'Mostrar'}
        aria-label={el.visible ? 'Ocultar elemento' : 'Mostrar elemento'}
        onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { visible: !el.visible }); }}
        className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
      >
        {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
      </button>
      <button
        title={el.locked ? 'Desbloquear' : 'Bloquear'}
        aria-label={el.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}
        onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { locked: !el.locked }); }}
        className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
      >
        {el.locked ? <Lock size={11} /> : <LockOpen size={11} />}
      </button>
      {showRemove && onRemove && (
        <button
          title="Excluir elemento"
          aria-label="Excluir elemento"
          onClick={(e) => { e.stopPropagation(); onRemove(el.id); }}
          className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LayersPanel({ elements, selectedIds, onSelect, onUpdate, onRemove, onReorderElements }: Props) {
  // Native HTML5 drag state
  const dragIdRef   = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...elements].sort((a, b) => b.zIndex - a.zIndex),
    [elements],
  );

  // Single O(n) pass: partition into groups and ungrouped list.
  const { grouped, ungrouped } = useMemo(() => {
    const groupMap = new Map<string, CanvasElement[]>();
    const ungroupedList: CanvasElement[] = [];

    sorted.forEach((el) => {
      if (el.groupId) {
        const existing = groupMap.get(el.groupId);
        if (existing) {
          existing.push(el);
        } else {
          groupMap.set(el.groupId, [el]);
        }
      } else {
        ungroupedList.push(el);
      }
    });

    return { grouped: Array.from(groupMap.entries()), ungrouped: ungroupedList };
  }, [sorted]);

  const handleSelectElement = (element: CanvasElement) => {
    if (element.groupId) {
      const groupMembers = elements
        .filter((e) => e.groupId === element.groupId)
        .map((e) => e.id);
      onSelect(groupMembers);
    } else {
      onSelect([element.id]);
    }
  };

  const handleUngroupElements = (groupId: string) => {
    elements
      .filter((e) => e.groupId === groupId)
      .forEach((e) => onUpdate(e.id, { groupId: undefined }));
    onSelect([]);
  };

  // ── Native HTML5 drag-and-drop handlers for ungrouped rows ────────────────

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== dragIdRef.current) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragIdRef.current;
    setDragOverId(null);
    dragIdRef.current = null;
    if (!sourceId || sourceId === targetId) return;

    const ungroupedIds = ungrouped.map((el) => el.id);
    const oldIndex = ungroupedIds.indexOf(sourceId);
    const newIndex = ungroupedIds.indexOf(targetId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = [...ungroupedIds];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, sourceId);

    if (onReorderElements) {
      // Reconstruct full ordered list preserving grouped element positions
      const fullReordered: string[] = [];
      let cursor = 0;
      sorted.forEach((el) => {
        if (!el.groupId) {
          fullReordered.push(next[cursor++]);
        } else {
          fullReordered.push(el.id);
        }
      });
      onReorderElements(fullReordered);
    } else {
      // Fallback: reassign zIndex directly
      const total = next.length;
      next.forEach((id, i) => {
        onUpdate(id, { zIndex: (total - i) * 10 });
      });
    }
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    dragIdRef.current = null;
  };

  if (sorted.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs p-6 text-center">
        <Layers size={24} className="opacity-40" />
        <p>Nenhum elemento nesta página.</p>
        <p className="text-slate-500">Arraste elementos da aba <strong>Elementos</strong> para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Camadas — {sorted.length} elemento{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Layer rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Render grouped elements (not draggable as units) */}
        {grouped.map(([groupId, members]) => {
          const allSelected = members.every((m) => selectedIds.includes(m.id));
          const firstMember = members[0];
          if (!firstMember) return null;

          return (
            <div key={groupId}>
              {/* Group header */}
              <div
                onClick={() => onSelect(members.map((m) => m.id))}
                className={cn(
                  'group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer border-b border-slate-800/40 transition-colors bg-indigo-500/5',
                  allSelected && 'bg-indigo-500/10 border-l-2 border-l-indigo-500',
                  !allSelected && 'border-l-2 border-l-transparent hover:bg-slate-800/40',
                )}
              >
                <span className={cn('shrink-0', allSelected ? 'text-indigo-500' : 'text-slate-400')}>
                  <Layers size={11} />
                </span>
                <span className={cn('flex-1 text-xs truncate', allSelected ? 'text-indigo-400 font-bold' : 'text-slate-400')}>
                  Grupo ({members.length} elementos)
                </span>
                <button
                  title="Desagrupar"
                  onClick={(e) => { e.stopPropagation(); handleUngroupElements(groupId); }}
                  className="p-0.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                >
                  <Link2Off size={11} />
                </button>
              </div>

              {/* Group members (indented, non-sortable) */}
              {members.map((el) => {
                const meta = getMeta(el.type);
                const isSelected = selectedIds.includes(el.id);

                return (
                  <div
                    key={el.id}
                    onClick={() => handleSelectElement(el)}
                    className={cn(
                      'group flex items-center gap-2 pl-6 pr-2.5 py-1.5 cursor-pointer border-b border-slate-800/40 transition-colors',
                      isSelected
                        ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                        : 'hover:bg-slate-800/40 border-l-2 border-l-transparent',
                      !el.visible && 'opacity-50',
                    )}
                  >
                    <span className={cn('shrink-0', isSelected ? 'text-blue-500' : 'text-slate-400')}>
                      {meta.icon}
                    </span>
                    <span className={cn('flex-1 text-xs truncate', isSelected ? 'text-blue-400 font-bold' : 'text-slate-500')}>
                      {meta.label}
                    </span>
                    <div className={cn('transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                      <LayerRowActions el={el} onUpdate={onUpdate} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Render ungrouped elements with native HTML5 drag-and-drop */}
        {ungrouped.map((el) => {
          const meta = getMeta(el.type);
          const isSelected = selectedIds.includes(el.id);
          const isDropTarget = dragOverId === el.id;

          return (
            <div
              key={el.id}
              draggable
              onDragStart={() => handleDragStart(el.id)}
              onDragOver={(e) => handleDragOver(e, el.id)}
              onDrop={(e) => handleDrop(e, el.id)}
              onDragEnd={handleDragEnd}
              onClick={() => handleSelectElement(el)}
              className={cn(
                'group flex items-center gap-1.5 px-1.5 py-1.5 cursor-pointer border-b border-slate-800/40 transition-colors',
                isSelected
                  ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                  : 'hover:bg-slate-800/40 border-l-2 border-l-transparent',
                !el.visible && 'opacity-50',
                isDropTarget && 'border-t-2 border-t-indigo-400',
              )}
            >
              {/* Drag handle */}
              <span
                role="button"
                tabIndex={-1}
                title="Arrastar para reordenar"
                aria-label="Arrastar para reordenar camada"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 px-0.5 select-none"
                style={{ fontSize: 13, lineHeight: 1 }}
              >
                ⠿
              </span>
              <span className={cn('shrink-0', isSelected ? 'text-blue-500' : 'text-slate-400')}>
                {meta.icon}
              </span>
              <span className={cn('flex-1 text-xs truncate', isSelected ? 'text-blue-400 font-bold' : 'text-slate-500')}>
                {meta.label}
              </span>
              <div className={cn('transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                <LayerRowActions el={el} onUpdate={onUpdate} onRemove={onRemove} showRemove />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800 bg-slate-900/40">
        <p className="text-[9px] text-slate-500 leading-relaxed font-mono uppercase tracking-widest">
          ⠿ Arrastar · Clique para selecionar · ↑ Frente · ↓ Fundo
        </p>
      </div>
    </div>
  );
}
