
import React, { useMemo } from 'react';
import { BarChart3, CloudSun } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { GenerationChart } from '@/components/ui/SolarCharts';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useSimulationWorker } from '../hooks/useSimulationWorker';

export const SimulationPreview: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const inverters = useSolarStore(selectInverters);
    const clientData = useSolarStore(state => state.clientData);
    const techSettings = useSolarStore(state => state.settings);

    // Basic Validation to show chart
    const hasEquipment = modules.length > 0 && inverters.length > 0;

    // Total System Power
    const systemPower = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000;

    // Worker Payload
    const consumption = clientData.invoices[0]?.monthlyHistory || Array(12).fill(0);
    const performanceRatio = techSettings.performanceRatio || 0.75;
    
    const payload = useMemo(() => ({
        systemPowerKWp: systemPower,
        performanceRatio,
        clientConsumption: consumption
    }), [systemPower, performanceRatio, consumption]);

    // Spin up Worker
    const { result, isCalculating } = useSimulationWorker(payload);

    const chartData = useMemo(() => {
        if (!result) return [];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return months.map((month, idx) => ({
            month,
            consumption: result.monthlyConsumption[idx] || 0,
            generation: result.monthlyGeneration[idx] || 0
        }));
    }, [result]);

    const totalGeneration = result?.totalAnnualGeneration || 0;
    const totalConsumption = result?.totalAnnualConsumption || 0;
    const coverRatio = totalConsumption > 0 ? (totalGeneration / totalConsumption) : 0;

    return (
        <DenseCard className="h-full flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-2 z-10 relative">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                     <BarChart3 size={12} className="text-purple-500" />
                     Simulação de Geração {isCalculating && <span className="text-[9px] lowercase text-emerald-500 font-normal animate-pulse">(calculando...)</span>}
                 </h4>
                 <div className="flex gap-4">
                     <div className="text-right">
                         <span className="text-[10px] text-slate-400 uppercase">Geração Anual</span>
                         <p className="text-xs font-bold text-slate-700">{(totalGeneration/12).toFixed(0)} kWh/mês (méd)</p>
                     </div>
                     <div className="text-right">
                         <span className="text-[10px] text-slate-400 uppercase">Cobertura</span>
                         <p className={`text-xs font-black ${(coverRatio > 0.95) ? 'text-green-500' : 'text-yellow-500'}`}>
                             {(coverRatio * 100).toFixed(0)}%
                         </p>
                     </div>
                 </div>
             </div>

             <div className="flex-1 w-full min-h-0 relative z-10 transition-opacity duration-300" style={{ opacity: isCalculating ? 0.5 : 1 }}>
                 {hasEquipment && chartData.length > 0 ? (
                     <GenerationChart data={chartData} />
                 ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-100">
                         <CloudSun size={32} />
                         <p className="text-xs mt-2">Adicione módulos e inversores para simular</p>
                     </div>
                 )}
             </div>
        </DenseCard>
    );
};
