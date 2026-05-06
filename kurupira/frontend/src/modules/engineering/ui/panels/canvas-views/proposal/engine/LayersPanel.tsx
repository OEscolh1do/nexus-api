/**
 * LayersPanel.tsx
 *
 * Painel de camadas: lista todos os elementos da página atual ordenados por
 * z-index (frente → fundo). Permite reordenar, alternar visibilidade/trava e
 * selecionar/excluir elementos.
 */

import React from 'react';
import {
  Eye, EyeOff, Lock, LockOpen, ArrowUp, ArrowDown, Trash2,
  Type, ImageIcon, Tag, Droplets, Minus, BarChart2, TrendingUp,
  Table, Map, FileText, Braces, Layers, Sun, Wallet,
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
  'map-static':             { label: 'Mapa',             icon: <Map            size={11} /> },
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
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onRemove: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LayersPanel({ elements, selectedId, onSelect, onUpdate, onRemove }: Props) {
  // Sort descending by z-index: index 0 = frontmost element
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const updates = buildReorderUpdates(sorted, id, direction);
    updates.forEach(({ id: elId, zIndex }) => onUpdate(elId, { zIndex }));
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
      <div className="shrink-0 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Camadas — {sorted.length} elemento{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Layer rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((el, idx) => {
          const meta      = getMeta(el.type);
          const isSelected = el.id === selectedId;
          const isFirst   = idx === 0;
          const isLast    = idx === sorted.length - 1;

          return (
            <div
              key={el.id}
              onClick={() => onSelect(el.id)}
              className={cn(
                'group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer border-b border-slate-100 transition-colors',
                isSelected
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : 'hover:bg-slate-50 border-l-2 border-l-transparent',
                !el.visible && 'opacity-50',
              )}
            >
              {/* Type icon */}
              <span className={cn('shrink-0', isSelected ? 'text-blue-500' : 'text-slate-400')}>
                {meta.icon}
              </span>

              {/* Label */}
              <span className={cn(
                'flex-1 text-xs truncate',
                isSelected ? 'text-blue-700 font-medium' : 'text-slate-600',
              )}>
                {meta.label}
              </span>

              {/* Controls — visible on hover or when selected */}
              <div className={cn(
                'flex items-center gap-0.5 shrink-0 transition-opacity',
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}>
                {/* Move up (toward front) */}
                <button
                  title="Mover para frente"
                  disabled={isFirst}
                  onClick={(e) => { e.stopPropagation(); handleMove(el.id, 'up'); }}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200"
                >
                  <ArrowUp size={11} />
                </button>

                {/* Move down (toward back) */}
                <button
                  title="Mover para trás"
                  disabled={isLast}
                  onClick={(e) => { e.stopPropagation(); handleMove(el.id, 'down'); }}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200"
                >
                  <ArrowDown size={11} />
                </button>

                {/* Visibility toggle */}
                <button
                  title={el.visible ? 'Ocultar' : 'Mostrar'}
                  onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { visible: !el.visible }); }}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  {el.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>

                {/* Lock toggle */}
                <button
                  title={el.locked ? 'Desbloquear' : 'Bloquear'}
                  onClick={(e) => { e.stopPropagation(); onUpdate(el.id, { locked: !el.locked }); }}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  {el.locked ? <Lock size={11} /> : <LockOpen size={11} />}
                </button>

                {/* Delete */}
                <button
                  title="Excluir elemento"
                  onClick={(e) => { e.stopPropagation(); onRemove(el.id); }}
                  className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-100 bg-slate-50">
        <p className="text-[9px] text-slate-400 leading-relaxed">
          ↑ Frente · ↓ Fundo · Clique para selecionar
        </p>
      </div>
    </div>
  );
}
