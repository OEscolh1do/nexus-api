
import React, { useMemo } from 'react';
import { BarChart3, CloudSun } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { GenerationChart } from '@/components/ui/SolarCharts';
import { useSolarStore } from '@/core/state/solarStore';

export const SimulationPreview: React.FC = () => {
    const modules = useSolarStore(state => state.modules);
    const inverters = useSolarStore(state => state.inverters);
    const clientData = useSolarStore(state => state.clientData);
    const techSettings = useSolarStore(state => state.settings);

    // Basic Validation to show chart
    const hasEquipment = modules.length > 0 && inverters.length > 0;

    // Total System Power
    const systemPower = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0) / 1000;

    const chartData = useMemo(() => {
        // Mock simple simulation curve based on HSP (assuming Avg HSP 4.5 for now if no weather data)
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        // Curve factor for Brazil (Lower in winter - Jun/Jul)
        const seasonalFactors = [1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15];
        
        const consumption = clientData.invoices[0]?.monthlyHistory || Array(12).fill(0);
        const performanceRatio = techSettings.performanceRatio || 0.75; // Use valid property from schema

        return months.map((month, index) => {
            const days = 30;
            const hsp = 4.5;
            const factor = seasonalFactors[index] || 1;
            const generation = systemPower * days * hsp * factor * performanceRatio;

            return {
                month,
                consumption: consumption[index] || 0,
                generation: generation
            };
        });
    }, [systemPower, clientData, techSettings]);

    const totalGeneration = chartData.reduce((a, b) => a + b.generation, 0);
    const totalConsumption = chartData.reduce((a, b) => a + b.consumption, 0);
    const coverRatio = totalConsumption > 0 ? (totalGeneration / totalConsumption) : 0;

    return (
        <DenseCard className="h-full flex flex-col relative overflow-hidden">
             <div className="flex items-center justify-between mb-2 z-10 relative">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                     <BarChart3 size={12} className="text-purple-500" />
                     Simulação de Geração
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

             <div className="flex-1 w-full min-h-0 relative z-10">
                 {hasEquipment ? (
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
