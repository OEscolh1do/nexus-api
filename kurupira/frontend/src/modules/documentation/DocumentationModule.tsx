/**
 * DOCUMENTATION-MODULE.TSX - Orquestrador do Módulo de Documentação
 * 
 * Responsabilidade: Gerenciar documentos técnicos para submissão à concessionária
 * e comissionamento do sistema.
 */

import React, { useState } from 'react';
import { FileText, ClipboardCheck } from 'lucide-react';

// Tab Components
import { MemorandumTab } from './tabs/MemorandumTab';
import { CommissioningTab } from './tabs/CommissioningTab';

type TabType = 'memorial' | 'comissionamento';

export const DocumentationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('memorial');

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-0 bg-white border-b border-slate-200 shadow-sm shrink-0 h-12">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-neonorte-purple animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">DOCUMENTAÇÃO TÉCNICA</span>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('memorial')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        activeTab === 'memorial'
                        ? 'bg-white text-neonorte-purple shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <FileText size={12} />
                    Memorial
                </button>
                <button 
                        onClick={() => setActiveTab('comissionamento')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        activeTab === 'comissionamento'
                        ? 'bg-white text-neonorte-purple shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <ClipboardCheck size={12} />
                    Comissionamento
                </button>
            </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === 'memorial' && <MemorandumTab />}
        {activeTab === 'comissionamento' && <CommissioningTab />}
      </main>
    </div>
  );
};

