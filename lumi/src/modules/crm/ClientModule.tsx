// LAYOUT V4.0 - TABBED CRM INTERFACE
// Timestamp: 2026-01-28 | Change: Migrated to Tabs (Survey vs Analysis) | Viewport-Fit

import React, { useState } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { MapPin, BarChart3, Save, Loader2, CheckCircle2, Send } from 'lucide-react';
import { ProjectService } from '@/services/ProjectService';
import { NexusClient } from '@/services/NexusClient';

// Tab Components
import { SurveyTab } from './tabs/SurveyTab';
import { AnalysisTab } from './tabs/AnalysisTab';

type TabType = 'survey' | 'analysis';

export const ClientModule: React.FC = () => {
    const activeModule = useSolarStore(state => state.activeModule);
    const setActiveModule = useSolarStore(state => state.setActiveModule);
    // Using local state for simple tabs, or could use Radix Tabs if preferred. 
    // Sticking to state to minimize dependency issues if Shadcn Tabs aren't fully set up or to keep it lightweight.
    const [activeTab, setActiveTab] = useState<TabType>('survey');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSaveDraft = async () => {
        try {
            setIsSaving(true);
            setSaveSuccess(false);
            await ProjectService.saveCurrentProject('DRAFT');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Erro ao salvar projeto", error);
            alert("Falha ao salvar o projeto. Verifique o console.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToEngineering = async () => {
        try {
            setIsSaving(true);
            
            // 1. Salva draft localmente no store
            await ProjectService.saveCurrentProject('WAITING_ENGINEERING');
            
            // 2. Integração com o Hub Nexus
            // Neste fluxo v3.2, o cliente avança para Engenharia localmente (aba)
            // e já despacha um alerta/projeto pro Nexus informando que o pipeline iniciou.
            
            // Obtemos a view do state atual
            const state = useSolarStore.getState();
            
            // Simulação de payload de integração
            await NexusClient.sendProposal({
                leadId: "6bb4c8f5-9b2f-4c55-b463-54cd8c219665", // Mock temporário para evitar quebrar caso lead não venha do import
                systemSizeKwp: 0, // Será preenchido reais nas próximas abas
                totalInvestment: 0, 
                moduleCount: 0,
                inverterCount: 0,
                notes: `Draft gerado para o cliente ${state.clientData.clientName}`
            });

            // 3. Muda a aba ativa
            setActiveModule('engineering');
        } catch (error) {
            console.error("Erro ao enviar projeto", error);
            alert("Aviso: Falha ao sincronizar com o Servidor Nexus Central, mas o progresso local foi salvo.");
            setActiveModule('engineering'); // Allow user to proceed offline/locally
        } finally {
            setIsSaving(false);
        }
    };

    if (activeModule !== 'crm') return null;

    return (
        // Viewport-Fit Container: h-[calc(100vh-theme(spacing.16))] assuming 4rem header. Adjusted to fit perfectly.
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-100 overflow-hidden">

            {/* Module Header Bar */}
            <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-neonorte-green animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">CRM Dashboard</span>
                    </div>

                    {/* Tab Navigation Controls */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('survey')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'survey'
                                ? 'bg-white text-neonorte-purple shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <MapPin size={12} />
                            Levantamento
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'analysis'
                                ? 'bg-white text-neonorte-purple shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <BarChart3 size={12} />
                            Análise de Consumo
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${saveSuccess
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-neonorte-green'
                            }`}
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> :
                            saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
                        {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Rascunho'}
                    </button>

                    <button
                        onClick={handleSendToEngineering}
                        disabled={isSaving}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-neonorte-purple hover:bg-neonorte-purple/90 px-3 py-1.5 rounded-md transition-colors group"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />}
                        {isSaving ? 'Enviando...' : 'Enviar p/ Engenharia'}
                    </button>
                </div>
            </header>

            {/* Tab Content Area - 100% remaining height, no scroll on container */}
            <main className="flex-1 p-4 overflow-hidden h-full w-full relative">
                {activeTab === 'survey' && <SurveyTab />}
                {activeTab === 'analysis' && <AnalysisTab />}
            </main>
        </div>
    );
};
