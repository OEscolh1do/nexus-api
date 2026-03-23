/**
 * =============================================================================
 * INVERTER PROPERTIES — Propriedades do inversor selecionado
 * =============================================================================
 */

import React, { useMemo, useCallback } from 'react';
import { Cpu, Zap, BarChart3, Cable } from 'lucide-react';
import { type SelectedEntity } from '@/core/state/uiStore';
import { useSolarStore, selectInverters } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { SectionHeader, PropRow, PropRowEditable } from './shared';

export const InverterProperties: React.FC<{ entity: SelectedEntity }> = ({ entity }) => {
  const inverters = useSolarStore(selectInverters);
  const updateInverterQty = useSolarStore(state => state.updateInverterQty);
  const { inverters: techInvertersNorm } = useTechStore();
  const techInverters = toArray(techInvertersNorm);

  const inverter = useMemo(
    () => inverters.find(inv => inv.id === entity.id),
    [inverters, entity.id]
  );

  const techInverter = useMemo(
    () => techInverters.find(ti => ti.catalogId === entity.id || ti.id === entity.id),
    [techInverters, entity.id]
  );

  const handleQtyChange = useCallback((value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty > 0 && entity.id) {
      updateInverterQty(entity.id, qty);
    }
  }, [entity.id, updateInverterQty]);

  if (!inverter) {
    return (
      <div className="p-3 text-center">
        <p className="text-[10px] text-slate-600">Inversor não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center gap-2 mb-2">
        <Cpu size={12} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 truncate">{entity.label}</span>
      </div>

      <section>
        <SectionHeader icon={<Cpu size={10} />} label="Especificações" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Fabricante" value={inverter.manufacturer} />
          <PropRow label="Modelo" value={inverter.model} />
          <PropRow label="Potência" value={`${inverter.nominalPower}kW`} accent />
          <PropRow label="Eficiência" value={`${inverter.maxEfficiency}%`} />
          <PropRow label="Conexão" value={inverter.connectionType} />
        </div>
      </section>

      <section>
        <SectionHeader icon={<Zap size={10} />} label="Elétrico" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="V máx. entrada" value={`${inverter.maxInputVoltage}V`} />
          <PropRow label="V mín. entrada" value={`${inverter.minInputVoltage}V`} />
          <PropRow label="I máx. entrada" value={`${inverter.maxInputCurrent}A`} />
          <PropRow label="V saída" value={`${inverter.outputVoltage}V`} />
          <PropRow label="I máx. saída" value={`${inverter.maxOutputCurrent}A`} />
        </div>
      </section>

      <section>
        <SectionHeader icon={<BarChart3 size={10} />} label="Projeto" />
        <div className="mt-2 space-y-1.5">
          <PropRowEditable
            label="Quantidade"
            value={String(inverter.quantity)}
            onCommit={handleQtyChange}
            type="number"
          />
        </div>
      </section>

      {/* MPPT Configurations */}
      {techInverter && techInverter.mpptConfigs.length > 0 && (
        <section>
          <SectionHeader icon={<Cable size={10} />} label="Configuração MPPT" />
          <div className="mt-2 space-y-2">
            {techInverter.mpptConfigs.map(mppt => (
              <div key={mppt.mpptId} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[9px] font-bold text-purple-400">MPPT {mppt.mpptId}</span>
                <div className="space-y-1">
                  <PropRow label="Strings" value={`${mppt.stringsCount}`} />
                  <PropRow label="Módulos/String" value={`${mppt.modulesPerString}`} />
                  {mppt.azimuth != null && <PropRow label="Azimute" value={`${mppt.azimuth}°`} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
