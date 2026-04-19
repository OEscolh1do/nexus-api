import React from 'react';
import { Image, Box, Layers, Zap } from 'lucide-react';
import { useUIStore, type CanvasViewMode } from '@/core/state/uiStore';
import { cn } from '@/lib/utils';

/**
 * CANVAS VIEW MODES (HUD)
 * 
 * Seletor de vistas estilo Blender para alternar entre as camadas de 
 * visualização técnica do Kurupira.
 */
export const CanvasViewModes: React.FC = () => {
    const activeMode = useUIStore(s => s.canvasViewMode);
    const setViewMode = useUIStore(s => s.setCanvasViewMode);

    const MODES: { id: CanvasViewMode; label: string; icon: any; shortcut: string }[] = [
        { id: 'CONTEXT', label: 'Contexto', icon: Image, shortcut: '1' },
        { id: 'BLUEPRINT', label: 'Blueprint', icon: Box, shortcut: '2' },
        { id: 'DIAGRAM', label: 'Diagrama', icon: Layers, shortcut: '3' },
        { id: 'UNIFILAR', label: 'Unifilar', icon: Zap, shortcut: '4' },
    ];

    return (
        <div className="absolute top-4 right-4 flex items-center bg-slate-950/90 backdrop-blur-md border border-slate-800 p-0.5 rounded-sm shadow-2xl z-[1100] group">
            {MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;

                return (
                    <button
                        key={mode.id}
                        onClick={() => setViewMode(mode.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-[1px] transition-all duration-200 relative",
                            isActive 
                                ? "bg-indigo-600/90 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                        )}
                        title={`${mode.label} (${mode.shortcut})`}
                    >
                        <Icon size={12} strokeWidth={isActive ? 3 : 2} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest font-mono hidden xl:inline",
                            isActive ? "opacity-100" : "opacity-60"
                        )}>
                            {mode.label}
                        </span>

                        {/* Indicador de Atalho (Opcional, discreto) */}
                        <span className="absolute -top-1 -right-0.5 text-[6px] text-slate-700 font-bold opacity-0 group-hover:opacity-100">
                            {mode.shortcut}
                        </span>
                    </button>
                );
            })}

            {/* Separador Visual para o Inspector (Se necessário) */}
            <div className="w-px h-4 bg-slate-800 mx-1" />
            
            <div className="px-2 hidden lg:flex items-center">
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">View Engine</span>
            </div>
        </div>
    );
};
