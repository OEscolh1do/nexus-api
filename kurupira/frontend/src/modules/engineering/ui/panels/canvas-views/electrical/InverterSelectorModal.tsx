import React, { useState, useRef } from 'react';
import { X, Search, Cpu, AlertTriangle, CheckCircle2, Info, Upload } from 'lucide-react';
import { useInverterCompatibility, DecoratedInverterCatalogItem } from '../../../../hooks/useInverterCompatibility';
import type { InverterCatalogItem } from '@/core/schemas/inverterSchema';
import { parsePanOnd } from '../../../../utils/pvsystParser';
import { mapOndToInverter } from '../../../../utils/ondAdapter';

interface InverterSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (inverter: InverterCatalogItem) => void;
}

export const InverterSelectorModal: React.FC<InverterSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const catalog = useInverterCompatibility();
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const filteredCatalog = catalog.filter(inv =>
        inv.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUploadOnd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            try {
                const parsed = parsePanOnd(content);
                const mapped = mapOndToInverter(parsed);
                
                // Geramos um ID temporário único para esta instância importada
                const importedInverter: InverterCatalogItem = {
                    ...mapped,
                    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                };

                onSelect(importedInverter);
                onClose();
            } catch (err) {
                console.error("Erro ao processar arquivo .OND:", err);
                alert("Falha ao processar arquivo .OND. Verifique se o formato está correto.");
            }
        };
        reader.readAsText(file);
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'RECOMMENDED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'ACCEPTABLE': return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
            case 'WARNING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            case 'INCOMPATIBLE': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };
    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'RECOMMENDED': return 'Recomendado';
            case 'ACCEPTABLE': return 'Aceitável';
            case 'WARNING': return 'Atenção';
            case 'INCOMPATIBLE': return 'Incompatível';
            default: return 'Não Avaliado';
        }
    };

    const handleSelect = (inv: DecoratedInverterCatalogItem) => {
        if (inv.compatibility?.status === 'INCOMPATIBLE') {
            const confirmed = window.confirm(
                "Aviso do Sistema:\nEste inversor viola os limites operacionais recomendados (Tensão ou Corrente) para os módulos selecionados.\n\nA inserção deste componente em configurações incompatíveis pode invalidar garantias.\nVocê assume explicitamente a responsabilidade por esta seleção?"
            );
            if (!confirmed) return;
        }
        onSelect(inv);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <div className="w-[450px] h-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right-10 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Cpu className="text-emerald-500" size={16} />
                        <div>
                            <h2 className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Seleção de Inversor</h2>
                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Match automático termo-elétrico</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-sm hover:bg-slate-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Search & Actions */}
                <div className="p-4 border-b border-slate-800 bg-slate-950 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                            <input 
                                type="text"
                                placeholder="Buscar fabricante ou modelo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-sm py-1.5 pl-8 pr-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-700"
                            />
                        </div>
                        
                        <input 
                            type="file" 
                            accept=".ond" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleUploadOnd}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 rounded-sm transition-all group"
                            title="Importar arquivo .OND do PVSyst"
                        >
                            <Upload size={12} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Importar</span>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 px-1">
                        <div className="h-[1px] flex-1 bg-slate-800/50" />
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">Catálogo Local</span>
                        <div className="h-[1px] flex-1 bg-slate-800/50" />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
                    {filteredCatalog.map(inv => {
                        const comp = inv.compatibility;
                        const statusClass = getStatusColor(comp?.status);
                        
                        return (
                            <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-sm p-2.5 hover:border-slate-600 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{inv.manufacturer}</p>
                                        <h3 className="text-[11px] font-black text-slate-200 uppercase tracking-tight">{inv.model}</h3>
                                    </div>
                                    <div className={`px-2 py-0.5 border rounded-sm text-[10px] font-bold uppercase tracking-widest ${statusClass}`}>
                                        {getStatusLabel(comp?.status)}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-px bg-slate-800/40 border border-slate-800 rounded-sm overflow-hidden mb-2.5">
                                    <div className="bg-slate-950 p-1.5 flex flex-col items-center justify-center">
                                        <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest">FDI</span>
                                        <span className="text-[10px] font-mono font-black text-slate-300 tabular-nums">
                                            {comp ? `${(comp.fdi * 100).toFixed(0)}%` : '--'}
                                        </span>
                                    </div>
                                    <div className="bg-slate-950 p-1.5 flex flex-col items-center justify-center">
                                        <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest">Potência</span>
                                        <span className="text-[10px] font-mono font-black text-slate-300 tabular-nums">{inv.nominalPowerW / 1000}kW</span>
                                    </div>
                                    <div className="bg-slate-950 p-1.5 flex flex-col items-center justify-center">
                                        <span className="text-[7px] text-slate-600 font-black uppercase tracking-widest">MPPTs</span>
                                        <span className="text-[10px] font-mono font-black text-slate-300 tabular-nums">
                                            {Array.isArray(inv.mppts) ? inv.mppts.length : (inv.mppts || 1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Alerts */}
                                {comp?.alerts.length ? (
                                    <div className="space-y-1 mb-3">
                                        {comp.alerts.map((alert, idx) => (
                                            <div key={idx} className={`flex items-start gap-1.5 text-[10px] p-1.5 rounded-sm ${
                                                alert.severity === 'error' ? 'bg-rose-950/30 text-rose-300' : 'bg-amber-950/30 text-amber-300'
                                            }`}>
                                                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                                <p className="leading-tight">{alert.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : comp?.status === 'RECOMMENDED' && (
                                    <div className="flex items-center gap-1.5 text-[10px] p-1.5 rounded-sm bg-emerald-950/30 text-emerald-300 mb-3">
                                        <CheckCircle2 size={12} />
                                        <p>Match perfeito com o arranjo atual.</p>
                                    </div>
                                )}

                                <button 
                                    onClick={() => handleSelect(inv)}
                                    className="w-full py-1.5 bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-300 rounded-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                                >
                                    Selecionar Equipamento
                                </button>
                            </div>
                        );
                    })}
                    {filteredCatalog.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Info size={32} className="mb-2 opacity-50" />
                            <p className="text-xs">Nenhum equipamento encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
