import React, { useState } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import {
  FileText, Eye, EyeOff, Download, Loader2,
  Plus, Trash2, GripVertical, ChevronDown,
  User, Phone, Instagram, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// PAGE INDEX CONFIG
// =============================================================================

const PAGE_LABELS = ['Capa', 'Investimento', 'Dimensionamento', 'Cronograma', 'Encerramento'] as const;

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
      "flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[9px] font-black uppercase tracking-wider transition-all duration-200",
      active
        ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20"
        : "bg-slate-900/40 border-slate-800 text-slate-600 hover:text-slate-400"
    )}
  >
    {active ? <Eye size={10} /> : <EyeOff size={10} />}
    <span>{label}</span>
  </button>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ProposalEditPanel: React.FC = () => {
  const proposalData = useSolarStore(s => s.proposalData);
  const updateProposalData = useSolarStore(s => s.updateProposalData);
  const activePage = useSolarStore(s => s.proposalActivePage);
  const setActivePage = useSolarStore(s => s.setProposalActivePage);
  const addLineItem = useSolarStore(s => s.addLineItem);
  const removeLineItem = useSolarStore(s => s.removeLineItem);
  const updateLineItem = useSolarStore(s => s.updateLineItem);
  const addPaymentStage = useSolarStore(s => s.addPaymentStage);
  const removePaymentStage = useSolarStore(s => s.removePaymentStage);
  const updatePaymentStage = useSolarStore(s => s.updatePaymentStage);
  const updateExecutionStage = useSolarStore(s => s.updateExecutionStage);
  const isExportingPdf = useSolarStore(s => s.isExportingPdf);
  const setExportingPdf = useSolarStore(s => s.setExportingPdf);

  const [isSaving, setIsSaving] = useState(false);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  // Payment stages validation
  const totalPercentage = (proposalData.paymentStages || []).reduce((s, p) => s + (p.percentage || 0), 0);
  const percentageValid = !proposalData.paymentStages || proposalData.paymentStages.length === 0 || totalPercentage === 100;

  // Line items total
  const lineItemsTotal = (proposalData.lineItems || []).reduce((s, i) => s + (i.value ?? 0), 0);

  const handleExportPdf = () => {
    setExportingPdf(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Header & Navigation ─────────────────────────────────────── */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/40 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              Proposta
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => updateProposalData({ excludedPages: [] })}
              className="text-[7px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800/50 rounded-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Incluir todas as páginas"
            >
              Todas
            </button>
            <button 
              onClick={() => updateProposalData({ excludedPages: [2, 3] })}
              className="text-[7px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800/50 rounded-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Ocultar dimensionamento e cronograma"
            >
              Comercial
            </button>
            <button 
              onClick={() => updateProposalData({ excludedPages: [1] })}
              className="text-[7px] font-black uppercase tracking-widest px-2 py-1 bg-slate-800/50 rounded-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Ocultar valores de investimento"
            >
              Viabilidade
            </button>
            {isSaving && (
              <Loader2 size={10} className="text-emerald-500 animate-spin ml-1" />
            )}
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}
            className="w-full flex items-center justify-between p-2 border border-slate-700/50 bg-slate-950/50 rounded-sm hover:border-indigo-500/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[8px] font-black">
                {activePage + 1}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                {PAGE_LABELS[activePage]}
              </span>
              {proposalData.excludedPages?.includes(activePage) && (
                <span className="text-[8px] font-bold text-amber-500 ml-2 border border-amber-500/30 px-1.5 rounded-sm bg-amber-500/10">
                  Oculto
                </span>
              )}
            </div>
            <ChevronDown size={14} className={cn("text-slate-500 transition-transform", isPageMenuOpen && "rotate-180")} />
          </button>

          {isPageMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0f1a] border border-slate-700 rounded-sm shadow-2xl z-50 flex flex-col py-1">
              {PAGE_LABELS.map((label, i) => {
                const isExcluded = proposalData.excludedPages?.includes(i);
                const isActive = activePage === i;
                return (
                  <div key={label} className="flex items-center group px-1">
                    <button
                      onClick={() => { setActivePage(i); setIsPageMenuOpen(false); }}
                      className={cn(
                        "flex-1 flex items-center gap-2 p-2 rounded-sm text-left transition-colors",
                        isActive ? "bg-indigo-500/10" : "hover:bg-slate-800/50"
                      )}
                    >
                      <span className={cn(
                        "w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black",
                        isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500",
                        isExcluded && !isActive && "opacity-40"
                      )}>
                        {i + 1}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        isActive ? "text-indigo-400" : "text-slate-400",
                        isExcluded && "opacity-40 line-through"
                      )}>
                        {label}
                      </span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const current = proposalData.excludedPages || [];
                        const next = isExcluded 
                          ? current.filter(idx => idx !== i)
                          : [...current, i];
                        updateProposalData({ excludedPages: next });
                      }}
                      className={cn(
                        "p-2 rounded-sm transition-colors",
                        isExcluded ? "text-slate-600 hover:text-indigo-400" : "text-indigo-500 hover:text-indigo-400"
                      )}
                      title={isExcluded ? "Incluir no PDF" : "Remover do PDF"}
                    >
                      {isExcluded ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Contextual Fields ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">

        {/* PAGE 0 — Capa (read-only) */}
        {activePage === 0 && (
          <div className="flex flex-col gap-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Dados da Capa
            </label>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Todos os campos da capa são automáticos (nome do cliente, código do projeto, potência e geração).
            </p>
            <button className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider hover:underline text-left">
              Editar dados do cliente →
            </button>
          </div>
        )}

        {/* PAGE 1 — Investimento */}
        {activePage === 1 && (
          <>
            {/* Line Items */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                  Itens de Investimento
                </label>
                <button
                  onClick={() => addLineItem({
                    id: `li-${Date.now()}`,
                    description: '',
                    value: null,
                    valueText: '',
                  })}
                  className="flex items-center gap-1 text-[8px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                >
                  <Plus size={10} /> Adicionar
                </button>
              </div>

              {(proposalData.lineItems || []).map((item) => (
                <div key={item.id} className="flex items-start gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-sm">
                  <GripVertical size={12} className="text-slate-700 mt-1.5 cursor-grab shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      className="w-full bg-transparent border-b border-slate-800 text-[10px] text-slate-300 font-bold outline-none focus:border-indigo-500/50 pb-1"
                      placeholder="Descrição do item..."
                      value={item.description}
                      onChange={e => updateLineItem(item.id, { description: e.target.value })}
                      onBlur={handleSave}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="w-24 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] text-white font-mono outline-none focus:border-indigo-500/50"
                        placeholder="R$ 0,00"
                        value={item.value ?? ''}
                        onChange={e => {
                          const v = e.target.value === '' ? null : Number(e.target.value);
                          updateLineItem(item.id, { value: v });
                        }}
                        onBlur={handleSave}
                      />
                      <input
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] text-slate-400 outline-none focus:border-indigo-500/50"
                        placeholder="ou texto (ex: 6 MESES)"
                        value={item.valueText}
                        onChange={e => updateLineItem(item.id, { valueText: e.target.value })}
                        onBlur={handleSave}
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

            {/* Payment Stages */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                  Etapas de Pagamento
                </label>
                <button
                  onClick={() => addPaymentStage({
                    id: `ps-${Date.now()}`,
                    label: `ETAPA ${proposalData.paymentStages.length + 1}`,
                    value: 0,
                    percentage: 0,
                  })}
                  className="flex items-center gap-1 text-[8px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                >
                  <Plus size={10} /> Adicionar
                </button>
              </div>

              {(proposalData.paymentStages || []).map((stage) => (
                <div key={stage.id} className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-sm flex-wrap sm:flex-nowrap">
                  <input
                    className="w-20 bg-transparent text-[10px] text-slate-300 font-bold outline-none border-b border-slate-800 focus:border-indigo-500/50"
                    value={stage.label}
                    onChange={e => updatePaymentStage(stage.id, { label: e.target.value })}
                    onBlur={handleSave}
                  />
                  <input
                    type="number"
                    className="w-20 bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] text-white font-mono outline-none focus:border-indigo-500/50"
                    placeholder="R$"
                    value={stage.value || ''}
                    onChange={e => updatePaymentStage(stage.id, { value: Number(e.target.value) })}
                    onBlur={handleSave}
                  />
                  <div className="relative flex-1">
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] text-white font-mono outline-none focus:border-indigo-500/50"
                      value={stage.percentage || ''}
                      onChange={e => updatePaymentStage(stage.id, { percentage: Number(e.target.value) })}
                      onBlur={handleSave}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600">%</span>
                  </div>
                  <button onClick={() => removePaymentStage(stage.id)} className="text-slate-700 hover:text-red-400">
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}

              {(proposalData.paymentStages || []).length > 0 && (
                <div className={cn(
                  "text-[9px] font-black uppercase tracking-widest text-right px-2",
                  percentageValid ? "text-emerald-500" : "text-red-400"
                )}>
                  Total: {totalPercentage}% {!percentageValid && '(deve ser 100%)'}
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Condições Comerciais
              </label>
              <textarea
                className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-[11px] text-slate-300 font-medium outline-none focus:border-indigo-500/50 min-h-[80px] resize-none"
                placeholder="Uma condição por linha (máx. 8)..."
                value={(proposalData.paymentTerms || []).join('\n')}
                onChange={e => {
                  const lines = e.target.value.split('\n').slice(0, 8);
                  updateProposalData({ paymentTerms: lines });
                }}
                onBlur={handleSave}
              />
            </div>
          </>
        )}

        {/* PAGE 2 — Dimensionamento */}
        {activePage === 2 && (
          <div className="flex flex-col gap-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Padrão Neonorte / Texto de Apresentação
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-sm p-3 text-[11px] text-slate-300 font-medium outline-none focus:border-indigo-500/50 min-h-[120px] resize-none"
              placeholder="Descreva o padrão de instalação, diferenciais e garantias..."
              maxLength={600}
              value={proposalData.customText}
              onChange={e => updateProposalData({ customText: e.target.value })}
              onBlur={handleSave}
            />
            <div className="flex justify-end">
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-widest",
                (proposalData.customText || '').length > 550 ? "text-amber-500" : "text-slate-700"
              )}>
                {(proposalData.customText || '').length} / 600
              </span>
            </div>
          </div>
        )}

        {/* PAGE 3 — Cronograma */}
        {activePage === 3 && (
          <div className="flex flex-col gap-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Etapas de Execução
            </label>
            {(proposalData.executionSchedule || []).map((stage) => (
              <div key={stage.id} className="flex flex-col gap-1.5 p-3 bg-slate-900/60 border border-slate-800 rounded-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">{stage.label}</span>
                  <span className="text-[8px] text-slate-600">·</span>
                  <input
                    className="flex-1 bg-transparent text-[9px] text-slate-400 font-bold outline-none border-b border-slate-800 focus:border-indigo-500/50"
                    value={stage.sublabel}
                    onChange={e => updateExecutionStage(stage.id, { sublabel: e.target.value })}
                    onBlur={handleSave}
                  />
                </div>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] text-white font-mono outline-none focus:border-indigo-500/50"
                  placeholder="Duração (ex: 15 DIAS)"
                  value={stage.durationText}
                  onChange={e => updateExecutionStage(stage.id, { durationText: e.target.value })}
                  onBlur={handleSave}
                />
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm p-2 text-[10px] text-slate-400 outline-none focus:border-indigo-500/50 min-h-[40px] resize-none"
                  placeholder="Descrição da etapa..."
                  value={stage.description}
                  onChange={e => updateExecutionStage(stage.id, { description: e.target.value })}
                  onBlur={handleSave}
                />
              </div>
            ))}
          </div>
        )}

        {/* PAGE 4 — Encerramento */}
        {activePage === 4 && (
          <div className="flex flex-col gap-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              Responsável Técnico e Contato
            </label>
            <p className="text-[8px] text-slate-600 italic leading-relaxed">
              Estes dados são salvos no perfil da empresa e aparecem em todas as propostas.
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <User size={10} /> Nome do Engenheiro
              </span>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                value={proposalData.engineerName}
                onChange={e => updateProposalData({ engineerName: e.target.value })}
                onBlur={handleSave}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Award size={10} /> Título
                </span>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                  value={proposalData.engineerTitle}
                  onChange={e => updateProposalData({ engineerTitle: e.target.value })}
                  onBlur={handleSave}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">CREA</span>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500/50"
                  value={proposalData.engineerCrea}
                  onChange={e => updateProposalData({ engineerCrea: e.target.value })}
                  onBlur={handleSave}
                  placeholder="CREA-PA: 000000000-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={10} /> WhatsApp
                </span>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                  value={proposalData.contactPhone}
                  onChange={e => updateProposalData({ contactPhone: e.target.value })}
                  onBlur={handleSave}
                  placeholder="(91) 99999-9999"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Instagram size={10} /> Instagram
                </span>
                <input
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                  value={proposalData.contactInstagram}
                  onChange={e => updateProposalData({ contactInstagram: e.target.value })}
                  onBlur={handleSave}
                  placeholder="@neonorte"
                />
              </div>
            </div>
          </div>
        )}
      </div>



      {/* ── Export Footer ──────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-800 bg-[#0a0f1a] flex flex-col gap-3">

        {/* Badge Strip de Visibilidade */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mr-1">PDF</span>
          <VisibilityBadge
            label="Preços"
            active={proposalData.showPricing}
            onToggle={() => { updateProposalData({ showPricing: !proposalData.showPricing }); handleSave(); }}
          />
          <VisibilityBadge
            label="Mapa"
            active={proposalData.showMap}
            onToggle={() => { updateProposalData({ showMap: !proposalData.showMap }); handleSave(); }}
          />
          <VisibilityBadge
            label="Comparativo"
            active={proposalData.showComparativePlans}
            onToggle={() => { updateProposalData({ showComparativePlans: !proposalData.showComparativePlans }); handleSave(); }}
          />
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className={cn(
            "w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-indigo-950/40 border border-indigo-400/20 group",
            isExportingPdf && "opacity-60 cursor-not-allowed"
          )}
        >
          {isExportingPdf ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          )}
          <div className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-black uppercase tracking-widest">
              {isExportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
            </span>
            {!isExportingPdf && (
              <span className="text-[8px] text-indigo-200 font-bold mt-0.5">
                {PAGE_LABELS.length - (proposalData.excludedPages?.length || 0)}/{PAGE_LABELS.length} PÁGINAS SELECIONADAS
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
