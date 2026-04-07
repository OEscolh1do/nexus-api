/**
 * =============================================================================
 * RIGHT INSPECTOR — Motor Polimórfico (P0-4)
 * =============================================================================
 *
 * O coração da reintegração CRM no workspace.
 * Painel POLIMÓRFICO que metamorfoseia suas propriedades:
 *
 * - Se NADA selecionado → Exibe Contexto Comercial (CRM Técnico)
 * - Se MÓDULO selecionado → Lookup por ID, exibe params + edição inline
 * - Se INVERSOR selecionado → Lookup por ID, exibe params + MPPT configs
 * - Se STRING selecionado → Exibe configuração da string/MPPT
 *
 * P0-4: Entity-by-ID lookup em vez de modules[0] / inverters[0].
 *       Campos editáveis via PropRowEditable (quantidade).
 * =============================================================================
 */

import React, { useMemo, useState } from 'react';
import {
  User, MapPin, BarChart3, Thermometer, Zap,
  Info, CloudOff, RotateCcw, Activity, Hexagon,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Sun,
  Flame // Adicionado para a seção termodinâmica
} from 'lucide-react';

import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useTechStore, type LossProfile } from '../../store/useTechStore';
import { useTechKPIs } from '../../hooks/useTechKPIs';
import { LOSS_CONFIG } from '../../constants/lossConfig';
import { getFdiStatus } from '../../constants/thresholds';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SectionHeader, PropRow, PropRowEditable } from './properties/shared';
import { CRESESB_DB } from '@/data/irradiation/cresesbData';

// =============================================================================
// MONTHS
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// PROPS
// =============================================================================


// =============================================================================
// COMPONENT
// =============================================================================

export const RightInspector: React.FC = () => {
  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <Info size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Inspector
          </h3>
        </div>
      </div>

      {/* Content — Always CRM Context */}
      <div className="flex-1 overflow-y-auto">
        <CommercialContextView />
      </div>
    </div>
  );
};

// =============================================================================
// VIEW: CONTEXTO COMERCIAL (CRM TÉCNICO — quando nada selecionado)
// =============================================================================

