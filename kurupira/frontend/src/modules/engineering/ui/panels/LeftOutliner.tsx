import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Cpu, Package, MapPin, Cable, Sun, Link2, Unlink, Layers, ChevronDown, ChevronRight, Trash2, Copy } from 'lucide-react';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useUIStore, useSelectedEntity } from '@/core/state/uiStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useElectricalValidation } from '@/modules/engineering/hooks/useElectricalValidation';
import { toArray } from '@/core/types/normalized.types';
import { ModuleCatalogDialog } from '../../components/ModuleCatalogDialog';
import { InverterCatalogDialog } from '../../components/InverterCatalogDialog';
import { mapCatalogToSpecs } from '../../utils/catalogMappers';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { cn } from '@/lib/utils';

import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, DragEndEvent, DragStartEvent,
  useDraggable, useDroppable
} from '@dnd-kit/core';

// =============================================================================
// TYPES
// =============================================================================

type TreeNodeType = 'inverter' | 'mppt' | 'string' | 'module' | 'area' | 'placed-module' | 'folder';

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

  // ── Electrical Validation ──
  const { electrical } = useElectricalValidation();

  // ── Local State ──
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [inverterDialogOpen, setInverterDialogOpen] = useState(false);
  const [activeDragData, setActiveDragData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Must move 8px to become a drag, ignoring simple clicks
      },
    })
  );

  const handleAddModule = useCallback((catalogItem: ModuleCatalogItem) => {
    const mappedSpecs = mapCatalogToSpecs(catalogItem);
    addModule({ ...mappedSpecs, id: Math.random().toString(36).substr(2, 9), quantity: 1 });
    setModuleDialogOpen(false);
  }, [addModule]);

  const handleAddInverter = useCallback((catalogItem: any) => {
    const newId = Math.random().toString(36).substr(2, 9);
    // mppts can be a number (from adapter) or array (from catalog store)
    const mpptArray = Array.isArray(catalogItem.mppts) ? catalogItem.mppts : null;
    const mpptCount = mpptArray ? mpptArray.length : (catalogItem.mppts || 1);

    const mapped = {
      id: newId,
      quantity: 1,
      manufacturer: catalogItem.manufacturer,
      model: catalogItem.model,
      imageUrl: catalogItem.imageUrl,
      nominalPower: catalogItem.nominalPowerW ? catalogItem.nominalPowerW / 1000 : catalogItem.nominalPower || 0,
      maxEfficiency: catalogItem.efficiency?.euro || catalogItem.efficiency || 0,
      maxInputVoltage: catalogItem.maxInputVoltage || (mpptArray ? mpptArray[0]?.maxInputVoltage : 600) || 600,
      minInputVoltage: mpptArray ? mpptArray[0]?.minMpptVoltage || 40 : 40,
      maxInputCurrent: mpptArray ? Math.round(mpptArray.reduce((sum: number, m: any) => sum + (m.maxCurrentPerMPPT || 0), 0) * 10) / 10 : 0,
      outputVoltage: catalogItem.outputVoltage || 220,
      outputFrequency: catalogItem.outputFrequency || 60,
      maxOutputCurrent: catalogItem.maxOutputCurrent || 0,
      weight: catalogItem.weight || 0,
      connectionType: catalogItem.connectionType || 'Monofásico',
      mppts: mpptCount,
    };
    addProjectInverter(mapped);
    techState.addInverter(catalogItem, newId);
    setInverterDialogOpen(false);
  }, [addProjectInverter, techState]);

  // ── Delete / Unlink Handlers ──
  const handleUnlink = useCallback((node: TreeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const handleDelete = useCallback((node: TreeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (node.type === 'module') {
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

  // ── Duplicate Handler ──
  const handleDuplicate = useCallback((node: TreeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (node.type === 'inverter') {
      const solarInv = inverters.find(inv => inv.id === node.id);
      if (solarInv) {
        const newId = Math.random().toString(36).substr(2, 9);
        addProjectInverter({ ...solarInv, id: newId, quantity: 1 });
        techState.addInverter(solarInv, newId);
      }
    } else if (node.type === 'module') {
      const mod = modules.find(m => m.id === node.id);
      if (mod) {
        const newId = Math.random().toString(36).substr(2, 9);
        addModule({ ...mod, id: newId, quantity: 1 });
      }
    }
  }, [inverters, modules, addProjectInverter, techState, addModule]);

  // ── Keyboard Shortcuts (Delete/Backspace, Ctrl+D) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntity.id) {
        e.preventDefault();
        const node: TreeNode = {
          id: selectedEntity.id, label: '', type: selectedEntity.type as TreeNodeType,
          icon: Sun, deletable: true,
        };
        handleDelete(node);
      }

      if (e.ctrlKey && e.key === 'd' && selectedEntity.id) {
        e.preventDefault();
        const node: TreeNode = {
          id: selectedEntity.id, label: '', type: selectedEntity.type as TreeNodeType,
          icon: Sun,
        };
        handleDuplicate(node);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedEntity, handleDelete, handleDuplicate]);

  // ── DnD Handlers ──
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragData(event.active.data.current);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    if (!over) return;

    const data = active.data.current;
    const targetData = over.data.current;

    if (!data || !targetData) return;

    // 1. Drag String -> Drop MPPT
    if (data.type === 'string' && targetData.type === 'mppt') {
      data.ids.forEach((strId: string) => {
        techState.assignStringToMPPT(strId, targetData.meta.inverterId, targetData.meta.mpptId);
      });
    }
    // 2. Drag Module -> Drop String
    else if (data.type === 'module' && targetData.type === 'string') {
      techState.addModulesToString(targetData.id, data.ids);
    }
    // 3. Drag Module -> Drop MPPT
    else if (data.type === 'module' && targetData.type === 'mppt') {
      techState.assignModulesToNewString(data.ids, targetData.meta.inverterId, targetData.meta.mpptId);
    }
    // 4. Drag Module -> Drop Inverter
    else if (data.type === 'module' && targetData.type === 'inverter') {
      const inv = useTechStore.getState().inverters.entities[targetData.id];
      const mpptId = inv?.mpptConfigs?.[0]?.mpptId || 1;
      techState.assignModulesToNewString(data.ids, targetData.id, mpptId);
    }
    // 5. Drag String -> Drop Inverter
    else if (data.type === 'string' && targetData.type === 'inverter') {
      data.ids.forEach((strId: string) => {
        techState.assignStringToInverterFallback(strId, targetData.id);
      });
    }
    // 6. Action: Devolver String para Pool
    else if (data.type === 'string' && targetData.id === 'folder-disconnected-strings') {
      data.ids.forEach((strId: string) => techState.unassignStringFromMPPT(strId));
    }
    // 7. Action: Devolver Module para Pool Livre
    else if (data.type === 'module' && targetData.id === 'folder-free-modules') {
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
  const assignedModuleIds = new Set<string>();
  Object.values(strings).forEach(str => str.moduleIds.forEach(mId => assignedModuleIds.add(mId)));

  const freeModules = useMemo(() => modules.filter(m => !assignedModuleIds.has(m.id)), [modules, assignedModuleIds]);
  const unassignedStrings = Object.values(strings).filter(str => !str.mpptId);

  // ── Multi-select Range Handler ──
  const handleMultiSelect = useCallback((id: string, shiftKey?: boolean) => {
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

  // ── Create String Handlers ──
  const handleCreateString = useCallback(() => {
    if (selectedEntity.type !== 'module') return;
    const idsToGroup = selectedEntity.multiIds.filter(id => freeModules.some(m => m.id === id));
    if (idsToGroup.length > 0) {
      techState.createString(idsToGroup);
      clearSelection();
    }
  }, [selectedEntity, freeModules, techState, clearSelection]);

  // ── Tree Construction ──

  const electricalNodes: TreeNode[] = useMemo(() => inverters.map(inv => {
    const techInv = techInverters.find(ti => ti.id === inv.id) || techInverters.find(ti => ti.catalogId === inv.id);
    const hasError = electrical?.entries?.some(e => e.inverterId === techInv?.id && e.status === 'error');
    const hasWarning = electrical?.entries?.some(e => e.inverterId === techInv?.id && e.status === 'warning');
    const inverterStatus = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

    const mpptChildren: TreeNode[] = techInv
      ? techInv.mpptConfigs.map(mppt => {

        const mpptStrings = mppt.stringIds.map(sid => strings[sid]).filter(Boolean);

        // Verificar validação deste MPPT
        const validationEntry = electrical?.entries?.find(e => e.inverterId === techInv.id && e.mpptId === mppt.mpptId);

        const hasVoc = validationEntry?.messages?.some(m => m.includes('Voc'));
        const hasIsc = validationEntry?.messages?.some(m => m.includes('Isc'));
        const hasVmp = validationEntry?.messages?.some(m => m.includes('Vmp'));
        const errorMessage = [
          hasVoc && 'Sobretensão!',
          hasIsc && 'Isc Alta!',
          hasVmp && 'Faixa MPPT!'
        ].filter(Boolean).join(' + ') || 'Violação!';

        const stringChildren: TreeNode[] = mpptStrings.map(str => {
          const strModules = str.moduleIds.map(mid => modules.find(m => m.id === mid)).filter(Boolean) as any[];
          return {
            id: str.id,
            label: str.name,
            type: 'string' as const,
            icon: Link2,
            badge: `${strModules.length} mods`,
            // Fios vermelhos se a string estiver num MPPT com erro
            badgeColor: validationEntry?.status === 'error' ? 'text-red-500 bg-red-500/10 border border-red-500/50' : undefined,
            deletable: true,
            draggable: true,
            droppable: true,
            children: strModules.map(m => ({
              id: m.id,
              label: `${m.manufacturer.substring(0, 6)} ${m.power}W`,
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
          badge: validationEntry && validationEntry.status !== 'ok' ? errorMessage : undefined,
          badgeColor: validationEntry?.status === 'error' ? 'text-red-400 bg-red-400/10 border border-red-500/50' :
            validationEntry?.status === 'warning' ? 'text-amber-400 bg-amber-400/10' : undefined,
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
      badge: inverterStatus === 'error' ? 'Crítico: Risco de Queima' : undefined,
      badgeColor: inverterStatus === 'error' ? 'text-red-50 text-[9px] bg-red-600 animate-pulse outline outline-1 outline-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : undefined,
      children: mpptChildren,
    };
  }), [inverters, techInverters, strings, modules, electrical]);

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
        label: `${m.manufacturer.substring(0, 6)} ${m.power}W`,
        type: 'module' as const,
        icon: Sun,
        deletable: true,
        draggable: true,
        meta: { stringId: str.id }
      }))
    };
  }), [unassignedStrings, modules]);

  const freeModuleNodes: TreeNode[] = useMemo(() => freeModules.map(m => ({
    id: m.id,
    label: `${m.manufacturer.substring(0, 6)} ${m.power}W`,
    type: 'module' as const,
    icon: Sun,
    deletable: true,
    draggable: true
  })), [freeModules]);

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

  const virtualFolders: TreeNode[] = [];

  if (disconnectedStringNodes.length > 0) {
    virtualFolders.push({
      id: 'folder-disconnected-strings',
      label: 'Strings Desconectadas',
      type: 'folder' as any,
      icon: Unlink,
      droppable: true,
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
      droppable: true,
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

  const allRootNodes = [...electricalNodes, ...virtualFolders];

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

      {/* Tree View inside DndContext */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {allRootNodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center border-2 border-dashed border-slate-800 rounded-xl m-2 bg-slate-900/50">
              <Cable size={24} className="text-slate-700" />
              <p className="text-[11px] max-w-[150px]">Adicione inversores ou painéis para montar a topologia.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {allRootNodes.map(node => (
                <TreeNodeItem key={node.id} node={node} depth={0}
                  selectedEntity={selectedEntity}
                  onSelect={selectEntity} onMultiSelect={handleMultiSelect}
                  onDelete={handleDelete} onUnlink={handleUnlink} onCreateString={handleCreateString}
                />
              ))}
            </div>
          )}

          <DragOverlay dropAnimation={null}>
            {activeDragData && (
              <div className="px-3 py-1.5 bg-emerald-500/90 text-emerald-50 font-medium text-[11px] rounded shadow-xl flex items-center gap-2 border border-emerald-400 backdrop-blur-md">
                <Layers size={14} />
                Arrastando {activeDragData.ids?.length || 1} ite{activeDragData.ids?.length === 1 ? 'm' : 'ns'}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800/50 flex items-center justify-between bg-slate-950 z-10">
        <span className="text-[9px] text-slate-600">{modules.length > 0 ? `${modules.length} lógicos` : '—'}</span>
        <span className="text-[9px] text-slate-700">{placedModules.length > 0 ? `${placedModules.length} físicos` : ''}</span>
      </div>

      <ModuleCatalogDialog isOpen={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} onAddModule={handleAddModule} />
      <InverterCatalogDialog isOpen={inverterDialogOpen} onClose={() => setInverterDialogOpen(false)} onAddInverter={handleAddInverter} />
    </div>
  );
};

// =============================================================================
// TREE NODE (Recursive, DnD via dnd-kit, ContextMenu)
// =============================================================================

const TreeNodeItem: React.FC<{
  node: TreeNode;
  depth: number;
  selectedEntity: any;
  onSelect: (type: any, id: string, label?: string) => void;
  onMultiSelect: (id: string, shiftKey?: boolean) => void;
  onDelete: (node: TreeNode, e?: React.MouseEvent) => void;
  onUnlink?: (node: TreeNode, e?: React.MouseEvent) => void;
  onCreateString?: () => void;
  onDuplicate?: (node: TreeNode, e?: React.MouseEvent) => void;
}> = ({ node, depth, selectedEntity, onSelect, onMultiSelect, onDelete, onUnlink, onCreateString, onDuplicate }) => {
  const [expanded, setExpanded] = useState(true);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedEntity.type === node.type && selectedEntity.multiIds.includes(node.id);
  const Icon = node.icon;

  const idsToDrag = isSelected && selectedEntity.multiIds.length > 1
    ? selectedEntity.multiIds
    : [node.id];

  // Identificadores únicos para o dnd-kit
  const dragId = node.id + '-drag';
  const dropId = node.id + '-drop';

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: dragId,
    data: { type: node.type, ids: idsToDrag, meta: node.meta },
    disabled: !node.draggable
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: dropId,
    data: { type: node.type, id: node.id, meta: node.meta },
    disabled: !node.droppable
  });

  const setNodeRef = useCallback((element: HTMLElement | null) => {
    setDroppableRef(element);
    if (node.draggable) setDraggableRef(element);
  }, [setDroppableRef, setDraggableRef, node.draggable]);

  // Menu de Contexto Dinâmico
  const renderContextMenu = () => {
    const isFreeSelected = selectedEntity.type === 'module' && selectedEntity.multiIds.includes(node.id);
    const actions: React.ReactNode[] = [];

    // Opção: Agrupar Strings
    if (node.type === 'module' && isFreeSelected && selectedEntity.multiIds.length > 0 && onCreateString) {
      actions.push(
        <ContextMenu.Item
          key="create-string"
          className="px-2 py-1.5 text-[10px] text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 outline-none cursor-pointer rounded-sm flex items-center gap-2 transition-colors"
          onClick={onCreateString}
        >
          <Link2 size={12} /> Agrupar em Nova String ({selectedEntity.multiIds.length})
        </ContextMenu.Item>
      );
    }

    // Opção: Desvincular / Devolver
    if (onUnlink && ((node.type === 'module' && node.meta?.stringId) || (node.type === 'string' && node.meta?.mpptId !== undefined))) {
      actions.push(
        <ContextMenu.Item
          key="unlink"
          className="px-2 py-1.5 text-[10px] text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 outline-none cursor-pointer rounded-sm flex items-center gap-2 transition-colors"
          onClick={(e) => onUnlink(node, e as any)}
        >
          <Unlink size={12} /> Desvincular e Devolver
        </ContextMenu.Item>
      );
    }

    // Opção: Duplicar (inversores e módulos)
    if (onDuplicate && (node.type === 'inverter' || node.type === 'module')) {
        actions.push(
            <ContextMenu.Item 
                key="duplicate"
                className="px-2 py-1.5 text-[10px] text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 outline-none cursor-pointer rounded-sm flex items-center gap-2 transition-colors"
                onClick={(e) => onDuplicate(node, e as any)}
            >
                <Copy size={12}/> Duplicar {node.type === 'inverter' ? 'Inversor' : 'Módulo'}
            </ContextMenu.Item>
        );
    }

    // Opção: Deletar Permanentemente
    if (node.deletable) {
      actions.push(
        <ContextMenu.Item
          key="delete"
          className="px-2 py-1.5 text-[10px] text-red-500 hover:bg-red-500/20 hover:text-red-400 outline-none cursor-pointer rounded-sm flex items-center gap-2 transition-colors"
          onClick={(e) => onDelete(node, e as any)}
        >
          <Trash2 size={12} /> Deletar Permanentemente
        </ContextMenu.Item>
      );
    }

    if (actions.length === 0) return null;

    return (
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[180px] bg-slate-900/95 backdrop-blur-sm border border-slate-700 shadow-xl rounded-lg p-1 z-[100] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {actions}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    );
  };

  const contextMenuContent = renderContextMenu();

  return (
    <div ref={setNodeRef} className={cn("relative", isDragging && "opacity-40")}>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div
            {...listeners}
            {...attributes}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren && !e.shiftKey && !e.ctrlKey) setExpanded(!expanded);

              if (e.shiftKey || e.ctrlKey) {
                onMultiSelect(node.id, e.shiftKey);
              } else {
                onSelect(node.type as any, node.id, node.label);
              }
            }}
            className={cn(
              "w-full flex items-center gap-1 px-1.5 py-1 rounded text-left transition-all text-[10px] group cursor-pointer select-none",
              isSelected ? 'bg-emerald-500/20 text-emerald-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200',
              isOver && 'ring-1 ring-emerald-500 bg-emerald-500/10 text-emerald-300',
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

            {/* Inline delete button (hover) */}
            {node.deletable && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(node, e); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-700 transition-all shrink-0"
                title="Remover"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </ContextMenu.Trigger>
        {contextMenuContent}
      </ContextMenu.Root>

      {hasChildren && expanded && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150 relative">
          <div className="absolute left-[14px] top-0 bottom-1 w-px bg-slate-800/50" />
          {node.children!.map(child => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1}
              selectedEntity={selectedEntity}
              onSelect={onSelect} onMultiSelect={onMultiSelect}
              onDelete={onDelete} onUnlink={onUnlink} onCreateString={onCreateString}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
