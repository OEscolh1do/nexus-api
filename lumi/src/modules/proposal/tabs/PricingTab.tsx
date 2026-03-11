import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
// Import Domain Sections
import { KitCostsSection } from './pricing/KitCostsSection';
import { ExecutionCostsSection } from './pricing/ExecutionCostsSection';
import { AdministrativeCostsSection } from './pricing/AdministrativeCostsSection';
import { CommercialStrategySection } from './pricing/CommercialStrategySection';
import { PricingResultsPanel } from './pricing/PricingResultsPanel';

export const PricingTab: React.FC = () => {
    const settings = useSolarStore(state => state.settings);
    const updateSettings = useSolarStore(state => state.updateSettings);

    const handleSettingsChange = (key: keyof typeof settings, value: string) => {
        updateSettings({ [key]: value });
    };

    return (
        <div className="flex h-full w-full bg-white overflow-hidden">

            {/* =================================================================================
                LEFT PANEL: CALCULATION ENGINE (Inputs)
               ================================================================================= */}
            <div className="w-2/3 h-full overflow-y-auto p-6 border-r border-slate-200">
                <div className="max-w-2xl mx-auto pb-12">

                    {/* Header */}
                    <div className="mb-6 flex justify-between items-end border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Motor de Precificação</h2>
                            <p className="text-sm text-slate-500">Fluxo: Custo Hard → Custo Soft → Markup → Preço.</p>
                        </div>
                        {/* Pricing Model Selector moved to Header for global context */}
                        <div className="flex flex-col items-end">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Modelo de Negócio</label>
                            <select
                                className="text-xs font-bold bg-indigo-50 border border-indigo-100 rounded px-3 py-1.5 text-indigo-700 focus:ring-2 focus:ring-indigo-200 cursor-pointer outline-none transition-all hover:bg-indigo-100"
                                value={settings.pricingModel || 'margin'}
                                onChange={(e) => handleSettingsChange('pricingModel', e.target.value)}
                            >
                                <option value="margin">Margem Global (Padrão)</option>
                                <option value="cost_plus">Cost Plus (Detalhado)</option>
                                <option value="fixed_kit">Orçamento Fornecedor (Kit Fixo)</option>
                            </select>
                        </div>
                    </div>

                    {/* Domain Sections */}
                    <KitCostsSection />
                    <ExecutionCostsSection />
                    <AdministrativeCostsSection />
                    <CommercialStrategySection />

                </div>
            </div>

            {/* =================================================================================
                RIGHT PANEL: PRICING RESULTS & BREAKDOWN
               ================================================================================= */}
            <PricingResultsPanel />

        </div>
    );
};
