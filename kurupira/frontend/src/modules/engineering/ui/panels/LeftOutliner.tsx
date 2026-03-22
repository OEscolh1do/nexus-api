/**
 * =============================================================================
 * LEFT OUTLINER — Árvore do BOS (UX-001 Fase 3)
 * =============================================================================
 *
 * Lateral esquerda: Árvore hierárquica profunda que lista todos os
 * componentes do sistema em camadas (Inversores, Strings, Módulos).
 *
 * Sincronia bidirecional: clique num item no Outliner ilumina no Canvas
 * e vice-versa, operando por referência de ID.
 *
 * NOTA: Dados mockados até integração com o store de equipamentos.
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Cpu, Cable, Sun,
  Layers, Search
} from 'lucide-react';
import type { SelectedEntity } from '../layout/WorkspaceLayout';
import { useSolarStore } from '@/core/state/solarStore';

// =============================================================================
// TYPES
// =============================================================================

interface TreeNode {
  id: string;
  label: string;
  type: 'inverter' | 'string' | 'module';
  icon: React.ElementType;
  children?: TreeNode[];
}

// =============================================================================
// MOCK BOS TREE (substituir por dados reais do TechSlice)
// =============================================================================

const buildTreeFromStore = (modules: any[], inverters: any[]): TreeNode[] => {
  if (inverters.length === 0 && modules.length === 0) {
    // Fallback mock tree
    return [
      {
        id: 'inv-1',
        label: 'Inversor 1 — Growatt 8000',
        type: 'inverter',
        icon: Cpu,
        children: [
          {
            id: 'str-1',
            label: 'String 1 (12 módulos)',
            type: 'string',
            icon: Cable,
            children: Array.from({ length: 12 }, (_, i) => ({
              id: `mod-1-${i + 1}`,
              label: `Módulo ${i + 1}`,
              type: 'module' as const,
              icon: Sun,
            })),
          },
          {
            id: 'str-2',
            label: 'String 2 (12 módulos)',
            type: 'string',
            icon: Cable,
            children: Array.from({ length: 12 }, (_, i) => ({
              id: `mod-2-${i + 1}`,
              label: `Módulo ${i + 1}`,
              type: 'module' as const,
              icon: Sun,
            })),
          },
        ],
      },
    ];
  }

  // Build from real store data
  return inverters.map((inv, iIdx) => ({
    id: `inv-${iIdx}`,
    label: `${inv.manufacturer} ${inv.model || inv.power + 'W'}`,
    type: 'inverter' as const,
    icon: Cpu,
    children: [{
      id: `str-${iIdx}-1`,
      label: `String 1 (${modules.length} módulos)`,
      type: 'string' as const,
      icon: Cable,
      children: modules.map((mod, mIdx) => ({
        id: `mod-${iIdx}-${mIdx}`,
        label: `${mod.manufacturer} ${mod.power}W`,
        type: 'module' as const,
        icon: Sun,
      })),
    }],
  }));
};

// =============================================================================
// PROPS
// =============================================================================

interface LeftOutlinerProps {
  selectedEntity: SelectedEntity;
  onSelectEntity: (entity: SelectedEntity) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const LeftOutliner: React.FC<LeftOutlinerProps> = ({
  selectedEntity,
  onSelectEntity,
}) => {
  const modules = useSolarStore(state => state.modules);
  const inverters = useSolarStore(state => state.inverters);
  const [searchFilter, setSearchFilter] = useState('');

  const tree = buildTreeFromStore(modules, inverters);

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Componentes
          </h3>
        </div>
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar..."
            className="w-full h-6 pl-7 pr-2 text-[10px] bg-slate-900 border border-slate-800 rounded text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/30"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Cpu size={20} className="text-slate-800 mb-2" />
            <p className="text-[10px] text-slate-600">Nenhum equipamento configurado</p>
            <p className="text-[9px] text-slate-700 mt-1">Configure módulos e inversores no dimensionamento.</p>
          </div>
        ) : (
          tree.map(node => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedEntity.id}
              searchFilter={searchFilter}
              onSelect={(n) => onSelectEntity({ type: n.type, id: n.id, label: n.label })}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[9px] text-slate-600">
          {modules.length > 0 ? `${modules.reduce((a, m) => a + (m.quantity || 0), 0)} módulos` : 'Mock data'}
        </span>
        <span className="text-[9px] text-slate-700">
          {inverters.length > 0 ? `${inverters.length} inv.` : ''}
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// TREE NODE (Recursive, virtualizable per-branch)
// =============================================================================

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  searchFilter: string;
  onSelect: (node: TreeNode) => void;
}> = ({ node, depth, selectedId, searchFilter, onSelect }) => {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = node.icon;

  // Filter logic
  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    const matchesSelf = node.label.toLowerCase().includes(q);
    const matchesChild = node.children?.some(c =>
      c.label.toLowerCase().includes(q) ||
      c.children?.some(gc => gc.label.toLowerCase().includes(q))
    );
    if (!matchesSelf && !matchesChild) return null;
  }

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node);
        }}
        className={`
          w-full flex items-center gap-1 px-1.5 py-1 rounded text-left transition-all text-[10px]
          ${isSelected
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown size={10} className="shrink-0 text-slate-600" />
            : <ChevronRight size={10} className="shrink-0 text-slate-600" />
        ) : (
          <span className="w-[10px] shrink-0" />
        )}
        <Icon size={11} className={`shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
        <span className="truncate font-medium">{node.label}</span>
      </button>

      {hasChildren && expanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          {node.children!.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              searchFilter={searchFilter}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
