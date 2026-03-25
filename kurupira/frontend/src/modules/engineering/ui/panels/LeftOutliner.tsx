import React, { useState, useCallback, useMemo } from 'react';
import { Cpu, Package, MapPin, Cable, Sun, Link2, Unlink, Layers, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useUIStore, useSelectedEntity } from '@/core/state/uiStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { ModuleCatalogDialog } from '../../components/ModuleCatalogDialog';
import { InverterCatalogDialog } from '../../components/InverterCatalogDialog';
import { mapCatalogToSpecs } from '../../utils/catalogMappers';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { cn } from '@/lib/utils';
import { DenseButton } from '@/components/ui/dense-form';

// =============================================================================
// TYPES
// =============================================================================

type TreeNodeType = 'inverter' | 'mppt' | 'string' | 'module' | 'area' | 'placed-module';

interface TreeNode {
  id: string;
  label: string;
  type: TreeNodeType;
  icon: any;
  badge?: string;
  badgeColor?: string;
  children?: TreeNode[];
  deletable?: boolean;
  draggable?: boolean;
  droppable?: boolean;
  meta?: any;
}

const DND_TYPE = 'application/x-solar-dnd';

// =============================================================================
// COMPONENT
// =============================================================================

export const LeftOutliner: React.FC = () => {
  // ── UI Store ──
  const selectedEntity = useSelectedEntity();
  const selectEntity = useUIStore(s => s.selectEntity);
  const toggleMultiSelection = useUIStore(s => s.toggleMultiSelection);
  const setMultiSelection = useUIStore(s => s.setMultiSelection);
  const clearSelection = useUIStore(s => s.clearSelection);
  
  // ── Solar Store (Project Level) ──
  const modules = useSolarStore(selectModules);
  const inverters = useSolarStore(selectInverters);
  const placedModules = useSolarStore(state => state.project.placedModules);
  const installationAreas = useSolarStore(state => state.project.installationAreas);
  const removeModule = useSolarStore(state => state.removeModule);
  const removeInverter = useSolarStore(state => state.removeInverter);
  const addModule = useSolarStore(state => state.addModule);
  const addProjectInverter = useSolarStore(state => state.addInverter);

  // ── Tech Store (Logical Level) ──
  const techState = useTechStore();
  const techInverters = useMemo(() => toArray(techState.inverters), [techState.inverters]);
  const strings = useMemo(() => techState.strings.entities, [techState.strings]);
  
  // ── Local State ──
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [inverterDialogOpen, setInverterDialogOpen] = useState(false);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const handleAddModule = useCallback((catalogItem: ModuleCatalogItem) => {
    const mappedSpecs = mapCatalogToSpecs(catalogItem);
    addModule({ ...mappedSpecs, id: Math.random().toString(36).substr(2, 9), quantity: 1 });
    setModuleDialogOpen(false);
  }, [addModule]);

  const handleAddInverter = useCallback((catalogItem: any) => {
    const newId = Math.random().toString(36).substr(2, 9);
    addProjectInverter({ ...catalogItem, id: newId, quantity: 1 });
    techState.addInverter(catalogItem, newId);
    setInverterDialogOpen(false);
  }, [addProjectInverter, techState]);

  // ── Delete / Unlink Handlers ──
  const handleUnlink = useCallback((node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'string') {
        techState.unassignStringFromMPPT(node.id);
    } else if (node.type === 'module' && node.meta?.stringId) {
        if (selectedEntity.multiIds.includes(node.id)) {
            techState.removeModulesFromString(node.meta.stringId, selectedEntity.multiIds);
            clearSelection();
        } else {
            techState.removeModulesFromString(node.meta.stringId, [node.id]);
        }
    }
  }, [techState, selectedEntity, clearSelection]);

  const handleDelete = useCallback((node: TreeNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'module') {
      // Se tiver múltiplos módulos selecionados e este for um deles, deletar todos
      if (selectedEntity.multiIds.includes(node.id)) {
          selectedEntity.multiIds.forEach(id => removeModule(id));
          clearSelection();
      } else {
          removeModule(node.id);
          if (selectedEntity.id === node.id) clearSelection();
      }
    } else if (node.type === 'inverter') {
      removeInverter(node.id);
      techState.removeInverter(node.id);
      if (selectedEntity.id === node.id) clearSelection();
    } else if (node.type === 'string') {
      techState.deleteString(node.id);
    } else if (node.type === 'placed-module') {
      useSolarStore.getState().removePlacedModule(node.id);
    }
  }, [removeModule, removeInverter, techState, selectedEntity, clearSelection]);

  // ── DnD Handlers ──
  const handleDrop = useCallback((targetNode: TreeNode, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);

    const dataRaw = e.dataTransfer.getData(DND_TYPE);
    if (!dataRaw) return;
    const data = JSON.parse(dataRaw);
    
    // 1. Drag String -> Drop MPPT
    if (data.type === 'string' && targetNode.type === 'mppt') {
        data.ids.forEach((strId: string) => {
            techState.assignStringToMPPT(strId, targetNode.meta.inverterId, targetNode.meta.mpptId);
        });
    }
    // 2. Drag Module -> Drop String
    else if (data.type === 'module' && targetNode.type === 'string') {
        techState.addModulesToString(targetNode.id, data.ids);
    }
    // 3. Drag Module -> Drop MPPT (Auto-create string shortcut)
    else if (data.type === 'module' && targetNode.type === 'mppt') {
        techState.assignModulesToNewString(data.ids, targetNode.meta.inverterId, targetNode.meta.mpptId);
    }
    // 4. Drag Module -> Drop Inverter (Fallback MPPT 1)
    else if (data.type === 'module' && targetNode.type === 'inverter') {
        const inv = useTechStore.getState().inverters.entities[targetNode.id];
        const mpptId = inv?.mpptConfigs?.[0]?.mpptId || 1;
        techState.assignModulesToNewString(data.ids, targetNode.id, mpptId);
    }
    // 5. Drag String -> Drop Inverter (Fallback MPPT 1)
    else if (data.type === 'string' && targetNode.type === 'inverter') {
        data.ids.forEach((strId: string) => {
            techState.assignStringToInverterFallback(strId, targetNode.id);
        });
    }
    // 6. Action: Devolver String para Pool
    else if (data.type === 'string' && targetNode.id === 'folder-disconnected-strings') {
        data.ids.forEach((strId: string) => techState.unassignStringFromMPPT(strId));
    }
    // 7. Action: Devolver Module para Pool Livre
    else if (data.type === 'module' && targetNode.id === 'folder-free-modules') {
        // Find which string owns these modules
        // data.meta object can tell us the string. But we don't have meta on ids array.
        // Easiest is to search all strings and remove them
        const allStrings = useTechStore.getState().strings.entities;
        Object.values(allStrings).forEach(str => {
             const intersection = str.moduleIds.filter(mid => data.ids.includes(mid));
             if (intersection.length > 0) {
                 useTechStore.getState().removeModulesFromString(str.id, intersection);
             }
        });
    }
    
    clearSelection();
  }, [techState, clearSelection]);

  // ── Derived Data for Trees ──
  
  // 1. Encontrar todos os módulos atrelados a Strings
  const assignedModuleIds = new Set<string>();
  Object.values(strings).forEach(str => str.moduleIds.forEach(mId => assignedModuleIds.add(mId)));

  // 2. Classificadores
  const freeModules = useMemo(() => modules.filter(m => !assignedModuleIds.has(m.id)), [modules, assignedModuleIds]);
  const unassignedStrings = Object.values(strings).filter(str => !str.mpptId);

  // ── Multi-select Range Handler ──
  const handleMultiSelect = useCallback((id: string, shiftKey?: boolean) => {
      // Range Selection for Free Modules
      if (shiftKey && selectedEntity.type === 'module' && selectedEntity.multiIds.length > 0) {
          const isFreeModule = freeModules.some(m => m.id === id);
          if (isFreeModule) {
              const lastSelectedId = selectedEntity.multiIds[selectedEntity.multiIds.length - 1];
              const startIndex = freeModules.findIndex(m => m.id === lastSelectedId);
              const endIndex = freeModules.findIndex(m => m.id === id);
              
              if (startIndex !== -1 && endIndex !== -1) {
                  const minIdx = Math.min(startIndex, endIndex);
                  const maxIdx = Math.max(startIndex, endIndex);
                  const rangeIds = freeModules.slice(minIdx, maxIdx + 1).map(m => m.id);
                  setMultiSelection(rangeIds);
                  return;
              }
          }
      }
      
      toggleMultiSelection(id);
  }, [freeModules, selectedEntity, toggleMultiSelection, setMultiSelection]);

  // ── Tree Construction ──
  
  // A) Topologia Elétrica (Inverters > MPPTs > Strings > Modules)
  const electricalNodes: TreeNode[] = useMemo(() => inverters.map(inv => {
    const techInv = techInverters.find(ti => ti.catalogId === inv.id || ti.id === inv.id);
    const mpptChildren: TreeNode[] = techInv
      ? techInv.mpptConfigs.map(mppt => {
          
          const mpptStrings = mppt.stringIds.map(sid => strings[sid]).filter(Boolean);
          
          const stringChildren: TreeNode[] = mpptStrings.map(str => {
             const strModules = str.moduleIds.map(mid => modules.find(m => m.id === mid)).filter(Boolean) as any[];
             return {
                 id: str.id,
                 label: str.name,
                 type: 'string' as const,
                 icon: Link2,
                 badge: `${strModules.length} mods`,
                 deletable: true,
                 draggable: true,
                 droppable: true, // Can receive dropped modules
                 children: strModules.map(m => ({
                     id: m.id,
                     label: `${m.manufacturer.substring(0,6)} ${m.power}W`,
                     type: 'module' as const,
                     icon: Sun,
                     deletable: true,
                     draggable: true,
                     meta: { stringId: str.id }
                 }))
             };
          });

          return {
            id: `${inv.id}-mppt-${mppt.mpptId}`,
            label: `MPPT ${mppt.mpptId}`,
            type: 'mppt' as const,
            icon: Cable,
            droppable: true,
            children: stringChildren,
            meta: { inverterId: techInv.id, mpptId: mppt.mpptId }
          };
        })
      : [];

    return {
      id: inv.id,
      label: `${inv.manufacturer} ${inv.model || ''}`,
      type: 'inverter' as const,
      icon: Cpu,
      deletable: true,
      droppable: true,
      children: mpptChildren,
    };
  }), [inverters, techInverters, strings, modules]);

  // B) Strings Desconectadas
  const disconnectedStringNodes: TreeNode[] = useMemo(() => unassignedStrings.map(str => {
      const strModules = str.moduleIds.map(mid => modules.find(m => m.id === mid)).filter(Boolean) as any[];
      return {
          id: str.id,
          label: str.name,
          type: 'string' as const,
          icon: Unlink,
          badgeColor: 'text-amber-500 bg-amber-500/10',
          badge: `${strModules.length} mods`,
          deletable: true,
          draggable: true,
          droppable: true,
          children: strModules.map(m => ({
             id: m.id,
             label: `${m.manufacturer.substring(0,6)} ${m.power}W`,
             type: 'module' as const,
             icon: Sun,
             deletable: true,
             draggable: true,
             meta: { stringId: str.id }
          }))
      };
  }), [unassignedStrings, modules]);

  // C) Módulos Livres
  const freeModuleNodes: TreeNode[] = useMemo(() => freeModules.map(m => ({
      id: m.id,
      label: `${m.manufacturer.substring(0,6)} ${m.power}W`,
      type: 'module' as const,
      icon: Sun,
      deletable: true,
      draggable: true
  })), [freeModules]);

  // D) Físico
  const areaNodes: TreeNode[] = useMemo(() => installationAreas.map(area => {
      const areaModules = placedModules.filter(pm => pm.areaId === area.id);
      const children: TreeNode[] = areaModules.map(pm => ({
        id: pm.id,
        label: `Mod ${pm.id.slice(-4).toUpperCase()}`,
        type: 'placed-module' as const,
        icon: Sun,
        deletable: true
      }));
      return {
        id: `area-${area.id}`,
        label: `Área ${area.surfaceType} (${areaModules.length})`,
        type: 'area' as const,
        icon: MapPin,
        children: children.length > 0 ? children : undefined,
      };
  }), [installationAreas, placedModules]);

  // C) Pastas Virtuais (Root level aggregation)
  const virtualFolders: TreeNode[] = [];
  
  if (disconnectedStringNodes.length > 0) {
      virtualFolders.push({
          id: 'folder-disconnected-strings',
          label: 'Strings Desconectadas',
          type: 'folder' as any,
          icon: Unlink,
          droppable: true, // Can receive dropped strings to unassign
          badgeColor: 'text-amber-500 bg-amber-500/10',
          badge: `${disconnectedStringNodes.length}`,
          children: disconnectedStringNodes
      });
  }

  if (freeModuleNodes.length > 0) {
      virtualFolders.push({
          id: 'folder-free-modules',
          label: 'Módulos Livres',
          type: 'folder' as any,
          icon: Package,
          droppable: true, // Can receive dropped modules to unassign them from strings
          badgeColor: 'text-indigo-400 bg-indigo-400/10',
          badge: `${freeModuleNodes.length}`,
          children: freeModuleNodes
      });
  }

  if (areaNodes.length > 0) {
      virtualFolders.push({
          id: 'folder-areas',
          label: 'Áreas Físicas',
          type: 'folder' as any,
          icon: Layers,
          children: areaNodes
      });
  }

  // Unified File Explorer Array
  const allRootNodes = [...electricalNodes, ...virtualFolders];

  // ── Multi-select Action Bar ──
  const selectedFreeModulesCount = selectedEntity.type === 'module' 
      ? selectedEntity.multiIds.filter(id => freeModules.some(m => m.id === id)).length 
      : 0;

  const handleCreateString = () => {
      if (selectedEntity.type !== 'module' || selectedFreeModulesCount === 0) return;
      const idsToGroup = selectedEntity.multiIds.filter(id => freeModules.some(m => m.id === id));
      techState.createString(idsToGroup);
      clearSelection();
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Topologia do Sistema
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
           <button onClick={() => setInverterDialogOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-[10px] text-slate-300 font-medium transition-colors">
              <Cpu size={12} className="text-emerald-500" /> + Inversor
           </button>
           <button onClick={() => setModuleDialogOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md text-[10px] text-slate-300 font-medium transition-colors">
              <Sun size={12} className="text-amber-500" /> + Painéis
           </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2">
        {allRootNodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center border-2 border-dashed border-slate-800 rounded-xl m-2 bg-slate-900/50">
            <Cable size={24} className="text-slate-700" />
            <p className="text-[11px] max-w-[150px]">Adicione inversores ou painéis para montar a topologia.</p>
          </div>
        ) : (
          <div className="space-y-1">
             {allRootNodes.map(node => (
                <TreeNodeItem key={node.id} node={node} depth={0}
                  selectedEntity={selectedEntity} dragOverTargetId={dragOverTargetId}
                  onSelect={selectEntity} onMultiSelect={handleMultiSelect}
                  onDelete={handleDelete} onUnlink={handleUnlink} onDragOverTarget={setDragOverTargetId} onDrop={handleDrop}
                />
             ))}
          </div>
        )}
      </div>

      {/* Floating Action Bar for Multi-Select */}
      {selectedFreeModulesCount > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-emerald-900 border border-emerald-500/50 shadow-xl rounded-lg p-3 animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-100">{selectedFreeModulesCount} módulos livres selecionados</span>
                  <DenseButton variant="primary" size="sm" onClick={handleCreateString}>
                      <Link2 size={12} className="mr-1.5" /> Criar String
                  </DenseButton>
              </div>
          </div>
      )}

      {/* Footer */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800/50 flex items-center justify-between bg-slate-950 z-10">
        <span className="text-[9px] text-slate-600">{modules.length > 0 ? `${modules.length} lógicos` : '—'}</span>
        <span className="text-[9px] text-slate-700">{placedModules.length > 0 ? `${placedModules.length} físicos` : ''}</span>
      </div>

      {/* Catalog Dialogs */}
      <ModuleCatalogDialog isOpen={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} onAddModule={handleAddModule} />
      <InverterCatalogDialog isOpen={inverterDialogOpen} onClose={() => setInverterDialogOpen(false)} onAddInverter={handleAddInverter} />
    </div>
  );
};

