import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import type { KeyResult } from '../types';

interface CheckInModalProps {
  isOpen: boolean;
  kr: KeyResult | null;
  onClose: () => void;
  onSave: (keyResultId: string, data: { newValue: number, comment?: string }) => Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, kr, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track state exactly as input to avoid forcing to Number too early
  const [newValueStr, setNewValueStr] = useState(''); 
  const [comment, setComment] = useState('');

  // Reset local state when a new KR is opened
  React.useEffect(() => {
     if (isOpen && kr) {
         setNewValueStr(kr.currentValue.toString());
         setComment('');
     }
  }, [isOpen, kr]);

  if (!isOpen || !kr) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(kr.id, {
        newValue: Number(newValueStr),
        comment: comment || undefined
      });
      onClose();
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = Math.min((Number(newValueStr) / kr.targetValue) * 100, 100) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                 <PlusCircle size={16} />
              </div>
              <div>
                  <h3 className="font-bold text-[15px] text-slate-800 dark:text-white tracking-tight leading-tight">Novo Check-in</h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={kr.title}>{kr.title}</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
           >
             <X size={18} />
           </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
           
           <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-[12px]">
               <div className="text-slate-500">Valor Atual:</div>
               <div className="font-bold text-slate-700 dark:text-slate-300 font-mono">{kr.currentValue} {kr.unit}</div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Novo Valor Atingido</label>
             <div className="relative">
                 <input 
                   autoFocus
                   type="number" 
                   required
                   value={newValueStr}
                   onChange={e => setNewValueStr(e.target.value)}
                   className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                     {kr.unit}
                 </div>
             </div>
             <div className="flex items-center justify-between mt-2 px-1">
                 <span className="text-[10px] text-slate-500 font-bold">Progresso Projetado:</span>
                 <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{progress.toFixed(1)}%</span>
             </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Nota / Comentário (Opcional)</label>
             <textarea 
               value={comment}
               onChange={e => setComment(e.target.value)}
               placeholder="Ex: Assinamos os contratos da região Sul..."
               rows={2}
               className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none custom-scrollbar"
             />
           </div>

           <button 
             type="submit" 
             className="w-full py-3 text-[14px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-lg shadow-md shadow-emerald-500/20 transition-all"
             disabled={isSubmitting}
           >
             {isSubmitting ? 'Registrando...' : 'Confirmar Check-in'}
           </button>
        </form>
      </div>
    </div>
  );
}
