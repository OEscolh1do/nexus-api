
import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { DenseCard, DenseStat } from '@/components/ui/dense-form';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';
import { useTechStore } from '@/modules/engineering/store/useTechStore';
import { toArray } from '@/core/types/normalized.types';
import { INVERTER_CATALOG } from '@/modules/engineering/constants/inverters';
import { validateSystemStrings, type MPPTInput } from '@/modules/engineering/utils/electricalMath';

export const SystemHealthCheck: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const inverters = useSolarStore(selectInverters);

    // Calc Logic
    const totalModulePowerWp = modules.reduce((acc, m) => acc + (m.power), 0);
    const totalModulePowerKwp = totalModulePowerWp / 1000;
    // Status defaults (will be overwritten below)
    // Inverter power in DB is in Watts, but stored as kW in Store to match schema max(500)
    const totalInverterPowerKw = inverters.reduce((acc, i) => acc + (i.nominalPower * i.quantity), 0);
    
    const overloadRatio = totalInverterPowerKw > 0 ? (totalModulePowerKwp / totalInverterPowerKw) : 0;
    
    // Status Logic
    const isOptimalOverload = overloadRatio >= 0.75 && overloadRatio <= 1.35;
    const isHighOverload = overloadRatio > 1.35;
    const isLowOverload = overloadRatio < 0.75 && totalInverterPowerKw > 0;
    
    const settings = useSolarStore(state => state.settings);
    const { inverters: techInvertersNorm } = useTechStore();
    const techInverters = toArray(techInvertersNorm);

    // ── P6-2: System-level electrical validation via pure engine ──
    const systemReport = React.useMemo(() => {
        if (modules.length === 0 || techInverters.length === 0) return null;

        const m = modules[0]; // Representative module
        const moduleSpecs = {
            voc: m.voc,
            vmp: m.vmp ?? m.voc * 0.82,
            isc: m.isc ?? 0,
            tempCoeffVoc: m.tempCoeff || -0.29,
        };

        const mpptInputs: MPPTInput[] = techInverters.flatMap(inv => {
            const spec = INVERTER_CATALOG.find((c: any) => c.id === inv.catalogId);
            if (!spec) return [];
            return inv.mpptConfigs
                .filter(cfg => cfg.modulesPerString > 0 && cfg.stringsCount > 0)
                .map(cfg => {
                    const specMppt = spec.mppts?.find((mp: any) => mp.mpptId === cfg.mpptId) || spec.mppts?.[0];
                    return {
                        inverterId: inv.id,
                        mpptId: cfg.mpptId,
                        modulesPerString: cfg.modulesPerString,
                        stringsCount: cfg.stringsCount,
                        maxInputVoltage: specMppt?.maxInputVoltage ?? 800,
                        minMpptVoltage: specMppt?.minMpptVoltage ?? 100,
                        maxMpptVoltage: specMppt?.maxMpptVoltage ?? 600,
                        maxCurrentPerMPPT: specMppt?.maxCurrentPerMPPT ?? 30,
                    } satisfies MPPTInput;
                });
        });

        if (mpptInputs.length === 0) return null;
        return validateSystemStrings(mpptInputs, moduleSpecs, settings?.minHistoricalTemp ?? 10);
    }, [modules, techInverters, settings]);

    // ── Status Logic (P6-2 integrated) ──
    let overloadStatus: 'success' | 'warning' | 'danger' | 'default' = 'default';
    let overloadMsg = "Aguardando dimensionamento...";
    let borderColor = 'border-l-slate-300';

    if (totalInverterPowerKw > 0) {
        // Priority: Electrical violations > Overload checks
        if (systemReport && !systemReport.isValid) {
            overloadStatus = 'danger';
            overloadMsg = `${systemReport.summary.errors} violação(ões) elétrica(s) detectada(s)!`;
            borderColor = 'border-l-red-600';
        } else if (systemReport && systemReport.globalStatus === 'warning') {
            overloadStatus = 'warning';
            overloadMsg = `${systemReport.summary.warnings} alerta(s) elétrico(s)`;
            borderColor = 'border-l-yellow-500';
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
    const areaEstimada = modules.reduce((acc, m) => acc + (m.area || 2), 0);
    const pesoEstimado = modules.reduce((acc, m) => acc + (m.weight || 25), 0);

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
            
            {/* P6-2: Electrical Violation Details */}
            {systemReport && systemReport.entries.filter(e => e.status !== 'ok').length > 0 && (
                <div className="mt-3 flex flex-col gap-1 bg-red-50/50 p-2 rounded border border-red-100">
                    <div className="flex items-center gap-1 mb-0.5">
                        <AlertTriangle size={10} className="text-red-500 shrink-0" />
                        <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Violações Elétricas</span>
                    </div>
                    {systemReport.entries
                        .filter(e => e.status !== 'ok')
                        .map(entry => (
                            <div key={`${entry.inverterId}-${entry.mpptId}`} className="flex flex-col gap-0.5">
                                {entry.messages.map((msg, i) => (
                                    <span key={i} className={`text-[9px] font-medium flex items-center gap-1 ${
                                        entry.status === 'error' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                        MPPT {entry.mpptId}: {msg}
                                    </span>
                                ))}
                            </div>
                        ))}
                </div>
            )}

            {/* Overload warnings (only if no electrical violations) */}
            {(!systemReport || systemReport.isValid) && (isHighOverload || isLowOverload) && (
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
