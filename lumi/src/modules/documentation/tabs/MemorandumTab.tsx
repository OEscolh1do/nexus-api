import React from 'react';
import { CheckSquare } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { TechnicalMemorandum } from '../components/TechnicalMemorandum';

export const MemorandumTab: React.FC = () => {
    return (
        <div className="space-y-4">
            <TechnicalMemorandum />
            
            {/* Diagram Placeholder */}
            <DenseCard className="border-dashed border-2 border-slate-200">
                <div className="flex items-center justify-center py-8 text-slate-400">
                <div className="text-center">
                    <CheckSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">Diagrama Unifilar</p>
                    <p className="text-[10px]">Em desenvolvimento — Requer BOS completo</p>
                </div>
                </div>
            </DenseCard>
        </div>
    );
};
