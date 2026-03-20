import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { 
    Dialog
} from '@/components/ui/simple-dialog';
import { InverterFilterPanel, InverterFilters, INITIAL_FILTERS } from './InverterFilterPanel';
import { InverterInventoryItem } from './InverterInventoryItem';

import { useTechStore } from '@/modules/engineering/store/useTechStore';

interface InverterCatalogDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InverterCatalogDialog: React.FC<InverterCatalogDialogProps> = ({ isOpen, onClose }) => {
    // Store mock - to be wired up to KurupiraClient 
    const catalogInverters: any[] = [];
    const isLoading = false;
    const { addInverter } = useTechStore();

    // Local Filter State
    const [filters, setFilters] = useState<InverterFilters>(INITIAL_FILTERS);

    // 1. Extract Unique Brands form Catalog
    const uniqueBrands = useMemo(() => {
        const brands = new Set(catalogInverters.map(m => m.manufacturer));
        return Array.from(brands).sort();
    }, [catalogInverters]);

    // 2. Final Filtered List
    const filteredCatalog = useMemo(() => {
        return catalogInverters.filter(item => {
            // A. Manufacturer (Exact)
            if (filters.manufacturer && item.manufacturer !== filters.manufacturer) return false;

            // B. Search (Model - Partial/Case Insensitive)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                if (!item.model.toLowerCase().includes(searchLower)) return false;
            }

            // C. Power Range (Min/Max kW)
            if (filters.minPower && item.nominalPower < parseFloat(filters.minPower)) return false;
            if (filters.maxPower && item.nominalPower > parseFloat(filters.maxPower)) return false;

            // D. Phase (Exact)
            if (filters.phase && item.connectionType !== filters.phase) return false;

            // E. MPPTs (Min)
            if (filters.minMppts && (item.mppts || 1) < parseInt(filters.minMppts)) return false;

            return true;
        });
    }, [filters, catalogInverters]);

    // Handle Add & Close (Optional UX: maintain open to add multiple? or close on add?)
    // Decision: Keep open to allow adding multiple, maybe show toast? 
    // For now, simple add. User can close manually.
    const handleAdd = (item: any) => {
        addInverter(item);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                
                {/* BACKDROP (Handled by Dialog Logic but we want custom content styling) */}
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                    onClick={onClose}
                />

                {/* MODAL CONTENT */}
                <div className="relative z-50 w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* 1. Header */}
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Catálogo de Inversores</h2>
                            <p className="text-sm text-slate-500">Selecione os equipamentos para o projeto.</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100/80 rounded-full transition-colors"
                        >
                            <span className="sr-only">Fechar</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    {/* 2. Filters (Sticky Top) */}
                    <div className="border-b border-slate-200 bg-white p-2 shrink-0 z-10">
                         <InverterFilterPanel 
                            uniqueBrands={uniqueBrands}
                            activeFilters={filters}
                            onFilterChange={setFilters}
                            onClear={() => setFilters(INITIAL_FILTERS)}
                            isOpen={true} // Always open in modal
                            onClose={() => {}} // No close button needed inside modal for panel
                            className="bg-transparent border-0 shadow-none p-0"
                        />
                    </div>

                    {/* 3. Catalog Grid (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
                        {isLoading && catalogInverters.length === 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[1,2,3,4,5,6,7,8].map(i => (
                                    <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : filteredCatalog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                                <Search size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-base font-semibold text-slate-600">Nenhum resultado encontrado</h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                    Tente ajustar os filtros de potência, marca ou fases para encontrar o inversor desejado.
                                </p>
                                <button 
                                    onClick={() => setFilters(INITIAL_FILTERS)}
                                    className="mt-6 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredCatalog.map((item) => (
                                    <InverterInventoryItem
                                        key={item.id}
                                        inverter={item}
                                        mode="catalog"
                                        onAdd={() => handleAdd(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Footer */}
                    <div className="px-6 py-3 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Mostrando <b>{filteredCatalog.length}</b> de <b>{catalogInverters.length}</b> equipamentos
                        </span>
                    </div>

                </div>
            </div>
        </Dialog>
    );
};
