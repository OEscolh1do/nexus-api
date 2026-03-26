/**
 * =============================================================================
 * STRING PROPERTIES — Propriedades da string/MPPT selecionada
 * =============================================================================
 */

import React, { useMemo, useCallback } from 'react';
import { Cable, Cpu } from 'lucide-react';
import { type SelectedEntity } from '@/core/state/uiStore';
import { useTechStore, type MPPTConfig } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { useElectricalValidation } from '@/modules/engineering/hooks/useElectricalValidation';
import { SectionHeader, PropRow, PropRowEditable } from './shared';

import { useSolarStore } from '@/core/state/solarStore';

export const StringProperties: React.FC<{ entity: SelectedEntity }> = ({ entity }) => {
  const { inverters: techInvertersNorm, updateMPPTConfig } = useTechStore();
  const techInverters = toArray(techInvertersNorm);
  const { electrical } = useElectricalValidation();
  const systemMinTemp = 10;

  const parsed = useMemo(() => {
    if (!entity.id) return null;
    const parts = entity.id.split('-mppt-');
    if (parts.length !== 2) return null;
    const inverterId = parts[0];
    const mpptId = parseInt(parts[1], 10);
    const techInv = techInverters.find(ti => ti.id === inverterId || ti.catalogId === inverterId);
    const mppt = techInv?.mpptConfigs.find(m => m.mpptId === mpptId);
    return { techInv, mppt, inverterId, mpptId };
  }, [entity.id, techInverters]);

  const handleMPPTCommit = useCallback(
    (field: keyof MPPTConfig, min: number, max: number) => (value: string): boolean => {
      if (!parsed?.techInv) return false;
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (num < min || num > max) return false;
      updateMPPTConfig(parsed.techInv.id, parsed.mpptId, { [field]: num });
      return true;
    },
    [parsed, updateMPPTConfig]
  );

  const placedModules = useSolarStore(s => s.project.placedModules);
  const physicalCount = parsed ? placedModules.filter(m => m.stringData?.inverterId === parsed.inverterId && m.stringData?.mpptId === parsed.mpptId).length : 0;
  
  const validation = useMemo(() => {
    if (!parsed || !electrical?.entries) return null;
    return electrical.entries.find(e => e.inverterId === parsed.inverterId && e.mpptId === parsed.mpptId);
  }, [parsed, electrical]);

  const logicalCount = parsed && parsed.mppt ? parsed.mppt.modulesPerString * parsed.mppt.stringsCount : 0;
  const isVocUnsafe = validation?.messages.some(m => m.includes('Voc')) || false;
  const isCurrentUnsafe = validation?.messages.some(m => m.includes('Isc')) || false;

  return (
    <div className="p-3 space-y-3">
      <div className="px-2 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center gap-2 mb-2">
        <Cable size={12} className="text-purple-400" />
        <span className="text-[10px] font-bold text-purple-400 truncate">{entity.label}</span>
      </div>

      <section>
        <SectionHeader icon={<Cable size={10} />} label="Configuração da String" />
        <div className="mt-2 space-y-1.5">
          {parsed?.mppt ? (
            <>
              <PropRowEditable
                label="Módulos/String"
                value={String(parsed.mppt.modulesPerString)}
                type="number"
                onCommit={handleMPPTCommit('modulesPerString', 1, 30)}
              />
              <PropRowEditable
                label="Nº de Strings"
                value={String(parsed.mppt.stringsCount)}
                type="number"
                onCommit={handleMPPTCommit('stringsCount', 1, 10)}
              />
              <PropRow label="Total Lógico" value={`${logicalCount}`} accent />
              <PropRow 
                 label="Total Físico" 
                 value={`${physicalCount}`} 
                 accent={physicalCount > 0 && physicalCount === logicalCount} 
              />
              
              <div className="h-px bg-slate-800/50 my-1" />
              
              {validation && (
                <>
                  <PropRow 
                    label={`Voc Máx (${systemMinTemp}°C)`} 
                    value={`${validation.vocMax.toFixed(1)}V`} 
                    danger={isVocUnsafe}
                  />
                  <PropRow 
                    label="Isc (Array)" 
                    value={`${validation.iscTotal.toFixed(1)}A`} 
                    danger={isCurrentUnsafe}
                  />
                </>
              )}

              <div className="h-px bg-slate-800/50 my-1" />

              <PropRowEditable
                label="Azimute (°)"
                value={String(parsed.mppt.azimuth ?? 180)}
                type="number"
                onCommit={handleMPPTCommit('azimuth', 0, 360)}
              />
              <PropRowEditable
                label="Inclinação (°)"
                value={String(parsed.mppt.inclination ?? 0)}
                type="number"
                onCommit={handleMPPTCommit('inclination', 0, 90)}
              />
            </>
          ) : (
            <>
              <PropRow label="Módulos" value="—" />
              <PropRow label="Tensão Total" value="—" />
              <PropRow label="Corrente" value="—" />
            </>
          )}
        </div>
      </section>

      {parsed?.techInv && (
        <section>
          <SectionHeader icon={<Cpu size={10} />} label="Inversor" />
          <div className="mt-2 space-y-1.5">
            <PropRow label="Modelo" value={parsed.techInv.snapshot.model} />
            <PropRow label="Potência" value={`${parsed.techInv.snapshot.nominalPower}kW`} />
            <PropRow label="MPPTs" value={`${parsed.techInv.snapshot.mppts}`} />
          </div>
        </section>
      )}
    </div>
  );
};
