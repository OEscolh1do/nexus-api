import React from 'react';
import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { AlertCircle, Zap, Box, ShieldCheck, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PANReviewModalProps {
  module: ModuleCatalogItem;
  duplicate?: ModuleCatalogItem;
  onConfirm: (asCopy: boolean) => void;
  onCancel: () => void;
  onUseExisting: () => void;
}

export const PANReviewModal: React.FC<PANReviewModalProps> = ({
  module,
  duplicate,
  onConfirm,
  onCancel,
  onUseExisting
}) => {
  // Verificação de divergência de specs se houver duplicata
  const hasDiff = duplicate && (
    duplicate.electrical.pmax !== module.electrical.pmax ||
    duplicate.electrical.voc !== module.electrical.voc ||
    duplicate.electrical.isc !== module.electrical.isc
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="absolute inset-0" onClick={onCancel} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-sm flex flex-col max-h-[90vh]">
        
        {/* Banner de Conflito (Se houver duplicata) */}
        {duplicate && (
          <div className={cn(
            "p-3 flex items-center justify-between border-b",
            hasDiff ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
          )}>
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className={hasDiff ? "text-red-500" : "text-emerald-500"} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                hasDiff ? "text-red-400" : "text-emerald-400"
              )}>
                {hasDiff ? 'DIVERGÊNCIA DE ESPECIFICAÇÃO DETECTADA' : 'HARDWARE IDÊNTICO JÁ EXISTENTE NO CATÁLOGO'}
              </span>
            </div>
            <button 
              onClick={onUseExisting}
              className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-slate-950 border border-slate-800 text-slate-100 hover:border-emerald-500/50 transition-colors"
            >
              Usar Existente
            </button>
          </div>
        )}

        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Revisão de Equipamento</h2>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">FONTE: ARQUIVO .PAN IMPORTADO</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          <div className="mb-8 pb-6 border-b border-slate-800/50">
             <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">{module.manufacturer}</span>
             <h3 className="text-2xl font-mono font-black text-slate-100 mt-1 uppercase tracking-tighter">
                {module.model} <span className="text-amber-500">{module.electrical.pmax}W</span>
             </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Especificações Elétricas (STC)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <SpecItem label="Pmax" value={`${module.electrical.pmax} W`} diffValue={duplicate?.electrical.pmax !== module.electrical.pmax ? `${duplicate?.electrical.pmax}W` : undefined} />
                <SpecItem label="Voc" value={`${module.electrical.voc} V`} diffValue={duplicate?.electrical.voc !== module.electrical.voc ? `${duplicate?.electrical.voc}V` : undefined} />
                <SpecItem label="Vmp" value={`${module.electrical.vmp} V`} />
                <SpecItem label="Isc" value={`${module.electrical.isc} A`} diffValue={duplicate?.electrical.isc !== module.electrical.isc ? `${duplicate?.electrical.isc}A` : undefined} />
                <SpecItem label="Imp" value={`${module.electrical.imp} A`} />
                <SpecItem label="Eficiência" value={`${((module.electrical.efficiency ?? 0) * 100).toFixed(2)} %`} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Box size={14} className="text-sky-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Físico e Térmico</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <SpecItem label="Largura" value={`${module.physical.widthMm} mm`} />
                <SpecItem label="Altura" value={`${module.physical.heightMm} mm`} />
                <SpecItem label="Peso" value={`${module.physical.weightKg} kg`} />
                <SpecItem label="Células" value={`${module.physical.cells}`} />
                <SpecItem label="Bifacial" value={module.electrical.bifacial ? 'SIM' : 'NÃO'} />
                <SpecItem label="Coef. Voc" value={`${module.electrical.tempCoeffVoc} %/°C`} />
              </div>
            </div>

          </div>

          <div className="mt-10 p-4 bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
             <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
             <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-medium">
                {duplicate 
                  ? 'Este modelo já consta no sistema. Se decidir adicionar uma cópia, ela será salva com um sufixo para evitar confusão no inventário do projeto.'
                  : 'Os dados acima foram inferidos diretamente do arquivo binário importado. Certifique-se de que os valores de Voc e Isc correspondem ao datasheet oficial.'
                }
             </p>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
          >
            Descartar Importação
          </button>
          <button 
            onClick={() => onConfirm(!!duplicate)}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            {duplicate ? 'Ignorar e Criar Cópia' : 'Confirmar e Adicionar ao Catálogo'}
          </button>
        </div>

      </div>

    </div>
  );
};

const SpecItem: React.FC<{ label: string; value: string; diffValue?: string }> = ({ label, value, diffValue }) => (
  <div className="flex flex-col border-l border-slate-800 pl-3">
    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">{label}</span>
    <div className="flex flex-col">
       <span className={cn("text-xs font-mono font-bold", diffValue ? "text-amber-400" : "text-slate-100")}>{value}</span>
       {diffValue && (
         <span className="text-[7px] text-slate-600 font-mono mt-0.5 strike-through line-through opacity-50">SISTEMA: {diffValue}</span>
       )}
    </div>
  </div>
);

