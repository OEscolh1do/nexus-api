import React, { useState } from 'react';
import { Target, X } from 'lucide-react';
import type { KeyResult } from '../types';

interface KeyResultModalProps {
  isOpen: boolean;
  strategyId: string;
  onClose: () => void;
  onSave: (strategyId: string, data: Partial<KeyResult>) => Promise<void>;
}

export const KeyResultModal: React.FC<KeyResultModalProps> = ({ isOpen, strategyId, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    targetValue: '',
    unit: '%',
    perspective: 'FINANCIAL'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(strategyId, {
        ...formData,
        targetValue: Number(formData.targetValue)
      });
      onClose();
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                 <Target size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">Novo Key Result</h3>
           </div>
           <button 
             onClick={onClose}
             className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors"
           >
             <X size={18} />
           </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Título do Key Result</label>
             <input 
               autoFocus
               type="text" 
               required
               value={formData.title}
               onChange={e => setFormData({...formData, title: e.target.value})}
               placeholder="Ex: Aumentar a receita em 20%"
               className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Meta (Target)</label>
                 <input 
                   type="number" 
                   required
                   value={formData.targetValue}
                   onChange={e => setFormData({...formData, targetValue: e.target.value})}
                   placeholder="Ex: 50000"
                   className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Unidade</label>
                 <input 
                   type="text" 
                   value={formData.unit}
                   onChange={e => setFormData({...formData, unit: e.target.value})}
                   placeholder="Ex: %, R$, unidades"
                   className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                 />
               </div>
           </div>

           <div className="space-y-1.5">
               <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Perspectiva Estratégica</label>
               <select
                 value={formData.perspective}
                 onChange={e => setFormData({...formData, perspective: e.target.value})}
                 className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
               >
                  <option value="FINANCIAL">Financeira</option>
                  <option value="CUSTOMER">Clientes / Mercado</option>
                  <option value="PROCESS">Processos Internos</option>
                  <option value="LEARNING">Aprendizado & Crescimento</option>
               </select>
           </div>

           <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-lg shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Key Result'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
