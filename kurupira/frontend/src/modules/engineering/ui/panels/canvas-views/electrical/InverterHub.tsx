import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Zap, Plus, X, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  catalogInverters: InverterCatalogItem[];
  isLoading?: boolean;
  onAddInverter: (item: InverterCatalogItem) => void;
  activeInverterIds: string[];
  /** KPI pills derivados dos cálculos elétricos */
  pills: ValidationPill[];
  /** Estado global de saúde: ok | warn | error */
  globalHealth: 'ok' | 'warning' | 'error';
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

const HEALTH_BAR: Record<string, string> = {
  ok:      'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const InverterHub: React.FC<InverterHubProps> = ({
  inverterChips,
  activeInverterId,
  onChipSelect,
  onChipRemove,
  catalogInverters,
  isLoading = false,
  onAddInverter,
  activeInverterIds,
  pills,
  globalHealth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return catalogInverters;
    return catalogInverters.filter(i =>
      i.model.toLowerCase().includes(term) ||
      i.manufacturer.toLowerCase().includes(term) ||
      (i.nominalPowerW / 1000).toFixed(1).includes(term)
    );
  }, [catalogInverters, searchTerm]);

  useEffect(() => { setFocusedIndex(-1); }, [filtered, isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        const item = filtered[focusedIndex];
        if (!activeInverterIds.includes(item.id)) { onAddInverter(item); setIsOpen(false); setSearchTerm(''); }
      }
    } else if (e.key === 'Escape') { setIsOpen(false); }
  };

  const totalStrings = inverterChips.reduce((acc, c) => acc + c.mpptCount, 0);

  return (
    <div className="bg-slate-900/50 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center shrink-0 z-20 min-h-[3.5rem] lg:h-14 relative">

      {/* PREFIX — ícone + contadores */}
      <div className="flex flex-col items-center justify-center gap-0.5 px-3 h-14 lg:h-full border-r border-slate-800 shrink-0">
        <Zap size={13} className="text-emerald-500" />
        <span className="text-[8px] text-slate-600 font-black tabular-nums leading-none">
          {inverterChips.length} INV
        </span>
        {totalStrings > 0 && (
          <span className="text-[7px] text-slate-700 font-bold tabular-nums leading-none">
            {totalStrings} MPPT
          </span>
        )}
      </div>

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

        {/* COMBOBOX "+ Inversor" */}
        <div className="relative shrink-0 pr-3 pl-1.5" ref={dropdownRef}>
          <button
            id="inverter-add-trigger"
            onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 50); }}
            className={cn(
              'flex items-center gap-1.5 px-3 min-h-[44px] lg:min-h-0 lg:py-1.5 border border-dashed rounded-sm transition-all',
              isOpen
                ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/20'
                : 'border-slate-700 text-slate-600 hover:border-emerald-500/40 hover:text-emerald-500'
            )}
          >
            <Plus size={10} strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Inversor</span>
            <ChevronDown size={10} className={cn('transition-transform', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-[360px] bg-slate-950 border border-slate-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[400px]">
              <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                <Search size={12} className="text-slate-600 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Fabricante, modelo, potência..."
                  className="flex-1 min-h-[44px] lg:min-h-0 bg-transparent text-[11px] text-slate-300 font-mono uppercase tracking-wider focus:outline-none placeholder:text-slate-700"
                />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Carregando catálogo...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Nenhum inversor encontrado
                  </div>
                ) : filtered.map((item, index) => {
                  const isAlready = activeInverterIds.includes(item.id);
                  const mpptCount = Array.isArray(item.mppts) ? item.mppts.length : (item.mppts as number) || 1;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if (!isAlready) { onAddInverter(item); setIsOpen(false); setSearchTerm(''); } }}
                      disabled={isAlready}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] lg:min-h-0 border-b border-slate-900 transition-all text-left',
                        isAlready
                          ? 'opacity-40 cursor-not-allowed bg-slate-950'
                          : index === focusedIndex
                            ? 'bg-slate-800 border-emerald-500/50'
                            : 'hover:bg-slate-900/60 cursor-pointer'
                      )}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight truncate">
                            {item.manufacturer}
                          </span>
                          <span className="text-[10px] font-black text-emerald-500 font-mono">
                            {(item.nominalPowerW / 1000).toFixed(1)}kW
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                          {item.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[9px] font-mono text-slate-600">
                        <span>{mpptCount} MPPT</span>
                        {isAlready && <span className="text-[7px] text-emerald-500 font-black uppercase tracking-widest">ATIVO</span>}
                      </div>
                    </button>
                  );
                })}
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

      {/* HEALTH BAR — bottom border colorida */}
      <div className="absolute bottom-[-1px] left-0 h-[2px] w-full overflow-hidden z-10">
        <div
          className={cn('h-full w-full transition-colors duration-500', HEALTH_BAR[globalHealth])}
          style={{ opacity: globalHealth === 'ok' ? 0.7 : 1 }}
        />
      </div>
    </div>
  );
};
