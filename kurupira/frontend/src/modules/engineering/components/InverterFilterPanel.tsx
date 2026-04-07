import React from 'react';
import { RotateCcw, Filter, X } from 'lucide-react';
import { DenseInput, DenseSelect, DenseFormGrid } from '@/components/ui/dense-form';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface InverterFilters {
    search: string;
    powerCategory: 'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' | 'UTILITY';
    phase: string;
}

interface InverterFilterPanelProps {
    activeFilters: InverterFilters;
    onFilterChange: (filters: InverterFilters) => void;
    onClear: () => void;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const INITIAL_FILTERS: InverterFilters = {
    search: '',
    powerCategory: 'ALL',
    phase: ''
};

export const InverterFilterPanel: React.FC<InverterFilterPanelProps> = ({
    activeFilters,
    onFilterChange,
    onClear,
    className,
    isOpen,
    onClose
}) => {
    const handleChange = (key: keyof InverterFilters, value: string) => {
        onFilterChange({ ...activeFilters, [key]: value });
    };

    const activeCount = 
        (activeFilters.search !== '' ? 1 : 0) + 
        (activeFilters.powerCategory !== 'ALL' ? 1 : 0) + 
        (activeFilters.phase !== '' ? 1 : 0);

    if (!isOpen) return null;

    return (
        <div className={cn("border-b border-slate-200 bg-slate-50/80 p-3 space-y-3 animate-in slide-in-from-top-2 duration-200", className)}>
            
            {/* Header / Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filtros Avançados</h4>
                    {activeCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {activeCount} ativos
                        </Badge>
                    )}
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hidden">
                    <X size={14} />
                </button>
            </div>

            {/* Grid de Filtros */}
            <DenseFormGrid className="gap-2">
                
                {/* 1. Busca Universal */}
                <div className="col-span-12 md:col-span-8 lg:col-span-8">
                    <DenseInput
                        placeholder="Buscar modelo ou fabricante..."
                        value={activeFilters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        colSpan={12}
                    />
                </div>

                {/* 2. Fases */}
                <div className="col-span-12 md:col-span-4 lg:col-span-4">
                    <DenseSelect
                        options={[
                            { value: 'MONOFÁSICO', label: 'Monofásico' },
                            { value: 'BIFÁSICO', label: 'Bifásico' },
                            { value: 'TRIFÁSICO', label: 'Trifásico' },
                        ]}
                        value={activeFilters.phase}
                        onChange={(e) => handleChange('phase', e.target.value)}
                        placeholder="Qualquer Fase"
                        colSpan={12}
                    />
                </div>
                
                {/* 3. Escala de Potência (Chips) */}
                <div className="col-span-12 flex flex-wrap gap-2 mt-1">
                    {[
                        { id: 'ALL', label: 'Todos' },
                        { id: 'RESIDENTIAL', label: 'Residencial (<10kW)' },
                        { id: 'COMMERCIAL', label: 'Comercial (10-50kW)' },
                        { id: 'UTILITY', label: 'Usina (>50kW)' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleChange('powerCategory', cat.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors border",
                                activeFilters.powerCategory === cat.id 
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

            </DenseFormGrid>

            {/* Footer Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-200/60">
                <button
                    onClick={onClear}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    disabled={activeCount === 0}
                >
                    <RotateCcw size={12} />
                    Limpar Filtros
                </button>
            </div>
        </div>
    );
};
