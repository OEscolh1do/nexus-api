import React from 'react';
import { useTechStore } from '../store/useTechStore';
import { useSolarStore, selectModules } from '@/core/state/solarStore';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { toArray } from '@/core/types/normalized.types';
import { Settings2, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MPPTCompactRow } from './StringConfiguratorRow';

export const StringConfigurator: React.FC<{ className?: string }> = ({ className }) => {
    const { inverters: invertersNormalized, updateMPPTConfig, selectedModuleId, updateInverterQuantity } = useTechStore();
    const catalogInverters = useCatalogStore(s => s.inverters);
    const inverters = toArray(invertersNormalized);

    // Get Selected Module Specs
    const projectModules = useSolarStore(selectModules);
    const selectedModule = projectModules.find(m => m.id === selectedModuleId) || projectModules[0];

    // State for Accordion
    // Default open all or specific logic? Let's keep it simple: all open by default or toggle.
    // We'll use a local map for expanded states if needed.

    if (inverters.length === 0) {
        return (
            <div className={cn("flex flex-col h-full w-full bg-slate-50 border border-slate-200 rounded-lg shadow-sm items-center justify-center p-6 text-center select-none", className)}>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                    <Zap size={20} className="text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-500">Sem Inversores</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[180px]">
                    Adicione inversores através do catálogo à esquerda para configurar as strings.
                </p>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full w-full bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden", className)}>
            {/* HEADER */}
            <div className="flex flex-col py-3 px-4 border-b bg-white shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <Settings2 size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Configuração de Strings</span>
                </div>
                {selectedModule ? (
                    <div className="text-xs font-medium text-slate-700 truncate" title={selectedModule.model}>
                        Módulo: <span className="text-blue-600">{selectedModule.model}</span> ({(selectedModule.power)}W)
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <AlertTriangle size={10} />
                        Selecione um módulo!
                    </div>
                )}
            </div>

            {/* BODY (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                {inverters.map(invInstance => {
                    const spec = catalogInverters.find((i: any) => i.id === invInstance.catalogId);
                    if (!spec) return null;

                    return (
                        <div key={invInstance.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Inverter Header Stripe */}
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-100/50 border-b border-slate-100">
                                <div className="min-w-0 flex-1 mr-2">
                                    <h4 className="text-xs font-bold text-slate-800 truncate" title={spec.model}>{spec.model}</h4>
                                    <div className="flex gap-2 text-[9px] text-slate-400 uppercase tracking-wider font-medium">
                                        <span>{spec.manufacturer}</span>
                                        <span>•</span>
                                        <span>{(spec.nominalPowerW / 1000).toFixed(1)} kW</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                    <span className="text-[9px] font-bold text-slate-400">QTD</span>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-6 text-center text-xs font-bold text-slate-700 outline-none"
                                        value={invInstance.quantity}
                                        onChange={(e) => updateInverterQuantity(invInstance.id, parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>

                            {/* MPPT Rows */}
                            <div className="p-2 space-y-2">
                                {invInstance.mpptConfigs.map((config) => (
                                    <MPPTCompactRow
                                        key={config.mpptId}
                                        mpptId={config.mpptId}
                                        config={config}
                                        spec={spec}
                                        moduleSpecs={selectedModule} // Pass full module object
                                        onChange={(newConfig) => updateMPPTConfig(invInstance.id, config.mpptId, newConfig)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

