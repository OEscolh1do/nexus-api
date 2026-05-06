import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Type, Image, Star, Droplets, Minus, BarChart2, TrendingUp,
  Table, ListOrdered, Map, Zap, LayoutTemplate,
  Sun, CandlestickChart, Activity, PieChart, Layers, BarChart,
  Braces, Square, Sparkles, LayoutGrid, Shield, ALargeSmall, Cpu,
} from 'lucide-react';
import type { CanvasElementType } from './types';
import { DEFAULT_ELEMENT_PROPS } from './types';
import type { CanvasPreset } from './presets';
import { ALL_PRESETS } from './presets';
import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PaletteItem {
  type: CanvasElementType;
  label: string;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
}

// ─── Catálogos de itens ───────────────────────────────────────────────────────

const DYNAMIC_ITEMS: PaletteItem[] = [
  { type: 'placeholder', label: 'Campo Dinâmico', icon: <Braces size={14} />, defaultWidth: 240, defaultHeight: 32 },
];

const CONTENT_ITEMS: PaletteItem[] = [
  { type: 'kpi-box',           label: 'KPI Box',            icon: <Zap size={14} />,           defaultWidth: 160, defaultHeight: 80  },
  { type: 'chart-generation',  label: 'Gráfico Geração',    icon: <BarChart2 size={14} />,      defaultWidth: 360, defaultHeight: 200 },
  { type: 'chart-financial',   label: 'Gráfico Financeiro', icon: <TrendingUp size={14} />,     defaultWidth: 360, defaultHeight: 200 },
  { type: 'payment-table',     label: 'Tab. Investimento',  icon: <Table size={14} />,          defaultWidth: 340, defaultHeight: 180 },
  { type: 'schedule-timeline', label: 'Cronograma',         icon: <ListOrdered size={14} />,    defaultWidth: 680, defaultHeight: 280 },
  { type: 'map-static',        label: 'Mapa Estático',      icon: <Map size={14} />,            defaultWidth: 320, defaultHeight: 200 },
];

const PROJECTION_ITEMS: PaletteItem[] = [
  { type: 'chart-gen-consumption',   label: 'Geração vs Consumo',  icon: <BarChart2 size={14} />,       defaultWidth: 400, defaultHeight: 220 },
  { type: 'chart-roi',               label: 'Retorno Acumulado',   icon: <TrendingUp size={14} />,      defaultWidth: 400, defaultHeight: 220 },
  { type: 'chart-financial-balance', label: 'Balanço Financeiro',  icon: <CandlestickChart size={14} />,defaultWidth: 380, defaultHeight: 220 },
  { type: 'chart-credit-bank',       label: 'Banco de Créditos',   icon: <Activity size={14} />,        defaultWidth: 400, defaultHeight: 200 },
  { type: 'chart-daily',             label: 'Geração Diária',      icon: <Sun size={14} />,             defaultWidth: 380, defaultHeight: 180 },
  { type: 'chart-loss-waterfall',    label: 'Análise de Perdas',   icon: <Layers size={14} />,          defaultWidth: 360, defaultHeight: 200 },
  { type: 'kpi-projection',          label: 'KPI Projeção',        icon: <PieChart size={14} />,        defaultWidth: 180, defaultHeight: 80  },
  { type: 'table-analytics',         label: 'Tabela Analítica',    icon: <BarChart size={14} />,        defaultWidth: 700, defaultHeight: 300 },
];

const DESIGN_ITEMS: PaletteItem[] = [
  { type: 'text',      label: 'Texto',         icon: <Type size={14} />,        defaultWidth: 240, defaultHeight: 40  },
  { type: 'box',       label: 'Caixa',         icon: <Square size={14} />,      defaultWidth: 200, defaultHeight: 80  },
  { type: 'icon',      label: 'Ícone',         icon: <Sparkles size={14} />,    defaultWidth: 40,  defaultHeight: 40  },
  { type: 'image',     label: 'Imagem',        icon: <Image size={14} />,       defaultWidth: 240, defaultHeight: 160 },
  { type: 'logo',      label: 'Logo',          icon: <Star size={14} />,        defaultWidth: 120, defaultHeight: 50  },
  { type: 'watermark', label: 'Marca d\'água', icon: <Droplets size={14} />,    defaultWidth: 400, defaultHeight: 200 },
  { type: 'divider',   label: 'Divisória',     icon: <Minus size={14} />,       defaultWidth: 600, defaultHeight: 16  },
];

