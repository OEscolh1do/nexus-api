import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { 
    Dialog
} from '@/components/ui/simple-dialog';
import { InverterFilterPanel, InverterFilters, INITIAL_FILTERS } from './InverterFilterPanel';
import { InverterInventoryItem } from './InverterInventoryItem';
import { useCatalogStore } from '../store/useCatalogStore';
import type { Inverter } from '../store/useTechStore';

interface InverterCatalogDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddInverter: (inverter: any) => void;
}

export const InverterCatalogDialog: React.FC<InverterCatalogDialogProps> = ({ isOpen, onClose, onAddInverter }) => {
    // P8: Consume catalog from useCatalogStore (Single Source of Truth)
    const catalogInverters = useCatalogStore(state => state.inverters);
    const isLoading = useCatalogStore(state => state.isLoading);
    const fetchCatalog = useCatalogStore(state => state.fetchCatalog);
    const isCatalogLoaded = catalogInverters.length > 0;

    // Load catalog data on first open
    useEffect(() => {
        if (isOpen && !isCatalogLoaded && !isLoading) {
            fetchCatalog();
        }
    }, [isOpen, isCatalogLoaded, isLoading, fetchCatalog]);

    // Adapter: InverterCatalogItem → Inverter (for InverterInventoryItem rendering)
    const adaptedInverters: (Inverter & { _catalogId: string })[] = useMemo(() => {
        return catalogInverters.map(i => ({
            id: i.id,
            _catalogId: i.id,
            manufacturer: i.manufacturer,
            model: i.model,
            nominalPower: i.nominalPowerW / 1000,
            mppts: i.mppts.length,
            connectionType: i.connectionType || 'Trifásico',
            maxInputVoltage: i.maxInputVoltage || i.mppts[0]?.maxInputVoltage || 600,
            imageUrl: i.imageUrl,
        }));
    }, [catalogInverters]);

    // Local Filter State
    const [filters, setFilters] = useState<InverterFilters>(INITIAL_FILTERS);

    // 1. Extract Unique Brands from Catalog
    const uniqueBrands = useMemo(() => {
        const brands = new Set(adaptedInverters.map(m => m.manufacturer));
        return Array.from(brands).sort();
    }, [adaptedInverters]);

    // 2. Final Filtered List
    const filteredCatalog = useMemo(() => {
        return adaptedInverters.filter(item => {
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

            // E. MPPTs (P8: agora disponível via useCatalogStore)
            if (filters.minMppts && (item.mppts || 1) < parseInt(filters.minMppts)) return false;

            return true;
        });
    }, [filters, adaptedInverters]);

    // Handle Add & Close (Optional UX: maintain open to add multiple? or close on add?)
    // Decision: Keep open to allow adding multiple, maybe show toast? 
    // For now, simple add. User can close manually.
    // For now, simple add. User can close manually or it closes automatically depending on parent.
    const handleAdd = (item: any) => {
        // Pass the ORIGINAL catalog item (full data), not the stripped adapter
        const original = catalogInverters.find(ci => ci.id === item.id || ci.id === item._catalogId);
        onAddInverter(original || item);
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
                <div className="relative z-50 w-full max-w-5xl bg-slate-900 rounded-xl shadow-2xl shadow-black/40 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700/50">
                    
                    {/* 1. Header */}
                    <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-white">Catálogo de Inversores</h2>
                            <p className="text-sm text-slate-400">Selecione os equipamentos para o projeto.</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-slate-500 hover:text-white p-2 hover:bg-slate-700/60 rounded-full transition-colors"
                        >
                            <span className="sr-only">Fechar</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    {/* 2. Filters (Sticky Top) */}
                    <div className="border-b border-slate-700/50 bg-slate-800/30 p-2 shrink-0 z-10">
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
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50">
                        {isLoading && adaptedInverters.length === 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[1,2,3,4,5,6,7,8].map(i => (
                                    <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredCatalog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                                <Search size={48} className="text-slate-600 mb-4" />
                                <h3 className="text-base font-semibold text-slate-400">Nenhum resultado encontrado</h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                    Tente ajustar os filtros de potência, marca ou fases para encontrar o inversor desejado.
                                </p>
                                <button 
                                    onClick={() => setFilters(INITIAL_FILTERS)}
                                    className="mt-6 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:border-slate-500 shadow-sm transition-all"
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
                    <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/50 shrink-0 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Mostrando <b className="text-slate-300">{filteredCatalog.length}</b> de <b className="text-slate-300">{adaptedInverters.length}</b> equipamentos
                        </span>
                    </div>

                </div>
            </div>
        </Dialog>
    );
};
