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
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100">
            {/* 1. HEADER (Fixed, White, h-12) - Compact & Minimalist */}
            <header className="flex-none h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20 relative">
                
                {/* Left: Branding */}
                <div className="flex items-center gap-4 shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:block">COMERCIAL</span>
                    </div>
                </div>

                {/* Center: Tabs Navigation (The 'Menu') - Text Only, Compact */}
                <div className="hidden md:flex bg-slate-950 p-1 rounded-sm border border-slate-800 h-9 items-center">
                    <button
                        onClick={() => setActiveTab('diagnostico')}
                        className={`flex items-center gap-2 px-3 h-full rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'diagnostico'
                                ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/30'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Activity size={14} />
                        Diagnóstico
                    </button>
                    <button
                        onClick={() => setActiveTab('presentation')}
                        disabled={needsGate}
                        className={`flex items-center gap-2 px-3 h-full rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'presentation'
                                ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/30'
                                : needsGate
                                ? 'text-slate-700 cursor-not-allowed opacity-50'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Eye size={14} />
                        Apresentação
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        disabled={needsGate}
                        className={`flex items-center gap-2 px-3 h-full rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'pricing'
                                ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/30'
                                : needsGate
                                ? 'text-slate-700 cursor-not-allowed opacity-50'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Settings2 size={14} />
                        Precificação
                    </button>
                    <button
                        onClick={() => setActiveTab('contract')}
                        disabled={needsGate}
                        className={`flex items-center gap-2 px-3 h-full rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'contract'
                                ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/30'
                                : needsGate
                                ? 'text-slate-700 cursor-not-allowed opacity-50'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <FileSignature size={14} />
                        Contrato
                    </button>
                </div>
                
                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-sm">
                        <FileText size={14} className="text-slate-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposta #001</span>
                    </div>
                </div>
            </header>

            {/* 2. STATUS STRIP (New Component) */}
            <ProposalStatusBar />

            {/* 3. MAIN CONTENT (Scrollable Tabs Content) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-950 p-4 w-full relative">
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
