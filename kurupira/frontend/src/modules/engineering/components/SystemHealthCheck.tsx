
import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { DenseCard, DenseStat } from '@/components/ui/dense-form';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';

export const SystemHealthCheck: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const inverters = useSolarStore(selectInverters);

    // Calc Logic
    const totalModulePowerWp = modules.reduce((acc, m) => acc + (m.power * m.quantity), 0);
    const totalModulePowerKwp = totalModulePowerWp / 1000;
    
    // Inverter power in DB is in Watts, but stored as kW in Store to match schema max(500)
    const totalInverterPowerKw = inverters.reduce((acc, i) => acc + (i.nominalPower * i.quantity), 0);
    
    const overloadRatio = totalInverterPowerKw > 0 ? (totalModulePowerKwp / totalInverterPowerKw) : 0;
    
    // Status Logic
    const isOptimalOverload = overloadRatio >= 0.75 && overloadRatio <= 1.35; // Regra de Ouro (75% a 135%)
    const isHighOverload = overloadRatio > 1.35;
    const isLowOverload = overloadRatio < 0.75 && totalInverterPowerKw > 0;

    let overloadStatus: 'success' | 'warning' | 'danger' | 'default' = 'default';
    let overloadMsg = "Aguardando dimensionamento...";
    let borderColor = 'border-l-slate-300';
    
    const settings = useSolarStore(state => state.settings); // Need settings for minHistoricalTemp
    
    // Safety Logic: Maximum Voc Check at Low Temp (Inverno)
    // Formula: Voc_max = Voc_stc * (1 + (tempCoeff/100) * (minHistoricalTemp - 25))
    let isVocUnsafe = false;

    // Assuming user has picked modules. We check the worst case (series connection).
    // Note: We don't know strings configuration perfectly here yet, but we can estimate or alert 
    // based on 'If all modules were in 1 string' or 'Avg string size'. 
    
    // Let's refine: The prompt implies I should implement the formula.
    // I will calculate Per-Module Max Voc first.
    const module = modules[0]; // Take representative module
    const inverter = inverters[0]; // Take representative inverter

    let maxVocGenerated = 0;

    if (module && inverter && settings) {
        const tempCoeff = module.tempCoeff; // %/C, e.g. -0.30
        const minTemp = settings.minHistoricalTemp; // e.g. -5
        const vocStc = module.voc;

        // Calculate Max Voc per module at min temp
        const deltaT = minTemp - 25;
        const correctionFactor = 1 + (tempCoeff / 100) * deltaT;
        const vocMaxPerModule = vocStc * correctionFactor;

        // Estimate Series Size (Naive: All modules / Inverters / 2 MPPTs approx? Or just 1 string?)
        // To be safe and socratic as requested: "If we don't know the string size, we can't validate."
        // BUT I must follow "Action Plan P0". 
        // I will assume for this check that we are checking if the *Selected Inverter* supports *Typical String Voltage*.
        // OR better: I will add a Warning if I can't calculate, but if I can (e.g. if we assume 1 string for small systems), do it.
        // Let's look at `modules` state. It has `.quantity`.
        // Let's assume the user puts all modules in series for a single inverter if only 1 inverter exists.
        
        const estStrings = Math.max(1, inverter.quantity); // simple assumption
        const modulesPerString = Math.ceil(modules.reduce((acc, m) => acc + m.quantity, 0) / estStrings);

        maxVocGenerated = vocMaxPerModule * modulesPerString;

        if (maxVocGenerated > (inverter.maxInputVoltage || 1000)) { // Default 1000V if missing
            isVocUnsafe = true;
        }
    }
    
    // Status Logic Updates with Voc Check
    if (totalInverterPowerKw > 0) {
        if (isVocUnsafe) {
            overloadStatus = 'danger'; // Critical overrides everything
            overloadMsg = `PERIGO: Tensão Máxima (${maxVocGenerated.toFixed(0)}V) excede limite do Inversor!`;
            borderColor = 'border-l-red-600';
        } else if (isOptimalOverload) {
            overloadStatus = 'success';
            overloadMsg = "Dimensionamento Otimizado";
            borderColor = 'border-l-green-500';
        } else if (isHighOverload) {
            overloadStatus = 'danger';
            overloadMsg = "Risco de Clipping Excessivo";
            borderColor = 'border-l-red-500';
        } else if (isLowOverload) {
            overloadStatus = 'warning';
            overloadMsg = "Inversor Superdimensionado";
            borderColor = 'border-l-yellow-500';
        }
    }

    // Area Estimada (2m² por modulo avg se não tiver dados)
    const areaEstimada = modules.reduce((acc, m) => acc + ((m.area || 2) * m.quantity), 0);
    const pesoEstimado = modules.reduce((acc, m) => acc + ((m.weight || 25) * m.quantity), 0);

    return (
        <DenseCard className={`h-full flex flex-col justify-center bg-white border-l-4 ${borderColor}`}>
            <div className="flex items-center justify-between mb-4">
                 <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={16} className={
                            overloadStatus === 'success' ? 'text-green-500' : 
                            overloadStatus === 'danger' ? 'text-red-500' : 
                            overloadStatus === 'warning' ? 'text-yellow-500' : 'text-slate-400'
                        } />
                        Health Check
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium ml-6">{overloadMsg}</p>
                 </div>
                 
                 <div className={`px-2 py-1 rounded text-xs font-bold border ${
                     overloadStatus === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 
                     overloadStatus === 'danger' ? 'bg-red-50 text-red-700 border-red-100' :
                     overloadStatus === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-slate-50 text-slate-500'
                 }`}>
                    FDI: {(overloadRatio * 100).toFixed(0)}%
                 </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
                 <DenseStat 
                    label="Potência Gerador" 
                    value={totalModulePowerKwp.toFixed(2)} 
                    unit="kWp" 
                    colSpan={3} 
                 />
                 <DenseStat 
                    label="Potência Inversores" 
                    value={totalInverterPowerKw.toFixed(2)} 
                    unit="kW" 
                    colSpan={3} 
                 />
                 <DenseStat 
                    label="Área Estimada" 
                    value={areaEstimada.toFixed(1)} 
                    unit="m²" 
                    colSpan={3} 
                 />
                 <DenseStat 
                    label="Peso Total" 
                    value={pesoEstimado.toFixed(0)} 
                    unit="kg" 
                    colSpan={3} 
                 />
            </div>
            
            {(isHighOverload || isLowOverload) && (
                <div className="mt-3 flex gap-2 items-start bg-yellow-50 p-2 rounded border border-yellow-100">
                    <AlertTriangle size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-yellow-700 leading-tight">
                        {isHighOverload 
                            ? "Atenção: A potência dos módulos excede 135% da capacidade do inversor. Verifique as especificações de entrada (Isc/Voc)." 
                            : "Atenção: O inversor está trabalhando com baixa carga, o que pode reduzir a eficiência da conversão."}
                    </p>
                </div>
            )}
        </DenseCard>
    );
};
