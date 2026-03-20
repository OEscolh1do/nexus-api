import React from 'react';
import { Zap } from 'lucide-react';
import { DenseCard, DenseStat, DenseButton } from '@/components/ui/dense-form';
import { useSolarStore } from '@/core/state/solarStore';

export const BOSInventory: React.FC = () => {
    const bosInventory = useSolarStore(state => state.bosInventory);
    const patchBOSInventory = useSolarStore(state => state.patchBOSInventory);

    // Initialize if null
    React.useEffect(() => {
        if (!bosInventory) {
            patchBOSInventory({});
        }
    }, [bosInventory, patchBOSInventory]);

    if (!bosInventory) return null;

    return (
        <DenseCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Zap size={12} className="text-yellow-500" />
                    Balance of System (BOS)
                </h4>
            </div>

            <div className="grid grid-cols-12 gap-3 mb-4">
                <DenseStat 
                    label="Cabos CC" 
                    value={bosInventory.dcCables?.length || 0} 
                    unit="trechos" 
                    colSpan={4} 
                />
                <DenseStat 
                    label="Cabos CA" 
                    value={bosInventory.acCables?.length || 0} 
                    unit="trechos" 
                    colSpan={4} 
                />
                <DenseStat 
                    label="Proteções" 
                    value={bosInventory.breakers?.length || 0} 
                    unit="polos" 
                    colSpan={4} 
                />
            </div>

            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <Zap size={24} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">Módulo de Cabeamento em construção</p>
                <p className="text-xs text-slate-400 max-w-[200px]">
                    O inventário de cabos e proteções será calculado automaticamente com base na distância dos inversores.
                </p>
                <div className="mt-4">
                     <DenseButton variant="secondary" size="sm" onClick={() => {/* Future implementation */}}>
                        Adicionar Cabo Manualmente
                     </DenseButton>
                </div>
            </div>
        </DenseCard>
    );
};
