import React from 'react';
import { ChevronLeft, Lock, Zap, Sun, Cpu, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemComposition } from '@/core/state/slices/systemCompositionSlice';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

interface BlockStatusRowProps {
    label: string;
    icon: React.ReactNode;
    status: 'complete' | 'warning' | 'error' | 'empty';
    onClick?: () => void;
}

const BlockStatusRow: React.FC<BlockStatusRowProps> = ({ label, icon, status, onClick }) => {
    const isComplete = status === 'complete' || status === 'warning'; // Consideramos warning como "em andamento/parcial"
    
    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 border rounded-sm transition-all cursor-pointer",
                isComplete ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" : "bg-slate-900/40 border-slate-800 text-slate-600 opacity-60"
            )}
        >
            <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center border",
                isComplete ? "bg-emerald-500/20 border-emerald-500/30" : "bg-slate-800 border-slate-700"
            )}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest flex-1">{label}</span>
            {isComplete ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                </div>
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-800" />
            )}
        </div>
    );
};

export const ProposalBlockedScreen: React.FC<{ onGoToProjection: () => void; onNavigate: (block: any) => void }> = ({ 
    onGoToProjection, 
    onNavigate 
}) => {
    const { consumptionBlock, arrangementBlock } = useSystemComposition();
    const modules = useSolarStore(selectModules);
    const hasModules = modules.length > 0;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm z-50 p-6 text-center">
            
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-8 shadow-2xl relative">
                <Lock size={36} className="text-slate-600" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
            </div>
            
            <div className="flex flex-col gap-2 mb-8">
                <h2 className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em]">
                    Proposta Bloqueada
                </h2>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest max-w-[400px] leading-relaxed">
                    É necessário concluir o dimensionamento técnico <br/> antes de gerar o documento comercial.
                </p>
            </div>

            {/* Status dos Blocos */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-[320px] mb-10">
                <BlockStatusRow 
                    label="Consumo" 
                    icon={<Zap size={12} />} 
                    status={consumptionBlock.status} 
                    onClick={() => onNavigate('consumption')}
                />
                <BlockStatusRow 
                    label="Módulos FV" 
                    icon={<Sun size={12} />} 
                    status={hasModules ? 'complete' : 'empty'} 
                    onClick={() => onNavigate('module')}
                />
                <BlockStatusRow 
                    label="Arranjo Físico" 
                    icon={<Cpu size={12} />} 
                    status={arrangementBlock.status} 
                    onClick={() => onNavigate('arrangement')}
                />
                <BlockStatusRow 
                    label="Projeção" 
                    icon={<TrendingUp size={12} />} 
                    status="empty" 
                    onClick={() => onNavigate('projection')}
                />
            </div>

            <button
                onClick={onGoToProjection}
                className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-950/40 border border-indigo-400/20 active:scale-95 group"
            >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Aprovar Dimensionamento
            </button>
        </div>
    );
};
