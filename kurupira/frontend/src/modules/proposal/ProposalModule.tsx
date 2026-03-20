import React, { useState } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { DenseCard } from '@/components/ui/dense-form';
import { FileText, AlertCircle, Settings2, Eye, FileSignature } from 'lucide-react';
import { PresentationTab } from './tabs/PresentationTab';
import { PricingTab } from './tabs/PricingTab';
import { ContractPreviewTab } from './tabs/ContractPreviewTab';
import { ProposalStatusBar } from './components/ProposalStatusBar';

type Tab = 'presentation' | 'pricing' | 'contract';

export const ProposalModule: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const [activeTab, setActiveTab] = useState<Tab>('presentation');

    const hasModules = modules.length > 0;
    const hasClient = !!clientData.clientName;

    if (!hasClient || !hasModules) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <DenseCard className="max-w-md text-center p-8 border-dashed border-2 border-slate-300 bg-slate-50">
                    <div className="flex justify-center mb-4 text-amber-500">
                        <AlertCircle size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Dados Insuficientes</h2>
                    <p className="text-slate-500 mb-6">
                        Para gerar uma proposta, você precisa primeiro preencher os dados do cliente e realizar o dimensionamento técnico.
                    </p>
                    <ul className="text-left text-sm space-y-2 bg-white p-4 rounded-lg border border-slate-200 inline-block">
                        <li className={`flex items-center gap-2 ${hasClient ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {hasClient ? '✅' : '⚪'} Dados do Cliente (CRM)
                        </li>
                        <li className={`flex items-center gap-2 ${hasModules ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {hasModules ? '✅' : '⚪'} Definição de Kit (Engenharia)
                        </li>
                    </ul>
                </DenseCard>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
            {/* 1. HEADER (Fixed, White, h-12) - Compact & Minimalist */}
            <header className="flex-none h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 relative">
                
                {/* Left: Branding */}
                <div className="flex items-center gap-4 shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">COMERCIAL</span>
                    </div>
                </div>

                {/* Center: Tabs Navigation (The 'Menu') - Text Only, Compact */}
                <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200 h-9 items-center">
                    <button
                        onClick={() => setActiveTab('presentation')}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'presentation'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Eye size={14} />
                        Apresentação
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'pricing'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Settings2 size={14} />
                        Precificação
                    </button>
                    <button
                        onClick={() => setActiveTab('contract')}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'contract'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <FileSignature size={14} />
                        Contrato
                    </button>
                </div>
                
                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded border border-slate-100">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Proposta #001</span>
                    </div>
                </div>
            </header>

            {/* 2. STATUS STRIP (New Component) */}
            <ProposalStatusBar />

            {/* 3. MAIN CONTENT (Scrollable Tabs Content) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-muted/10 p-4 w-full relative">
                 <div className="w-full max-w-7xl mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'presentation' && <PresentationTab />}
                    {activeTab === 'pricing' && <PricingTab />}
                    {activeTab === 'contract' && <ContractPreviewTab />}
                 </div>
            </div>
        </div>
    );
};
