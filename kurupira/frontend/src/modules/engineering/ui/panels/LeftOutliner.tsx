/**
 * =============================================================================
 * LEFT OUTLINER — Árvore do BOS (P0-1 + P0-2 + P0-3)
 * =============================================================================
 *
 * Lateral esquerda: Árvore hierárquica que lista todos os componentes
 * do sistema em camadas (Módulos, Inversores → MPPTs/Strings).
 *
 * Sincronia bidirecional: clique num item no Outliner seleciona no
 * Inspector e vice-versa, operando por referência de ID.
 *
 * P0-1: Módulos como nós expansíveis. Botão '+' abre ModuleCatalogDialog.
 * P0-2: Inversores como nós raiz com strings como filhos.
 * P0-3: Strings exibem contagem de módulos configurados.
 * =============================================================================
 */

import React, { useState, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, Cpu, Cable, Sun,
  Layers, Search, Plus, Trash2, Package, type LucideIcon
} from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useUIStore, useSelectedEntity } from '@/core/state/uiStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { ModuleCatalogDialog } from '../../components/ModuleCatalogDialog';
import { InverterCatalogDialog } from '../../components/InverterCatalogDialog';
import { mapCatalogToSpecs } from '../../utils/catalogMappers';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';

// =============================================================================
// TYPES
// =============================================================================

interface TreeNode {
  id: string;
  label: string;
  type: 'module' | 'inverter' | 'string';
  icon: LucideIcon;
  badge?: string;
  children?: TreeNode[];
  deletable?: boolean;
}

// =============================================================================
// NO PROPS NEEDED NATIVELY (Reads from UI Store)
// =============================================================================

// =============================================================================
// COMPONENT
// =============================================================================

