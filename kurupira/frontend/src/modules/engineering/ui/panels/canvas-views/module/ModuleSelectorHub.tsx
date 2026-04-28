import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Search, Upload, X, Sun, ChevronDown, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';

interface ArrayChip {
  id: string;
  model: string;
  manufacturer: string;
  power: number;
  quantity: number;
  totalKwp: number;
}

interface ModuleSelectorHubProps {
  /** Chips representando os arranjos ativos no projeto */
  arrayChips: ArrayChip[];
  /** Chip atualmente selecionado (em foco) */
  activeChipId: string | null;
  /** Callback ao clicar num chip */
  onChipSelect: (chipId: string) => void;
  /** Callback ao remover um arranjo */
  onChipRemove: (chipId: string) => void;
  /** Módulos filtrados do catálogo */
  catalogModules: ModuleCatalogItem[];
  /** Se o catálogo está carregando */
  isLoading: boolean;
  /** Callback ao selecionar um módulo do catálogo */
  onSelectModule: (item: ModuleCatalogItem) => void;
  /** Modelos já ativos (para desabilitar no dropdown) */
  activeModuleModels: string[];
  /** KPIs */
  kWpAlvo: number;
  kWpInstalado: number;
  /** Upload .PAN */
  onUploadPan: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ModuleSelectorHub: React.FC<ModuleSelectorHubProps> = ({
  arrayChips,
  activeChipId,
  onChipSelect,
  onChipRemove,
  catalogModules,
  isLoading,
  onSelectModule,
  activeModuleModels,
  kWpAlvo,
  kWpInstalado,
  onUploadPan,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered modules
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return catalogModules;
    return catalogModules.filter(m =>
      m.model.toLowerCase().includes(term) ||
      m.manufacturer.toLowerCase().includes(term) ||
      m.electrical.pmax.toString().includes(term)
    );
  }, [catalogModules, searchTerm]);

