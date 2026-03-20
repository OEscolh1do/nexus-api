/**
 * =============================================================================
 * SERVICE COMPOSITION PHASE - DENSE LAYOUT (REFATORADO)
 * =============================================================================
 *
 * MUDANÇAS:
 * ❌ Removido: Header gigante com ícone Settings 300px
 * ❌ Removido: Tabela com padding excessivo
 * ❌ Removido: Botões Voltar/Gerar Proposta internos
 * ✅ Mantido: Edição manual do preço de serviço
 * ✅ Mantido: Recálculo automático via solarEngine
 * ✅ Novo: Layout compacto com cards de resumo
 *
 * =============================================================================
 */

import React, { useState } from 'react';
import { ProposalData } from '@/core/types';
import { recalculateProposalWithServicePrice } from '@/services/solarEngine';
import {
  Wrench, Cpu, PieChart, ShieldCheck, 
  Info, Edit2, Save, X, CheckCircle
} from 'lucide-react';
import {
  DenseFormGrid,
  DenseCard,
  DenseStat,
  DenseButton,
  DenseDivider
} from '@/components/ui/dense-form';

// =============================================================================
// TIPOS
// =============================================================================

interface Props {
  data: ProposalData;
  onBack?: () => void;
  onConfirm: (updatedData: ProposalData) => void;
  hideNavigation?: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const ServiceCompositionPhase: React.FC<Props> = ({ data, onConfirm }) => {
  const [localData, setLocalData] = useState<ProposalData>(data);
  const [isEditing, setIsEditing] = useState(false);
  const [manualPrice, setManualPrice] = useState(data.servicePrice);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleConfirm = () => {
    onConfirm(localData);
  };

  const handleSavePrice = () => {
    const updated = recalculateProposalWithServicePrice(localData, manualPrice);
    setLocalData(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setManualPrice(localData.servicePrice);
    setIsEditing(false);
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      <DenseFormGrid className="gap-4">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HEADER: Resumo do Investimento */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12">
          <DenseCard className="bg-neonorte-purple text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <PieChart size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Composição de Investimento</h4>
                  <p className="text-xs text-white/50">Resumo comercial do projeto</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Total</p>
                <p className="text-2xl font-black">{formatMoney(localData.totalInvestment)}</p>
              </div>
            </div>
          </DenseCard>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LINHA DE ITENS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Kit Fotovoltaico */}
        <div className="col-span-12 lg:col-span-6">
          <DenseCard>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-neonorte-purple/10 text-neonorte-purple rounded-lg">
                <Cpu size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">Kit Gerador Fotovoltaico</h4>
                <p className="text-xs text-slate-400">Módulos, Inversores, Estruturas e Cabeamento</p>
              </div>
            </div>
            <DenseDivider />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400 uppercase font-bold">Equipamentos</span>
              <span className="text-xl font-black text-slate-800">{formatMoney(localData.kitPrice)}</span>
            </div>
          </DenseCard>
        </div>

        {/* Serviços */}
        <div className="col-span-12 lg:col-span-6">
          <DenseCard>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-neonorte-green/10 text-neonorte-green rounded-lg">
                <Wrench size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800">Serviços & Engenharia</h4>
                <p className="text-xs text-slate-400">Projeto, Instalação e Homologação</p>
              </div>
            </div>
            <DenseDivider />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400 uppercase font-bold">Implementação</span>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="number"
                    className="w-28 h-8 bg-slate-100 border border-slate-300 rounded-lg px-2 text-right text-sm font-bold outline-none focus:ring-2 focus:ring-neonorte-green"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Number(e.target.value))}
                  />
                  <button 
                    onClick={handleSavePrice} 
                    className="p-1.5 bg-neonorte-green text-white rounded-lg hover:bg-neonorte-darkGreen"
                  >
                    <Save size={14} />
                  </button>
                  <button 
                    onClick={handleCancelEdit} 
                    className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="text-xl font-black text-slate-800">{formatMoney(localData.servicePrice)}</span>
                  <button
                    onClick={() => { setIsEditing(true); setManualPrice(localData.servicePrice); }}
                    className="p-1 text-slate-300 hover:text-neonorte-purple opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Editar valor"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </DenseCard>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TOTAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12">
          <DenseCard className="bg-slate-900 text-white">
            <DenseFormGrid>
              <DenseStat 
                label="Kit Equipamentos" 
                value={formatMoney(localData.kitPrice)} 
                colSpan={4}
              />
              <DenseStat 
                label="Serviços" 
                value={formatMoney(localData.servicePrice)} 
                colSpan={4}
                variant="success"
              />
              <DenseStat 
                label="Investimento Total" 
                value={formatMoney(localData.totalInvestment)} 
                colSpan={4}
                variant="success"
              />
            </DenseFormGrid>
          </DenseCard>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* INFORMAÇÕES ADICIONAIS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-6">
          <DenseCard className="bg-slate-50 h-full">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-neonorte-green/10 text-neonorte-green rounded-lg shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1">Garantia NeoNorte</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Garantia de performance do projeto e qualidade da instalação. Suporte técnico durante startup e monitoramento inicial.
                </p>
              </div>
            </div>
          </DenseCard>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <DenseCard className="bg-slate-50 h-full">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-neonorte-purple/10 text-neonorte-purple rounded-lg shrink-0">
                <Info size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1">Condições Comerciais</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Equipamentos faturados pelo distribuidor. Serviços contratados via NeoNorte Engenharia.
                </p>
              </div>
            </div>
          </DenseCard>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* AÇÃO FINAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12">
          <div className="flex justify-end">
            <DenseButton
              type="button"
              onClick={handleConfirm}
              variant="primary"
              icon={<CheckCircle size={16} />}
              className="px-6"
            >
              Gerar Proposta
            </DenseButton>
          </div>
        </div>

      </DenseFormGrid>
    </div>
  );
};
