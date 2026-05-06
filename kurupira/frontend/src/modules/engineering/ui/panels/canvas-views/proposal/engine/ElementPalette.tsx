import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Type, Image, Star, Droplets, Minus, BarChart2, TrendingUp,
  Table, ListOrdered, Map, Zap, LayoutTemplate,
  Sun, CandlestickChart, Activity, PieChart, Layers, BarChart,
  Braces,
} from 'lucide-react';
import type { CanvasElementType } from './types';
import { DEFAULT_ELEMENT_PROPS } from './types';
import { cn } from '@/lib/utils';

interface PaletteItem {
  type: CanvasElementType;
  label: string;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
}

const CONTENT_ITEMS: PaletteItem[] = [
  { type: 'kpi-box',            label: 'KPI Box',         icon: <Zap size={14} />,          defaultWidth: 160, defaultHeight: 80  },
  { type: 'chart-generation',   label: 'Gráfico Geração', icon: <BarChart2 size={14} />,     defaultWidth: 360, defaultHeight: 200 },
  { type: 'chart-financial',    label: 'Gráfico Financeiro', icon: <TrendingUp size={14} />, defaultWidth: 360, defaultHeight: 200 },
  { type: 'payment-table',      label: 'Tab. Investimento', icon: <Table size={14} />,       defaultWidth: 340, defaultHeight: 180 },
  { type: 'schedule-timeline',  label: 'Cronograma',      icon: <ListOrdered size={14} />,   defaultWidth: 680, defaultHeight: 280 },
  { type: 'map-static',         label: 'Mapa Estático',   icon: <Map size={14} />,           defaultWidth: 320, defaultHeight: 200 },
];

const DYNAMIC_ITEMS: PaletteItem[] = [
  { type: 'placeholder', label: 'Campo Dinâmico', icon: <Braces size={14} />, defaultWidth: 240, defaultHeight: 32 },
];

const PROJECTION_ITEMS: PaletteItem[] = [
  { type: 'chart-gen-consumption',  label: 'Geração vs Consumo',   icon: <BarChart2 size={14} />,      defaultWidth: 400, defaultHeight: 220 },
  { type: 'chart-roi',              label: 'Retorno Acumulado',     icon: <TrendingUp size={14} />,     defaultWidth: 400, defaultHeight: 220 },
  { type: 'chart-financial-balance',label: 'Balanço Financeiro',    icon: <CandlestickChart size={14}/>,defaultWidth: 380, defaultHeight: 220 },
  { type: 'chart-credit-bank',      label: 'Banco de Créditos',     icon: <Activity size={14} />,       defaultWidth: 400, defaultHeight: 200 },
  { type: 'chart-daily',            label: 'Geração Diária',        icon: <Sun size={14} />,            defaultWidth: 380, defaultHeight: 180 },
  { type: 'chart-loss-waterfall',   label: 'Análise de Perdas',     icon: <Layers size={14} />,         defaultWidth: 360, defaultHeight: 200 },
  { type: 'kpi-projection',         label: 'KPI Projeção',          icon: <PieChart size={14} />,       defaultWidth: 180, defaultHeight: 80  },
  { type: 'table-analytics',        label: 'Tabela Analítica',      icon: <BarChart size={14} />,       defaultWidth: 700, defaultHeight: 300 },
];

const DESIGN_ITEMS: PaletteItem[] = [
  { type: 'text',      label: 'Texto',        icon: <Type size={14} />,         defaultWidth: 240, defaultHeight: 40  },
  { type: 'image',     label: 'Imagem',       icon: <Image size={14} />,        defaultWidth: 240, defaultHeight: 160 },
  { type: 'logo',      label: 'Logo',         icon: <Star size={14} />,         defaultWidth: 120, defaultHeight: 50  },
  { type: 'watermark', label: 'Marca d\'água', icon: <Droplets size={14} />,   defaultWidth: 400, defaultHeight: 200 },
  { type: 'divider',   label: 'Divisória',    icon: <Minus size={14} />,        defaultWidth: 600, defaultHeight: 16  },
];

interface DraggableItemProps {
  item: PaletteItem;
}

function DraggableItem({ item }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      fromPalette: true,
      elementType: item.type,
      defaultWidth: item.defaultWidth,
      defaultHeight: item.defaultHeight,
      defaultProps: DEFAULT_ELEMENT_PROPS[item.type],
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
          <p className="leading-relaxed">Para adicionar elementos, arraste um item abaixo. O template clássico será clonado automaticamente.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Campos Dinâmicos</p>
          {DYNAMIC_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        <div className="px-3 py-1.5 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Conteúdo</p>
          {CONTENT_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        <div className="px-3 py-1.5 border-t border-slate-100 mt-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 mt-1">
            Projeção
          </p>
          {PROJECTION_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>

        <div className="px-3 py-1.5 border-t border-slate-100 mt-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 mt-1">Design</p>
          {DESIGN_ITEMS.map((item) => (
            <DraggableItem key={item.type} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
