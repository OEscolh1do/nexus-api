import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { 
  FileText, Calendar, Shield, CreditCard, 
  Eye, EyeOff, Download, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProposalEditPanel: React.FC = () => {
    const proposalData      = useSolarStore(s => s.proposalData);
    const updateProposalData = useSolarStore(s => s.updateProposalData);
    
    // Simulação de salvar (discreto)
    const [isSaving, setIsSaving] = React.useState(false);

    const handleUpdate = (updates: Partial<typeof proposalData>) => {
        updateProposalData(updates);
        // Simula autosave ao disparar evento de persistência
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 800);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Configurações da Proposta
                    </span>
                </div>
                {isSaving && (
                    <div className="flex items-center gap-1.5 animate-pulse">
                        <Loader2 size={10} className="text-emerald-500 animate-spin" />
                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Salvando...</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                
                {/* Seção 1: Identificação Comercial */}
                <div className="flex flex-col gap-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                         Descrição / Apresentação
                    </label>
                    <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-[11px] text-slate-300 font-medium outline-none focus:border-indigo-500/50 transition-all min-h-[120px] resize-none"
                        placeholder="Descreva o padrão de instalação, diferenciais do integrador ou observações para o cliente..."
                        value={proposalData.customText}
                        onChange={(e) => updateProposalData({ customText: e.target.value })}
                        onBlur={() => handleUpdate({})}
                    />
                    <div className="flex justify-end">
                        <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">
                            {proposalData.customText.length} / 500
                        </span>
                    </div>
                </div>

                {/* Seção 2: Prazos e Garantias */}
                <div className="flex flex-col gap-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                         Condições Comerciais
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={10} /> Validade
                            </span>
                            <div className="relative">
                                <input 
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500/50"
                                    value={proposalData.validityDays}
                                    onChange={(e) => handleUpdate({ validityDays: Number(e.target.value) })}
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600 uppercase">dias</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Shield size={10} /> Garantia
                            </span>
                            <div className="relative">
                                <input 
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500/50"
                                    value={proposalData.warrantyYears}
                                    onChange={(e) => handleUpdate({ warrantyYears: Number(e.target.value) })}
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600 uppercase">anos</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <CreditCard size={10} /> Formas de Pagamento
                        </span>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-[11px] text-slate-300 font-medium outline-none focus:border-indigo-500/50 transition-all min-h-[60px] resize-none"
                            placeholder="Ex: 50% na aprovação, 50% na entrega..."
                            value={proposalData.paymentTerms}
                            onChange={(e) => updateProposalData({ paymentTerms: e.target.value })}
                            onBlur={() => handleUpdate({})}
                        />
                    </div>
                </div>

                {/* Seção 3: Opções do PDF */}
                <div className="flex flex-col gap-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                         Visibilidade no PDF
                    </label>
                    
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => handleUpdate({ showPricing: !proposalData.showPricing })}
                            className={cn(
                                "flex items-center justify-between p-3 border rounded-sm transition-all group",
                                proposalData.showPricing 
                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                                    : "bg-slate-900/40 border-slate-800 text-slate-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {proposalData.showPricing ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">Exibir Preço Total</span>
                            </div>
                            <div className={cn(
                                "w-6 h-3 rounded-full relative transition-all duration-300",
                                proposalData.showPricing ? "bg-indigo-500" : "bg-slate-800"
                            )}>
                                <div className={cn(
                                    "absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all duration-300",
                                    proposalData.showPricing ? "right-0.5" : "left-0.5"
                                )} />
                            </div>
                        </button>

                        <button 
                            onClick={() => handleUpdate({ showMap: !proposalData.showMap })}
                            className={cn(
                                "flex items-center justify-between p-3 border rounded-sm transition-all group",
                                proposalData.showMap 
                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                                    : "bg-slate-900/40 border-slate-800 text-slate-600"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {proposalData.showMap ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">Exibir Mapa de Localização</span>
                            </div>
                            <div className={cn(
                                "w-6 h-3 rounded-full relative transition-all duration-300",
                                proposalData.showMap ? "bg-indigo-500" : "bg-slate-800"
                            )}>
                                <div className={cn(
                                    "absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all duration-300",
                                    proposalData.showMap ? "right-0.5" : "left-0.5"
                                )} />
                            </div>
                        </button>
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-slate-800 bg-[#0a0f1a] flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Exportação v2.1</span>
                    <span className="text-[8px] text-slate-600 font-bold">PDF / A4 / 300DPI</span>
                </div>
                <button className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-indigo-950/40 border border-indigo-400/20 group">
                    <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exportar PDF Projeto</span>
                </button>
            </div>
        </div>
    );
};
