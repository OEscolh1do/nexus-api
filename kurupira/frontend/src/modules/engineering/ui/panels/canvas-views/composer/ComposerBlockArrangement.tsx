import React from 'react';
import { Map, MousePointer2 } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { useSystemComposition } from '@/core/state/slices/systemCompositionSlice';
import { cn } from '@/lib/utils';
import { usePanelStore } from '@/modules/engineering/store/panelStore';

/**
 * COMPOSER BLOCK ARRANGEMENT (Indigo)
 * 
 * Cockpit para o Arranjo Físico. Gerencia a geometria do telhado e a 
 * consistência entre módulos planejados e módulos instalados.
 */
export const ComposerBlockArrangement: React.FC = () => {
    const focusedBlock = useUIStore(s => s.activeFocusedBlock);
    const setFocusedBlock = useUIStore(s => s.setFocusedBlock);
    const setActiveTool = useUIStore(s => s.setActiveTool);
    const restoreMap = usePanelStore(s => s.restoreMap);
    
    // Obtemos as métricas derivadas do hook global de composição
    const { arrangementBlock } = useSystemComposition();
    const isFocused = focusedBlock === 'arrangement';

    // Handler de Foco
    const handleFocus = () => {
        setFocusedBlock('arrangement');
        restoreMap();
        
        // Se estiver vazio, já sugere a ferramenta de desenho
        if (arrangementBlock.status === 'empty') {
            setActiveTool('POLYGON');
        }
    };

    return (
        <div 
            onClick={handleFocus}
            className={cn(
                "relative rounded-none border-x border-b flex flex-col overflow-visible transition-all duration-300 z-35 cursor-pointer -mt-px",
                isFocused 
                    ? "border-indigo-500 bg-indigo-950/80 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50" 
                    : "border-indigo-600/40 bg-indigo-950/70 hover:border-indigo-500/50 shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] backdrop-blur-sm"
            )}
        >
            {/* Header */}
            <div className="px-4 py-2.5 flex items-center gap-3 border-b border-indigo-500/10 bg-gradient-to-r from-indigo-900/15 to-transparent">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                    <Map size={11} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider leading-none">Arranjo Físico</span>
                </div>
            </div>

            {/* Content: Placeholder vs Metrics */}
            {arrangementBlock.status === 'empty' ? (
                <div className="px-5 py-6 flex flex-col items-center text-center gap-2 group">
                    <div className="relative">
                        <Map size={14} className="text-indigo-900/40" />
                        <MousePointer2 size={8} className="absolute -bottom-1 -right-1 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[8px] text-indigo-800/60 font-bold uppercase tracking-widest leading-relaxed max-w-[150px]">
                        Nenhuma área definida
                    </p>
                    <button 
                        className="mt-1 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-[2px] text-[7px] text-indigo-400 font-black uppercase tracking-tighter hover:bg-indigo-500/20 transition-colors"
                    >
                        Abrir Mapa para Desenhar
                    </button>
                </div>
            ) : (
                <div className="px-4 py-3 flex items-center justify-between bg-black/20 backdrop-blur-md">
                    {/* Chips de Métricas (Iterativo via BlockStatus) */}
                    <div className="flex flex-wrap gap-3">
                        {arrangementBlock.chips.map((chip, idx) => (
                            <div key={idx} className="flex flex-col">
                                <span className={cn(
                                    "text-[7px] font-bold uppercase tracking-[0.15em] mb-1",
                                    chip.severity === 'ok' ? "text-indigo-500/80" : "text-amber-500/80"
                                )}>
                                    {chip.label}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn(
                                        "text-xs font-black font-mono tabular-nums tracking-tighter leading-none",
                                        chip.severity === 'ok' ? "text-indigo-300" : "text-amber-400"
                                    )}>
                                        {chip.value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info de Status Global do Bloco */}
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                        arrangementBlock.status === 'complete' ? "text-emerald-500 bg-emerald-500" : "text-amber-500 bg-amber-500"
                    )} />
                </div>
            )}
        </div>
    );
};
