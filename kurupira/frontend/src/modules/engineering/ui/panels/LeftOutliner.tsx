/**
 * =============================================================================
 * LEFT OUTLINER — Árvore do BOS Lógico (P6.2)
 * =============================================================================
 *
 * Lateral esquerda: Árvore hierárquica focada na TOPOLOGIA ELÉTRICA.
 *
 * Inversores são nós raízes. MPPTs são galhos. Lotes de Módulos são folhas.
 * Existe um painel de "Banco de Módulos" que lista módulos do inventário
 * ainda não atribuídos a Inversores.
 * =============================================================================
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronRight, ChevronDown, Cpu, Cable, Sun,
  Layers, Search, Plus, Trash2, Package, MapPin, Link2, type LucideIcon
} from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useUIStore, useSelectedEntity } from '@/core/state/uiStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { ModuleCatalogDialog } from '../../components/ModuleCatalogDialog';
import { InverterCatalogDialog } from '../../components/InverterCatalogDialog';
import { mapCatalogToSpecs } from '../../utils/catalogMappers';
import { useStringAssignment } from '../../hooks/useStringAssignment';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface TreeNode {
  id: string;
  label: string;
  type: 'module' | 'inverter' | 'string' | 'placed-module' | 'area';
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  children?: TreeNode[];
  deletable?: boolean;
  checkable?: boolean;
}

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
  const placedModules = useSolarStore(state => state.project.placedModules);
  const installationAreas = useSolarStore(state => state.project.installationAreas);
  const removeModule = useSolarStore(state => state.removeModule);
  const removeInverter = useSolarStore(state => state.removeInverter);
  const { inverters: techInvertersStore, removeInverter: removeTechInverter } = useTechStore();
  const techInverters = toArray(techInvertersStore);
  
  // P6.2 Logical Hooks
  const { assignLogical, availableMPPTs, unassignedPool } = useStringAssignment();

  // ── Local state ──
  const [searchFilter, setSearchFilter] = useState('');
  
  // Catalog Dialog States (transient)
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [inverterDialogOpen, setInverterDialogOpen] = useState(false);
  
  // MPPT Logical Assignment State
  const [assignPopoverOpen, setAssignPopoverOpen] = useState(false);
  const [qtyToAssign, setQtyToAssign] = useState<number | ''>('');

  // ── Handle add module (from ModuleCatalogDialog) ──
  const addModule = useSolarStore(state => state.addModule);
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
      removeModule(node.id); // Removes from Inventory
      if (selectedEntity.id === node.id) {
        clearSelection();
      }
    } else if (node.type === 'inverter') {
      removeInverter(node.id); // Removes from Inventory
      removeTechInverter(node.id); // Removes Logical config
      if (selectedEntity.id === node.id) {
        clearSelection();
      }
    } else if (node.type === 'placed-module') {
       useSolarStore.getState().removePlacedModule(node.id);
    }
  }, [removeModule, removeInverter, removeTechInverter, selectedEntity.id, clearSelection]);

  // ── Logical Assignment Action ──
  const handleAssignToMPPT = useCallback((inverterId: string, mpptId: number) => {
    const qty = typeof qtyToAssign === 'number' ? qtyToAssign : unassignedPool;
    if (qty <= 0) return;
    
    assignLogical(qty, inverterId, mpptId);
    setQtyToAssign('');
    setAssignPopoverOpen(false);
  }, [assignLogical, qtyToAssign, unassignedPool]);

  // ── Tree Construction ──

  // P6.2: Module Inventory (Root representation)
  const moduleNodes: TreeNode[] = modules.map(m => ({
    id: m.id,
    label: `${m.manufacturer} ${m.model}`,
    type: 'module' as const,
    icon: Sun,
    badge: `x${m.quantity}`,
    deletable: true,
  }));

  // P6.2: Logical System Tree (Inverters -> MPPTs -> Modules)
  const systemTreeNodes: TreeNode[] = inverters.map(inv => {
    const techInv = techInverters.find(ti => ti.catalogId === inv.id || ti.id === inv.id);
    const mpptChildren: TreeNode[] = techInv
      ? techInv.mpptConfigs.map(mppt => {
          const assignedCount = mppt.modulesPerString * mppt.stringsCount;
          // Leaf node (Assigned modules to this MPPT)
          const leafChildren: TreeNode[] = assignedCount > 0 && modules.length > 0 ? [{
             id: `${inv.id}-mppt-${mppt.mpptId}-leaf`,
             label: `${modules[0].model}`, // P6 assumes homogenous modules
             type: 'module' as const,
             icon: Sun,
             badge: `x${assignedCount}`,
             badgeColor: 'text-emerald-400 bg-emerald-500/10'
          }] : [];

          return {
            id: `${inv.id}-mppt-${mppt.mpptId}`,
            label: `MPPT ${mppt.mpptId}`,
            type: 'string' as const,
            icon: Cable,
            badge: assignedCount > 0 ? `${assignedCount}/${mppt.modulesPerString}×${mppt.stringsCount}` : undefined,
            badgeColor: assignedCount > 0 ? 'text-amber-400 bg-amber-500/10' : undefined,
            children: leafChildren.length > 0 ? leafChildren : undefined
          };
        })
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

  // P6.2: Placed Modules (Now purely physical representation)
  const areaNodes: TreeNode[] = useMemo(() => {
    return installationAreas.map(area => {
      const areaModules = placedModules.filter(pm => pm.areaId === area.id);
      const children: TreeNode[] = areaModules.map(pm => {
        return {
          id: pm.id,
          label: `Mod ${pm.id.slice(-4).toUpperCase()}`,
          type: 'placed-module' as const,
          icon: Sun,
          deletable: true
        };
      });
      return {
        id: `area-${area.id}`,
        label: `Área ${area.surfaceType} (${areaModules.length})`,
        type: 'area' as const,
        icon: MapPin,
        children: children.length > 0 ? children : undefined,
      };
    });
  }, [installationAreas, placedModules]);

  // ── Stats ──
  const totalModules = modules.reduce((a, m) => a + (m.quantity || 0), 0);

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Topologia do Sistema
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
        
        {/* ── Section: ÁRVORE LÓGICA (Inversores no topo) ── */}
        <SectionHeader
          label="Topologia Elétrica"
          icon={Cpu}
          count={inverters.length}
          onAdd={() => setInverterDialogOpen(true)}
        />
        {systemTreeNodes.length === 0 ? (
          <EmptySection
            icon={Cpu}
            message="Nenhum inversor"
            actionLabel="Adicionar"
            onAction={() => setInverterDialogOpen(true)}
          />
        ) : (
          systemTreeNodes.map(node => (
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

        {/* ── Section: Módulos (Inventário Geral) & Atribuição Lógica ── */}
        <SectionHeader
          label="Inventário Módulos"
          icon={Package}
          count={totalModules}
          onAdd={() => setModuleDialogOpen(true)}
        />
        
        {/* Sub-painel: Desatribuídos (Pool) */}
        {totalModules > 0 && (
          <div className="mx-2 my-2 p-1.5 rounded bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[9px] text-amber-500/70 font-semibold uppercase">
                Módulos Desatribuídos: {unassignedPool}
              </span>
              {unassignedPool > 0 && (
                <input 
                  type="number" 
                  value={qtyToAssign} 
                  onChange={e => setQtyToAssign(e.target.value === '' ? '' : parseInt(e.target.value))} 
                  placeholder={unassignedPool.toString()}
                  max={unassignedPool}
                  min={1}
                  className="w-12 h-4 text-center text-[9px] font-medium bg-slate-900 border border-amber-500/20 rounded text-amber-500 outline-none focus:border-amber-400"
                  title="Quantidade para enviar ao inversor"
                />
              )}
            </div>
            
            {unassignedPool > 0 && availableMPPTs.length > 0 ? (
                <div className="relative">
                  <button
                    onClick={() => setAssignPopoverOpen(!assignPopoverOpen)}
                    className="w-full h-5 flex items-center justify-center gap-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-[9px] font-bold text-emerald-500 transition-colors border border-emerald-500/20 focus:outline-none focus:border-emerald-500/50"
                  >
                    <Link2 size={10} />
                    Atribuir à String
                  </button>
                  {assignPopoverOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded shadow-xl max-h-40 overflow-y-auto">
                      {availableMPPTs.map(mppt => (
                        <button
                          key={`${mppt.inverterId}-${mppt.mpptId}`}
                          onClick={() => handleAssignToMPPT(mppt.inverterId, mppt.mpptId)}
                          className="w-full text-left px-2 py-1.5 text-[9px] flex items-center justify-between transition-colors text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                        >
                          <span>{mppt.inverterModel} — MPPT {mppt.mpptId}</span>
                          <span className="text-[8px] text-slate-500">
                             Atuais: {mppt.assignedCount}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
            ) : unassignedPool > 0 ? (
               <div className="text-[8px] text-amber-500/40 text-center py-0.5">
                 Adicione um inversor acima para distribuir.
               </div>
            ) : null}
          </div>
        )}

        {moduleNodes.length === 0 ? (
          <EmptySection
            icon={Package}
            message="Nenhum módulo importado"
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

        {/* ── Section: Layout Físico ── */}
        {areaNodes.length > 0 && (
          <>
            <SectionHeader
              label="Layout Físico"
              icon={MapPin}
              count={placedModules.length}
              onAdd={() => {}}
            />
            {areaNodes.map(node => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                depth={1}
                selectedId={selectedEntity.id}
                searchFilter={searchFilter}
                onSelect={(n) => selectEntity(n.type, n.id, n.label)}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer stats */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800/50 flex items-center justify-between">
        <span className="text-[9px] text-slate-600">
          {totalModules > 0 ? `${totalModules} lógicos` : '—'}
        </span>
        <span className="text-[9px] text-slate-700">
          {placedModules.length > 0 ? `${placedModules.length} físicos` : ''}
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
// SECTION HEADER
// =============================================================================

const SectionHeader: React.FC<{
  label: string;
  icon: LucideIcon;
  count: number;
  onAdd: () => void;
}> = ({ label, icon: Icon, count, onAdd }) => (
  <div className="flex items-center justify-between px-2 py-1.5 mt-2">
    <div className="flex items-center gap-1.5">
      <Icon size={11} className="text-slate-500" />
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      {count > 0 && (
        <span className="text-[8px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
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
    const currentQty = node.badge.replace(/[^0-9]/g, '');
    setQtyDraft(currentQty);
    setEditingQty(true);
  };

  const commitQty = () => {
    const qty = parseInt(qtyDraft, 10);
    if (!isNaN(qty) && qty >= 0) {
      if (node.type === 'module') {
        useSolarStore.getState().updateModuleQty(node.id, qty);
      } else if (node.type === 'inverter') {
        useSolarStore.getState().updateInverterQty(node.id, qty);
      } else if (node.type === 'string') {
        // Technically mppt occupation via badge edit. Unsafe structurally unless parsed carefully.
        // P6.2 disables manual string edit via badge for safety (leaves it to the Properties Drawer)
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
        className={cn("w-full flex items-center gap-1 px-1.5 py-1 rounded text-left transition-all text-[10px] group",
          isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown size={10} className="shrink-0 text-slate-600" />
            : <ChevronRight size={10} className="shrink-0 text-slate-600" />
        ) : (
          <span className="w-[10px] shrink-0" />
        )}
        
        <Icon size={11} className={cn("shrink-0", isSelected ? 'text-emerald-400' : 'text-slate-600')} />
        <span className="truncate font-medium flex-1">{node.label}</span>

        {/* Badge (quantity) — double-click to edit inline */}
        {node.badge && !editingQty && (
          <span
            className={cn("text-[8px] font-bold px-1 py-0.5 rounded shrink-0 transition-colors",
              node.badgeColor ? node.badgeColor : 'text-slate-600 bg-slate-800/80 cursor-text hover:text-emerald-400 hover:bg-emerald-500/10'
            )}
            onDoubleClick={node.type !== 'string' ? handleBadgeDoubleClick : undefined}
            title={node.type !== 'string' ? 'Duplo clique para editar quantidade' : 'Módulos Atribuídos / Capacidade Formatada'}
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