// Dimensionamento (elementos monolíticos — mantidos como atalho)
const TECHNICAL_ITEMS: PaletteItem[] = [
  { type: 'section-header',     label: 'Cabeçalho de Seção',     icon: <ALargeSmall size={14} />, defaultWidth: 500, defaultHeight: 130 },
  { type: 'kpi-capacity-badge', label: 'Badge (monolítico)',      icon: <Layers size={14} />,      defaultWidth: 325, defaultHeight: 100 },
  { type: 'guarantees-list',    label: 'Lista de Garantias',      icon: <Shield size={14} />,      defaultWidth: 325, defaultHeight: 240 },
  { type: 'equipment-panel',    label: 'Painel (monolítico)',     icon: <Cpu size={14} />,         defaultWidth: 343, defaultHeight: 150 },
];

// ─── DraggableItem — elemento único ──────────────────────────────────────────

function DraggableItem({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      fromPalette:   true,
      isPreset:      false,
      elementType:   item.type,
      defaultWidth:  item.defaultWidth,
      defaultHeight: item.defaultHeight,
      defaultProps:  DEFAULT_ELEMENT_PROPS[item.type],
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border border-transparent',
        'text-xs text-slate-600 cursor-grab select-none',
        'hover:bg-slate-100 hover:border-slate-200 active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
    >
      <span className="text-slate-400">{item.icon}</span>
      <span>{item.label}</span>
    </div>
  );
}

// ─── DraggablePreset — combinação de elementos ────────────────────────────────

const PRESET_ICONS: Record<string, React.ReactNode> = {
  'kpi-badge':         <Layers size={14} />,
  'equipment-panel':   <Cpu size={14} />,
  'section-header':    <ALargeSmall size={14} />,
  'kpi-card':          <PieChart size={14} />,
  'guarantee-bullet':  <Shield size={14} />,
};

function DraggablePreset({ preset }: { preset: CanvasPreset }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `preset-${preset.id}`,
    data: {
      fromPalette:    true,
      isPreset:       true,
      presetId:       preset.id,
      defaultWidth:   preset.defaultWidth,
      defaultHeight:  preset.defaultHeight,
      presetElements: preset.elements,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={preset.description}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border border-transparent',
        'text-xs text-slate-600 cursor-grab select-none',
        'hover:bg-indigo-50 hover:border-indigo-200 active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
    >
      <span className="text-indigo-400">{PRESET_ICONS[preset.id] ?? <LayoutGrid size={14} />}</span>
      <span className="flex-1">{preset.label}</span>
      <span className="text-[9px] text-indigo-300 font-medium bg-indigo-50 px-1 rounded">
        {preset.elements.length} el.
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  hasCustomLayout: boolean;
}

export function ElementPalette({ hasCustomLayout }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-r border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 shrink-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Elementos</p>
      </div>

      {!hasCustomLayout && (
        <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 shrink-0">
          <div className="flex items-center gap-1.5 font-medium mb-1">
            <LayoutTemplate size={12} />
            Template Clássico ativo
          </div>
          <p className="leading-relaxed">Arraste um item para a página. O template será clonado automaticamente.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">

        {/* Presets — composições de múltiplos elementos */}
        <div className="px-3 py-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Presets</p>
            <span className="text-[9px] text-indigo-300">· adicionam vários elementos</span>
          </div>
          {ALL_PRESETS.map((preset) => (
            <DraggablePreset key={preset.id} preset={preset} />
          ))}
        </div>

        {/* Campos dinâmicos */}
        <div className="px-3 py-1.5 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Campos Dinâmicos</p>
          {DYNAMIC_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        {/* Design (primitivos) */}
        <div className="px-3 py-1.5 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Design</p>
          {DESIGN_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        {/* Projeção */}
        <div className="px-3 py-1.5 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Projeção</p>
          {PROJECTION_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        {/* Conteúdo */}
        <div className="px-3 py-1.5 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Conteúdo</p>
          {CONTENT_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        {/* Dimensionamento (atalhos monolíticos — legado) */}
        <div className="px-3 py-1.5 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Dimensionamento</p>
          {TECHNICAL_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

      </div>
    </div>
  );
}
