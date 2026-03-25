import React, { useMemo } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { DenseCard } from '@/components/ui/dense-form';
import { Ruler, Weight, Maximize, Zap, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/hooks/useProjectContext';

interface EngineeringGuidelinePanelProps {
    className?: string;
}

export const EngineeringGuidelinePanel: React.FC<EngineeringGuidelinePanelProps> = ({ className }) => {
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const { energyGoal } = useProjectContext();

    // 2. Metrics Calculation
    const metrics = useMemo(() => {
        // A. Current Totals
        const currentQty = modules.length;
        const totalPowerKw = modules.reduce((acc, m) => acc + (m.power), 0) / 1000;
        const totalAreaM2 = modules.reduce((acc, m) => acc + (m.area), 0);

        // Weight calculation (fallback to 22kg if 0 or undefined, though schema enforces positive number)
        const totalWeightKg = modules.reduce((acc, m) => acc + (m.weight), 0);

        // B. Target / Min Modules
        // Formula: Consumption / (HSP_Avg * 30 * ModulePower_kW * PR_0.75)
        // We use the first module's power as reference or average 550W if none selected
        const refPowerKw = modules.length > 0 ? modules[0].power / 1000 : 0.55;

        // Calculate average HSP from monthly data, filtering out zeros
        const validHsp = (clientData.monthlyIrradiation || []).filter(v => v > 0);
        const avgHsp = validHsp.length > 0
            ? validHsp.reduce((a, b) => a + b, 0) / validHsp.length
            : 4.5; // Default fallback if no weather data

        const targetGeneration = energyGoal.monthlyTarget || 0; // kWh/month
        const performanceRatio = 0.75; // Standard conservative PR

        // Avoid division by zero
        const minModules = refPowerKw > 0 && avgHsp > 0
            ? Math.ceil(targetGeneration / (avgHsp * 30 * refPowerKw * performanceRatio))
            : 0;

        return {
            currentQty,
            totalPowerKw,
            totalAreaM2,
            totalWeightKg,
            minModules,
            avgHsp
        };
    }, [modules, clientData.monthlyIrradiation, energyGoal.monthlyTarget]);

    // 3. Status Derivation
    const isUnderSized = metrics.currentQty < metrics.minModules;

    // 4. Helper for Stat Item
    const StatItem = ({
        icon: Icon,
        label,
        value,
        subValue,
        highlight = false
    }: {
        icon: any,
        label: string,
        value: React.ReactNode,
        subValue?: React.ReactNode,
        highlight?: boolean
    }) => (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon size={12} />
                <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={cn("text-lg font-bold leading-none", highlight ? "text-amber-600" : "text-slate-700")}>
                    {value}
                </span>
                {subValue && (
                    <span className="text-[10px] text-slate-400 font-medium">
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <DenseCard className={cn("bg-white flex flex-col justify-center px-4 py-3 h-full border-l-4 border-l-blue-500", className)}>

            {/* Title / Header (Optional, maybe implied by stats) */}
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Ruler size={14} className="text-blue-500" />
                    Dimensionamento Físico
                </h3>
                {metrics.avgHsp > 0 && (
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        HSP Ref: <strong>{metrics.avgHsp.toFixed(1)} kWh/m²</strong>
                    </span>
                )}
            </div>

            {/* Metrics Grid - Responsive: Grid on mobile, Flex on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-8">

                {/* 1. Módulos (Quantidade) */}
                <StatItem
                    icon={Layers}
                    label="Módulos"
                    value={metrics.currentQty}
                    subValue={metrics.minModules > 0 ? `/ ${metrics.minModules} min` : null}
                    highlight={isUnderSized && metrics.minModules > 0}
                />

                {/* 2. Potência Total */}
                <StatItem
                    icon={Zap}
                    label="Potência"
                    value={metrics.totalPowerKw.toFixed(2)}
                    subValue="kWp"
                />

                {/* 3. Área Total */}
                <StatItem
                    icon={Maximize}
                    label="Área"
                    value={metrics.totalAreaM2.toFixed(1)}
                    subValue="m²"
                />

                {/* 4. Peso Total */}
                <StatItem
                    icon={Weight}
                    label="Peso"
                    value={metrics.totalWeightKg.toFixed(0)}
                    subValue="kg"
                />

                {/* 5. Simulação / Status (Compacto) */}
                <div className="hidden md:flex flex-col justify-center pl-4 border-l border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status</span>
                    {metrics.currentQty === 0 ? (
                        <span className="text-xs font-medium text-slate-400">Nenhum módulo</span>
                    ) : isUnderSized ? (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            ⚠️ Abaixo da Meta
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            ✅ Meta Atingida
                        </span>
                    )}
                </div>

            </div>

        </DenseCard>
    );
};
