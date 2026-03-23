/**
 * =============================================================================
 * MODULE PROPERTIES — Propriedades do módulo fotovoltaico selecionado
 * =============================================================================
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Sun, Zap, BarChart3, Cable } from 'lucide-react';
import { type SelectedEntity } from '@/core/state/uiStore';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { useUIStore } from '@/core/state/uiStore';
import { toArray } from '@/core/types/normalized.types';
import { SectionHeader, PropRow, PropRowEditable } from './shared';

export const ModuleProperties: React.FC<{ entity: SelectedEntity }> = ({ entity }) => {
  const modules = useSolarStore(selectModules);
  const engineering = useSolarStore(state => state.engineeringData);
  const updateModuleQty = useSolarStore(state => state.updateModuleQty);
  const placedModules = useSolarStore(state => state.project.placedModules);
  
  const inverters = useSolarStore(selectInverters);
  const { inverters: techInvertersStore } = useTechStore();
  const techInverters = toArray(techInvertersStore);

  const multiIds = entity.multiIds || [entity.id!];
  const isMulti = multiIds.length > 1;

  const placedInstance = useMemo(
    () => placedModules.find(pm => pm.id === entity.id),
    [placedModules, entity.id]
  );

  const module = useMemo(
    () => modules.find(m => m.id === (placedInstance ? placedInstance.moduleSpecId : entity.id)),
    [modules, entity.id, placedInstance]
  );

  const handleQtyChange = useCallback((value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty > 0 && !placedInstance && entity.id) {
      updateModuleQty(entity.id, qty);
    }
  }, [entity.id, updateModuleQty, placedInstance]);

  const [assignInverterId, setAssignInverterId] = useState<string>('');
  const [assignMpptId, setAssignMpptId] = useState<string>('');

  const handleAssign = () => {
    if (!assignInverterId || !assignMpptId) return;
    const mpptNumericId = parseInt(assignMpptId, 10);
    useSolarStore.getState().assignModulesToString(multiIds, assignInverterId, mpptNumericId);
    useUIStore.getState().clearSelection();
  };

  if (!module) {
    return (
      <div className="p-3 text-center">
        <p className="text-[10px] text-slate-600">Módulo não encontrado no catálogo.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2 mb-2">
        <Sun size={12} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-400 truncate">{entity.label}</span>
      </div>

      <section>
        <SectionHeader icon={<Sun size={10} />} label="Especificações" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Fabricante" value={module.manufacturer} />
          <PropRow label="Modelo" value={module.model} />
          <PropRow label="Potência" value={`${module.power}W`} accent />
          <PropRow label="Tipo" value={module.type || '—'} />
          <PropRow label="Eficiência" value={`${module.efficiency}%`} />
          <PropRow label="Células" value={`${module.cells}`} />
        </div>
      </section>

      <section>
        <SectionHeader icon={<Zap size={10} />} label="Elétrico" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Vmp" value={`${module.vmp}V`} />
          <PropRow label="Imp" value={`${module.imp}A`} />
          <PropRow label="Voc" value={`${module.voc}V`} />
          <PropRow label="Isc" value={`${module.isc}A`} />
          <PropRow label="Fusível Máx" value={`${module.maxFuseRating}A`} />
          <PropRow label="Coef. Temp." value={`${module.tempCoeff}%/°C`} />
        </div>
      </section>

      <section>
        <SectionHeader icon={<BarChart3 size={10} />} label="Projeto" />
        <div className="mt-2 space-y-1.5">
          {placedInstance ? (
            <PropRow label="Status Físico" value="Posicionado no Mapa" accent />
          ) : (
            <PropRowEditable
              label="Quantidade (Manual)"
              value={String(module.quantity)}
              onCommit={handleQtyChange}
              type="number"
            />
          )}
          <PropRow label="Azimute" value={engineering?.azimute != null ? `${engineering.azimute}°` : '—'} />
          <PropRow label="Inclinação" value={engineering?.roofTilt != null ? `${engineering.roofTilt}°` : '—'} />
          <PropRow label="Orientação" value={engineering?.orientation || '—'} />
        </div>
      </section>

      {/* P6-1: UI de Stringing Física-Lógica */}
      {placedInstance && inverters.length > 0 && (
        <section className="pt-2 border-t border-slate-800">
          <SectionHeader icon={<Cable size={10} />} label="Atribuição Elétrica" />
          <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-700/50 space-y-3">
            <p className="text-[10px] text-slate-400">
              Vincule {isMulti ? `os ${multiIds.length} módulos selecionados` : 'este módulo'} a uma string física do inversor.
            </p>
            
            <div className="space-y-2">
              <select 
                className="w-full bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded p-1.5 outline-none focus:border-indigo-500"
                value={assignInverterId}
                onChange={e => { setAssignInverterId(e.target.value); setAssignMpptId(''); }}
              >
                <option value="">-- Selecione o Inversor --</option>
                {inverters.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.model} ({inv.nominalPower}kW)</option>
                ))}
              </select>

              {assignInverterId && (
                <select 
                  className="w-full bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded p-1.5 outline-none focus:border-indigo-500"
                  value={assignMpptId}
                  onChange={e => setAssignMpptId(e.target.value)}
                >
                  <option value="">-- Selecione o MPPT --</option>
                  {techInverters.find(ti => ti.id === assignInverterId || ti.catalogId === assignInverterId)?.mpptConfigs.map(mppt => (
                     <option key={mppt.mpptId} value={mppt.mpptId}>MPPT {mppt.mpptId} ({mppt.stringsCount} String(s))</option>
                  ))}
                </select>
              )}
            </div>

            <button 
              className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!assignInverterId || !assignMpptId}
              onClick={handleAssign}
            >
              Conectar à String
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
