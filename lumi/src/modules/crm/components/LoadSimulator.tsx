import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Plug, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { DenseButton } from '@/components/ui/dense-form';
import { cn } from '@/lib/utils';
import { useSolarStore } from '@/core/state/solarStore';
import { TYPICAL_LOADS } from '../constants/loadCatalog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LoadSimulatorProps {
    className?: string;
}

export const LoadSimulator: React.FC<LoadSimulatorProps> = ({ className }) => {
    // Global State
    const items = useSolarStore(state => state.simulatedItems);
    const addLoadItem = useSolarStore(state => state.addLoadItem);
    const updateLoadItem = useSolarStore(state => state.updateLoadItem);
    const removeLoadItem = useSolarStore(state => state.removeLoadItem);
    const getSimulatedTotal = useSolarStore(state => state.getSimulatedTotal);
    const clientData = useSolarStore(state => state.clientData);

    const activeInvoice = clientData.invoices?.[0]; // Assuming first invoice for technical limits
    const breakerAmps = activeInvoice?.breakerCurrent || 0;
    const voltage = parseFloat(activeInvoice?.voltage?.replace(/\D/g, '') || '220'); // Simplistic parsing
    const currentVoltage = voltage > 0 ? voltage : 220; // Fallback
    
    // UI State
    const [isAdding, setIsAdding] = useState(false);
    const [selectedPresetId, setSelectedPresetId] = useState('');
    
    const [draft, setDraft] = useState({
        name: '',
        power: 0,
        hoursPerDay: 0,
        daysPerMonth: 30,
        qty: 1,
        dutyCycle: 1,
        suggestion: '',
        solarOpportunity: false
    });

    const totalKwh = getSimulatedTotal();
    
    // Engineering Checks
    const totalWatts = items.reduce((acc, i) => acc + (i.power * i.qty), 0);
    const estimatedAmps = totalWatts / currentVoltage;
    const isOverload = breakerAmps > 0 && estimatedAmps > breakerAmps;

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pid = e.target.value;
        setSelectedPresetId(pid);
        
        const preset = TYPICAL_LOADS.find(p => p.id === pid);
        if (preset) {
            setDraft({
                name: preset.name,
                power: preset.power,
                hoursPerDay: preset.defaultHours,
                daysPerMonth: preset.defaultDays || 30,
                qty: 1,
                dutyCycle: preset.dutyCycle,
                suggestion: preset.suggestion || '',
                solarOpportunity: preset.solarOpportunity || false
            });
            setIsAdding(true);
        }
    };

    const handleAddItem = () => {
        if (!draft.name || draft.power <= 0) return;
        addLoadItem({ ...draft, id: Math.random().toString(36).substr(2, 9) });
        setDraft({ name: '', power: 0, hoursPerDay: 0, daysPerMonth: 30, qty: 1, dutyCycle: 1, suggestion: '', solarOpportunity: false });
        setSelectedPresetId('');
        setIsAdding(false);
    };

    return (
        <div className={cn("flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full", className)}>
            {/* Header */}
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-violet-100 rounded text-violet-600">
                         <Calculator size={14} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase">Simulador de Carga</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Adicionar equipamentos futuros</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Acréscimo</span>
                    <span className="text-sm font-mono font-bold text-violet-600">
                        +{totalKwh.toFixed(0)} <span className="text-[10px] text-slate-400">kWh/mês</span>
                    </span>
                </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-y-auto min-h-0 p-0 relative">
                {items.length === 0 && !isAdding && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 p-4">
                        <Plug size={24} className="mb-2 opacity-50"/>
                        <p className="text-xs text-center">Nenhuma carga adicional</p>
                        <button onClick={() => setIsAdding(true)} className="mt-2 text-xs text-violet-500 hover:text-violet-700 font-bold underline">
                            Simular Agora
                        </button>
                    </div>
                )}
                
                <table className="w-full text-left border-collapse">
                    {items.length > 0 && (
                        <thead className="bg-slate-50/50 text-[9px] text-slate-400 uppercase font-bold sticky top-0 z-10 transition-shadow shadow-sm">
                            <tr>
                                <th className="px-2 py-1 font-medium pl-3">Item</th>
                                <th className="px-1 py-1 font-medium text-center w-14">Pot(W)</th>
                                <th className="px-1 py-1 font-medium text-center w-10">Uso(h)</th>
                                <th className="px-1 py-1 font-medium text-center w-10">Freq(d)</th>
                                <th className="px-1 py-1 font-medium text-center w-10">Qtd</th>
                                <th className="px-1 py-1 font-medium text-center">Total</th>
                                <th className="px-1 py-1 w-6"></th>
                            </tr>
                        </thead>
                    )}
                    <tbody className="text-xs text-slate-600">
                        {items.map(item => {
                             const days = item.daysPerMonth ?? 30;
                             const itemKwh = (item.power * item.dutyCycle * item.hoursPerDay * days * item.qty) / 1000;
                             return (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors group">
                                    <td className="px-2 py-1 align-middle pl-3">
                                        <div className="flex flex-col justify-center h-full">
                                             <div className="flex items-center gap-1">
                                                 <span className="truncate max-w-[100px] font-medium text-[11px]" title={item.name}>{item.name}</span>
                                                 {item.solarOpportunity && (
                                                     <TooltipProvider>
                                                         <Tooltip>
                                                             <TooltipTrigger>
                                                                 <Lightbulb size={10} className="text-yellow-500 fill-yellow-500 shrink-0 cursor-help" />
                                                             </TooltipTrigger>
                                                             <TooltipContent className="text-[10px] bg-slate-800 text-white border-none">
                                                                 {item.suggestion}
                                                             </TooltipContent>
                                                         </Tooltip>
                                                     </TooltipProvider>
                                                 )}
                                             </div>
                                        </div>
                                    </td>
                                    
                                    {/* Potência Input */}
                                    <td className="p-1 align-middle">
                                        <input 
                                            type="number"
                                            className="w-full h-6 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-violet-200 rounded text-center text-[11px] font-mono outline-none transition-all px-0"
                                            value={item.power}
                                            onChange={e => updateLoadItem(item.id, { power: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>

                                    {/* Horas Input */}
                                    <td className="p-1 align-middle">
                                        <input 
                                            type="number"
                                            className="w-full h-6 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-violet-200 rounded text-center text-[11px] font-mono outline-none transition-all px-0"
                                            value={item.hoursPerDay}
                                            onChange={e => updateLoadItem(item.id, { hoursPerDay: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>

                                    {/* Dias Input */}
                                    <td className="p-1 align-middle">
                                        <input 
                                            type="number"
                                            max={31}
                                            className="w-full h-6 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-violet-200 rounded text-center text-[11px] font-mono outline-none transition-all px-0 text-slate-500"
                                            value={days}
                                            onChange={e => updateLoadItem(item.id, { daysPerMonth: Math.min(31, parseFloat(e.target.value) || 0) })}
                                        />
                                    </td>

                                    {/* Qtd Input */}
                                    <td className="p-1 align-middle">
                                        <input 
                                            type="number"
                                            className="w-full h-6 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-violet-200 rounded text-center text-[11px] font-mono outline-none transition-all px-0 font-bold text-slate-700"
                                            value={item.qty}
                                            onChange={e => updateLoadItem(item.id, { qty: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>

                                    {/* Total Display */}
                                    <td className="px-1 py-1 text-center font-mono font-bold text-violet-600 text-[11px] align-middle">
                                        {itemKwh.toFixed(0)}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-1 py-1 text-right align-middle pr-2">
                                        <button onClick={() => removeLoadItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                            <Trash2 size={12}/>
                                        </button>
                                    </td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Input Footer */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 shrink-0">
                {isAdding ? (
                    <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        {/* Preset Selector */}
                        <div className="relative">
                            <select 
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-violet-400 appearance-none font-medium text-slate-700"
                                value={selectedPresetId}
                                onChange={handlePresetChange}
                            >
                                <option value="" disabled>Selecione um aparelho típico...</option>
                                {TYPICAL_LOADS.map(load => (
                                    <option key={load.id} value={load.id}>{load.name}</option>
                                ))}
                            </select>
                            <Zap size={10} className="absolute right-2 top-2 text-slate-400 pointer-events-none"/>
                        </div>

                        {/* Name Input */}
                        <input 
                            placeholder="Nome do Equipamento" 
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-violet-400 w-full"
                            value={draft.name}
                            onChange={e => setDraft({...draft, name: e.target.value})}
                        />
                        
                        {/* Inline Grid for Values */}
                        <div className="grid grid-cols-4 gap-2">
                             <div className="relative col-span-1">
                                <input 
                                    type="number"
                                    placeholder="W" 
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-violet-400 w-full pl-5 font-mono"
                                    value={draft.power || ''}
                                    onChange={e => setDraft({...draft, power: parseFloat(e.target.value)})}
                                />
                                <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">W</span>
                             </div>
                             <div className="relative col-span-1">
                                <input 
                                    type="number"
                                    placeholder="h" 
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-violet-400 w-full pl-4 font-mono"
                                    value={draft.hoursPerDay || ''}
                                    onChange={e => setDraft({...draft, hoursPerDay: parseFloat(e.target.value)})}
                                />
                                <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">h</span>
                             </div>
                             <div className="relative col-span-1">
                                <input 
                                    type="number"
                                    placeholder="d" 
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-violet-400 w-full pl-4 font-mono text-slate-500"
                                    value={draft.daysPerMonth}
                                    onChange={e => setDraft({...draft, daysPerMonth: parseFloat(e.target.value)})}
                                />
                                <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">d</span>
                             </div>
                             <div className="relative col-span-1">
                                <input 
                                    type="number"
                                    placeholder="Qtd" 
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-violet-400 w-full pl-5 font-mono"
                                    value={draft.qty}
                                    onChange={e => setDraft({...draft, qty: parseFloat(e.target.value)})}
                                />
                                <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">x</span>
                             </div>
                        </div>

                        {/* Solar Tip Preview */}
                        {draft.solarOpportunity && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 text-[10px]">
                                <Lightbulb size={10} className="fill-yellow-500 text-yellow-500"/>
                                <span className="font-bold">Dica Solar:</span> {draft.suggestion || "Mova o consumo para 10h-14h."}
                            </div>
                        )}

                        <div className="flex gap-2 mt-1">
                            <DenseButton 
                                onClick={() => setIsAdding(false)}
                                size="sm" 
                                variant="ghost" 
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-600"
                            >
                                Cancelar
                            </DenseButton>
                            <DenseButton 
                                onClick={handleAddItem}
                                size="sm" 
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                            >
                                Adicionar
                            </DenseButton>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {/* Overload Alert */}
                        {isOverload && (
                            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 animate-in slide-in-from-bottom-2">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0 animate-pulse"/>
                                <div>
                                    <p className="text-[10px] font-bold uppercase leading-none mb-1">Alerta de Sobrecarga</p>
                                    <p className="text-[10px] leading-tight">
                                        Corrente estimada ({estimatedAmps.toFixed(1)}A) excede o disjuntor ({breakerAmps}A). Considere aumento de carga.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => setIsAdding(true)}
                            className="w-full flex items-center justify-center gap-2 py-1.5 border border-dashed border-slate-300 rounded text-xs font-bold text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all hover:shadow-sm"
                        >
                            <Plus size={12}/> Adicionar Carga
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
