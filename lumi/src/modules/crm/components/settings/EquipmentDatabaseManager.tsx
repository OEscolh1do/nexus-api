import React, { useState } from 'react';
import { ModulesTable } from './ModulesTable';
import { InvertersTable } from './InvertersTable';
import { DenseButton } from '@/components/ui/dense-form';
import { LayoutGrid, Zap, RotateCcw } from 'lucide-react';
import { useEquipmentStore } from '../../store/useEquipmentStore';

export const EquipmentDatabaseManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'modules' | 'inverters'>('modules');
    const { resetToDefaults } = useEquipmentStore();

    const handleReset = () => {
        if (window.confirm('Tem certeza? Isso irá apagar todos os equipamentos personalizados e restaurar o catálogo padrão.')) {
            resetToDefaults();
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`
                            px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                            ${activeTab === 'modules' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        <LayoutGrid size={16} />
                        Módulos FV
                    </button>
                    <button
                        onClick={() => setActiveTab('inverters')}
                        className={`
                            px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                            ${activeTab === 'inverters' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        <Zap size={16} />
                        Inversores
                    </button>
                </div>

                <DenseButton 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset} 
                    icon={<RotateCcw size={14} />}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                    Restaurar Padrões de Fábrica
                </DenseButton>
            </div>

            <div className="flex-1 overflow-auto pr-2">
                {activeTab === 'modules' ? <ModulesTable /> : <InvertersTable />}
            </div>
        </div>
    );
};
