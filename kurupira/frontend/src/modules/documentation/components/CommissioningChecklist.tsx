/**
 * COMMISSIONING-CHECKLIST.TSX - Checklist de Comissionamento NBR 16274
 * 
 * Responsabilidade: Gerar checklist de verificações técnicas para
 * comissionamento do sistema fotovoltaico conforme NBR 16274.
 * 
 * Verificações incluem:
 * - Inspeção visual
 * - Teste de isolamento
 * - Verificação de polaridade
 * - Medição de Voc
 * - Medição de corrente de curto-circuito
 * 
 */

import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';
import { useSolarStore, selectModules } from '@/core/state/solarStore';

interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  status: 'pending' | 'pass' | 'fail';
  expectedValue?: string;
  measuredValue?: string;
}

const StatusIcon: React.FC<{ status: ChecklistItem['status'] }> = ({ status }) => {
  switch (status) {
    case 'pass':
      return <CheckCircle2 size={14} className="text-green-500" />;
    case 'fail':
      return <XCircle size={14} className="text-red-500" />;
    default:
      return <Circle size={14} className="text-slate-300" />;
  }
};

export const CommissioningChecklist: React.FC = () => {
  const modules = useSolarStore(selectModules);
  
  // Local state for interacting with the checklist without persisting yet
  const [interactiveState, setInteractiveState] = useState<Record<string, { status: ChecklistItem['status'], measuredValue?: string }>>({});

  // Generating items dynamically based on the specifications of the chosen modules
  const baseItems = useMemo<ChecklistItem[]>(() => {
    let expectedVoc = '± 5%';
    let expectedIsc = '± 10%';

    if (modules.length > 0 && modules[0] !== undefined) {
      if (modules[0].voc) {
        expectedVoc = `~ ${modules[0].voc} V (± 5%)`;
      }
      if (modules[0].isc) {
        expectedIsc = `~ ${modules[0].isc} A (± 10%)`;
      }
    }

    return [
      { id: '1', category: 'Inspeção Visual', description: 'Módulos fixados corretamente', status: 'pending' },
      { id: '2', category: 'Inspeção Visual', description: 'Cabeamento sem danos visíveis', status: 'pending' },
      { id: '3', category: 'Inspeção Visual', description: 'Conexões firmes e protegidas', status: 'pending' },
      { id: '4', category: 'Teste Elétrico', description: 'Isolamento CC > 1 MΩ', status: 'pending', expectedValue: '> 1 MΩ' },
      { id: '5', category: 'Teste Elétrico', description: 'Polaridade correta em todas as strings', status: 'pending' },
      { id: '6', category: 'Teste Elétrico', description: 'Voc dentro da faixa esperada', status: 'pending', expectedValue: expectedVoc },
      { id: '7', category: 'Teste Elétrico', description: 'Isc dentro da faixa esperada', status: 'pending', expectedValue: expectedIsc },
      { id: '8', category: 'Proteções', description: 'DPS instalado e funcional', status: 'pending' },
      { id: '9', category: 'Proteções', description: 'Disjuntores dimensionados corretamente', status: 'pending' },
      { id: '10', category: 'Aterramento', description: 'Sistema de aterramento conforme projeto', status: 'pending' },
    ];
  }, [modules]);
  
  // Merge the memoized checklist with the user's interactive state
  const checklistItems = baseItems.map(item => ({
    ...item,
    ...(interactiveState[item.id] || {})
  }));

  const completedCount = checklistItems.filter(i => i.status !== 'pending').length;
  const totalCount = checklistItems.length;

  const cycleStatus = (id: string, currentStatus: ChecklistItem['status']) => {
    const nextStatus = currentStatus === 'pending' ? 'pass' : currentStatus === 'pass' ? 'fail' : 'pending';
    setInteractiveState(prev => ({
      ...prev,
      [id]: { ...prev[id], status: nextStatus }
    }));
  };

  const updateMeasured = (id: string, val: string) => {
    setInteractiveState(prev => ({
      ...prev,
      [id]: { ...prev[id], status: prev[id]?.status || 'pending', measuredValue: val }
    }));
  };

  return (
    <DenseCard className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <ClipboardCheck size={14} className="text-purple-500" />
          Comissionamento NBR 16274
        </h3>
        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {completedCount}/{totalCount} itens
        </span>
      </div>

      {/* Lista de Verificações */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            onClick={() => cycleStatus(item.id, item.status)}
            className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer rounded select-none group"
          >
            <div className="shrink-0 transition-transform group-active:scale-95">
               <StatusIcon status={item.status} />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className={`text-xs truncate transition-colors ${item.status === 'fail' ? 'text-red-700 line-through opacity-70' : 'text-slate-700'}`}>
                {item.description}
              </p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{item.category}</p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
               {(item.id === '6' || item.id === '7' || item.id === '4') && (
                 <input
                   type="text"
                   value={item.measuredValue || ''}
                   onChange={e => updateMeasured(item.id, e.target.value)}
                   placeholder="Medido..."
                   className="w-16 h-5 text-[9px] px-1 border border-slate-200 rounded text-right focus:outline-none focus:border-purple-400 bg-white"
                 />
               )}
               {item.expectedValue && (
                 <span className="text-[9px] text-slate-400 font-mono bg-slate-100/80 px-1 py-0.5 rounded border border-slate-100 truncate max-w-[60px]" title={item.expectedValue}>
                   {item.expectedValue}
                 </span>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
        <p className="text-[10px] text-slate-400 text-center">
          Clique nos itens para registrar resultado. Use as caixas para medição.
        </p>
      </div>
    </DenseCard>
  );
};


