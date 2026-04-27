import React from 'react';
import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';
import { cn } from '@/lib/utils';
import { Activity, Zap, Cpu } from 'lucide-react';

interface ModuleCardProps {
  item: ModuleCatalogItem;
  isSelected: boolean;
  minQty: number;
  estGen: number;
  onSelect: (item: ModuleCatalogItem) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  searchTerm: string;
  isComparing?: boolean;
  onToggleCompare?: (id: string) => void;
}

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) return text;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <span key={i} className="bg-amber-500/30 text-amber-200">{part}</span> 
          : part
      )}
    </span>
  );
};

export const ModuleCard: React.FC<ModuleCardProps> = ({
  item,
  isSelected,
  minQty,
  estGen,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  searchTerm,
  isComparing,
  onToggleCompare
}) => {
  const pmod = item.electrical.pmax;
  const efficiency = (item.electrical.efficiency ?? 0) * 100;
  const isBifacial = item.electrical.bifacial;
  const techLabel = isBifacial ? 'BIFACIAL' : 'MONO-PERC';

  return (
    <div 
      onClick={() => onSelect(item)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative flex flex-col bg-gradient-to-br from-slate-900/80 to-slate-950/60 backdrop-blur-md border transition-all duration-300 cursor-pointer overflow-hidden rounded-none",
        "hover:bg-slate-900/90 hover:translate-x-0.5",
        isSelected 
          ? "border-amber-500/50 bg-amber-950/5 shadow-[0_0_15px_rgba(245,158,11,0.05)]" 
          : "border-slate-800/60 hover:border-slate-700"
      )}
    >
      {/* Linha de Status & Título (Cockpit Style) */}
      <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-slate-800/40 bg-slate-950/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex flex-col">
             <span className="text-[10px] font-black text-slate-100 font-mono tracking-tight truncate">
                {highlightText(item.manufacturer, searchTerm)}
             </span>
             <span className="text-[8px] text-amber-500 font-black tracking-widest mt-[-2px]">
                {pmod}WP
             </span>
          </div>
          <div className="w-px h-3 bg-slate-800 mx-1" />
          <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.5 font-mono font-black shrink-0">
            {minQty} UN
          </span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isSelected && (
             <div className="flex items-center gap-1.5 bg-amber-500/5 px-1.5 py-0.5 border border-amber-500/10">
               <span className="text-[7px] text-amber-500 font-black tracking-widest uppercase">ATIVO</span>
               <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
             </div>
          )}
          {isComparing !== undefined && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare?.(item.id);
              }}
              className={cn(
                "p-1 border transition-all duration-300",
                isComparing 
                  ? "bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                  : "bg-slate-950/50 border-slate-800 text-slate-500 hover:border-amber-500/50 hover:text-amber-500"
              )}
            >
              <Activity size={10} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Telemetria & Metadados Técnicos */}
      <div className="px-2.5 py-2.5 relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu size={8} className="text-slate-600" />
              <p className="text-[9px] text-slate-400 font-bold uppercase truncate leading-none tracking-tight">
                {highlightText(item.model, searchTerm)}
              </p>
            </div>
            
            {/* Grid de Performance em Linha Única */}
            <div className="flex items-center gap-4 text-[9px] font-mono">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                  <Zap size={7} className="text-amber-500/60" />
                  <span className="text-[6px] font-black uppercase tracking-widest">GEN</span>
                </div>
                <span className="text-slate-100 font-black">{estGen.toFixed(1)}<span className="text-[7px] ml-0.5 text-slate-500 font-normal">kWh</span></span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                  <Activity size={7} className="text-emerald-500/60" />
                  <span className="text-[6px] font-black uppercase tracking-widest">EFIC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black">{efficiency.toFixed(1)}%</span>
                  {/* Micro barra de eficiência visual */}
                  <div className="w-8 h-[2px] bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className="h-full bg-emerald-500/60" 
                      style={{ width: `${(efficiency / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge de Tech Minimalista */}
          <div className="flex flex-col items-end gap-1.5 self-end">
            <span className={cn(
              "text-[7px] px-1.5 py-0.5 border font-black tracking-widest uppercase transition-colors",
              isBifacial 
                ? "border-sky-500/20 bg-sky-500/5 text-sky-400" 
                : "border-slate-800 text-slate-600 group-hover:border-slate-700"
            )}>
              {techLabel}
            </span>
            <span className="text-[7px] text-slate-600 font-mono tracking-tighter opacity-50">
              #{item.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Indicador Lateral de Seleção */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.5)]" />
      )}
      
      {/* Decoração Hover Sutil */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/0 to-amber-500/[0.02] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
