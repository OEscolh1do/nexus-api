/**
 * StringingMpptPickerModal — Picker de MPPT para atribuição de módulos
 *
 * Exibido ao confirmar a seleção de módulos no modo STRINGING.
 * Extrato de PhysicalCanvasView para manter o canvas principal enxuto.
 */

import React from 'react';
import type { InverterState } from '../../../../store/useTechStore';
import type { PlacedModule } from '@/core/state/slices/projectSlice';

// =============================================================================
// TYPES
// =============================================================================

export interface StringingMpptPickerModalProps {
  /** Se o modal está visível */
  open: boolean;
  /** IDs dos módulos selecionados para atribuição */
  selectedModuleIds: string[];
  /** Lista de inversores configurados no projeto */
  techInverters: InverterState[];
  /** Módulos posicionados no canvas */
  placedModules: PlacedModule[];
  /** Lista de inversores do catálogo (para exibir modelo) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalogInvertersList: any[];
  /** Atribui os módulos a uma string do MPPT escolhido */
  onAssign: (moduleIds: string[], inverterId: string, mpptId: number, stringId: string) => void;
  /** Fecha o modal */
  onClose: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const StringingMpptPickerModal: React.FC<StringingMpptPickerModalProps> = ({
  open,
  selectedModuleIds,
  techInverters,
  placedModules,
  catalogInvertersList,
  onAssign,
  onClose,
}) => {
  if (!open || selectedModuleIds.length === 0) return null;

  // D03: Aviso de reassociação — módulos que já têm string atribuída
  const assignedModules = selectedModuleIds
    .map(id => placedModules.find(m => m.id === id))
    .filter(m => m?.stringData);

  const sourceStrings =
    assignedModules.length > 0
      ? [...new Set(
          assignedModules.map(m => {
            const sd = m!.stringData!;
            const inv = techInverters.find(i => i.id === sd.inverterId);
            const invLabel = inv
              ? (catalogInvertersList.find((c: any) => c.id === inv.catalogId)?.model ?? `Inv ${sd.inverterId.slice(0, 6)}`)
              : `Inv ${sd.inverterId.slice(0, 6)}`;
            return `${invLabel} › MPPT ${sd.mpptId}`;
          })
        )]
      : [];

  const handleAssignToMppt = (inverterId: string, mpptId: number) => {
    const existingStringIds = new Set(
      placedModules
        .filter(m => m.stringData?.inverterId === inverterId && m.stringData?.mpptId === mpptId && m.stringData?.stringId)
        .map(m => m.stringData!.stringId as string)
    );
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nextStringId = 'String A';
    for (let i = 0; i < letters.length; i++) {
      const candidate = `String ${letters[i]}`;
      if (!existingStringIds.has(candidate)) { nextStringId = candidate; break; }
    }
    onAssign(selectedModuleIds, inverterId, mpptId, nextStringId);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-end justify-center pb-16 pointer-events-none">
      <div
        className="pointer-events-auto bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-4 w-[360px] animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">
            Atribuir {selectedModuleIds.length} módulo{selectedModuleIds.length !== 1 ? 's' : ''} ao MPPT
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Aviso de reassociação */}
        {assignedModules.length > 0 && (
          <div className="mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-[9px] text-amber-400 font-bold uppercase tracking-wider">
            ⚠ {assignedModules.length} módulo(s) de {sourceStrings.join(', ')} serão reassociados
          </div>
        )}

        {/* Lista de inversores e MPPTs */}
        {techInverters.length === 0 ? (
          <p className="text-[10px] text-slate-500 text-center py-4">
            Nenhum inversor configurado. Vá para a aba Inversores.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
            {techInverters.map(inv => {
              const cat = catalogInvertersList.find((c: any) => c.id === inv.catalogId);
              return (
                <div key={inv.id} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {cat?.model ?? inv.snapshot?.model ?? inv.id}
                  </div>
                  <div className="flex flex-wrap gap-1 p-2">
                    {inv.mpptConfigs.map(mppt => {
                      const assignedCount = placedModules.filter(
                        m => m.stringData?.inverterId === inv.id && m.stringData?.mpptId === mppt.mpptId
                      ).length;
                      const stringCount = mppt.strings?.length ?? 0;
                      const configuredCapacity = (mppt.strings || []).reduce(
                        (acc, s) => acc + (s.modulesCount || mppt.modulesPerString || 0), 0
                      );
                      const remaining = Math.max(0, configuredCapacity - assignedCount);

                      return (
                        <button
                          key={mppt.mpptId}
                          onClick={() => handleAssignToMppt(inv.id, mppt.mpptId)}
                          className="px-2 py-1 text-[9px] font-black uppercase rounded border border-slate-700 bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-slate-400 transition-all"
                        >
                          <span>MPPT {mppt.mpptId}</span>
                          {stringCount > 0 && <span className="opacity-60"> · {stringCount} str</span>}
                          <span className="ml-1 flex items-center gap-0.5">
                            {assignedCount > 0 && (
                              <span className="px-1 rounded bg-indigo-500/20 text-indigo-300 text-[8px] font-mono">
                                {assignedCount}↑
                              </span>
                            )}
                            {configuredCapacity > 0 && remaining > 0 && (
                              <span className="px-1 rounded bg-slate-600/40 text-slate-400 text-[8px] font-mono">
                                {remaining}↓
                              </span>
                            )}
                            {configuredCapacity > 0 && remaining === 0 && assignedCount > 0 && (
                              <span className="px-1 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-mono">✓</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancelar */}
        <button
          onClick={onClose}
          className="mt-3 w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors border border-slate-800 rounded-md"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
