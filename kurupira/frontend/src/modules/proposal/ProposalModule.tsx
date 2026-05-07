import React, { useState } from 'react';
import { useSolarStore, selectModules, selectClientData } from '@/core/state/solarStore';
import { FileText, Settings2, Eye, FileSignature, Activity } from 'lucide-react';
import { PresentationTab } from './tabs/PresentationTab';
import { PricingTab } from './tabs/PricingTab';
import { ContractPreviewTab } from './tabs/ContractPreviewTab';
import { DiagnosticoTab } from './tabs/DiagnosticoTab';
import { cn } from '@/lib/utils';

type Tab = 'diagnostico' | 'presentation' | 'pricing' | 'contract';

export const ProposalModule: React.FC = () => {
    const modules = useSolarStore(selectModules);
    const clientData = useSolarStore(selectClientData);
    const [activeTab, setActiveTab] = useState<Tab>('diagnostico');

    const hasModules = modules.length > 0;
    const hasClient = !!clientData.clientName;
    const needsGate = !hasClient || !hasModules;

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden text-slate-100">
            
            {/* Local Navigation - Contained Tabs Pattern (Report UX-001) */}
            <div className="flex-none px-4 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                <div className="flex bg-slate-950 p-1 rounded-sm border border-slate-800 h-9 items-center">
                    {[
                        { id: 'diagnostico', label: 'Diagnóstico', icon: Activity },
                        { id: 'presentation', label: 'Apresentação', icon: Eye },
                        { id: 'pricing', label: 'Precificação', icon: Settings2 },
                        { id: 'contract', label: 'Contrato', icon: FileSignature },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isLocked = tab.id !== 'diagnostico' && needsGate;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => !isLocked && setActiveTab(tab.id as Tab)}
                                disabled={isLocked}
                                className={cn(
                                    "flex items-center gap-2 px-3 h-full rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
                                    isActive
                                        ? "bg-slate-800 text-slate-100 shadow-inner border border-slate-700"
                                        : isLocked
                                            ? "text-slate-700 cursor-not-allowed opacity-50"
                                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                                )}
                            >
                                <Icon size={12} className={cn(isActive ? "text-indigo-400" : "text-slate-600")} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-sm">
                        <FileText size={12} className="text-slate-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {clientData.projectName || 'DOC_RASCUNHO'}
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT (Scrollable Tabs Content) */}
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
