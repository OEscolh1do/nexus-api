import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import type { Risk } from '../types';

interface RiskModalProps {
  isOpen: boolean;
  strategyId: string;
  onClose: () => void;
  onSave: (strategyId: string, data: Partial<Risk>) => Promise<void>;
}

export const RiskModal: React.FC<RiskModalProps> = ({ isOpen, strategyId, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    probability: 'MEDIUM' as 'MEDIUM' | 'LOW' | 'HIGH',
    impact: 'MEDIUM' as 'MEDIUM' | 'LOW' | 'HIGH',
    mitigation: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(strategyId, formData);
      setFormData({
         title: '', description: '', probability: 'MEDIUM', impact: 'MEDIUM', mitigation: ''
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                 <ShieldAlert size={16} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">Novo Risco Mapeado</h3>
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
             <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Identificação do Risco</label>
             <input 
               autoFocus
               type="text" 
               required
               value={formData.title}
               onChange={e => setFormData({...formData, title: e.target.value})}
               placeholder="Ex: Mudança na regulamentação de impostos"
               className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
             />
           </div>

           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Descrição Detalhada</label>
             <textarea 
               value={formData.description}
               onChange={e => setFormData({...formData, description: e.target.value})}
               placeholder="Descreva o contexto do risco..."
               rows={2}
               className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none resize-none custom-scrollbar"
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                   <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Probabilidade</label>
                   <select
                     value={formData.probability}
                     onChange={e => setFormData({...formData, probability: e.target.value as 'MEDIUM' | 'LOW' | 'HIGH'})}
                     className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                   >
                      <option value="LOW">Baixa</option>
                      <option value="MEDIUM">Média</option>
                      <option value="HIGH">Alta</option>
                   </select>
               </div>
               <div className="space-y-1.5">
                   <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Impacto</label>
                   <select
                     value={formData.impact}
                     onChange={e => setFormData({...formData, impact: e.target.value as 'MEDIUM' | 'LOW' | 'HIGH'})}
                     className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                   >
                      <option value="LOW">Baixo</option>
                      <option value="MEDIUM">Médio</option>
                      <option value="HIGH">Alto</option>
                   </select>
               </div>
           </div>

           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider block">Plano de Mitigação</label>
             <textarea 
               value={formData.mitigation}
               onChange={e => setFormData({...formData, mitigation: e.target.value})}
               placeholder="Ações para evitar ou reduzir o impacto..."
               rows={2}
               className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none resize-none custom-scrollbar"
             />
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
                className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Risco'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
}
