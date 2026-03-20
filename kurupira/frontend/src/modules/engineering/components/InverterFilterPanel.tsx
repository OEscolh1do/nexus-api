import React from 'react';
import { RotateCcw, Filter, X } from 'lucide-react';
import {
    DenseInput,
    DenseSelect,
    DenseFormGrid
} from '@/components/ui/dense-form';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface InverterFilters {
    search: string;
    manufacturer: string;
    minPower: string;
    maxPower: string;
    phase: string;
    minMppts: string;
}

interface InverterFilterPanelProps {
    uniqueBrands: string[];
    activeFilters: InverterFilters;
    onFilterChange: (filters: InverterFilters) => void;
    onClear: () => void;
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const INITIAL_FILTERS: InverterFilters = {
    search: '',
    manufacturer: '',
    minPower: '',
    maxPower: '',
    phase: '',
    minMppts: ''
};

export const InverterFilterPanel: React.FC<InverterFilterPanelProps> = ({
    uniqueBrands,
    activeFilters,
    onFilterChange,
    onClear,
    className,
    isOpen,
    onClose
}) => {
    // Local state for immediate feedback before debounce (optional, but good for inputs)
    // For now, we'll drive directly from props to keep it simple and controlled.

    const handleChange = (key: keyof InverterFilters, value: string) => {
        onFilterChange({ ...activeFilters, [key]: value });
    };

    const activeCount = Object.values(activeFilters).filter(Boolean).length;

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
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                </button>
            </div>

            {/* Grid de Filtros */}
            <DenseFormGrid className="gap-2">
                
                {/* 1. Busca Textual */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                    <DenseInput
                        placeholder="Buscar modelo..."
                        value={activeFilters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        colSpan={12}
                    />
                </div>

                 {/* 2. Fabricante */}
                 <div className="col-span-6 md:col-span-3 lg:col-span-2">
                    <DenseSelect
                        options={uniqueBrands.map(b => ({ value: b, label: b }))}
                        value={activeFilters.manufacturer}
                        onChange={(e) => handleChange('manufacturer', e.target.value)}
                        placeholder="Fabricante"
                        colSpan={12}
                    />
                </div>

                {/* 3. Potência (Min/Max) */}
                <div className="col-span-6 md:col-span-3 lg:col-span-2 flex gap-1">
                     <DenseInput
                        type="number"
                        placeholder="Min kW"
                        value={activeFilters.minPower}
                        onChange={(e) => handleChange('minPower', e.target.value)}
                        colSpan={6}
                    />
                    <DenseInput
                        type="number"
                        placeholder="Max kW"
                        value={activeFilters.maxPower}
                        onChange={(e) => handleChange('maxPower', e.target.value)}
                        colSpan={6}
                    />
                </div>
               
               {/* 4. Fases */}
                <div className="col-span-6 md:col-span-3 lg:col-span-2">
                    <DenseSelect
                        options={[
                            { value: 'MONOFÁSICO', label: 'Monofásico' },
                            { value: 'BIFÁSICO', label: 'Bifásico' },
                            { value: 'TRIFÁSICO', label: 'Trifásico' },
                        ]}
                        value={activeFilters.phase}
                        onChange={(e) => handleChange('phase', e.target.value)}
                        placeholder="Fase"
                        colSpan={12}
                    />
                </div>

                {/* 5. MPPTs */}
                <div className="col-span-6 md:col-span-3 lg:col-span-2">
                     <DenseInput
                        type="number"
                        placeholder="Min MPPTs"
                        value={activeFilters.minMppts}
                        onChange={(e) => handleChange('minMppts', e.target.value)}
                        colSpan={12}
                    />
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
