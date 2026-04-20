import React from 'react';
import { Image, Box, Layers, Zap } from 'lucide-react';
import { useUIStore, type CanvasViewMode } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';

// =============================================================================
// VIEW LAYER SELECTOR (D3 — Horizontal Selection)
// =============================================================================
//
// Seletor de "consciência" do canvas. Posicionado horizontalmente à esquerda,
// acima da ilha de ferramentas. Foca na troca rápida de contexto técnico.
// =============================================================================

export const ViewLayerSelector: React.FC = () => {
    const activeMode = useUIStore(s => s.canvasViewMode);
    const setViewMode = useUIStore(s => s.setCanvasViewMode);

    const MODES: { id: CanvasViewMode; label: string; icon: any; shortcut: string }[] = [
        { id: 'CONTEXT', label: 'Contexto', icon: Image, shortcut: '1' },
        { id: 'BLUEPRINT', label: 'Blueprint', icon: Box, shortcut: '2' },
        { id: 'DIAGRAM', label: 'Diagrama', icon: Layers, shortcut: '3' },
        { id: 'UNIFILAR', label: 'Unifilar', icon: Zap, shortcut: '4' },
    ];

    return (
        <div className="absolute left-6 top-8 flex flex-row items-center bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[1100] group select-none animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-row gap-1.5">
                {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = activeMode === mode.id;

                    return (
                        <button
                            key={mode.id}
                            onClick={() => setViewMode(mode.id)}
                            className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200 relative group/btn outline-none",
                                isActive 
                                    ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
                                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800 active:scale-95"
                            )}
                            title={`${mode.label} (${mode.shortcut})`}
                        >
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            
                            {/* Shortcut Badge (Estilo CAD) */}
                            <span className={cn(
                                "absolute -top-1 -right-1 text-[7px] font-bold px-1 rounded-full border bg-slate-900 transition-all z-10",
                                isActive 
                                    ? "text-indigo-300 border-indigo-500/50" 
                                    : "text-slate-700 border-slate-800"
                            )}>
                                {mode.shortcut}
                            </span>

                            {/* Tooltip Superior (Blender-ish) */}
                            <span className="absolute bottom-12 px-2 py-1 bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-200 rounded-sm opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/btn:translate-y-0 whitespace-nowrap shadow-xl">
                                {mode.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
