import React from 'react';
import { RotateCcw, Hexagon, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTechStore, LossProfile } from '../store/useTechStore';
import { LOSS_CONFIG, LossConfigItem } from '../constants/lossConfig';

interface SystemLossesCardProps {
    className?: string;
    readOnly?: boolean;
    onReset?: () => void;
}

export const SystemLossesCard: React.FC<SystemLossesCardProps> = ({ 
    className, 
    readOnly = false,
    onReset
}) => {
    // Connect to TechStore
    const { 
        lossProfile, 
        updateLoss, 
        resetLosses, 
        getPerformanceRatio, 
        getAdditivePerformanceRatio,
        prCalculationMode,
        setPrCalculationMode
    } = useTechStore();
    
    // Calculate PRs (Both needed for swap logic)
    const prDecimalIEC = getPerformanceRatio();
    const prPercentageIEC = (prDecimalIEC * 100).toFixed(1);
    
    const prDecimalAdditive = getAdditivePerformanceRatio();
    const prPercentageAdditive = (prDecimalAdditive * 100).toFixed(1);

    // Determines which is Primary and Secondary based on Mode
    const isAdditive = prCalculationMode === 'additive';
    
    const primaryPR = isAdditive ? prPercentageAdditive : prPercentageIEC;
    const secondaryPR = isAdditive ? prPercentageIEC : prPercentageAdditive;
    
    const primaryLabel = isAdditive ? "Soma Simples" : "Normativo (IEC)";
    const secondaryLabel = isAdditive ? "IEC 61724" : "Soma Simples";

    const prValuePrimary = parseFloat(primaryPR);

    // Status Colors based on Primary PR
    const getPrStatus = (pr: number) => {
        if (pr >= 80) return { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", label: "Excelente" };
        if (pr >= 75) return { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", label: "Bom" };
        return { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", label: "Atenção" };
    };

    const status = getPrStatus(prValuePrimary);

    const handleReset = () => {
        resetLosses();
        if (onReset) onReset();
    };

    const toggleMode = () => {
        setPrCalculationMode(isAdditive ? 'iec' : 'additive');
    };

    const handleChange = (key: keyof LossProfile, valStr: string, type: 'loss' | 'efficiency') => {
        if (readOnly) return;
        let num = parseFloat(valStr);
        if (isNaN(num)) num = 0;
        
        if (type === 'efficiency') {
             if (num > 100) num = 100;
             if (num < 0) num = 0;
        } else {
             if (num > 100) num = 100;
             if (num < 0) num = 0;
        }

        updateLoss(key, num);
    };

    // Helper Component - Highly Compact
    const LossInput = ({ config, value }: { config: LossConfigItem, value: number }) => {
        const Icon = config.icon;
        const isEfficiency = config.type === 'efficiency';

        return (
            <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Icon size={12} className={cn("shrink-0", isEfficiency ? "text-blue-500" : "text-slate-400")} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate leading-none pt-0.5" title={config.description}>
                        {config.label}
                    </span>
                </div>
                <div className="relative group w-full">
                    <input 
                        type="number"
                        className={cn(
                            "w-full h-8 px-2 pl-2 text-right font-mono text-xs font-bold text-slate-700 bg-white border rounded outline-none focus:ring-1 transition-all",
                            isEfficiency 
                                ? "border-blue-200 focus:border-blue-500 focus:ring-blue-100 bg-blue-50/10" 
                                : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                        )}
                        value={value} 
                        onChange={(e) => handleChange(config.key, e.target.value, config.type)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        step={0.1}
                        min={0}
                        max={100}
                    />
                    <span className="absolute right-5 top-1.5 text-[10px] text-slate-400 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">%</span>
                </div>
            </div>
        );
    };

    return (
        <div className={cn("flex flex-col h-full w-full bg-slate-50/50 border border-slate-200 rounded-lg shadow-sm overflow-hidden", className)}>
            
            {/* 1. Header (Fixed) */}
            <div className={cn("flex flex-col items-center justify-center py-3 px-4 border-b shrink-0 relative transition-colors duration-500 bg-white", status.border)}>
                 <div className="absolute top-2 left-3 flex items-center gap-2 opacity-60">
                     <Hexagon size={14} className={status.text} />
                     <span className={cn("text-[10px] font-bold uppercase tracking-widest", status.text)}>PR Global</span>
                </div>

                {/* Primary PR (Big) */}
                <div className={cn("text-5xl font-black tracking-tighter tabular-nums mt-3 flex items-baseline relative z-10", status.text)}>
                    {primaryPR}<span className="text-2xl font-bold opacity-60 ml-1">%</span>
                </div>
                
                <div className="flex items-center gap-2 mt-1 relative z-20">
                     <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-white/40", status.border, status.text)}>
                        {primaryLabel}
                    </div>
                    {/* Mode Toggle Button */}
                    <button 
                        onClick={toggleMode}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all select-none"
                        title="Alternar Método de Cálculo"
                    >
                        <ArrowRightLeft size={8} />
                        <span>{secondaryLabel}: {secondaryPR}%</span>
                    </button>
                </div>

                <div className="absolute top-2 right-2 flex gap-1">
                    <button 
                        onClick={handleReset} 
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors" 
                        title="Resetar para Padrões"
                    >
                        <RotateCcw size={12} />
                    </button>
                </div>
            </div>

            {/* 2. Single View Body (Zero Scroll) */}
            <div className="flex-1 p-4 flex flex-col justify-between min-h-0 bg-white">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 content-start overflow-y-auto pr-1">
                    {LOSS_CONFIG.map((config) => (
                        <LossInput 
                            key={config.key} 
                            config={config} 
                            value={lossProfile[config.key]} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
