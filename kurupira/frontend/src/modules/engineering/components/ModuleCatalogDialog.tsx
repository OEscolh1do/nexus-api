import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { 
    Dialog
} from '@/components/ui/simple-dialog';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ModuleInventoryItem } from './ModuleInventoryItem';
import { useCatalogStore } from '../store/useCatalogStore';
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';

interface ModuleCatalogDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddModule: (module: ModuleCatalogItem) => void;
}

export const ModuleCatalogDialog: React.FC<ModuleCatalogDialogProps> = ({ 
    isOpen, 
    onClose,
    onAddModule 
}) => {
    // P8: Consume catalog from useCatalogStore (Single Source of Truth)
    const catalogModules = useCatalogStore(state => state.modules);
    const isLoading = useCatalogStore(state => state.isLoading);
    const fetchCatalog = useCatalogStore(state => state.fetchCatalog);
    const isCatalogLoaded = catalogModules.length > 0;

    // Load catalog data on first open
    useEffect(() => {
        if (isOpen && !isCatalogLoaded && !isLoading) {
            fetchCatalog();
        }
    }, [isOpen, isCatalogLoaded, isLoading, fetchCatalog]);
    
    // Local Filter State
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // 1. Extract Unique Brands
    const uniqueBrands = useMemo(() => {
        const brands = new Set(catalogModules.map(m => m.manufacturer));
        return Array.from(brands).sort();
    }, [catalogModules]);

    // 2. Filter Logic
    const filteredModules = useMemo(() => {
        return catalogModules.filter(item => {
            // A. Brand
            if (selectedBrand !== 'all' && item.manufacturer !== selectedBrand) return false;
            
            // B. Search (Model)
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                if (!item.model.toLowerCase().includes(searchLower)) return false;
            }

            return true;
        });
    }, [catalogModules, selectedBrand, searchQuery]);


    const handleAdd = (item: ModuleCatalogItem) => {
        onAddModule(item);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                
                {/* BACKDROP */}
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                    onClick={onClose}
                />

                {/* MODAL CONTENT */}
                <div className="relative z-50 w-full max-w-5xl bg-slate-900 rounded-xl shadow-2xl shadow-black/40 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700/50">
                    
                    {/* 1. Header */}
                    <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-white">Catálogo de Módulos Fotovoltaicos</h2>
                            <p className="text-sm text-slate-400">Selecione os painéis para o arranjo.</p>
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
                    <div className="border-b border-slate-700/50 bg-slate-800/30 p-3 shrink-0 z-10 flex gap-3 items-center">
                         {/* Brand Select */}
                         <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                            <SelectTrigger className="w-[180px] h-9 text-xs bg-slate-800 border-slate-600 text-slate-200">
                                <SelectValue placeholder="Todas as Marcas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs font-semibold">Todas as Marcas</SelectItem>
                                {uniqueBrands.map(brand => (
                                    <SelectItem key={brand} value={brand} className="text-xs">
                                        {brand}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Search Input */}
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar modelo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-600 bg-slate-800 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400"
                            />
                        </div>

                         <div className="ml-auto text-xs text-slate-500">
                            <b className="text-slate-300">{filteredModules.length}</b> modelos encontrados
                        </div>
                    </div>

                    {/* 3. Catalog Grid (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50">
                        {isLoading && catalogModules.length === 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[1,2,3,4,5,6,7,8].map(i => (
                                    <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredModules.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                                <Search size={48} className="text-slate-600 mb-4" />
                                <h3 className="text-base font-semibold text-slate-400">Nenhum módulo encontrado</h3>
                                <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                                    Tente mudar a marca ou termo de busca.
                                </p>
                                <button 
                                    onClick={() => { setSelectedBrand('all'); setSearchQuery(''); }}
                                    className="mt-6 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:border-slate-500 shadow-sm transition-all"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredModules.map((item, idx) => (
                                    <ModuleInventoryItem
                                        key={`${item.manufacturer}-${item.model}-${idx}`}
                                        module={item}
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
                             Total no Banco de Dados: <b className="text-slate-300">{catalogModules.length}</b>
                         </span>
                    </div>

                </div>
            </div>
        </Dialog>
    );
};
