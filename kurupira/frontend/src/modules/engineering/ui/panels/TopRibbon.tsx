/**
 * =============================================================================
 * TOP RIBBON — Comandos O(1) e Contexto Global (UX-001 Fase 3)
 * =============================================================================
 *
 * Barra horizontal fixada no topo do Workspace.
 * Abriga os controlos globais e disparadores de simulação.
 * Modos de ferramenta: Cursor, Desenhar Polígono, Medir, Colocar Módulos.
 *
 * Consome `activeTool` do Zustand Store (ou via props para isolamento).
 * =============================================================================
 */

import React from 'react';
import {
  MousePointer2, Pentagon, Ruler, LayoutGrid,
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen,
  Undo2, Redo2, Download, LayoutDashboard
} from 'lucide-react';
import type { ActiveTool } from '../layout/WorkspaceLayout';
import { useSolarStore } from '@/core/state/solarStore';

// =============================================================================
// TOOL CONFIG
// =============================================================================

interface ToolConfig {
  id: ActiveTool;
  icon: React.ElementType;
  label: string;
  shortcut: string;
}

const TOOLS: ToolConfig[] = [
  { id: 'SELECT', icon: MousePointer2, label: 'Selecionar', shortcut: 'V' },
  { id: 'POLYGON', icon: Pentagon, label: 'Desenhar Polígono', shortcut: 'P' },
  { id: 'MEASURE', icon: Ruler, label: 'Medir Distância', shortcut: 'M' },
  { id: 'PLACE_MODULE', icon: LayoutGrid, label: 'Colocar Módulos', shortcut: 'L' },
];

// =============================================================================
// PROPS
// =============================================================================

interface TopRibbonProps {
  activeTool: ActiveTool;
  onToolChange: (tool: ActiveTool) => void;
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const TopRibbon: React.FC<TopRibbonProps> = ({
  activeTool,
  onToolChange,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}) => {
  const setActiveModule = useSolarStore(state => state.setActiveModule);

  return (
    <div className="h-full w-full bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 select-none">

      {/* ── LEFT: Panel Toggles + Module Context ── */}
      <div className="flex items-center gap-1">
        {/* Back to Hub */}
        <button
          onClick={() => setActiveModule('hub')}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors mr-1"
          title="Voltar ao Explorador"
        >
          <LayoutDashboard size={14} />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Panel toggles */}
        <button
          onClick={onToggleLeft}
          className={`p-1.5 rounded-md transition-colors ${leftOpen ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
          title={leftOpen ? 'Ocultar Outliner' : 'Mostrar Outliner'}
        >
          {leftOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
        <button
          onClick={onToggleRight}
          className={`p-1.5 rounded-md transition-colors ${rightOpen ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
          title={rightOpen ? 'Ocultar Inspector' : 'Mostrar Inspector'}
        >
          {rightOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>
      </div>

      {/* ── CENTER: Tool Palette ── */}
      <div className="flex items-center gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-slate-800">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all
                ${isActive
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Icon size={13} />
              <span className="hidden xl:inline">{tool.label}</span>
              <kbd className="hidden xl:inline text-[8px] px-1 py-0.5 rounded bg-slate-800 text-slate-500 font-mono ml-1">
                {tool.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: Undo/Redo + Export ── */}
      <div className="flex items-center gap-0.5">
        <button
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors"
          title="Refazer (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </button>
        <div className="h-5 w-px bg-slate-800 mx-1" />
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          title="Exportar PDF"
        >
          <Download size={12} />
          <span className="hidden xl:inline">Exportar</span>
        </button>
      </div>
    </div>
  );
};
