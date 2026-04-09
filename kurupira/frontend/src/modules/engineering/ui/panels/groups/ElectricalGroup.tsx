/**
 * =============================================================================
 * ELECTRICAL GROUP — Consumo, HSP, Perdas e Termodinâmica (UX-002)
 * =============================================================================
 *
 * Grupo extraído do RightInspector (linhas 167-626).
 * Contém: MonthlyConsumptionGrid, MonthlyIrradiationGrid, SystemLossesSection,
 *         ThermalConfigBlock.
 * Auto-suficiente: consome suas próprias stores e hooks.
 * =============================================================================
 */

import React, { useState } from 'react';
import {
  Zap, Sun, Activity, Hexagon, RotateCcw, Flame,
} from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { useTechStore, type LossProfile } from '../../../store/useTechStore';
import { LOSS_CONFIG } from '../../../constants/lossConfig';
import { CRESESB_DB } from '@/data/irradiation/cresesbData';
import { SectionHeader, PropRow, PropRowEditable } from '../properties/shared';

// =============================================================================
// CONSTANTS
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// COMPONENT
// =============================================================================

export const ElectricalGroup: React.FC = () => {
  return (
    <div className="p-3 space-y-3">
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

      {/* System Losses */}
      <SystemLossesSection />

      {/* Termodinâmica */}
      <ThermalConfigBlock />
    </div>
  );
};

// =============================================================================
// GRID: CONSUMO MENSAL
// =============================================================================

const MonthlyConsumptionGrid: React.FC = () => {
  const clientData = useSolarStore((state) => state.clientData);
  const updateMonthly = useSolarStore((state) => state.updateMonthlyConsumption);

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
  const clientData = useSolarStore((state) => state.clientData);
  const setIrradiationData = useSolarStore((state) => state.setIrradiationData);
  const weatherData = useSolarStore((state) => state.weatherData);

  const hspArray =
    clientData.monthlyIrradiation &&
    clientData.monthlyIrradiation.length === 12 &&
    clientData.monthlyIrradiation.some((v) => v > 0)
      ? clientData.monthlyIrradiation
      : Array(12).fill(4.5);

  const avgHsp = hspArray.reduce((acc, curr) => acc + curr, 0) / 12;
  const sourceLabel = clientData.irradiationCity || weatherData?.irradiation_source || 'Média Genérica';

  // Auto-Assign / Fallback Logic
  React.useEffect(() => {
    if (clientData.irradiationCity && CRESESB_DB[clientData.irradiationCity]) {
      return;
    }

    let matchedKey: string | null = null;
    if (clientData.city && clientData.state) {
      const candidate = `${clientData.city.toUpperCase()} - ${clientData.state.toUpperCase()}`;
      if (CRESESB_DB[candidate]) {
        matchedKey = candidate;
      }
    }

    if (!matchedKey) {
      if (clientData.state?.toUpperCase() === 'PA') {
        matchedKey = 'DEFAULT_PA';
      } else {
        matchedKey = 'PARAUAPEBAS - PA';
      }
    }

    if (matchedKey) {
      setIrradiationData(CRESESB_DB[matchedKey].hsp_monthly, matchedKey);
    }
  }, [clientData.city, clientData.state, clientData.irradiationCity, setIrradiationData]);

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
          <option value="" disabled>
            Selecione uma cidade do CRESESB
          </option>
          {cityOptions.map((cityKey) => (
            <option key={cityKey} value={cityKey}>
              {cityKey}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-slate-900/50 rounded-lg border border-emerald-900/40">
        {MONTHS.map((month, idx) => (
          <PropRow key={`hsp-${month}`} label={month} value={String(hspArray[idx].toFixed(2))} />
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
// VIEW: SYSTEM LOSSES SECTION
// =============================================================================

const SystemLossesSection: React.FC = () => {
  const { lossProfile, updateLoss, resetLosses, getPerformanceRatio } = useTechStore();

  const [localLosses, setLocalLosses] = useState<LossProfile>(lossProfile);

  React.useEffect(() => {
    setLocalLosses(lossProfile);
  }, [lossProfile]);

  const prDecimal = getPerformanceRatio();
  const prPercentage = (prDecimal * 100).toFixed(1);
  const prValue = parseFloat(prPercentage);

  const getPrStatus = (pr: number) => {
    if (pr >= 80) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    if (pr >= 75) return { bg: 'bg-blue-500/10', text: 'text-blue-400' };
    return { bg: 'bg-amber-500/10', text: 'text-amber-400' };
  };

  const status = getPrStatus(prValue);

  const handleSliderChange = (key: keyof LossProfile, e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLosses((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }));
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
            const sliderMax = isEff ? 100 : 15;
            const sliderStep = isEff ? 0.5 : 0.1;

            return (
              <div key={config.key} className="flex flex-col gap-1" title={config.description}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon size={10} className={isEff ? 'text-indigo-400' : 'text-slate-500'} />
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
// VIEW: THERMAL CONFIG BLOCK
// =============================================================================

const ThermalConfigBlock: React.FC = () => {
  const settings = useSolarStore((state) => state.settings);
  const updateSettings = useSolarStore((state) => state.updateSettings);

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
