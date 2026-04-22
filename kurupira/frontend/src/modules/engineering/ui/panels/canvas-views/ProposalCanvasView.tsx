import React from 'react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';

// Subcomponents
import { ProposalEditPanel } from './proposal/ProposalEditPanel';
import { ProposalDocumentPreview } from './proposal/ProposalDocumentPreview';
import { ProposalBlockedScreen } from './proposal/ProposalBlockedScreen';

/**
 * PROPOSAL CANVAS VIEW — spec-view-proposal-2026-04-20
 * 
 * Etapa Final da Jornada: Síntese Comercial e Documento A4.
 */
export const ProposalCanvasView: React.FC = () => {
    const projectStatus   = useSolarStore(s => s.project.projectStatus);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);

    // Gate de Aprovação (PGFX-04)
    const isApproved = projectStatus === 'approved';

    if (!isApproved) {
        return (
            <ProposalBlockedScreen 
                onGoToProjection={() => setFocusedBlock('projection')} 
                onNavigate={(block) => setFocusedBlock(block)}
            />
        );
    }

    return (
        <div className="w-full h-full bg-slate-950 flex flex-col lg:flex-row overflow-hidden relative animate-in fade-in duration-500">
            
            {/* ══════════════════════════════════════════════════════
                PAINEL ESQUERDO (35%) — Controles Editoriais
            ══════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-[400px] shrink-0 border-r border-slate-800 bg-[#0a0f1a] flex flex-col overflow-hidden">
                <ProposalEditPanel />
            </div>

            {/* ══════════════════════════════════════════════════════
                PAINEL DIREITO (65%) — Documento A4 Preview
            ══════════════════════════════════════════════════════ */}
            <div className="flex-1 bg-slate-900/50 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#05080e] custom-scrollbar">
                    {/* O Preview replica fielmente o template PDF Neonorte */}
                    <ProposalDocumentPreview />
                </div>
            </div>

        </div>
    );
};