// =============================================================================
// TREE NODE (Recursive, DnD, Multi-select)
// =============================================================================

const TreeNodeItem: React.FC<{
  node: TreeNode;
  depth: number;
  selectedEntity: any;
  dragOverTargetId: string | null;
  onSelect: (type: any, id: string, label?: string) => void;
  onMultiSelect: (id: string, shiftKey?: boolean) => void;
  onDelete: (node: TreeNode, e: React.MouseEvent) => void;
  onUnlink?: (node: TreeNode, e: React.MouseEvent) => void;
  onDragOverTarget: (id: string | null) => void;
  onDrop: (node: TreeNode, e: React.DragEvent) => void;
}> = ({ node, depth, selectedEntity, dragOverTargetId, onSelect, onMultiSelect, onDelete, onUnlink, onDragOverTarget, onDrop }) => {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  
  const hasChildren = node.children && node.children.length > 0;
  
  // Is this node currently in the multi-select array?
  const isSelected = selectedEntity.type === node.type && selectedEntity.multiIds.includes(node.id);
  
  const isDragOver = dragOverTargetId === node.id;
  const Icon = node.icon;

  const handleDragStart = (e: React.DragEvent) => {
      e.stopPropagation();
      
      // Se tiver múltiplos selecionados e este item fizer parte, arrastamos TODOS
      const idsToDrag = isSelected && selectedEntity.multiIds.length > 1 
                        ? selectedEntity.multiIds 
                        : [node.id];

      e.dataTransfer.setData(DND_TYPE, JSON.stringify({ type: node.type, ids: idsToDrag }));
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropLocal = (e: React.DragEvent) => {
      onDrop(node, e);
  };

  return (
    <div>
      <div
        draggable={node.draggable}
        onDragStart={node.draggable ? handleDragStart : undefined}
        onDragOver={node.droppable ? (e) => { e.preventDefault(); e.stopPropagation(); onDragOverTarget(node.id); } : undefined}
        onDragLeave={node.droppable ? (e) => { e.preventDefault(); onDragOverTarget(null); } : undefined}
        onDrop={node.droppable ? handleDropLocal : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren && !e.shiftKey && !e.ctrlKey) setExpanded(!expanded);
          
          if (e.shiftKey || e.ctrlKey) {
              onMultiSelect(node.id, e.shiftKey);
          } else {
              onSelect(node.type as any, node.id, node.label);
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "w-full flex items-center gap-1 px-1.5 py-1 rounded text-left transition-all text-[10px] group cursor-pointer select-none",
          isSelected ? 'bg-emerald-500/20 text-emerald-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200',
          isDragOver && 'ring-2 ring-emerald-400 bg-emerald-500/20 text-emerald-300 scale-[1.02] z-10',
          node.draggable && !isSelected && 'hover:bg-slate-800'
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
        
        <Icon size={11} className={cn("shrink-0", isSelected ? 'text-emerald-400' : node.badgeColor ? node.badgeColor.split(' ')[0] : 'text-slate-600')} />
        <span className="truncate flex-1">{node.label}</span>

        {/* Badge */}
        {node.badge && (
          <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded shrink-0", node.badgeColor || 'text-slate-600 bg-slate-800/80')}>
            {node.badge}
          </span>
        )}

        {/* Delete / Unlink */}
        {node.deletable && (hovered || isSelected) && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
              {/* If it's a module inside a string OR a string inside an MPPT, it can be unlinked */}
              {onUnlink && ((node.type === 'module' && node.meta?.stringId) || (node.type === 'string' && node.meta?.mpptId !== undefined)) && (
                <span
                  role="button"
                  onClick={(e) => onUnlink(node, e)}
                  className="p-0.5 rounded hover:bg-amber-500/20 text-slate-700 hover:text-amber-400 transition-colors"
                  title="Devolver / Desconectar"
                >
                  <Unlink size={10} />
                </span>
              )}
              {/* Trash completely destroys it */}
              <span
                role="button"
                onClick={(e) => onDelete(node, e)}
                className="p-0.5 rounded hover:bg-red-500/20 text-slate-700 hover:text-red-400 transition-colors"
                title="Deletar permanentemente"
              >
                <Trash2 size={10} />
              </span>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150 relative">
           {/* Guidelines */}
           <div className="absolute left-[14px] top-0 bottom-1 w-px bg-slate-800/50" />
          {node.children!.map(child => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1}
              selectedEntity={selectedEntity} dragOverTargetId={dragOverTargetId}
              onSelect={onSelect} onMultiSelect={onMultiSelect}
              onDelete={onDelete} onUnlink={onUnlink} onDragOverTarget={onDragOverTarget} onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};
