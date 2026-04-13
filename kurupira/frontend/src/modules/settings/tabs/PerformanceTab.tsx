import React from 'react';
import { Activity, ArrowRightLeft, Database } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { EngineeringSettings } from '@/core/types';
import { useTechStore, LossProfile } from '../../engineering/store/useTechStore';
import { LOSS_CONFIG, LossConfigItem } from '../../engineering/constants/lossConfig';
import { cn } from '@/lib/utils';

interface PerformanceTabProps {
  settings: EngineeringSettings;
  onChange: (path: string, value: number | string) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ settings, onChange }) => {
  const { 
    lossProfile, 
    updateLoss, 
    getPerformanceRatio, 
    getAdditivePerformanceRatio,
    prCalculationMode,
    setPrCalculationMode
  } = useTechStore();

  const isAdditive = prCalculationMode === 'additive';
  const primaryPR = isAdditive ? (getAdditivePerformanceRatio() * 100).toFixed(1) : (getPerformanceRatio() * 100).toFixed(1);
  const secondaryPR = isAdditive ? (getPerformanceRatio() * 100).toFixed(1) : (getAdditivePerformanceRatio() * 100).toFixed(1);
  const primaryLabel = isAdditive ? "Soma Simples" : "Normativo (IEC)";

  const toggleMode = () => setPrCalculationMode(isAdditive ? 'iec' : 'additive');

  const handleLossChange = (key: keyof LossProfile, valStr: string) => {
    let num = parseFloat(valStr);
    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    updateLoss(key, num);
  };

  const LossInput = ({ config, value }: { config: LossConfigItem, value: number }) => {
    const Icon = config.icon;
    const isEfficiency = config.type === 'efficiency';

    return (
      <div className="flex flex-col gap-1 w-full group">
        <label className="flex items-center gap-1.5 min-w-0" title={config.description}>
          <Icon size={12} className={cn("shrink-0", isEfficiency ? "text-blue-500" : "text-slate-400")} />
          <span className="text-[10px] font-bold text-slate-500 uppercase truncate pt-0.5 group-hover:text-slate-800 transition-colors">
            {config.label}
          </span>
        </label>
        <div className="relative w-full">
          <input 
            type="number"
            className={cn(
              "w-full h-8 px-2 pl-2 text-right font-mono text-xs font-bold text-slate-700 bg-white border rounded outline-none focus:ring-1 transition-all",
              isEfficiency 
                ? "border-blue-200 focus:border-blue-500 focus:ring-blue-100 bg-blue-50/10" 
                : "border-slate-200 focus:border-neonorte-purple focus:ring-purple-100 placeholder:text-transparent"
            )}
            value={value} 
            onChange={(e) => handleLossChange(config.key, e.target.value)}
            step={0.1} min={0} max={100}
          />
          <span className="absolute right-7 top-2 text-[10px] font-black text-slate-400 opacity-50">%</span>
        </div>
      </div>
    );
  };

  const environmentalLosses = LOSS_CONFIG.slice(0, 6);
  const electricalLosses = LOSS_CONFIG.slice(6, 9);
  const inverterLosses = LOSS_CONFIG.slice(9, 10);

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      
      {/* LEFT COLUMN: Physical & Electrical Losses Grid */}
      <DenseCard className="flex-[3] bg-white p-5 h-min">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Database size={14} className="text-slate-400" />
            Matriz de Perdas Globais do Sistema
            </h3>
            
            {/* PR HUD COMPACT */}
            <div className="flex items-center gap-3 bg-slate-50 border px-3 py-1.5 rounded-lg">
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">PR Global</span>
                    <button 
                        onClick={toggleMode}
                        className="text-[9px] text-blue-500 font-medium hover:text-blue-700 transition-colors text-left flex gap-1 items-center"
                        title={`Mudar Base (Secundário: ${secondaryPR}%)`}
                    >
                    <ArrowRightLeft size={8} /> {primaryLabel}
                    </button>
                </div>
                <div className="text-xl font-black tabular-nums tracking-tighter text-slate-800">
                    {primaryPR}<span className="text-sm font-bold opacity-40 ml-0.5">%</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Fatores Ambientais */}
            <div className="col-span-2">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-dashed pb-1">Ambiental</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    {environmentalLosses.map(config => (
                        <LossInput key={config.key} config={config} value={lossProfile[config.key]} />
                    ))}
                </div>
            </div>

            {/* Fatores Elétricos & Inversor */}
            <div className="space-y-4 border-l border-slate-100 pl-4">
                <div>
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-dashed pb-1">Elétrico</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {electricalLosses.map(config => (
                            <LossInput key={config.key} config={config} value={lossProfile[config.key]} />
                        ))}
                    </div>
                </div>
                <div className="pt-2">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 border-b border-dashed pb-1">Inversor Base</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {inverterLosses.map(config => (
                            <LossInput key={config.key} config={config} value={lossProfile[config.key]} />
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </DenseCard>

      {/* RIGHT COLUMN: Fatores de Correção */}
      <DenseCard className="flex-[1] bg-white p-5 h-min">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
          <Activity size={14} className="text-slate-400" />
          Módulos (Orientação)
        </h3>
        
        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
            Fatores multiplicadores de eficiência baseados na inclinação e orientação do telhado. Afeta a estimativa simplificada.
        </p>

        <div className="flex flex-col gap-3">
            {Object.entries(settings.orientationFactors).map(([key, val]) => (
            <div key={key} className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{key}</label>
                <div className="relative w-full">
                    <input
                    type="number" step="0.01" min="0" max="1"
                    value={val}
                    onChange={(e) => onChange(`orientationFactors.${key}`, parseFloat(e.target.value))}
                    className="w-full h-8 px-2 text-right font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:border-neonorte-purple focus:ring-purple-100 transition-all cursor-text hover:bg-white"
                    />
                     <span className="absolute left-2 top-2 text-[10px] font-black text-slate-300 pointer-events-none">x</span>
                </div>
            </div>
            ))}
        </div>
      </DenseCard>

    </div>
  );
};
