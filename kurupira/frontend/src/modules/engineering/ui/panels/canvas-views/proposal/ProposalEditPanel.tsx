import React, { useState } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import {
  FileText, Eye, EyeOff, Download, Loader2,
  Plus, Trash2, GripVertical,
  User, Phone, Instagram, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TOGGLE COMPONENT
// =============================================================================

const VisibilityBadge: React.FC<{
  label: string;
  active: boolean;
  onToggle: () => void;
}> = ({ label, active, onToggle }) => (
  <button
    onClick={onToggle}
    title={active ? `Ocultar ${label} no PDF` : `Exibir ${label} no PDF`}
    className={cn(
      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border text-[10px] font-black uppercase tracking-wider transition-all duration-200 shrink-0',
      active
        ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20'
        : 'bg-slate-900/40 border-slate-800 text-slate-600 hover:text-slate-400',
    )}
  >
    {active ? <Eye size={10} /> : <EyeOff size={10} />}
    <span>{label}</span>
  </button>
);

// Section label helper
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
    {children}
  </label>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ProposalEditPanel: React.FC = () => {
  const proposalData       = useSolarStore(s => s.proposalData);
  const updateProposalData = useSolarStore(s => s.updateProposalData);
  const addLineItem        = useSolarStore(s => s.addLineItem);
  const removeLineItem     = useSolarStore(s => s.removeLineItem);
  const updateLineItem     = useSolarStore(s => s.updateLineItem);
  const addPaymentStage    = useSolarStore(s => s.addPaymentStage);
  const removePaymentStage = useSolarStore(s => s.removePaymentStage);
  const updatePaymentStage = useSolarStore(s => s.updatePaymentStage);
  const updateExecutionStage = useSolarStore(s => s.updateExecutionStage);
  const isExportingPdf     = useSolarStore(s => s.isExportingPdf);
  const setExportingPdf    = useSolarStore(s => s.setExportingPdf);

  const [draggingLineItem, setDraggingLineItem] = useState<string | null>(null);

  const totalPercentage = (proposalData.paymentStages || []).reduce((s, p) => s + (p.percentage || 0), 0);
  const percentageValid = !proposalData.paymentStages || proposalData.paymentStages.length === 0 || totalPercentage === 100;
  const lineItemsTotal  = (proposalData.lineItems || []).reduce((s, i) => s + (i.value ?? 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2 shrink-0">
        <FileText size={14} className="text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
          Dados da Proposta
        </span>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-4 custom-scrollbar">

        {/* ── Dimensionamento ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Texto de Apresentação</SectionLabel>
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-xs text-slate-300 font-medium outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
            placeholder="Descreva o padrão de instalação, diferenciais e garantias..."
            maxLength={600}
            value={proposalData.customText}
            onChange={e => updateProposalData({ customText: e.target.value })}
          />
          <div className="flex justify-end">
            <span className={cn(
              'text-xs font-bold uppercase tracking-widest',
              (proposalData.customText || '').length > 550 ? 'text-amber-500' : 'text-slate-700',
            )}>
              {(proposalData.customText || '').length} / 600
            </span>
          </div>
        </div>

        <div className="border-t border-slate-800/60" />

        {/* ── Itens de Investimento ────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Itens de Investimento</SectionLabel>
            <button
              onClick={() => addLineItem({ id: `li-${Date.now()}`, description: '', value: null, valueText: '' })}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              <Plus size={10} /> Adicionar
            </button>
          </div>

          {(proposalData.lineItems || []).map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggingLineItem(item.id)}
              onDragEnd={() => setDraggingLineItem(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggingLineItem || draggingLineItem === item.id) return;
                const items = [...(proposalData.lineItems || [])];
                const fromIdx = items.findIndex(i => i.id === draggingLineItem);
                const toIdx   = items.findIndex(i => i.id === item.id);
                const [moved] = items.splice(fromIdx, 1);
                items.splice(toIdx, 0, moved);
                updateProposalData({ lineItems: items });
                setDraggingLineItem(null);
              }}
              className={cn(
                'flex items-start gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-sm transition-opacity',
                draggingLineItem === item.id && 'opacity-40',
              )}
            >
              <GripVertical size={12} className="text-slate-500 mt-1.5 cursor-grab shrink-0 active:cursor-grabbing" />
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  className="w-full bg-transparent border-b border-slate-800 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500/50 pb-1"
                  placeholder="Descrição do item..."
                  value={item.description}
                  onChange={e => updateLineItem(item.id, { description: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-24 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50"
                    placeholder="R$ 0,00"
                    value={item.value ?? ''}
                    onChange={e => updateLineItem(item.id, { value: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                  <input
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-slate-400 outline-none focus:border-indigo-500/50"
                    placeholder="ou texto (ex: 6 MESES)"
                    value={item.valueText}
                    onChange={e => updateLineItem(item.id, { valueText: e.target.value })}
                  />
                </div>
              </div>
              <button onClick={() => removeLineItem(item.id)} className="text-slate-700 hover:text-red-400 transition-colors mt-1">
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {(proposalData.lineItems || []).length > 0 && (
            <div className="flex justify-end px-2">
              <span className="text-[10px] font-black text-indigo-400 tabular-nums">
                TOTAL: R$ {lineItemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* ── Etapas de Pagamento ───────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Etapas de Pagamento</SectionLabel>
            <button
              onClick={() => addPaymentStage({
                id: `ps-${Date.now()}`,
                label: `ETAPA ${proposalData.paymentStages.length + 1}`,
                value: 0,
                percentage: 0,
              })}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
            >
              <Plus size={10} /> Adicionar
            </button>
          </div>

          {(proposalData.paymentStages || []).map((stage) => (
            <div key={stage.id} className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded-sm flex-wrap sm:flex-nowrap">
              <input
                className="w-20 bg-transparent text-[11px] text-slate-300 font-bold outline-none border-b border-slate-800 focus:border-indigo-500/50"
                value={stage.label}
                onChange={e => updatePaymentStage(stage.id, { label: e.target.value })}
              />
              <input
                type="number"
                className="w-20 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50"
                placeholder="R$"
                value={stage.value || ''}
                onChange={e => updatePaymentStage(stage.id, { value: Number(e.target.value) })}
              />
              <div className="relative flex-1">
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50"
                  value={stage.percentage || ''}
                  onChange={e => updatePaymentStage(stage.id, { percentage: Number(e.target.value) })}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">%</span>
              </div>
              <button onClick={() => removePaymentStage(stage.id)} className="text-slate-700 hover:text-red-400">
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {(proposalData.paymentStages || []).length > 0 && (
            <div className={cn(
              'text-xs font-black uppercase tracking-widest text-right px-2 tabular-nums',
              percentageValid ? 'text-emerald-500' : 'text-red-400',
            )}>
              Total: {totalPercentage}% {!percentageValid && '(deve ser 100%)'}
            </div>
          )}
        </div>

        {/* ── Condições Comerciais ─────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Condições Comerciais</SectionLabel>
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-xs text-slate-300 font-medium outline-none focus:border-indigo-500/50 min-h-[60px] resize-none"
            placeholder="Uma condição por linha (máx. 8)..."
            value={(proposalData.paymentTerms || []).join('\n')}
            onChange={e => updateProposalData({ paymentTerms: e.target.value.split('\n').slice(0, 8) })}
          />
        </div>

        <div className="border-t border-slate-800/60" />

        {/* ── Cronograma de Execução ───────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Etapas de Execução</SectionLabel>
          {(proposalData.executionSchedule || []).map((stage) => (
            <div key={stage.id} className="flex flex-col gap-1.5 p-3 bg-slate-900/60 border border-slate-800 rounded-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-indigo-400 uppercase tracking-wider">{stage.label}</span>
                <span className="text-xs text-slate-600">·</span>
                <input
                  className="flex-1 bg-transparent text-xs text-slate-400 font-bold outline-none border-b border-slate-800 focus:border-indigo-500/50"
                  value={stage.sublabel}
                  onChange={e => updateExecutionStage(stage.id, { sublabel: e.target.value })}
                />
              </div>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50"
                placeholder="Duração (ex: 15 DIAS)"
                value={stage.durationText}
                onChange={e => updateExecutionStage(stage.id, { durationText: e.target.value })}
              />
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-xs text-slate-400 outline-none focus:border-indigo-500/50 min-h-[40px] resize-none"
                placeholder="Descrição da etapa..."
                value={stage.description}
                onChange={e => updateExecutionStage(stage.id, { description: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800/60" />

        {/* ── Responsável Técnico e Contato ────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Responsável Técnico</SectionLabel>
          <p className="text-xs text-slate-600 italic leading-relaxed">
            Aparece em todas as propostas geradas.
          </p>

          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <User size={10} /> Nome do Engenheiro
            </span>
            <input
              className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-500/50"
              value={proposalData.engineerName}
              onChange={e => updateProposalData({ engineerName: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Award size={10} /> Título
              </span>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-500/50"
                value={proposalData.engineerTitle}
                onChange={e => updateProposalData({ engineerTitle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">CREA</span>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-indigo-500/50"
                value={proposalData.engineerCrea}
                onChange={e => updateProposalData({ engineerCrea: e.target.value })}
                placeholder="CREA-PA: 000000000-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Phone size={10} /> WhatsApp
              </span>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-500/50"
                value={proposalData.contactPhone}
                onChange={e => updateProposalData({ contactPhone: e.target.value })}
                placeholder="(91) 99999-9999"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Instagram size={10} /> Instagram
              </span>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[11px] text-white outline-none focus:border-indigo-500/50"
                value={proposalData.contactInstagram}
                onChange={e => updateProposalData({ contactInstagram: e.target.value })}
                placeholder="@neonorte"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── Export Footer ──────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mr-1 shrink-0">PDF</span>
          <VisibilityBadge
            label="Preços"
            active={proposalData.showPricing}
            onToggle={() => updateProposalData({ showPricing: !proposalData.showPricing })}
          />
          <VisibilityBadge
            label="Mapa"
            active={proposalData.showMap}
            onToggle={() => updateProposalData({ showMap: !proposalData.showMap })}
          />
          <VisibilityBadge
            label="Comparativo"
            active={proposalData.showComparativePlans}
            onToggle={() => updateProposalData({ showComparativePlans: !proposalData.showComparativePlans })}
          />
        </div>

        <button
          onClick={() => setExportingPdf(true)}
          disabled={isExportingPdf}
          className={cn(
            'w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-indigo-950/40 border border-indigo-400/20 group',
            isExportingPdf && 'opacity-60 cursor-not-allowed',
          )}
        >
          {isExportingPdf
            ? <Loader2 size={14} className="animate-spin" />
            : <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />}
          <span className="text-xs font-black uppercase tracking-widest">
            {isExportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
          </span>
        </button>
      </div>
    </div>
  );
};
