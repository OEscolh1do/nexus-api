
import React, { useState, useEffect } from 'react';
import { ProposalData } from '../types';
import { recalculateProposalWithServicePrice } from '../services/solarEngine';
import {
   Wrench,
   Settings,
   DollarSign,
   ChevronRight,
   ChevronLeft,
   PieChart,
   ShieldCheck,
   Info,
   Box,
   Cpu,
   Edit2,
   Save,
   X
} from 'lucide-react';

interface Props {
   data: ProposalData;
   onBack: () => void;
   onConfirm: (updatedData: ProposalData) => void;
}

export const ServiceCompositionPhase: React.FC<Props> = ({ data, onBack, onConfirm }) => {
   const [localData, setLocalData] = useState<ProposalData>(data);
   const [isEditing, setIsEditing] = useState(false);
   const [manualPrice, setManualPrice] = useState(data.servicePrice);

   useEffect(() => {
      // If external data changes drastically (e.g. reset), sync, but usually we respect local edits
      // For now, only init
   }, []);

   const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   const handleConfirm = () => {
      onConfirm(localData);
   };

   const handleSavePrice = () => {
      const updated = recalculateProposalWithServicePrice(localData, manualPrice);
      setLocalData(updated);
      setIsEditing(false);
   };

   const handleCancelEdit = () => {
      setManualPrice(localData.servicePrice);
      setIsEditing(false);
   };

   return (
      <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 pb-20">

         <div className="bg-neonorte-deepPurple rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 neonorte-overlay">
            <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] pointer-events-none">
               <Settings size={300} />
            </div>

            <div className="relative z-10 space-y-8">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="bg-gradient-to-br from-neonorte-purple to-neonorte-lightPurple p-3 rounded-2xl shadow-lg shadow-neonorte-purple/20">
                        <DollarSign size={28} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1 font-display">Orçamento Resumido</h2>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em]">Pilar de Investimento & Engenharia</p>
                     </div>
                  </div>
                  <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                     <PieChart size={20} className="text-neonorte-green" />
                     <div className="text-left font-mono">
                        <p className="text-[10px] font-black text-white/30 uppercase">Investimento Total</p>
                        <p className="text-sm font-bold text-white leading-none">{formatMoney(localData.totalInvestment)}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20">
                  <table className="w-full text-left text-sm">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                           <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest font-display">Descrição do Investimento</th>
                           <th className="px-8 py-5 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right font-display">Valor Líquido</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50 transition-colors group">
                           <td className="px-8 py-8">
                              <div className="flex items-start gap-4">
                                 <div className="p-3 bg-neonorte-purple/10 text-neonorte-purple rounded-2xl group-hover:scale-110 transition-transform">
                                    <Cpu size={24} />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-neonorte-darkPurple text-lg uppercase tracking-tight font-display">Kit Gerador Fotovoltaico</h4>
                                    <p className="text-slate-400 text-xs font-medium max-w-md mt-1">Módulos, Inversores, Estruturas de fixação e cabeamento CC original.</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-8 text-right align-middle font-mono">
                              <p className="text-2xl font-black text-neonorte-darkPurple">{formatMoney(localData.kitPrice)}</p>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Equipamentos</span>
                           </td>
                        </tr>

                        <tr className="hover:bg-slate-50 transition-colors group">
                           <td className="px-8 py-8">
                              <div className="flex items-start gap-4">
                                 <div className="p-3 bg-neonorte-green/10 text-neonorte-green rounded-2xl group-hover:scale-110 transition-transform">
                                    <Wrench size={24} />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-neonorte-darkPurple text-lg uppercase tracking-tight font-display">Serviços & Engenharia</h4>
                                    <p className="text-slate-400 text-xs font-medium max-w-md mt-1">Projeto, Mão de obra especializada, Homologação e Instalação Padrão NBR-5410.</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-8 text-right align-middle font-mono relative">
                              {isEditing ? (
                                 <div className="flex items-center justify-end gap-2">
                                    <input
                                       autoFocus
                                       type="number"
                                       className="w-32 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-right text-lg font-black text-neonorte-darkPurple outline-none focus:ring-2 focus:ring-neonorte-green"
                                       value={manualPrice}
                                       onChange={(e) => setManualPrice(Number(e.target.value))}
                                    />
                                    <button onClick={handleSavePrice} className="p-2 bg-neonorte-green text-white rounded-lg hover:bg-neonorte-darkGreen transition-colors"><Save size={16} /></button>
                                    <button onClick={handleCancelEdit} className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"><X size={16} /></button>
                                 </div>
                              ) : (
                                 <div className="group/edit relative pr-8">
                                    <p className="text-2xl font-black text-neonorte-darkPurple">{formatMoney(localData.servicePrice)}</p>
                                    <span className="text-[9px] font-black text-neonorte-green uppercase tracking-widest bg-neonorte-green/10 px-2 py-1 rounded-md border border-neonorte-green/20">Implementação</span>
                                    <button
                                       onClick={() => { setIsEditing(true); setManualPrice(localData.servicePrice); }}
                                       className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover/edit:opacity-100 transition-opacity p-2 text-slate-300 hover:text-neonorte-purple"
                                       title="Editar valor manualmente"
                                    >
                                       <Edit2 size={16} />
                                    </button>
                                 </div>
                              )}
                           </td>
                        </tr>
                     </tbody>
                     <tfoot>
                        <tr className="bg-neonorte-purple text-white border-t-4 border-neonorte-green">
                           <td className="px-8 py-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-8 bg-neonorte-green rounded-full"></div>
                                 <span className="font-black uppercase tracking-[0.2em] text-sm font-display">Investimento Total Projeto</span>
                              </div>
                           </td>
                           <td className="px-8 py-8 text-right font-mono">
                              <p className="text-3xl font-black text-white leading-none">{formatMoney(localData.totalInvestment)}</p>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2 italic">Valor de referência para pagamento à vista</p>
                           </td>
                        </tr>
                     </tfoot>
                  </table>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-start gap-4">
                     <div className="p-3 bg-neonorte-green/20 text-neonorte-green rounded-2xl">
                        <ShieldCheck size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-white mb-1 uppercase text-xs font-display">Garantia NeoNorte</h4>
                        <p className="text-white/50 text-xs leading-relaxed">
                           A NeoNorte garante a performance do projeto e a qualidade da instalação. O suporte técnico cobre toda a fase de startup e monitoramento inicial.
                        </p>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-start gap-4">
                     <div className="p-3 bg-neonorte-lightPurple/20 text-neonorte-lightPurple rounded-2xl">
                        <Info size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-white mb-1 uppercase text-xs font-display">Condições Comerciais</h4>
                        <p className="text-white/50 text-xs leading-relaxed">
                           Os equipamentos são faturados diretamente pelo distribuidor. Os serviços de engenharia são contratados via NeoNorte Engenharia.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-12 border-t border-white/10">
                  <button type="button" onClick={onBack} className="group flex items-center gap-4 text-white/50 hover:text-white transition-all px-10 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest">
                     <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                  </button>

                  <button
                     onClick={handleConfirm}
                     className="group relative overflow-hidden bg-neonorte-green hover:bg-neonorte-lightGreen text-neonorte-deepPurple font-black py-6 px-16 rounded-[2rem] shadow-xl shadow-neonorte-green/20 transition-all active:scale-95 flex items-center gap-6"
                  >
                     <span className="tracking-[0.2em] uppercase text-lg font-display">Gerar Proposta Profissional</span>
                     <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};
