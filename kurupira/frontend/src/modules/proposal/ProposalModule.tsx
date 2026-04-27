import React, { useState } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { FileText, Settings2, Eye, FileSignature, Activity } from 'lucide-react';
import { PresentationTab } from './tabs/PresentationTab';
import { PricingTab } from './tabs/PricingTab';
import { ContractPreviewTab } from './tabs/ContractPreviewTab';
import { DiagnosticoTab } from './tabs/DiagnosticoTab';
import { ProposalStatusBar } from './components/ProposalStatusBar';

type Tab = 'diagnostico' | 'presentation' | 'pricing' | 'contract';

export const ProposalModule: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const [activeTab, setActiveTab] = useState<Tab>('diagnostico');

    const hasModules = modules.length > 0;
    const hasClient = !!clientData.clientName;
    // Diagnóstico é sempre acessível; demais abas exigem dados completos
    const needsGate = !hasClient || !hasModules;

    return (
        <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
            {/* 1. HEADER (Fixed, White, h-12) - Compact & Minimalist */}
            <header className="flex-none h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 relative">
                
                {/* Left: Branding */}
                <div className="flex items-center gap-4 shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-neonorte-purple animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">COMERCIAL</span>
                    </div>
                </div>

                {/* Center: Tabs Navigation (The 'Menu') - Text Only, Compact */}
                <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200 h-9 items-center">
                    <button
                        onClick={() => setActiveTab('diagnostico')}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'diagnostico'
                                ? 'bg-white text-neonorte-purple shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Activity size={14} />
                        Diagnóstico
                    </button>
                    <button
                        onClick={() => setActiveTab('presentation')}
                        disabled={needsGate}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'presentation'
                                ? 'bg-white text-neonorte-purple shadow-sm'
                                : needsGate
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Eye size={14} />
                        Apresentação
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        disabled={needsGate}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'pricing'
                                ? 'bg-white text-neonorte-purple shadow-sm'
                                : needsGate
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Settings2 size={14} />
                        Precificação
                    </button>
                    <button
                        onClick={() => setActiveTab('contract')}
                        disabled={needsGate}
                        className={`flex items-center gap-2 px-3 h-full rounded-md text-xs font-bold transition-all ${
                            activeTab === 'contract'
                                ? 'bg-white text-neonorte-purple shadow-sm'
                                : needsGate
                                ? 'text-slate-300 cursor-not-allowed'
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
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-muted/10 p-4 w-full relative">
                 <div className="w-full max-w-7xl mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'diagnostico' && <DiagnosticoTab />}
                    {activeTab === 'presentation' && <PresentationTab />}
                    {activeTab === 'pricing' && <PricingTab />}
                    {activeTab === 'contract' && <ContractPreviewTab />}
                 </div>
            </div>
        </div>
    );
};
