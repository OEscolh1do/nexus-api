import React from 'react';
import { type ModuleSpecs } from '@/core/schemas/equipment.schemas';
import { PVArrayCard } from './PVArrayCard';
import { LayoutTemplate } from 'lucide-react';

interface PVArrayBuilderProps {
  arrays: { id: string; name: string; moduleBase: ModuleSpecs; quantity: number }[];
  onUpdateQty: (modelId: string, qty: number) => void;
  onRemoveArray: (modelId: string) => void;
  targetWp: number;
}

export const PVArrayBuilder: React.FC<PVArrayBuilderProps> = ({
  arrays,
  onUpdateQty,
  onRemoveArray,
  targetWp
}) => {
  const totalWp = arrays.reduce((sum, arr) => sum + (arr.quantity * arr.moduleBase.power), 0);
  const aderencia = targetWp > 0 ? (totalWp / targetWp) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      
      {/* Cockpit Global (Header Fixo) */}
      <div className="shrink-0 bg-slate-900/40 border-b border-slate-800/60 p-6 flex items-center justify-between z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <LayoutTemplate size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Workspace de Arranjos</h2>
            <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">
              {arrays.length} Sub-sistemas definidos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Potência Global DC</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-black text-amber-500 tabular-nums leading-none">{(totalWp / 1000).toFixed(2)}</span>
              <span className="text-[10px] font-bold text-amber-500/60 uppercase">kWp</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end min-w-[120px]">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Aderência (Alvo: {(targetWp / 1000).toFixed(2)}kWp)</span>
            <div className="w-full bg-slate-950 border border-slate-800/50 h-2 px-0.5 flex items-center relative overflow-hidden mt-1">
              <div 
                className={`h-1 transition-all duration-700 relative z-10 ${aderencia >= 95 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`}
                style={{ width: `${Math.min(aderencia, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
        
        {arrays.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
            <LayoutTemplate size={48} className="text-slate-700 mb-4" />
            <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhum arranjo definido</span>
            <span className="text-xs text-slate-600 mt-2 font-medium">Selecione um módulo na biblioteca lateral para iniciar o dimensionamento.</span>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">
            {arrays.map((arr, i) => (
              <PVArrayCard
                key={arr.id}
                arrayId={arr.id}
                name={`Arranjo ${i + 1}`}
                moduleBase={arr.moduleBase}
                quantity={arr.quantity}
                onUpdateQty={(qty) => onUpdateQty(arr.id, qty)}
                onRemove={() => onRemoveArray(arr.id)}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
