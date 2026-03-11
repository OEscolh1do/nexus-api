
import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { ConsumptionManager } from '../components/ConsumptionManager';
import { EnergyProfileChart } from '../components/EnergyProfileChart';
import { LoadSimulator } from '../components/LoadSimulator';
import { useSolarStore } from '@/core/state/solarStore';


export const AnalysisTab: React.FC = () => {
    const clientData = useSolarStore(state => state.clientData);
    
    // Controlled State for Consumption Manager orchestration
    const [activeInvoiceId, setActiveInvoiceId] = useState<string>(
        clientData.invoices?.[0]?.id || ''
    );
    
    // Derived active invoice for the Chart
    const activeInvoice = clientData.invoices.find(inv => inv.id === activeInvoiceId) || clientData.invoices[0];

    return (
         <section className="h-full w-full flex flex-col min-h-0 bg-slate-50/50">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 shrink-0">
                <div className="p-1 bg-orange-100 rounded text-orange-600">
                    <Zap size={14} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Análise de Consumo</span>
            </div>
            
            {/* Content Grid */}
            <div className="flex-1 p-3 min-h-0 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
                    
                    {/* LEFT COLUMN (Inputs): Manager */}
                    {/* Compact Column (span-4) - Full Height for Month List */}
                    <div className="lg:col-span-4 flex flex-col min-h-0 overflow-hidden h-full">
                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-3 overflow-hidden flex flex-col min-h-0">
                            <ConsumptionManager 
                                activeInvoiceId={activeInvoiceId} 
                                onInvoiceSelect={setActiveInvoiceId} 
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Viz): Chart + Simulator */}
                    {/* Wider Column (span-8) - Stacked Viz */}
                    <div className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                        
                        {/* CHART: Fixed height relative to container (e.g. 45%) */}
                        <div className="h-[45%] shrink-0 min-h-[250px]">
                             <EnergyProfileChart 
                                 invoice={activeInvoice} 
                                 className="h-full w-full shadow-sm rounded-xl border-slate-200"
                            />
                        </div>

                        {/* SIMULATOR: Takes remaining space (flex-1) */}
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <LoadSimulator 
                                className="h-full border-slate-200 shadow-sm"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};