  // Reset focus when list or visibility changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filtered, isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const aderencia = kWpAlvo > 0 ? (kWpInstalado / kWpAlvo) * 100 : 0;
  const isMetTarget = aderencia >= 98;

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
        if (!activeModuleModels.includes(item.model)) {
          onSelectModule(item);
          setIsOpen(false);
          setSearchTerm('');
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-slate-900/50 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center shrink-0 z-20 min-h-[3.5rem] lg:h-14 relative">

      {/* LEFT: ComboBox + Chips */}
      <div className="flex items-center flex-1 min-w-0 h-14 lg:h-full">

        {/* Prefix Icon */}
        <div className="flex flex-col items-center justify-center gap-0.5 px-3 h-full border-r border-slate-800 shrink-0">
          <Sun size={13} className="text-amber-500" />
          <span className="text-[8px] text-slate-600 font-black tabular-nums leading-none">
            {arrayChips.length} ARR
          </span>
        </div>

        {/* KPIs (Alvo e Instalado) */}
        <div className="flex items-center gap-4 px-4 h-full border-r border-slate-800 shrink-0 bg-slate-900/20">
          <div className="flex flex-col justify-center">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none mb-0.5">Alvo</span>
            <div className="flex items-baseline gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)] animate-pulse" />
              <span className="text-[13px] font-mono font-black text-indigo-400 tabular-nums">{kWpAlvo.toFixed(2)}</span>
              <span className="text-[8px] text-slate-600 font-bold hidden sm:inline">kWp</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none mb-0.5">Instalado</span>
            <div className="flex items-baseline gap-1">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shadow-lg",
                isMetTarget ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50"
              )} />
              <span className={cn(
                "text-[13px] font-mono font-black tabular-nums",
                isMetTarget ? "text-emerald-400" : "text-amber-400"
              )}>
                {kWpInstalado.toFixed(2)}
              </span>
              <span className="text-[8px] text-slate-600 font-bold hidden sm:inline">kWp</span>
            </div>
          </div>
        </div>

        {/* Arrangement Chips */}
        <div className="flex items-center gap-1.5 px-3 overflow-x-auto custom-scrollbar h-full">
          {arrayChips.map(chip => {
            const isActive = chip.id === activeChipId;
            return (
              <button
                key={chip.id}
                onClick={() => onChipSelect(chip.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 border rounded-sm transition-all shrink-0 group/chip",
                  isActive
                    ? "bg-amber-950/30 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                )}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse shrink-0" />
                )}
                <div className="flex flex-col items-start min-w-0">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tight leading-none truncate max-w-[120px]",
                    isActive ? "text-amber-400" : "text-slate-400"
                  )}>
                    {chip.manufacturer} {chip.power}W
                  </span>
                  <span className="text-[9px] font-mono text-slate-600 tabular-nums leading-none mt-0.5">
                    ×{chip.quantity} · {chip.totalKwp.toFixed(1)} kWp
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmDeleteId === chip.id) {
                      onChipRemove(chip.id);
                      setConfirmDeleteId(null);
                    } else {
                      setConfirmDeleteId(chip.id);
                      setTimeout(() => setConfirmDeleteId(null), 3000);
                    }
                  }}
                  className={cn(
                    "p-2 lg:p-0.5 rounded-sm transition-all",
                    confirmDeleteId === chip.id
                      ? "text-rose-400 bg-rose-500/20 opacity-100 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                      : "text-slate-700 hover:text-rose-400 opacity-0 group-hover/chip:opacity-100"
                  )}
                  title={confirmDeleteId === chip.id ? "Clique novamente para remover" : "Remover arranjo"}
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </button>
            );
          })}
        </div>

        {/* Add Module Button (ComboBox Trigger) */}
        <div className="relative shrink-0 pr-3 pl-1.5" ref={dropdownRef}>
            <button
              onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 50); }}
              className={cn(
                "flex items-center gap-1.5 px-3 min-h-[44px] lg:min-h-0 lg:py-1.5 border border-dashed rounded-sm transition-all",
                isOpen
                  ? "border-amber-500/60 text-amber-400 bg-amber-950/20"
                  : "border-slate-700 text-slate-600 hover:border-amber-500/40 hover:text-amber-500"
              )}
            >
              <Plus size={10} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Módulo</span>
              <ChevronDown size={10} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-[340px] bg-slate-950 border border-slate-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[400px]">
                {/* Search Input */}
                <div className="p-2 border-b border-slate-800 flex items-center gap-2">
                  <Search size={12} className="text-slate-600 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Buscar modelo, fabricante, potência..."
                    className="flex-1 min-h-[44px] lg:min-h-0 lg:py-1 bg-transparent text-[11px] text-slate-300 font-mono uppercase tracking-wider focus:outline-none placeholder:text-slate-700"
                  />
                  {/* Upload .PAN inline */}
                  <input type="file" accept=".pan" onChange={onUploadPan} ref={fileInputRef} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 lg:px-1.5 py-2 lg:py-0.5 border border-slate-700 hover:border-amber-500 text-slate-500 hover:text-amber-500 transition-colors rounded-sm min-h-[44px] lg:min-h-0"
                    title="Importar arquivo .PAN"
                  >
                    <Upload size={10} />
                    <span className="text-[8px] font-black uppercase tracking-widest">PAN</span>
                  </button>
                </div>

                {/* Module List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {isLoading ? (
                    <div className="p-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                      Carregando catálogo...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-6 flex flex-col items-center gap-2 text-center">
                      <Package size={20} className="text-slate-700" />
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Nenhum módulo encontrado
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 flex items-center gap-1.5 px-4 lg:px-3 py-2 lg:py-1.5 border border-dashed border-amber-500/40 text-amber-500 text-[9px] font-black uppercase tracking-widest hover:bg-amber-950/20 transition-all min-h-[44px] lg:min-h-0"
                      >
                        <Upload size={10} /> Importar .PAN
                      </button>
                    </div>
                  ) : (
                    filtered.map((item, index) => {
                      const isAlreadyActive = activeModuleModels.includes(item.model);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (!isAlreadyActive) {
                              onSelectModule(item);
                              setIsOpen(false);
                              setSearchTerm('');
                            }
                          }}
                          disabled={isAlreadyActive}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] lg:min-h-0 border-b border-slate-900 transition-all text-left",
                            isAlreadyActive
                              ? "opacity-40 cursor-not-allowed bg-slate-950"
                              : index === focusedIndex
                                ? "bg-slate-800 border-amber-500/50"
                                : "hover:bg-slate-900/60 cursor-pointer"
                          )}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight truncate">
                                {item.manufacturer}
                              </span>
                              <span className="text-[10px] font-black text-amber-500 font-mono">
                                {item.electrical.pmax}W
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                              {item.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-[9px] font-mono text-slate-600">
                            <span>η{((item.electrical.efficiency ?? 0) * 100).toFixed(1)}%</span>
                            <span>{item.electrical.voc.toFixed(0)}V</span>
                          </div>
                          {isAlreadyActive && (
                            <span className="text-[7px] text-amber-500 font-black uppercase tracking-widest">ATIVO</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Global Target Bar */}
      <div className="absolute bottom-[-1px] left-0 h-[2px] w-full bg-transparent overflow-visible z-10">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-in-out relative",
            isMetTarget ? "bg-emerald-500" : "bg-amber-500"
          )}
          style={{ width: `${Math.min(aderencia, 100)}%` }}
        >
          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 blur-[2px] opacity-70",
            isMetTarget ? "bg-emerald-400" : "bg-amber-400"
          )} />
        </div>
      </div>
    </div>
  );
};
