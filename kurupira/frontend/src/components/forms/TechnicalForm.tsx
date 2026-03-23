/**
 * TECHNICAL FORM - Com Grafico de Geracao Integrado
 * Refatorado: Simulacao em tempo real com SolarCharts
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ModuleSpecs, InverterSpecs, EngineeringSettings, ChartData } from '@/core/types';
import { 
  Box, Plus, Trash2, Zap, DollarSign, AlertTriangle, 
  CheckCircle, Minus, BarChart3, TrendingUp
} from 'lucide-react';
import { MODULE_DB } from '@/data/equipment/modules';
import { INVERTER_CATALOG, Inverter } from '@/modules/engineering/constants/inverters';
import { calculateSimpleGeneration } from '@/services/solarEngine';
import { GenerationChart } from '@/components/ui/SolarCharts';
import {
  DenseFormGrid, DenseCard, DenseSelect, DenseStat, DenseButton, DenseDivider
} from '@/components/ui/dense-form';

interface Props {
  initialModules: ModuleSpecs[];
  initialInverters: InverterSpecs[];
  settings: EngineeringSettings;
  monthlyConsumption: number[];
  hspMonthly: number[];
  onBack?: () => void;
  onConfirm: (modules: ModuleSpecs[], inverters: InverterSpecs[], manualKitPrice: number) => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const TechnicalForm: React.FC<Props> = ({ 
  initialModules, 
  initialInverters, 
  settings,
  monthlyConsumption,
  hspMonthly,
  onConfirm 
}) => {
  const [modules, setModules] = useState<ModuleSpecs[]>(initialModules);
  const [inverters, setInverters] = useState<InverterSpecs[]>(initialInverters);
  
  const totalPowerKwp = useMemo(() => 
    modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000, 
  [modules]);
  
  const [manualKitPrice, setManualKitPrice] = useState<number>(totalPowerKwp * settings.referenceKitPricePerKwp);
  const [hasManualEdit, setHasManualEdit] = useState(false);

  useEffect(() => {
    if (!hasManualEdit) {
      setManualKitPrice(totalPowerKwp * settings.referenceKitPricePerKwp);
    }
  }, [totalPowerKwp, settings.referenceKitPricePerKwp, hasManualEdit]);

  // Seletores
  const [modMake, setModMake] = useState('');
  const [modModel, setModModel] = useState('');
  const [invMake, setInvMake] = useState('');

  // Calculos de validacao
  const totalInvPower = useMemo(() => inverters.reduce((acc, i) => acc + (i.nominalPower * i.quantity), 0), [inverters]);
  const overloadRatio = totalInvPower > 0 ? (totalPowerKwp / totalInvPower) : 0;
  const isOptimal = overloadRatio >= 0.75 && overloadRatio <= 1.45;
  
  // Validacao Voc (NBR 16274)
  const primaryInverter = inverters[0];
  const vocTotal = useMemo(() => modules.reduce((acc, m) => acc + ((m.voc || 49.5) * m.quantity), 0), [modules]);
  const vocSafetyMargin = primaryInverter ? (primaryInverter.maxInputVoltage * 0.8) : 800;
  const isVocSafe = vocTotal <= vocSafetyMargin;
  const isOverloadCritical = overloadRatio > 1.50;

  // Listas de equipamentos
  const moduleMakes = useMemo(() => Array.from(new Set(MODULE_DB.map((m: any) => m.manufacturer))).sort(), []);
  const moduleModels = useMemo(() => modMake ? MODULE_DB.filter((m: any) => m.manufacturer === modMake).map((m: any) => m.model).sort() : [], [modMake]);
  const inverterMakes = useMemo(() => Array.from(new Set(INVERTER_CATALOG.map((i: Inverter) => i.manufacturer))).sort(), []);
  const inverterModels = useMemo(() => invMake ? INVERTER_CATALOG.filter((i: Inverter) => i.manufacturer === invMake).map((i: Inverter) => i.model).sort() : [], [invMake]);

  // Calculo de geracao reativo
  const monthlyGeneration = useMemo(() => {
    if (modules.length === 0) return Array(12).fill(0);
    return calculateSimpleGeneration(modules, hspMonthly, settings.performanceRatio || 0.75);
  }, [modules, hspMonthly, settings.performanceRatio]);

  // Chart Data
  const chartData: ChartData[] = useMemo(() => {
    return MONTHS.map((month, i) => ({
      month,
      consumption: monthlyConsumption[i] || 0,
      generation: Math.round(monthlyGeneration[i] || 0)
    }));
  }, [monthlyConsumption, monthlyGeneration]);

  // Totais
  const totalAnnualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
  const totalAnnualConsumption = monthlyConsumption.reduce((a, b) => a + b, 0);
  const coveragePercent = totalAnnualConsumption > 0 ? (totalAnnualGeneration / totalAnnualConsumption) * 100 : 0;

  // Handlers
  const handleAddModule = () => {
    const db = MODULE_DB.find(m => m.model === modModel);
    if (!db) return;
    setModules([...modules, {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      supplier: db.manufacturer,
      manufacturer: db.manufacturer,
      model: db.model,
      type: 'Mono PERC',
      power: db.electrical.pmax,
      efficiency: Number(((db.electrical.efficiency || 0.2) * 100).toFixed(2)),
      cells: db.physical.cells || 144,
      imp: db.electrical.imp,
      vmp: db.electrical.vmp,
      isc: db.electrical.isc,
      voc: db.electrical.voc,
      weight: db.physical.weightKg,
      area: (db.physical.widthMm * db.physical.heightMm) / 1000000,
      dimensions: `${db.physical.heightMm}x${db.physical.widthMm}x${db.physical.depthMm}`,
      inmetroId: 'Aprovado',
      maxFuseRating: db.electrical.maxFuseRating || 20,
      tempCoeff: db.electrical.tempCoeffVoc,
      annualDepreciation: 0.8
    }]);
    setModModel('');
  };

  const handleAddInverter = (modelName: string) => {
    const db = INVERTER_CATALOG.find((i: Inverter) => i.model === modelName);
    if (!db) return;
    setInverters([...inverters, {
      id: Math.random().toString(36).substr(2, 9),
      quantity: 1,
      manufacturer: db.manufacturer,
      model: db.model,
      maxInputVoltage: db.mppts?.[0]?.maxInputVoltage || 600,
      minInputVoltage: db.mppts?.[0]?.minMpptVoltage || 80,
      maxInputCurrent: db.mppts?.[0]?.maxCurrentPerMPPT || 15,
      outputVoltage: 220,
      outputFrequency: 60,
      maxOutputCurrent: (db.nominalPowerW / 220),
      nominalPower: db.nominalPowerW / 1000,
      maxEfficiency: db.efficiency?.euro || 97.5,
      weight: 20,
      connectionType: 'Monofásico 220V'
    }]);
  };

  const handleQtyChange = (list: 'mod' | 'inv', id: string, delta: number) => {
    if (list === 'mod') {
      setModules(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      ));
    } else {
      setInverters(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      ));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(modules, inverters, manualKitPrice);
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
      <DenseFormGrid className="gap-4">

        {/* HEADER: Status do Dimensionamento */}
        <div className="col-span-12">
          <DenseCard className={`${isOptimal ? 'bg-slate-900' : 'bg-orange-500'} text-white`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <DenseStat label="Potencia Total" value={totalPowerKwp.toFixed(2)} unit="kWp" colSpan={3} variant="success" />
                <DenseStat label="Overload" value={`${(overloadRatio * 100).toFixed(0)}%`} colSpan={3} variant={isOptimal ? 'success' : 'warning'} />
                <DenseStat label="Inversores" value={totalInvPower.toFixed(1)} unit="kW" colSpan={3} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                  <DollarSign size={14} className="text-orange-400" />
                  <span className="text-xs font-bold text-white/60">Kit:</span>
                  <input
                    type="number"
                    value={manualKitPrice}
                    onChange={(e) => { setManualKitPrice(parseFloat(e.target.value) || 0); setHasManualEdit(true); }}
                    className="bg-transparent w-28 text-white font-bold outline-none text-right"
                  />
                </div>
                <DenseButton type="submit" variant="primary" disabled={modules.length === 0 || inverters.length === 0} icon={<CheckCircle size={14} />}>
                  Confirmar
                </DenseButton>
              </div>
            </div>
          </DenseCard>
        </div>

        {/* COLUNA ESQUERDA: Equipamentos (Col-7) */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          
          {/* Modulos */}
          <DenseCard>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Box size={12} className="text-orange-500" />
                Modulos Fotovoltaicos
              </h4>
              <span className="text-xs text-slate-400">{modules.reduce((a, m) => a + m.quantity, 0)} un</span>
            </div>

            <DenseFormGrid className="mb-3">
              <DenseSelect label="Fabricante" value={modMake} onChange={e => { setModMake(e.target.value); setModModel(''); }} options={moduleMakes.map(m => ({ value: m, label: m }))} placeholder="Selecione..." colSpan={5} />
              <DenseSelect label="Modelo" value={modModel} onChange={e => setModModel(e.target.value)} options={moduleModels.map(m => ({ value: m, label: m }))} placeholder="Selecione..." colSpan={5} disabled={!modMake} />
              <div className="col-span-2 flex items-end">
                <DenseButton type="button" onClick={handleAddModule} disabled={!modModel} variant="secondary" size="sm" icon={<Plus size={14} />} className="w-full" />
              </div>
            </DenseFormGrid>

            <DenseDivider />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {modules.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum modulo adicionado</p>
              ) : (
                modules.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{m.model}</p>
                      <p className="text-[10px] text-slate-400">{m.manufacturer} - {m.power}Wp</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleQtyChange('mod', m.id, -1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400"><Minus size={12} /></button>
                      <span className="w-6 text-center text-sm font-bold">{m.quantity}</span>
                      <button type="button" onClick={() => handleQtyChange('mod', m.id, 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400"><Plus size={12} /></button>
                      <button type="button" onClick={() => setModules(modules.filter(x => x.id !== m.id))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-100 text-slate-300 hover:text-red-500 ml-2"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DenseCard>

          {/* Inversores */}
          <DenseCard>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Zap size={12} className="text-yellow-500" />
                Inversores Fotovoltaicos
              </h4>
              <span className="text-xs text-slate-400">{inverters.reduce((a, i) => a + i.quantity, 0)} un</span>
            </div>

            <DenseFormGrid className="mb-3">
              <DenseSelect label="Fabricante" value={invMake} onChange={e => setInvMake(e.target.value)} options={inverterMakes.map(m => ({ value: m, label: m }))} placeholder="Selecione..." colSpan={6} />
              <DenseSelect label="Modelo" value="" onChange={e => handleAddInverter(e.target.value)} options={inverterModels.map(m => ({ value: m, label: m }))} placeholder="Selecione para adicionar..." colSpan={6} disabled={!invMake} />
            </DenseFormGrid>

            <DenseDivider />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {inverters.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum inversor adicionado</p>
              ) : (
                inverters.map(i => (
                  <div key={i.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{i.model}</p>
                      <p className="text-[10px] text-slate-400">{i.manufacturer} - {i.nominalPower}kW</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleQtyChange('inv', i.id, -1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400"><Minus size={12} /></button>
                      <span className="w-6 text-center text-sm font-bold">{i.quantity}</span>
                      <button type="button" onClick={() => handleQtyChange('inv', i.id, 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-400"><Plus size={12} /></button>
                      <button type="button" onClick={() => setInverters(inverters.filter(x => x.id !== i.id))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-100 text-slate-300 hover:text-red-500 ml-2"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Alertas */}
            {!isVocSafe && modules.length > 0 && inverters.length > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-600">
                  <strong>Voc ({vocTotal.toFixed(0)}V)</strong> excede 80% da tensao max. do inversor ({vocSafetyMargin.toFixed(0)}V).
                </p>
              </div>
            )}
            {isOverloadCritical && (
              <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 flex items-start gap-2">
                <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-600">
                  <strong>Overload critico ({(overloadRatio * 100).toFixed(0)}%)</strong>. Adicione mais inversores.
                </p>
              </div>
            )}
          </DenseCard>
        </div>

        {/* COLUNA DIREITA: Simulacao (Col-5) */}
        <div className="col-span-12 lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          
          {/* Grafico */}
          <DenseCard>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={12} className="text-neonorte-green" />
                Simulacao de Geracao
              </h4>
            </div>
            
            {modules.length === 0 ? (
              <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-400">Adicione modulos para ver a simulacao</p>
              </div>
            ) : (
              <div className="h-48">
                <GenerationChart data={chartData} />
              </div>
            )}
          </DenseCard>

          {/* Resumo */}
          <DenseCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              <TrendingUp size={12} className="text-green-500" />
              Resumo Anual
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase">Geracao</p>
                <p className="text-lg font-black text-green-600">{(totalAnnualGeneration / 1000).toFixed(1)}</p>
                <p className="text-[9px] text-slate-400">MWh/ano</p>
              </div>
              <div className="bg-white/80 rounded-lg p-2 text-center">
                <p className="text-[10px] text-slate-500 uppercase">Cobertura</p>
                <p className={`text-lg font-black ${coveragePercent >= 100 ? 'text-green-600' : 'text-orange-500'}`}>{coveragePercent.toFixed(0)}%</p>
                <p className="text-[9px] text-slate-400">do consumo</p>
              </div>
            </div>
          </DenseCard>

          {/* Financeiro */}
          <DenseCard className="bg-slate-50">
            <DenseFormGrid>
              <DenseStat label="Kit (A Vista)" value={formatMoney(manualKitPrice)} colSpan={12} />
            </DenseFormGrid>
          </DenseCard>
        </div>

      </DenseFormGrid>
    </form>
  );
};