export const LeftOutliner: React.FC = () => {
  // ── UI Store ──
  const selectedEntity = useSelectedEntity();
  const selectEntity = useUIStore(s => s.selectEntity);
  const clearSelection = useUIStore(s => s.clearSelection);
  // ── Store data ──
  const modules = useSolarStore(selectModules);
  const inverters = useSolarStore(selectInverters);
  const removeModule = useSolarStore(state => state.removeModule);
  const removeInverter = useSolarStore(state => state.removeInverter);
  const { inverters: techInvertersNorm, removeInverter: removeTechInverter } = useTechStore();
  const techInverters = toArray(techInvertersNorm);

  // ── Local state ──
  const [searchFilter, setSearchFilter] = useState('');
  // Catalog Dialog States (transient)
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [inverterDialogOpen, setInverterDialogOpen] = useState(false);

  // ── Handle add module (from ModuleCatalogDialog) ──
  const addModule = useSolarStore(state => state.addModule);
  // Mapping domain boundary: Catalog -> Project Inventory
  const handleAddModule = useCallback((catalogItem: ModuleCatalogItem) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const mappedSpecs = mapCatalogToSpecs(catalogItem);
    addModule({
      ...mappedSpecs,
      id: newId,
    });
    setModuleDialogOpen(false);
  }, [addModule]);

  // ── Handle add inverter (from InverterCatalogDialog) ──
  const addProjectInverter = useSolarStore(state => state.addInverter);
  const handleAddInverter = useCallback((catalogItem: any) => {
    const newId = Math.random().toString(36).substr(2, 9);
    addProjectInverter({
      ...catalogItem,
      id: newId,
      quantity: 1,
    });
    // Link matching tech state
    useTechStore.getState().addInverter(catalogItem, newId);
    setInverterDialogOpen(false);
  }, [addProjectInverter]);

  // ── Handle delete ──
  const handleDelete = useCallback((node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'module') {
      removeModule(node.id);
      if (selectedEntity.id === node.id) {
        clearSelection();
      }
    } else if (node.type === 'inverter') {
      removeInverter(node.id);
      removeTechInverter(node.id);
      if (selectedEntity.id === node.id) {
        clearSelection();
      }
    }
  }, [removeModule, removeInverter, removeTechInverter, selectedEntity.id, clearSelection]);

  // ── Build Module nodes ──
  const moduleNodes: TreeNode[] = modules.map(m => ({
    id: m.id,
    label: `${m.manufacturer} ${m.model}`,
    type: 'module' as const,
    icon: Sun,
    badge: `x${m.quantity}`,
    deletable: true,
  }));

  // ── Build Inverter nodes with MPPT children ──
  const inverterNodes: TreeNode[] = inverters.map(inv => {
    // Try to find matching tech inverter for MPPT data
    const techInv = techInverters.find(ti => ti.catalogId === inv.id || ti.id === inv.id);
    const mpptChildren: TreeNode[] = techInv
      ? techInv.mpptConfigs.map(mppt => ({
          id: `${inv.id}-mppt-${mppt.mpptId}`,
          label: `MPPT ${mppt.mpptId} — ${mppt.modulesPerString} mod × ${mppt.stringsCount} str`,
          type: 'string' as const,
          icon: Cable,
        }))
      : [];

    return {
      id: inv.id,
      label: `${inv.manufacturer} ${inv.model || ''}`,
      type: 'inverter' as const,
      icon: Cpu,
      badge: inv.quantity > 1 ? `x${inv.quantity}` : undefined,
      deletable: true,
      children: mpptChildren.length > 0 ? mpptChildren : undefined,
    };
  });

  // ── Stats ──
  const totalModules = modules.reduce((a, m) => a + (m.quantity || 0), 0);

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
        {/* ── Section: Módulos ── */}
        <SectionHeader
          label="Módulos"
          icon={Sun}
          count={totalModules}
          onAdd={() => setModuleDialogOpen(true)}
        />
        {moduleNodes.length === 0 ? (
          <EmptySection
            icon={Package}
            message="Nenhum módulo"
            actionLabel="Adicionar"
            onAction={() => setModuleDialogOpen(true)}
          />
        ) : (
          moduleNodes.map(node => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              depth={1}
              selectedId={selectedEntity.id}
              searchFilter={searchFilter}
              onSelect={(n) => selectEntity(n.type, n.id, n.label)}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* ── Section: Inversores ── */}
        <SectionHeader
          label="Inversores"
          icon={Cpu}
          count={inverters.length}
          onAdd={() => setInverterDialogOpen(true)}
        />
        {inverterNodes.length === 0 ? (
          <EmptySection
            icon={Cpu}
            message="Nenhum inversor"
            actionLabel="Adicionar"
            onAction={() => setInverterDialogOpen(true)}
          />
        ) : (
          inverterNodes.map(node => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              depth={1}
              selectedId={selectedEntity.id}
              searchFilter={searchFilter}
              onSelect={(n) => selectEntity(n.type, n.id, n.label)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[9px] text-slate-600">
          {totalModules > 0 ? `${totalModules} módulos` : '—'}
        </span>
        <span className="text-[9px] text-slate-700">
          {inverters.length > 0 ? `${inverters.length} inv.` : ''}
        </span>
      </div>

      {/* ── Catalog Dialogs (overlays) ── */}
      <ModuleCatalogDialog
        isOpen={moduleDialogOpen}
        onClose={() => setModuleDialogOpen(false)}
        onAddModule={handleAddModule}
      />
      <InverterCatalogDialog
        isOpen={inverterDialogOpen}
        onClose={() => setInverterDialogOpen(false)}
        onAddInverter={handleAddInverter}
      />
    </div>
  );
};

// =============================================================================
// SECTION HEADER (Módulos / Inversores — with + button)
// =============================================================================

const SectionHeader: React.FC<{
  label: string;
  icon: LucideIcon;
  count: number;
  onAdd: () => void;
}> = ({ label, icon: Icon, count, onAdd }) => (
  <div className="flex items-center justify-between px-2 py-1.5 mt-1">
    <div className="flex items-center gap-1.5">
      <Icon size={11} className="text-slate-500" />
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      {count > 0 && (
        <span className="text-[8px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    <button
      onClick={onAdd}
      className="p-0.5 rounded hover:bg-emerald-500/10 text-slate-600 hover:text-emerald-400 transition-colors"
      title={`Adicionar ${label.toLowerCase()}`}
    >
      <Plus size={12} />
    </button>
  </div>
);

// =============================================================================
// EMPTY SECTION
// =============================================================================

const EmptySection: React.FC<{
  icon: LucideIcon;
  message: string;
  actionLabel: string;
  onAction: () => void;
}> = ({ icon: Icon, message, actionLabel, onAction }) => (
  <div className="flex flex-col items-center py-3 px-4">
    <Icon size={16} className="text-slate-800 mb-1" />
    <p className="text-[9px] text-slate-700 mb-1.5">{message}</p>
    <button
      onClick={onAction}
      className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
    >
      <Plus size={10} />
      {actionLabel}
    </button>
  </div>
);

// =============================================================================
// TREE NODE (Recursive)
// =============================================================================

const TreeNodeComponent: React.FC<{
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  searchFilter: string;
  onSelect: (node: TreeNode) => void;
  onDelete: (node: TreeNode, e: React.MouseEvent) => void;
}> = ({ node, depth, selectedId, searchFilter, onSelect, onDelete }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = node.icon;

  // ── Inline quantity editing ──
  const [editingQty, setEditingQty] = useState(false);
  const [qtyDraft, setQtyDraft] = useState('');

  const handleBadgeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.badge) return;
    const currentQty = node.badge.replace('x', '');
    setQtyDraft(currentQty);
    setEditingQty(true);
  };

  const commitQty = () => {
    const qty = parseInt(qtyDraft, 10);
    if (!isNaN(qty) && qty > 0) {
      if (node.type === 'module') {
        useSolarStore.getState().updateModuleQty(node.id, qty);
      } else if (node.type === 'inverter') {
        useSolarStore.getState().updateInverterQty(node.id, qty);
      }
    }
    setEditingQty(false);
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitQty();
    if (e.key === 'Escape') setEditingQty(false);
  };

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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          w-full flex items-center gap-1 px-1.5 py-1 rounded text-left transition-all text-[10px] group
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
        <span className="truncate font-medium flex-1">{node.label}</span>

        {/* Badge (quantity) — double-click to edit inline */}
        {node.badge && !editingQty && (
          <span
            className="text-[8px] font-bold text-slate-600 bg-slate-800/80 px-1 py-0.5 rounded shrink-0 cursor-text hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            onDoubleClick={handleBadgeDoubleClick}
            title="Duplo clique para editar quantidade"
          >
            {node.badge}
          </span>
        )}

        {/* Inline quantity input */}
        {editingQty && (
          <input
            type="number"
            value={qtyDraft}
            onChange={(e) => setQtyDraft(e.target.value)}
            onBlur={commitQty}
            onKeyDown={handleQtyKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            min={1}
            className="w-10 text-center text-[9px] font-bold text-emerald-400 bg-slate-800 border border-emerald-500/40 rounded px-1 py-0.5 outline-none shrink-0"
          />
        )}

        {/* Delete button (on hover) */}
        {node.deletable && hovered && !editingQty && (
          <span
            role="button"
            onClick={(e) => onDelete(node, e)}
            className="p-0.5 rounded hover:bg-red-500/20 text-slate-700 hover:text-red-400 transition-colors shrink-0"
            title="Remover"
          >
            <Trash2 size={10} />
          </span>
        )}
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
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
