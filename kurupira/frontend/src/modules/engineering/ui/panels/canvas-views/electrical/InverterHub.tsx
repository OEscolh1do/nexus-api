import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Zap, Plus, X, Search, Upload, ChevronDown, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInverterCompatibility } from '../../../../hooks/useInverterCompatibility';
import { type InverterCatalogItem } from '@/core/schemas/inverterSchema';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface InverterChipData {
  id: string;
  manufacturer: string;
  model: string;
  powerKw: number;
  mpptCount: number;
}

export type PillSeverity = 'ok' | 'warn' | 'error' | 'neutral';

export interface ValidationPill {
  label: string;
  value: string;
  severity: PillSeverity;
  tooltip?: string;
}

interface InverterHubProps {
  inverterChips: InverterChipData[];
  activeInverterId: string | null;
  onChipSelect: (id: string) => void;
  onChipRemove: (id: string) => void;
  /** Callback ao selecionar um inversor do catálogo */
  onSelectInverter: (item: InverterCatalogItem) => void;
  /** Callback para upload de .OND */
  onUploadOnd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** IDs de catálogo já ativos (para desabilitar no dropdown) */
  activeCatalogIds: string[];
  /** KPI pills derivados dos cálculos elétricos */
  pills: ValidationPill[];
  /** Estado global de saúde: ok | warn | error */
  globalHealth: 'ok' | 'warning' | 'error';
  /** FDI atual para a barra de aderência */
  fdi?: number;
  /** Potência CC total instalada (kWp) — para KPI P_CC */
  totalKwpCC?: number;
  /** Sincronização de Inventário (Módulos Alocados vs Físicos) */
  inventory?: {
    isSynced: boolean;
    placedCount: number;
    logicalCount: number;
    inventoryCount: number;
    remainingCount: number;
    difference: number;
    status: 'ok' | 'warning' | 'error';
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PILL COLORS
// ─────────────────────────────────────────────────────────────────────────────

const PILL_COLORS: Record<PillSeverity, string> = {
  ok:      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  warn:    'bg-amber-500/10 border-amber-500/30 text-amber-400',
  error:   'bg-red-500/10 border-red-500/30 text-red-400',
  neutral: 'bg-slate-800/60 border-slate-700 text-slate-500',
};

const PILL_DOT: Record<PillSeverity, string> = {
  ok:      'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
  warn:    'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
  error:   'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  neutral: 'bg-slate-600',
};



// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const InverterHub: React.FC<InverterHubProps> = ({
  inverterChips,
  activeInverterId,
  onChipSelect,
  onChipRemove,
  onSelectInverter,
  onUploadOnd,
  activeCatalogIds,
  pills,
  globalHealth,
  fdi = 0,
  totalKwpCC = 0,
  inventory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hook de compatibilidade (Catálogo Decorado)
  const catalog = useInverterCompatibility();

  // Filtragem local
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return catalog;
    return catalog.filter(inv =>
      inv.model.toLowerCase().includes(term) ||
      inv.manufacturer.toLowerCase().includes(term)
    );
  }, [catalog, searchTerm]);

  // Reset focus
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filtered, isOpen]);

  // Click outside closure
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        const item = filtered[focusedIndex];
        if (!activeCatalogIds.includes(item.id)) {
          handleInverterSelection(item);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleInverterSelection = (inv: any) => {
    if (inv.compatibility?.status === 'INCOMPATIBLE') {
      const confirmed = window.confirm(
        "Aviso do Sistema:\nEste inversor viola os limites operacionais recomendados para os módulos atuais.\n\nVocê assume a responsabilidade por esta seleção?"
      );
      if (!confirmed) return;
    }
    onSelectInverter(inv);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'RECOMMENDED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'ACCEPTABLE':  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'WARNING':     return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'INCOMPATIBLE': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:            return 'text-slate-500 bg-slate-900/50 border-slate-800';
    }
  };


  const totalPower = inverterChips.reduce((acc, c) => acc + c.powerKw, 0);

  // Aderência: no Kurupira, o FDI ideal é 1.1 a 1.35. 
  // Mostramos o FDI como uma barra de progresso onde 1.25 (ponto ótimo) é o alvo visual.
  // Normalizamos: 0 a 1.5 -> 0% a 100%
  const adherenceProgress = Math.min(100, (fdi / 1.5) * 100);

  return (
    <div className="bg-slate-900/50 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center shrink-0 z-20 min-h-[3.5rem] lg:h-14 relative">

      {/* PREFIX — ícone + contadores */}
      <div className="flex flex-col items-center justify-center gap-0.5 px-3 h-14 lg:h-full border-r border-slate-800 shrink-0">
        <Zap size={13} className="text-emerald-500" />
        <span className="text-[8px] text-slate-600 font-black tabular-nums leading-none">
          {inverterChips.length} INV
        </span>
      </div>

      {/* KPIs — P_CC / P_CA / FDI (espelho do ModuleSelectorHub) */}
      <div className="flex items-center gap-4 px-4 h-14 lg:h-full border-r border-slate-800 shrink-0 bg-slate-900/20">
        {/* P_CC */}
        <div className="flex flex-col justify-center">
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none mb-0.5">P_CC</span>
          <div className="flex items-baseline gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0" />
            <span className="text-[13px] font-mono font-black text-amber-400 tabular-nums">
              {totalKwpCC > 0 ? totalKwpCC.toFixed(2) : '—'}
            </span>
            <span className="text-[8px] text-slate-600 font-bold hidden sm:inline">kWp</span>
          </div>
        </div>
        {/* P_CA */}
        <div className="flex flex-col justify-center">
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none mb-0.5">P_CA</span>
          <div className="flex items-baseline gap-1">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full shadow-lg shrink-0',
              fdi >= 1.05 && fdi <= 1.35 ? 'bg-emerald-500 shadow-emerald-500/50' :
              fdi > 1.35 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-slate-600'
            )} />
            <span className={cn(
              'text-[13px] font-mono font-black tabular-nums',
              fdi >= 1.05 && fdi <= 1.35 ? 'text-emerald-400' :
              fdi > 1.35 ? 'text-amber-400' : 'text-slate-500'
            )}>
              {totalPower > 0 ? totalPower.toFixed(1) : '—'}
            </span>
            <span className="text-[8px] text-slate-600 font-bold hidden sm:inline">kW</span>
          </div>
        </div>
        {/* FDI */}
        {fdi > 0 && (
          <div className="flex flex-col justify-center">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none mb-0.5">FDI</span>
            <span className={cn(
              'text-[13px] font-mono font-black tabular-nums',
              fdi < 1.05 || fdi > 1.50 ? 'text-rose-400' :
              fdi <= 1.35 ? 'text-emerald-400' : 'text-amber-400'
            )}>
              {(fdi * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* INVENTORY / MODULE BALANCE - DUAL-STATE COCKPIT (TIER 3) */}
      {inventory && inventory.inventoryCount > 0 && (
        <div className="flex items-center px-4 h-14 lg:h-full border-r border-slate-800 shrink-0 bg-slate-900/10" title={inventory.message}>
          {inventory.remainingCount === 0 ? (
            // COLLAPSED COMPLETED STATE
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                100% Alocado ({inventory.inventoryCount})
              </span>
            </div>
          ) : inventory.remainingCount < 0 ? (
            // EXCEEDED STATE
            <div className="flex flex-col justify-center min-w-[150px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] text-rose-500 font-bold uppercase tracking-[0.15em] leading-none flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Orçamento Excedido
                </span>
                <span className="text-[9px] font-mono font-black text-rose-400 animate-pulse">
                  +{Math.abs(inventory.remainingCount)} Mód
                </span>
              </div>
              <div className="w-full h-1.5 bg-rose-950/50 rounded-full overflow-hidden flex border border-rose-900/50">
                <div className="h-full bg-rose-500 w-full shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
              </div>
            </div>
          ) : (
            // PENDING STATE (DUAL GAUGE)
            <div className="flex flex-col justify-center min-w-[160px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-none">
                  Alocados: <span className="text-slate-200">{inventory.logicalCount}</span>
                </span>
                <span className="text-[8px] text-amber-500 font-bold uppercase tracking-[0.15em] leading-none animate-pulse">
                  Restam: <span className="text-amber-400">{inventory.remainingCount}</span>
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex relative">
                <div 
                  className="h-full bg-sky-500 transition-all duration-500 ease-out"
                  style={{ width: `${(inventory.logicalCount / inventory.inventoryCount) * 100}%` }}
                />
              </div>
              <div className="text-[7px] text-slate-500 font-black tracking-[0.2em] uppercase mt-1.5 text-center w-full">
                Orçado: {inventory.inventoryCount} Módulos
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHIPS DE INVERSORES + COMBOBOX */}
      <div className="flex items-center flex-1 min-w-0 h-14 lg:h-full">

        {/* Chips */}
        <div className="flex items-center gap-1.5 px-3 overflow-x-auto custom-scrollbar h-full">
          {inverterChips.map(chip => {
            const isActive = chip.id === activeInverterId;
            return (
              <button
                key={chip.id}
                onClick={() => onChipSelect(chip.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 border rounded-sm transition-all shrink-0 group/chip h-8',
                  isActive
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                )}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse shrink-0" />
                )}
                <div className="flex flex-col items-start min-w-0">
                  <span className={cn(
                    'text-[10px] font-black uppercase tracking-tight leading-none truncate max-w-[140px]',
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  )}>
                    {chip.manufacturer} {chip.powerKw.toFixed(1)}kW
                  </span>
                  <span className="text-[9px] font-mono text-slate-600 leading-none mt-0.5">
                    {chip.mpptCount} MPPT
                  </span>
                </div>
                {/* Remove — duplo-clique confirma */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmDeleteId === chip.id) { onChipRemove(chip.id); setConfirmDeleteId(null); }
                    else { setConfirmDeleteId(chip.id); setTimeout(() => setConfirmDeleteId(null), 3000); }
                  }}
                  className={cn(
                    'p-2 lg:p-0.5 rounded-sm transition-all',
                    confirmDeleteId === chip.id
                      ? 'text-rose-400 bg-rose-500/20 opacity-100'
                      : 'text-slate-700 hover:text-rose-400 opacity-0 group-hover/chip:opacity-100'
                  )}
                  title={confirmDeleteId === chip.id ? 'Clique novamente para remover' : 'Remover inversor'}
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </button>
            );
          })}
        </div>

        {/* BOTÃO "+ Inversor" (Trigger do Dropdown) */}
        <div className="relative shrink-0 pr-3 pl-1.5" ref={dropdownRef}>
          <button
            onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 50); }}
            className={cn(
              "flex items-center gap-1.5 px-3 min-h-[44px] lg:min-h-0 lg:py-1.5 border border-dashed rounded-sm transition-all",
              isOpen
                ? "border-emerald-500/60 text-emerald-400 bg-emerald-950/20"
                : "border-slate-700 text-slate-600 hover:border-emerald-500/40 hover:text-emerald-500"
            )}
          >
            <Plus size={10} strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Inversor</span>
            <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
          </button>

          {/* DROPDOWN DE CATÁLOGO */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-[380px] bg-slate-950 border border-slate-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[450px]">
              {/* Search + Upload */}
              <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                <Search size={12} className="text-slate-600 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Fabricante ou modelo..."
                  className="flex-1 bg-transparent text-[11px] text-slate-300 font-mono uppercase tracking-wider focus:outline-none placeholder:text-slate-700 h-8"
                />
                <input type="file" accept=".ond" onChange={onUploadOnd} ref={fileInputRef} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2 py-1 border border-slate-700 hover:border-emerald-500 text-slate-500 hover:text-emerald-500 transition-colors rounded-sm h-8"
                  title="Importar arquivo .OND"
                >
                  <Upload size={10} />
                  <span className="text-[8px] font-black uppercase tracking-widest">OND</span>
                </button>
              </div>

              {/* Lista de Resultados */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.length === 0 ? (
                  <div className="p-6 flex flex-col items-center gap-2 text-center">
                    <Package size={20} className="text-slate-700" />
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      Nenhum inversor encontrado
                    </span>
                  </div>
                ) : (
                  filtered.map((inv, index) => {
                    const isAlreadyActive = activeCatalogIds.includes(inv.id);
                    const comp = inv.compatibility;
                    const statusClass = getStatusColor(comp?.status);

                    return (
                      <button
                        key={inv.id}
                        onClick={() => !isAlreadyActive && handleInverterSelection(inv)}
                        disabled={isAlreadyActive}
                        className={cn(
                          "w-full flex flex-col gap-1.5 px-3 py-2.5 border-b border-slate-900 transition-all text-left",
                          isAlreadyActive
                            ? "opacity-40 cursor-not-allowed bg-slate-950"
                            : index === focusedIndex
                              ? "bg-slate-800 border-emerald-500/50"
                              : "hover:bg-slate-900/60 cursor-pointer"
                        )}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                              {inv.manufacturer}
                            </span>
                            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight truncate">
                              {inv.model}
                            </span>
                          </div>
                          <div className={cn(
                            "px-1.5 py-0.5 border rounded-sm text-[7px] font-black uppercase tracking-widest shrink-0",
                            statusClass
                          )}>
                            {comp?.status === 'RECOMMENDED' ? 'Match OK' : 
                             comp?.status === 'INCOMPATIBLE' ? 'Incompatível' : 
                             comp?.status === 'WARNING' ? 'Atenção' : 'Aceitável'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Zap size={9} className="text-slate-600" />
                            <span className="text-[9px] font-mono text-emerald-500 font-bold">
                              {(inv.nominalPowerW / 1000).toFixed(1)}kW
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] font-mono text-slate-500">
                              FDI: {comp ? (comp.fdi * 100).toFixed(0) : '--'}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] font-mono text-slate-500">
                              {Array.isArray(inv.mppts) ? inv.mppts.length : (inv.mppts || 1)} MPPT
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI PILLS — separador + pills de validação */}
      {pills.length > 0 && (
        <div className="flex items-center gap-2 px-4 h-14 lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
          {pills.map((pill, i) => (
            <div
              key={i}
              title={pill.tooltip}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 border rounded-sm text-[10px] font-mono font-bold shrink-0 cursor-default',
                PILL_COLORS[pill.severity]
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PILL_DOT[pill.severity])} />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{pill.label}</span>
              <span className="tabular-nums leading-none">{pill.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ADHERENCE BAR — herança da view de módulos */}
      <div className="absolute bottom-[-1px] left-0 h-[2px] w-full bg-slate-950 overflow-hidden z-10">
        <div
          className={cn(
            'h-full transition-all duration-700 ease-out', 
            globalHealth === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
            globalHealth === 'warning' ? 'bg-amber-500' : 'bg-rose-600'
          )}
          style={{ width: `${adherenceProgress}%` }}
        />
        {/* Marcador de FDI Ideal (1.1 - 1.35) */}
        <div 
          className="absolute top-0 h-full border-l border-emerald-400/30 w-[16%]" 
          style={{ left: `${(1.1/1.5)*100}%` }}
          title="Faixa Ideal de FDI (1.1 a 1.35)"
        />
      </div>
    </div>
  );
};
