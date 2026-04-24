import React, { useState } from 'react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';
import { Settings2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const [mobileMode, setMobileMode] = useState<'editor' | 'preview'>('editor');

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
        <div className="w-full h-full bg-slate-950 flex flex-col lg:flex-row overflow-hidden relative animate-in fade-in duration-500 pb-16 lg:pb-0">
            
            {/* ══════════════════════════════════════════════════════
                PAINEL ESQUERDO (35%) — Controles Editoriais
            ══════════════════════════════════════════════════════ */}
            <div className={cn(
                "w-full lg:w-[40%] xl:w-[35%] 2xl:w-[30%] min-w-[380px] max-w-[700px] shrink-0 border-r border-slate-800 bg-[#0a0f1a] flex-col overflow-hidden transition-all duration-300 ease-in-out",
                mobileMode === 'editor' ? "flex h-full" : "hidden lg:flex lg:h-full"
            )}>
                <ProposalEditPanel />
            </div>

            {/* ══════════════════════════════════════════════════════
                PAINEL DIREITO (65%) — Documento A4 Preview
            ══════════════════════════════════════════════════════ */}
            <div className={cn(
                "flex-1 bg-slate-900/50 flex flex-col overflow-hidden relative",
                mobileMode === 'preview' ? "flex" : "hidden lg:flex"
            )}>
                <div className="flex-1 flex justify-center bg-[#05080e] overflow-hidden">
                    {/* O Preview replica fielmente o template PDF Neonorte */}
                    <ProposalDocumentPreview />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                MOBILE BOTTOM NAVIGATION
            ══════════════════════════════════════════════════════ */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-2 px-4 z-50">
                <button
                    onClick={() => setMobileMode('editor')}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors",
                        mobileMode === 'editor' ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
                    )}
                >
                    <Settings2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Editor</span>
                </button>
                <div className="w-px h-8 bg-slate-800" />
                <button
                    onClick={() => setMobileMode('preview')}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors",
                        mobileMode === 'preview' ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"
                    )}
                >
                    <FileText size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Documento</span>
                </button>
            </div>

        </div>
    );
};