const CommercialContextView: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const weatherData = useSolarStore(state => state.weatherData);

  const hasClientData = !!clientData.clientName;

  return (
    <div className="p-3 space-y-3">
      {/* Client Info */}
      <section>
        <SectionHeader icon={<User size={10} />} label="Cliente" />
        {hasClientData ? (
          <div className="space-y-1.5 mt-2">
            <PropRow label="Nome" value={clientData.clientName || '—'} />
            <PropRow label="Cidade" value={`${clientData.city || '—'}, ${clientData.state || '—'}`} />
            <PropRow label="Endereço" value={clientData.street || '—'} />
            <PropRow label="Conexão" value={
              clientData.connectionType === 'trifasico' ? 'Trifásico' :
              clientData.connectionType === 'bifasico' ? 'Bifásico' :
              clientData.connectionType === 'monofasico' ? 'Monofásico' :
              clientData.connectionType || '—'
            } />
          </div>
        ) : (
          <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <p className="text-[10px] text-slate-600">Dados do cliente serão exibidos aqui quando carregados.</p>
          </div>
        )}
      </section>

      {/* Location */}
      <section>
        <SectionHeader icon={<MapPin size={10} />} label="Localização" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Latitude" value={clientData.lat ? `${clientData.lat.toFixed(4)}°` : '—'} />
          <PropRow label="Longitude" value={clientData.lng ? `${clientData.lng.toFixed(4)}°` : '—'} />
          <PropRow label="Área Disponível" value={clientData.availableArea ? `${clientData.availableArea} m²` : '—'} />
        </div>
      </section>

      {/* Weather */}
      <section>
        <SectionHeader icon={<Thermometer size={10} />} label="Clima" />
        <div className="mt-2 space-y-1.5">
          {weatherData ? (
            <>
              <PropRow label="Temp. Média" value={`${weatherData.ambient_temp_avg.toFixed(1)}°C`} />
              <PropRow label="Fonte" value={weatherData.irradiation_source} />
              <PropRow label="Local" value={weatherData.location_name} />
            </>
          ) : (
            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
              <CloudOff size={12} className="text-amber-500/50 shrink-0" />
              <p className="text-[9px] text-amber-500/60">
                Dados climáticos não disponíveis. Configure a localização para obter dados automáticos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Generation vs Consumption (P2-1) */}
      <SimulationMetricsSection />

      {/* Energia (Consumo e Tarifa) */}
      <section>
        <SectionHeader icon={<Zap size={10} />} label="Energia (Consumo)" />
        <MonthlyConsumptionGrid />
      </section>

      {/* Irradiação (HSP) */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-2">
           <SectionHeader icon={<Sun size={10} />} label="Irradiação CRESESB (HSP)" />
        </div>
        <MonthlyIrradiationGrid />
      </section>

      {/* System Losses (P1-1) */}
      <SystemLossesSection />

      {/* Opção C: Controles Dinâmicos de Termodinâmica */}
      <ThermalConfigBlock />
    </div>
  );
};

// =============================================================================
// GRID: CONSUMO MENSAL (P7 Extra)
// =============================================================================

const MonthlyConsumptionGrid: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const updateMonthly = useSolarStore(state => state.updateMonthlyConsumption);
  
  const history = clientData.invoices?.[0]?.monthlyHistory || Array(12).fill(clientData.averageConsumption || 0);

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
        {MONTHS.map((month, idx) => (
          <PropRowEditable
            key={`cons-${month}`}
            label={month}
            value={String(history[idx])}
            type="number"
            onCommit={(val) => {
              const num = parseFloat(val);
              if (!isNaN(num) && num >= 0) {
                updateMonthly(idx, num);
                return true;
              }
              return false;
            }}
          />
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
         <PropRow label="Consumo Calculado" value={`${clientData.averageConsumption?.toFixed(0) || 0} kWh (Média)`} />
         <PropRow label="Tarifa R$/kWh" value={clientData.tariffRate ? `R$ ${clientData.tariffRate.toFixed(2)}` : '—'} accent />
      </div>
    </div>
  );
};

// =============================================================================
// GRID: IRRADIAÇÃO MENSAL (CRESESB / HSP)
// =============================================================================

const MonthlyIrradiationGrid: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const setIrradiationData = useSolarStore(state => state.setIrradiationData);
  const weatherData = useSolarStore(state => state.weatherData);
  
  const hspArray = (clientData.monthlyIrradiation && clientData.monthlyIrradiation.length === 12 && clientData.monthlyIrradiation.some(v => v > 0))
    ? clientData.monthlyIrradiation
    : Array(12).fill(4.5);
    
  // A média exibida 
  const avgHsp = hspArray.reduce((acc, curr) => acc + curr, 0) / 12;
  const sourceLabel = clientData.irradiationCity || weatherData?.irradiation_source || 'Média Genérica';

  // Auto-Assign / Fallback Logic
  React.useEffect(() => {
    // 1. If explicit irradiation key is already saved and valid, use it
    if (clientData.irradiationCity && CRESESB_DB[clientData.irradiationCity]) {
       // Already set correctly, do nothing
       return;
    }

    // 2. Try to match the city/state string from the form
    let matchedKey: string | null = null;
    if (clientData.city && clientData.state) {
       const candidate = `${clientData.city.toUpperCase()} - ${clientData.state.toUpperCase()}`;
       if (CRESESB_DB[candidate]) {
          matchedKey = candidate;
       }
    }

    // 3. Fallback based on State
    if (!matchedKey) {
       if (clientData.state?.toUpperCase() === 'PA') {
          matchedKey = "DEFAULT_PA";
       } else {
          // If no state or outside PA, safely fallback to generic Parauapebas
          matchedKey = "PARAUAPEBAS - PA"; 
       }
    }

    // Apply the matched data
    if (matchedKey) {
      setIrradiationData(CRESESB_DB[matchedKey].hsp_monthly, matchedKey);
    }
  }, [clientData.city, clientData.state, clientData.irradiationCity, setIrradiationData]);

  // Lista de cidades ativas no CRESESB
  const cityOptions = Object.keys(CRESESB_DB);

  return (
    <div className="mt-2 space-y-2">
      {/* Seletor de Cidade (CRESESB) */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1">
          Selecione a Cidade:
        </label>
        <select 
          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-[10px] text-slate-300 outline-none focus:border-emerald-500/50"
          value={clientData.irradiationCity || ''}
          onChange={(e) => {
             const key = e.target.value;
             if (CRESESB_DB[key]) {
               setIrradiationData(CRESESB_DB[key].hsp_monthly, key);
             }
          }}
        >
          <option value="" disabled>Selecione uma cidade do CRESESB</option>
          {cityOptions.map(cityKey => (
            <option key={cityKey} value={cityKey}>{cityKey}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-slate-900/50 rounded-lg border border-emerald-900/40">
        {MONTHS.map((month, idx) => (
          <PropRow
            key={`hsp-${month}`}
            label={month}
            value={String(hspArray[idx].toFixed(2))}
          />
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
         <PropRow label="Média Anual" value={`${avgHsp.toFixed(2)} kWh/m²/dia`} accent />
         <PropRow label="Fonte" value={sourceLabel} />
      </div>
    </div>
  );
};

// =============================================================================
// VIEW: SIMULATION METRICS SECTION (P2-1)
// =============================================================================

const SimulationMetricsSection: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const modules = useSolarStore(selectModules);
  const { getPerformanceRatio } = useTechStore();
  const { kpi } = useTechKPIs();

  const data = useMemo(() => {
    const totalPowerKw = modules.reduce((acc, m) => acc + (m.power), 0) / 1000;
    const pr = getPerformanceRatio();

    // Tries to get historical consumption or user-defined average
    const consumptionInvoices = clientData.invoices?.[0]?.monthlyHistory;
    const hasMonthlyData = consumptionInvoices?.length === 12 && consumptionInvoices.some(v => v > 0);
    
    // Single Source of Truth: individual monthly values from invoices
    // Falls back to flat average only when no monthly data exists
    const consumptionHistory = hasMonthlyData
        ? consumptionInvoices
        : Array(12).fill(clientData.averageConsumption || 400);
    
    const avgCons = consumptionHistory.reduce((a: number, b: number) => a + b, 0) / 12;

    // Weather Data (HSP)
    const irradiationData = (clientData.monthlyIrradiation && clientData.monthlyIrradiation.length === 12 && clientData.monthlyIrradiation.some(v => v > 0))
        ? clientData.monthlyIrradiation
        : Array(12).fill(4.5); 

    let totalGenYear = 0;
    let totalConsYear = 0;

    const chartData = MONTHS.map((month, idx) => {
        const hsp = irradiationData[idx];
        const consumption = consumptionHistory[idx] || avgCons;
        const generation = totalPowerKw * hsp * 30 * pr;

        totalGenYear += generation;
        totalConsYear += consumption;

        return { name: month, consumo: Math.round(consumption), geracao: Math.round(generation) };
    });

    const averageGen = totalGenYear / 12;
    const averageCons = totalConsYear / 12;
    const coverage = totalConsYear > 0 ? (totalGenYear / totalConsYear) : 0;
    
    return { chartData, averageGen, averageCons, coverage };
  }, [modules, clientData, getPerformanceRatio]);

  const isPositive = data.averageGen >= data.averageCons;
  const hasEquipment = modules.length > 0;

  // FDI Evaluation (unified via thresholds.ts)
  const fdiPercent = kpi.dcAcRatio * 100;
  const fdiStatus = getFdiStatus(kpi.dcAcRatio);
  const isFdiLow = fdiStatus === 'oversized';
  const isFdiHigh = fdiStatus === 'clipping';
  
  return (
    <section className="space-y-3">
      {/* ── CHART ── */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-3 relative h-[140px] flex flex-col pt-1">
         <div className="flex items-center justify-between z-10 relative mb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <BarChart3 size={11} className="text-teal-400" />
              <span>Geração vs Consumo</span>
            </div>
            
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {(data.coverage * 100).toFixed(0)}%
            </div>
         </div>

         {!hasEquipment && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-900/80 px-2 py-1 rounded">Sem módulos</span>
            </div>
         )}
         
         <div className={`flex-1 min-h-0 w-full -ml-3 ${!hasEquipment ? 'opacity-20' : ''}`}>
             <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                 <BarChart data={data.chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barGap={0}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 7, fill: '#64748b' }} interval="preserveStartEnd" />
                     <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px', borderRadius: '6px' }}
                        itemStyle={{ padding: 0 }}
                      />
                     <Bar dataKey="consumo" fill="#fb923c" radius={[2, 2, 0, 0]} barSize={6} animationDuration={500} />
                     <Bar dataKey="geracao" fill="#2dd4bf" radius={[2, 2, 0, 0]} barSize={6} animationDuration={500} />
                 </BarChart>
             </ResponsiveContainer>
         </div>

         <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800">
             <div className="flex flex-col">
                 <span className="text-[8px] text-slate-500 uppercase font-bold">Consumo Médio</span>
                 <span className="text-[10px] font-bold text-orange-400">{data.averageCons.toFixed(0)} kWh</span>
             </div>
             <div className="flex flex-col text-right">
                 <span className="text-[8px] text-slate-500 uppercase font-bold">Geração Est.</span>
                 <span className="text-[10px] font-bold text-teal-400">{data.averageGen.toFixed(0)} kWh</span>
             </div>
         </div>
      </div>

      {/* ── FDI MICRO-DASHBOARD ── */}
      {hasEquipment && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-2.5 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">FDI (DC/AC)</span>
                <span className={`text-base font-black leading-none mt-0.5 ${isFdiHigh ? 'text-red-400' : isFdiLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {fdiPercent.toFixed(1)}%
                </span>
            </div>
            <div className="flex flex-col items-end text-right justify-center">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isFdiHigh ? 'border-red-900/50 bg-red-900/20' : isFdiLow ? 'border-amber-900/50 bg-amber-900/20' : 'border-emerald-900/50 bg-emerald-900/20'}`}>
                    {isFdiHigh ? <Activity size={10} className="text-red-400" /> : isFdiLow ? <AlertTriangle size={10} className="text-amber-400" /> : <CheckCircle2 size={10} className="text-emerald-400" />}
                    <span className={`text-[9px] font-bold ${isFdiHigh ? 'text-red-400' : isFdiLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isFdiHigh ? 'Clipping Anual' : isFdiLow ? 'Oversized AC' : 'Ideal'}
                    </span>
                </div>
            </div>
        </div>
      )}
    </section>
  );
};

// =============================================================================
// VIEW: SYSTEM LOSSES SECTION (P1-1)
// =============================================================================

const SystemLossesSection: React.FC = () => {
  const { lossProfile, updateLoss, resetLosses, getPerformanceRatio } = useTechStore();
  
  // Local state to update UI fluidly without hitting store/throttle on every pixel drag
  const [localLosses, setLocalLosses] = useState<LossProfile>(lossProfile);

  // Sync back when store changes (like via undo/redo or reset)
  React.useEffect(() => {
    setLocalLosses(lossProfile);
  }, [lossProfile]);

  const prDecimal = getPerformanceRatio();
  const prPercentage = (prDecimal * 100).toFixed(1);
  const prValue = parseFloat(prPercentage);

  const getPrStatus = (pr: number) => {
    if (pr >= 80) return { bg: "bg-emerald-500/10", text: "text-emerald-400" };
    if (pr >= 75) return { bg: "bg-blue-500/10", text: "text-blue-400" };
    return { bg: "bg-amber-500/10", text: "text-amber-400" };
  };

  const status = getPrStatus(prValue);

  const handleSliderChange = (key: keyof LossProfile, e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLosses(prev => ({ ...prev, [key]: parseFloat(e.target.value) }));
  };

  const handleSliderCommit = (key: keyof LossProfile, e: React.PointerEvent<HTMLInputElement>) => {
    updateLoss(key, parseFloat(e.currentTarget.value));
  };

  return (
    <section className="mt-4 pt-4 border-t border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Activity size={12} className="text-indigo-400" />
          <span>Perdas do Sistema</span>
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${status.bg} border border-slate-700/50`}>
          <Hexagon size={10} className={status.text} />
          <span className={`text-[10px] font-bold tabular-nums leading-none ${status.text}`}>
            PR: {prPercentage}%
          </span>
        </div>
      </div>

      <div className="space-y-3 bg-slate-900 rounded-lg p-3 border border-slate-800 relative">
        <button 
          onClick={resetLosses}
          className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          title="Resetar para Padrões"
        >
          <RotateCcw size={12} />
        </button>

        <div className="pr-6 space-y-3">
          {LOSS_CONFIG.map((config) => {
            const Icon = config.icon;
            const val = localLosses[config.key] ?? 0;
            const isEff = config.type === 'efficiency';
            // Constrained slider ranges for precision (instead of 0-100)
            const sliderMax = isEff ? 100 : 15;
            const sliderStep = isEff ? 0.5 : 0.1;

            return (
              <div key={config.key} className="flex flex-col gap-1" title={config.description}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon size={10} className={isEff ? "text-indigo-400" : "text-slate-500"} />
                    <span className="text-[10px] font-medium text-slate-400 leading-none">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      value={val}
                      min="0"
                      max="100"
                      step="0.1"
                      onChange={(e) => handleSliderChange(config.key, e as any)}
                      onBlur={() => updateLoss(config.key, val)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { 
                          updateLoss(config.key, val);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-14 text-right bg-slate-800/60 border border-slate-700/50 rounded px-1 py-0.5 hover:border-indigo-500/50 focus:border-indigo-500 focus:bg-slate-800 focus:outline-none text-[10px] font-mono text-slate-200 tabular-nums transition-colors cursor-text"
                    />
                    <span className="text-[10px] font-mono text-slate-500">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={sliderMax}
                  step={sliderStep}
                  value={Math.min(val, sliderMax)}
                  onChange={(e) => handleSliderChange(config.key, e)}
                  onPointerUp={(e) => handleSliderCommit(config.key, e)}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 1)',
                    height: '3px',
                  }}
                  className="w-full rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// VIEW: THERMAL CONFIG BLOCK (Opção C - Motor Dinâmico)
// =============================================================================

const ThermalConfigBlock: React.FC = () => {
    // Acessa as propriedades do Solar Store para as configurações técnicas
    const settings = useSolarStore(state => state.settings);
    const updateSettings = useSolarStore(state => state.updateSettings);

    const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSettings({ minHistoricalTemp: parseFloat(e.target.value) || 0 });
    };

    const handleCoeffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSettings({ vocTempCoefficient: parseFloat(e.target.value) || 0 });
    };

    return (
        <section className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Flame size={12} className="text-red-400" />
                    <span>Termodinâmica Local</span>
                </div>
            </div>

            <div className="space-y-3 bg-slate-900 rounded-lg p-3 border border-slate-800 relative">
                <p className="text-[9px] text-slate-500 mb-2 leading-tight">
                    Esses parâmetros afetam dinamicamente o cálculo de limite de tensão (VocMax) durante as madrugadas frias de inverno (NEC 690.7).
                </p>

                <div className="flex flex-col gap-1.5" title="Temperatura Mínima Histórica">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400 leading-none">Temp. Mínima Histórica</span>
                        <div className="flex items-center gap-0.5">
                            <input
                                type="number"
                                value={settings.minHistoricalTemp}
                                min="-40"
                                max="50"
                                step="1"
                                onChange={handleTempChange}
                                className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-700 focus:border-red-500 focus:outline-none text-[10px] font-mono text-slate-300 tabular-nums transition-colors"
                            />
                            <span className="text-[10px] font-mono text-slate-500">°C</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="-20"
                        max="30"
                        step="1"
                        value={settings.minHistoricalTemp}
                        onChange={handleTempChange}
                        style={{ backgroundColor: 'rgba(30, 41, 59, 1)', height: '4px' }}
                        className="w-full rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col gap-1.5 mt-2" title="Coeficiente de Temperatura Voc (%/°C)">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400 leading-none">Coeficiente de Voc</span>
                        <div className="flex items-center gap-0.5">
                            <input
                                type="number"
                                value={settings.vocTempCoefficient}
                                min="-0.5"
                                max="0"
                                step="0.01"
                                onChange={handleCoeffChange}
                                className="w-14 text-right bg-transparent border-b border-transparent hover:border-slate-700 focus:border-red-500 focus:outline-none text-[10px] font-mono text-slate-300 tabular-nums transition-colors"
                            />
                            <span className="text-[10px] font-mono text-slate-500">%/°C</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
