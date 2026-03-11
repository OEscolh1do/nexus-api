import React, { useState } from 'react';
import { ArrowLeft, CircleDollarSign, Cable, Box } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { DenseButton } from '@/components/ui/dense-form';

// Tab Components
import { CablingTab } from './tabs/CablingTab';
import { StringBoxTab } from './tabs/StringBoxTab';

type TabType = 'cabeamento' | 'stringbox';

export const ElectricalModule: React.FC = () => {
  const activeModule = useSolarStore(state => state.activeModule);
  const setActiveModule = useSolarStore(state => state.setActiveModule);
  const [activeTab, setActiveTab] = useState<TabType>('cabeamento');

  if (activeModule !== 'electrical') return null;

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
        {/* Header Compacto */}
        <header className="flex items-center justify-between px-4 py-0 bg-white border-b border-slate-200 shadow-sm shrink-0 h-12">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">ELÉTRICO & BOS</span>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('cabeamento')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            activeTab === 'cabeamento'
                            ? 'bg-white text-yellow-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Cable size={12} />
                        Cabeamento
                    </button>
                    <button 
                         onClick={() => setActiveTab('stringbox')}
                         className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            activeTab === 'stringbox' 
                            ? 'bg-white text-yellow-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Box size={12} />
                        String Box
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2">
                <DenseButton 
                    variant="ghost" 
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveModule('engineering')}
                    icon={<ArrowLeft size={14} />}
                >
                    Voltar
                </DenseButton>
                <DenseButton 
                    variant="primary" 
                    size="sm"
                    className="h-8"
                    onClick={() => setActiveModule('finance')}
                    icon={<CircleDollarSign size={14} />}
                >
                    Ir para Viabilidade
                </DenseButton>
            </div>
        </header>

        {/* Layout Content */}
        <main className="flex-1 p-4 overflow-hidden">
            {activeTab === 'cabeamento' && <CablingTab />}
            {activeTab === 'stringbox' && <StringBoxTab />}
        </main>
    </div>
  );
};
