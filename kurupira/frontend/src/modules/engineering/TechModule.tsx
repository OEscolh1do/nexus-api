import React, { useState } from 'react';
import { Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { DenseButton } from '@/components/ui/dense-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Tab Components
import { PVArrayTab } from './tabs/PVArrayTab';
import { InverterSystemTab } from './tabs/InverterSystemTab';
import { GenerationAnalysisTab } from './tabs/GenerationAnalysisTab';

import { TechStatusBar } from './components/TechStatusBar';
import { ProjectService } from '@/services/ProjectService';

export const TechModule: React.FC = () => {
    const activeModule = useSolarStore(state => state.activeModule);
    const setActiveModule = useSolarStore(state => state.setActiveModule);
    const [isApproving, setIsApproving] = useState(false);
    const [approveSuccess, setApproveSuccess] = useState(false);

    const handleApproveSystem = async () => {
        try {
            setIsApproving(true);
            setApproveSuccess(false);
            await ProjectService.saveCurrentProject('APPROVED_FOR_PROPOSAL');
            setApproveSuccess(true);
            setTimeout(() => {
                setApproveSuccess(false);
                setActiveModule('electrical');
            }, 1000);
        } catch (error) {
            console.error("Erro ao aprovar projeto", error);
            alert("Falha ao aprovar o sistema.");
        } finally {
            setIsApproving(false);
        }
    };

    if (activeModule !== 'engineering') return null;

    return (
        // ROOT TABS CONTAINER: Wraps the whole page to allow TabsList in header and Content in main
        <Tabs defaultValue="pv-array" className="flex flex-col h-full bg-slate-100 overflow-hidden">

            {/* 1. HEADER (Fixed, White, h-12) - Compact & Minimalist */}
            <header className="flex-none h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 relative">

                {/* Left: Branding */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">ENGENHARIA</span>
                    </div>
                </div>

                {/* Center: Tabs Navigation (The 'Menu') - Text Only, Compact */}
                <TabsList className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200 h-9 items-center">
                    <TabsTrigger value="pv-array" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs font-bold px-3 h-full rounded-md transition-all text-slate-400 hover:text-slate-600">
                        Arranjo
                    </TabsTrigger>
                    <TabsTrigger value="inverter-system" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs font-bold px-3 h-full rounded-md transition-all text-slate-400 hover:text-slate-600">
                        Inversores
                    </TabsTrigger>
                    <TabsTrigger value="generation" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs font-bold px-3 h-full rounded-md transition-all text-slate-400 hover:text-slate-600">
                        Geração
                    </TabsTrigger>
                </TabsList>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">

                    <button
                        onClick={handleApproveSystem}
                        disabled={isApproving}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all h-8 ${approveSuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                    >
                        {isApproving ? <Loader2 size={14} className="animate-spin" /> :
                            approveSuccess ? <CheckCircle2 size={14} /> : <CheckCircle2 size={14} />}
                        {isApproving ? 'Aprovando...' : approveSuccess ? 'Aprovado!' : 'Aprovar Sistema'}
                    </button>

                    <DenseButton
                        variant="secondary"
                        size="sm"
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 h-8 hidden md:flex"
                        onClick={() => setActiveModule('electrical')}
                        icon={<Zap size={14} />}
                    >
                        Elétrico
                    </DenseButton>
                </div>
            </header>

            {/* 2. STATUS STRIP (New Component) */}
            <TechStatusBar />

            {/* 3. MAIN CONTENT (Scrollable Tabs Content) */}
            <div className="flex-1 min-h-0 overflow-hidden bg-muted/10 p-4 w-full relative">
                <div className="h-full w-full max-w-7xl mx-auto flex flex-col">
                    <TabsContent value="pv-array" className="h-full mt-0 border-0 p-0 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 data-[state=inactive]:hidden">
                        <PVArrayTab />
                    </TabsContent>
                    <TabsContent value="inverter-system" className="h-full mt-0 border-0 p-0 animate-in fade-in slide-in-from-bottom-2 duration-300 data-[state=inactive]:hidden">
                        <InverterSystemTab />
                    </TabsContent>
                    <TabsContent value="generation" className="h-full mt-0 border-0 p-0 animate-in fade-in slide-in-from-bottom-2 duration-300 data-[state=inactive]:hidden">
                        <GenerationAnalysisTab />
                    </TabsContent>
                </div>
            </div>
        </Tabs>
    );
};
