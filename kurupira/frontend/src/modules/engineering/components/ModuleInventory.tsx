import React, { useState, useEffect, useRef } from 'react';
import { Package2, Plus, PlusCircle } from 'lucide-react';
import { 
    Card,
    CardContent 
} from '@/components/ui/card';
import { DenseButton } from '@/components/ui/dense-form';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

import { useTechStore } from '../store/useTechStore';
import { cn } from '@/lib/utils';
import { ModuleInventoryItem } from './ModuleInventoryItem';
import { ModuleCatalogDialog } from './ModuleCatalogDialog'; // New Dialog
import type { ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { mapCatalogToSpecs } from '../utils/catalogMappers';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ModuleInventoryProps {
    className?: string;
}

export const ModuleInventory: React.FC<ModuleInventoryProps> = ({ className }) => {
    // Store mock
    const availableModules: ModuleCatalogItem[] = [];
    const isLoading = false;
    const error = null;
    
    // Store - Project (Selected Equipment)
    const modules = useSolarStore(selectModules);
    const addModule = useSolarStore(state => state.addModule);
    const removeModule = useSolarStore(state => state.removeModule);
    const updateModuleQty = useSolarStore(state => state.updateModuleQty);

    
    // Store - UI Selection (Highlight)
    const { selectedModuleId, setSelectedModuleId } = useTechStore();

    // Local State
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Refs for Scroll Handling
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const handleAdd = (catalogItem: ModuleCatalogItem) => {
        const newId = Math.random().toString(36).substr(2, 9);
        const mappedItem = mapCatalogToSpecs(catalogItem);

        // Add to project state overriding ID with local unique ID
        addModule({
            ...mappedItem,
            id: newId,
        });
        
        setSelectedModuleId(newId);
    };

    // Auto-Scroll to Selected Item
    useEffect(() => {
        if (selectedModuleId && itemRefs.current.has(selectedModuleId)) {
            itemRefs.current.get(selectedModuleId)?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }
    }, [selectedModuleId, modules]);

    return (
        <Card className={cn("flex flex-col h-full overflow-hidden bg-white border-slate-200", className)}>
            {/* HEADER CLEAN */}
            <div className="flex flex-row items-center justify-between px-3 h-12 border-b bg-white shrink-0 z-20 gap-2 relative">
                
                {/* Left: Title & Badge */}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <h3 className="text-sm font-semibold text-slate-800 truncate whitespace-nowrap">
                        Módulos Fotovoltaicos
                    </h3>
                    <span className="flex items-center justify-center h-5 px-2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
                        {modules.reduce((a, m) => a + m.quantity, 0)}
                    </span>
                    {isLoading && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                </div>

                {/* Right: Add Button (Opens Modal) */}
                <div className="flex items-center gap-1 shrink-0">
                    <DenseButton
                        variant="primary"
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                        icon={<Plus size={14} />}
                        className="shadow-sm"
                    >
                        Adicionar
                    </DenseButton>
                </div>
            </div>

            {/* ERROR FEEDBACK */}
            {error && (
                <div className="px-3 pt-2 shrink-0">
                    <Alert variant="destructive" className="py-2 h-auto text-xs flex items-center gap-2 bg-red-50 border-red-200 text-red-900">
                        <AlertTriangle className="h-4 w-4 shrink-0 stroke-red-600" />
                        <div className="flex-1">
                            <AlertTitle className="font-bold mb-0 text-[10px] uppercase tracking-wider text-red-700">Modo Offline</AlertTitle>
                            <AlertDescription className="text-[10px] opacity-90 leading-tight">
                                Falha na sincronização. Exibindo catálogo local.
                            </AlertDescription>
                        </div>
                    </Alert>
                </div>
            )}

            {/* CONTENT: Selected Items Only */}
            <CardContent className="flex-1 min-h-0 p-2 overflow-y-auto bg-slate-50/50 relative z-0">
                {modules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-60">
                        <Package2 size={32} className="text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-500 font-bold">Nenhum Módulo</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                            Clique em <b>Adicionar</b> para selecionar painéis do catálogo.
                        </p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                            <PlusCircle size={14} />
                            Abrir Catálogo
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pb-2">
                        {modules.map(m => {
                            const isSelected = m.id === selectedModuleId;
                            // Match project module to catalog item to get full specs for display
                            const catalogItem = availableModules.find(cat => cat.model === m.model);
                            if (!catalogItem) return null; // Handle missing catalog item

                            return (
                                <div 
                                    key={m.id}
                                    ref={el => {
                                        if (el) itemRefs.current.set(m.id, el);
                                        else itemRefs.current.delete(m.id);
                                    }}
                                >
                                    <ModuleInventoryItem
                                        module={catalogItem}
                                        mode="inventory"
                                        isSelected={isSelected}
                                        quantity={m.quantity}
                                        onSelect={() => setSelectedModuleId(m.id)}
                                        onQuantityChange={(delta) => {
                                            const newQty = Math.max(1, m.quantity + delta);
                                            updateModuleQty(m.id, newQty);
                                        }}
                                        onRemove={() => removeModule(m.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* MODAL DIALOG */}
            <ModuleCatalogDialog 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddModule={handleAdd}
            />
        </Card>
    );
};
