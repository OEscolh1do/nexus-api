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
  Activity, Hexagon, RotateCcw, Flame,
} from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { useTechStore, type LossProfile } from '../../../store/useTechStore';
import { LOSS_CONFIG } from '../../../constants/lossConfig';

// =============================================================================
// CONSTANTS
// =============================================================================

// =============================================================================
// COMPONENT
// =============================================================================

export const ElectricalGroup: React.FC = () => {
  return (
    <div className="p-3 space-y-3">
      {/* System Losses */}
      <SystemLossesSection />

      {/* Termodinâmica */}
      <ThermalConfigBlock />
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
