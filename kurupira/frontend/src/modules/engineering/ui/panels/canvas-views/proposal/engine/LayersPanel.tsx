/**
 * LayersPanel.tsx
 *
 * Painel de camadas: lista todos os elementos da página atual ordenados por
 * z-index (frente → fundo). Permite reordenar, alternar visibilidade/trava e
 * selecionar/excluir elementos.
 */

import React from 'react';
import {
  Eye, EyeOff, Lock, LockOpen, ArrowUp, ArrowDown, Trash2, Link2Off,
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

// ─── Reorder helpers ──────────────────────────────────────────────────────────

/**
 * Returns z-index updates for moving one element up (toward front) or down in
 * the stack. The sorted array is descending by z-index (index 0 = frontmost).
 * Moving "up" in the list = higher z-index = toward the front.
 */
function buildReorderUpdates(
  sorted: CanvasElement[],
  elementId: string,
  direction: 'up' | 'down',
): Array<{ id: string; zIndex: number }> {
  const idx = sorted.findIndex((e) => e.id === elementId);
  if (idx < 0) return [];

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return [];

  // Clone the sorted array and swap positions
  const next = [...sorted];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

  // Assign new z-indexes: highest position (index 0) → highest z-index
  const total = next.length;
  return next.map((el, i) => ({ id: el.id, zIndex: (total - i) * 10 }));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onRemove: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LayersPanel({ elements, selectedIds, onSelect, onUpdate, onRemove }: Props) {
  // Sort descending by z-index: index 0 = frontmost element
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  // Group elements by groupId — single-pass O(n) using a Map
  const groupMap = new Map<string, CanvasElement[]>();
  const ungrouped: CanvasElement[] = [];

  sorted.forEach((el) => {
    if (el.groupId) {
      const existing = groupMap.get(el.groupId);
      if (existing) {
        existing.push(el);
      } else {
        groupMap.set(el.groupId, [el]);
      }
    } else {
      ungrouped.push(el);
    }
  });

  const grouped = Array.from(groupMap.entries());

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const updates = buildReorderUpdates(sorted, id, direction);
    updates.forEach(({ id: elId, zIndex }) => onUpdate(elId, { zIndex }));
  };

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
        {/* Render grouped elements */}
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

              {/* Group members (indented) */}
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
                    <div className={cn('flex items-center gap-0.5 shrink-0 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                      <button title={el.visible ? 'Ocultar' : 'Mostrar'} onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { visible: !el.visible }); }} className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200">
                        {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                      </button>
                      <button title={el.locked ? 'Desbloquear' : 'Bloquear'} onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { locked: !el.locked }); }} className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200">
                        {el.locked ? <Lock size={11} /> : <LockOpen size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Render ungrouped elements */}
        {ungrouped.map((el) => {
          const meta = getMeta(el.type);
          const isSelected = selectedIds.includes(el.id);
          // Position in the full sorted stack (includes grouped elements)
          const sortedIdx = sorted.findIndex((s) => s.id === el.id);
          const isFirst = sortedIdx === 0;
          const isLast  = sortedIdx === sorted.length - 1;

          return (
            <div
              key={el.id}
              onClick={() => handleSelectElement(el)}
              className={cn(
                'group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer border-b border-slate-800/40 transition-colors',
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
              <div className={cn('flex items-center gap-0.5 shrink-0 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                <button title="Mover para frente" disabled={isFirst} onClick={(e) => { e.stopPropagation(); handleMove(el.id, 'up'); }} className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200">
                  <ArrowUp size={11} />
                </button>
                <button title="Mover para trás" disabled={isLast} onClick={(e) => { e.stopPropagation(); handleMove(el.id, 'down'); }} className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200">
                  <ArrowDown size={11} />
                </button>
                <button title={el.visible ? 'Ocultar' : 'Mostrar'} onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { visible: !el.visible }); }} className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200">
                  {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
                <button title={el.locked ? 'Desbloquear' : 'Bloquear'} onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { locked: !el.locked }); }} className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200">
                  {el.locked ? <Lock size={11} /> : <LockOpen size={11} />}
                </button>
                <button title="Excluir elemento" onClick={(e) => { e.stopPropagation(); onRemove(el.id); }} className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800 bg-slate-900/40">
        <p className="text-[9px] text-slate-500 leading-relaxed font-mono uppercase tracking-widest">
          ↑ Frente · ↓ Fundo · Clique para selecionar
        </p>
      </div>
    </div>
  );
}
