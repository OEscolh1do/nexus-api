import React, { useState } from 'react';
import { Package2, Plus, PlusCircle } from 'lucide-react';
import { 
    Card,
    CardContent 
} from '@/components/ui/card';
import { useTechStore } from '@/modules/engineering/store/useTechStore';

import { cn } from '@/lib/utils';
import { InverterInventoryItem } from './InverterInventoryItem';
import { InverterCatalogDialog } from './InverterCatalogDialog';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DenseButton } from '@/components/ui/dense-form';

interface InverterInventoryProps {
    className?: string;
}

export const InverterInventory: React.FC<InverterInventoryProps> = ({ className }) => {
    // Store
    const { inverters: selectedInverters, removeInverter, updateInverterQuantity } = useTechStore();
    const catalogInverters: any[] = [];
    const isLoading = false;
    const error = null;
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <Card className={cn("flex flex-col h-full overflow-hidden bg-white border-slate-200", className)}>
            {/* HEADER CLEAN */}
            <div className="flex flex-row items-center justify-between px-3 h-12 border-b bg-white shrink-0 z-20 gap-2 relative">
                
                {/* Left: Title & Badge */}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <h3 className="text-sm font-semibold text-slate-800 truncate whitespace-nowrap">
                        Inversores do Projeto
                    </h3>
                    <span className="flex items-center justify-center h-5 px-2 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
                        {selectedInverters.reduce((a, m) => a + m.quantity, 0)}
                    </span>
                    {isLoading && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                </div>

                {/* Right: Add Button (Triggers Modal) */}
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
                {selectedInverters.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-60">
                        <Package2 size={32} className="text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-500 font-bold">Nenhum Inversor</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                            Clique em <b>Adicionar</b> para selecionar inversores do catálogo.
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
                    <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 pb-2">
                        {selectedInverters.map(invInstance => {
                            const catalogItem = catalogInverters.find(cat => cat.id === invInstance.catalogId);
                            // Fallback if catalog item is missing (offline sync issue?)
                            // We construct a temporary display object or handle null
                            if (!catalogItem) return null; 

                            return (
                                <div key={invInstance.id}>
                                    <InverterInventoryItem
                                        inverter={catalogItem}
                                        mode="inventory"
                                        quantity={invInstance.quantity}
                                        onQuantityChange={(delta) => {
                                            const newQty = Math.max(1, invInstance.quantity + delta);
                                            updateInverterQuantity(invInstance.id, newQty);
                                        }}
                                        onRemove={() => removeInverter(invInstance.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* MODAL DIALOG */}
            <InverterCatalogDialog 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </Card>
    );
};
