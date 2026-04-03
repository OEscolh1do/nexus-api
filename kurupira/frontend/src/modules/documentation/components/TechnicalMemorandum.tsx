/**
 * TECHNICAL-MEMORANDUM.TSX - Memorial Descritivo Técnico
 * 
 * Responsabilidade: Gerar documento técnico para submissão à concessionária
 * contendo especificações do sistema, cálculos de queda de tensão CC/CA
 * e dimensionamento de proteções.
 * 
 * // TODO: Integrar com useSolarStore() para puxar dados reais
 * // TODO: Adicionar exportação para PDF
 */

import React from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { DenseCard, DenseButton } from '@/components/ui/dense-form';
import { useSolarStore, selectModules, selectInverters } from '@/core/state/solarStore';

import { generateTechnicalMemorandumPDF } from '../utils/pdfGenerator';

export const TechnicalMemorandum: React.FC = () => {
  const modules = useSolarStore(selectModules);
  const inverters = useSolarStore(selectInverters);
  const clientData = useSolarStore(state => state.clientData);
  const projectName = useSolarStore(state => (state.project as any)?.projectName);
  const projectState = useSolarStore(state => state.project);

  const hasRequiredData = modules.length > 0 && inverters.length > 0;

  const handleExportPDF = () => {
    generateTechnicalMemorandumPDF({
      modules,
      inverters,
      clientData,
      projectName,
      projectMapData: projectState,
      placedModulesQty: projectState.placedModules?.length || 0
    });
  };

  return (
    <DenseCard className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <FileText size={14} className="text-purple-500" />
          Memorial Descritivo
        </h3>
        <DenseButton
          variant="secondary"
          size="sm"
          icon={<Download size={12} />}
          disabled={!hasRequiredData}
          onClick={handleExportPDF}
        >
          Exportar PDF
        </DenseButton>
      </div>

      {/* Conteúdo Skeleton */}
      {!hasRequiredData ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <AlertCircle size={32} className="mb-2 opacity-50" />
          <p className="text-xs font-medium text-center">
            Dados insuficientes
          </p>
          <p className="text-[10px] text-center mt-1">
            Complete o dimensionamento (Módulos e Inversores) para gerar o memorial
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Project Summary Header */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white">
             <h4 className="text-xs font-bold text-emerald-400 mb-1">{clientData.clientName || projectName || 'Projeto sem Nome'}</h4>
             <p className="text-[10px] text-slate-400">{clientData.street ? `${clientData.street}, ` : ''}{clientData.city} - {clientData.state}</p>
          </div>

          {/* Preview do Memorial */}
          <div className="bg-slate-50 rounded p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">
              Índice do Memorial
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex justify-between">
                <span>✓ 1. Identificação do Projeto</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1 rounded">OK</span>
              </li>
              <li className="flex justify-between">
                <span>✓ 2. Módulos ({modules.length}x)</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1 rounded">OK</span>
              </li>
              <li className="flex justify-between">
                <span>✓ 3. Inversor(es) ({inverters.length}x)</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1 rounded">OK</span>
              </li>
              <li className="flex justify-between">
                <span>○ 4. Queda de Tensão CC</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">PENDENTE</span>
              </li>
              <li className="flex justify-between">
                <span>○ 5. Queda de Tensão CA</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">PENDENTE</span>
              </li>
              <li className="flex justify-between">
                <span>○ 6. Proteções</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">PENDENTE</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </DenseCard>
  );
};

export default TechnicalMemorandum;
