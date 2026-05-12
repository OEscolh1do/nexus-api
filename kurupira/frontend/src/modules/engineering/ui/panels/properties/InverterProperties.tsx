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
  const { inverters: techInvertersNorm, updateMPPTConfig } = useTechStore();
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
    <div className="flex flex-col">
      {/* ── INVERTER HEADER ── */}
      <div className="p-3 pb-0">
        <div className="px-3 py-2 rounded-sm bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-2 mb-4">
          <Cpu size={12} className="text-indigo-400" />
          <span className="text-[10px] font-black text-slate-200 truncate uppercase tracking-widest">{entity.label}</span>
        </div>
      </div>

      <div className="px-3 space-y-5 pb-6">
        <section>
          <SectionHeader icon={<Cpu size={10} />} label="Especificações" />
          <div className="mt-2 space-y-0.5">
            <PropRow label="Fabricante" value={inverter.manufacturer} mono={false} />
            <PropRow label="Modelo" value={inverter.model} mono={false} />
            <PropRow label="Potência" value={`${inverter.nominalPower}kW`} accent />
            <PropRow label="Eficiência" value={`${inverter.maxEfficiency}%`} />
            <PropRow label="Conexão" value={inverter.connectionType} mono={false} />
          </div>
        </section>

        <section>
          <SectionHeader icon={<Zap size={10} />} label="Elétrico" />
          <div className="mt-2 space-y-0.5">
            <PropRow label="V máx. entrada" value={`${inverter.maxInputVoltage}V`} />
            <PropRow label="V mín. entrada" value={`${inverter.minInputVoltage}V`} />
            <PropRow label="I máx. entrada" value={`${inverter.maxInputCurrent}A`} />
            <PropRow label="V saída" value={`${inverter.outputVoltage}V`} />
            <PropRow label="I máx. saída" value={`${inverter.maxOutputCurrent}A`} />
          </div>
        </section>

        <section>
          <SectionHeader icon={<BarChart3 size={10} />} label="Projeto" />
          <div className="mt-2 space-y-0.5">
            <PropRowEditable
              label="Quantidade"
              value={String(inverter.quantity)}
              onCommit={handleQtyChange}
              type="number"
              unit="un"
            />
          </div>
        </section>

        {/* MPPT Configurations */}
        {techInverter && techInverter.mpptConfigs.length > 0 && (
          <section>
            <SectionHeader icon={<Cable size={10} />} label="Configuração MPPT" />
            <div className="mt-2 space-y-2">
              {techInverter.mpptConfigs.map(mppt => (
                <div key={mppt.mpptId} className="px-2 py-1.5 rounded-sm bg-slate-900/40 border border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">MPPT {mppt.mpptId}</span>
                  </div>
                  <div className="space-y-0.5">
                    <PropRowEditable 
                      label="Strings" 
                      value={`${mppt.stringsCount}`} 
                      type="number"
                      onCommit={(val) => {
                        updateMPPTConfig(inverter.id, mppt.mpptId, { stringsCount: Number(val) });
                      }}
                    />
                    <PropRowEditable 
                      label="Módulos/String" 
                      value={`${mppt.modulesPerString}`} 
                      type="number"
                      onCommit={(val) => {
                        updateMPPTConfig(inverter.id, mppt.mpptId, { modulesPerString: Number(val) });
                      }}
                    />
                    <PropRowEditable 
                      label="Azimute" 
                      value={String(mppt.azimuth ?? 180)} 
                      type="number"
                      unit="°"
                      onCommit={(val) => {
                        updateMPPTConfig(inverter.id, mppt.mpptId, { azimuth: Number(val) });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
