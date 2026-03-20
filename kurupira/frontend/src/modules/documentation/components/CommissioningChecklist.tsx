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
 * // TODO: Integrar com useSolarStore() para valores esperados
 * // TODO: Adicionar campos de input para valores medidos
 */

import React from 'react';
import { ClipboardCheck, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { DenseCard } from '@/components/ui/dense-form';

interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  status: 'pending' | 'pass' | 'fail';
  expectedValue?: string;
}

// Checklist NBR 16274 simplificado
const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: '1', category: 'Inspeção Visual', description: 'Módulos fixados corretamente', status: 'pending' },
  { id: '2', category: 'Inspeção Visual', description: 'Cabeamento sem danos visíveis', status: 'pending' },
  { id: '3', category: 'Inspeção Visual', description: 'Conexões firmes e protegidas', status: 'pending' },
  { id: '4', category: 'Teste Elétrico', description: 'Isolamento CC > 1 MΩ', status: 'pending', expectedValue: '> 1 MΩ' },
  { id: '5', category: 'Teste Elétrico', description: 'Polaridade correta em todas as strings', status: 'pending' },
  { id: '6', category: 'Teste Elétrico', description: 'Voc dentro da faixa esperada', status: 'pending', expectedValue: '± 5%' },
  { id: '7', category: 'Teste Elétrico', description: 'Isc dentro da faixa esperada', status: 'pending', expectedValue: '± 10%' },
  { id: '8', category: 'Proteções', description: 'DPS instalado e funcional', status: 'pending' },
  { id: '9', category: 'Proteções', description: 'Disjuntores dimensionados corretamente', status: 'pending' },
  { id: '10', category: 'Aterramento', description: 'Sistema de aterramento conforme projeto', status: 'pending' },
];

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
  const completedCount = CHECKLIST_ITEMS.filter(i => i.status !== 'pending').length;
  const totalCount = CHECKLIST_ITEMS.length;

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
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <StatusIcon status={item.status} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 truncate">{item.description}</p>
              <p className="text-[10px] text-slate-400">{item.category}</p>
            </div>
            {item.expectedValue && (
              <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                {item.expectedValue}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
        <p className="text-[10px] text-slate-400 text-center">
          Clique nos itens para registrar resultado da verificação
        </p>
      </div>
    </DenseCard>
  );
};

export default CommissioningChecklist;
