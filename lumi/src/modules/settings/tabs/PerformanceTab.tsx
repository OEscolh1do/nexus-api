import React from 'react';
import { Activity } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { EngineeringSettings } from '@/core/types';
import { SystemLossesCard } from '../../engineering/components/SystemLossesCard';

interface PerformanceTabProps {
  settings: EngineeringSettings;
  onChange: (path: string, value: number | string) => void;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ settings, onChange }) => {
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Section: System Losses & PR */}
      <div className="h-64">
        {/* Smart Component: Connects directly to Global Store */}
        <SystemLossesCard readOnly={false} />
      </div>

      {/* Bottom Section: Financial & Other Factors */}
      <DenseCard className="flex-1 bg-white p-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2 border-b pb-2">
          <Activity size={14} className="text-neonorte-purple" />
          Outros Fatores & Financeiro
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Inflação Energética (a.a.)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range" min="0.0" max="0.15" step="0.001"
                value={settings.energyInflationRate}
                onChange={(e) => onChange('energyInflationRate', parseFloat(e.target.value))}
                className="flex-1 accent-neonorte-purple h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs font-bold text-neonorte-purple w-12 text-right">
                {(settings.energyInflationRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div>
             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                Fatores de Orientação (Simulação Simplificada)
            </label>
            <div className="grid grid-cols-4 gap-2">
                {Object.entries(settings.orientationFactors).map(([key, val]) => (
                <div key={key}>
                    <label className="block text-[9px] text-slate-400 capitalize mb-1">{key}</label>
                    <input
                    type="number" step="0.01"
                    value={val}
                    onChange={(e) => onChange(`orientationFactors.${key}`, parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border rounded px-1 py-1 text-xs text-center font-mono focus:border-neonorte-purple outline-none"
                    />
                </div>
                ))}
            </div>
          </div>

        </div>
      </DenseCard>
    </div>
  );
};
