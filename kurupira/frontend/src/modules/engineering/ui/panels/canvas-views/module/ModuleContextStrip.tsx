import React from 'react';
import { Minus, Plus, Sun, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleContextStripProps {
  manufacturer?: string;
  model?: string;
  power?: number;
  quantity?: number;
  placedCount?: number;
  totalKwp?: number;
  totalArea?: number;
  onUpdateQty: (qty: number) => void;
}

export const ModuleContextStrip: React.FC<ModuleContextStripProps> = ({
  manufacturer,
  model,
  power,
  quantity,
  placedCount,
  totalKwp,
  totalArea,
  onUpdateQty,
}) => {
  const isEmpty = !manufacturer || quantity === undefined;
  const [inputValue, setInputValue] = React.useState(quantity?.toString() || '0');

  React.useEffect(() => {
    setInputValue(quantity?.toString() || '0');
  }, [quantity]);

  const handleUpdate = () => {
    if (isEmpty) return;
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateQty(val);
    } else {
      setInputValue(quantity?.toString() || '0');
    }
  };

  return (
    <div className={cn(
      "bg-slate-950/50 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center shrink-0 z-10 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 transition-opacity",
      isEmpty ? "opacity-50 pointer-events-none" : "opacity-100"
    )}>
      {/* Badge + Model */}
      <div className="flex items-center gap-3 px-4 py-2.5 lg:py-1.5 shrink-0">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 border rounded-sm shrink-0",
          isEmpty ? "bg-slate-900 border-slate-800" : "bg-amber-500/10 border-amber-500/20"
        )}>
          <Sun size={9} className={isEmpty ? "text-slate-600" : "text-amber-400"} />
          <span className={cn(
            "text-[8px] font-black uppercase tracking-[0.15em]",
            isEmpty ? "text-slate-500" : "text-amber-400"
          )}>Módulo</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-black text-slate-200 uppercase tracking-tight truncate max-w-[140px]">
            {isEmpty ? '---' : manufacturer}
          </span>
          <span className="text-[10px] font-black text-amber-500 font-mono">
            {isEmpty ? '---' : `${power}W`}
          </span>
          <span className="text-[9px] text-slate-600 font-mono truncate max-w-[160px] hidden sm:inline">
            {isEmpty ? '---' : model}
          </span>
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="flex items-center gap-3 px-4 py-2.5 lg:py-1.5 shrink-0">
        <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Qtd</span>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm overflow-hidden min-h-[44px] lg:min-h-[28px] h-[44px] lg:h-7">
          <button
            disabled={isEmpty}
            onClick={() => onUpdateQty(Math.max(1, (quantity ?? 1) - 1))}
            className="px-4 lg:px-2 h-full text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all active:scale-90 flex items-center justify-center min-w-[44px] lg:min-w-0 disabled:opacity-50"
          >
            <Minus size={12} />
          </button>
          <div className="px-1 h-full flex items-center border-x border-slate-800">
            <input
              type="number"
              value={isEmpty ? '' : inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleUpdate}
              disabled={isEmpty}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdate();
                  e.currentTarget.blur();
                }
              }}
              placeholder="-"
              className="w-14 h-full bg-transparent text-[12px] font-mono font-black text-slate-100 tabular-nums text-center focus:outline-none focus:bg-slate-800 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-600"
            />
          </div>
          <button
            disabled={isEmpty}
            onClick={() => onUpdateQty((quantity ?? 0) + 1)}
            className="px-4 lg:px-2 h-full text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all active:scale-90 flex items-center justify-center min-w-[44px] lg:min-w-0 disabled:opacity-50"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Placed Status */}
      {!isEmpty && (
        <div className="flex items-center gap-3 px-4 py-2.5 lg:py-1.5 shrink-0 bg-slate-900/40">
          <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Colocados</span>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-[13px] font-mono font-black tabular-nums",
              placedCount === quantity ? "text-emerald-400" :
              (placedCount ?? 0) > (quantity ?? 0) ? "text-rose-400" : "text-amber-500/80"
            )}>
              {placedCount ?? 0}
            </span>
            <span className="text-[10px] text-slate-700 font-bold">/ {quantity}</span>
          </div>
        </div>
      )}

      {/* kWp deste arranjo */}
      <div className="flex items-center gap-3 px-4 py-2.5 lg:py-1.5 shrink-0">
        <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Potência</span>
        <div className="flex items-baseline gap-1">
          <span className={cn(
            "text-[13px] font-mono font-black tabular-nums",
            isEmpty ? "text-slate-600" : "text-amber-400"
          )}>
            {isEmpty ? '---' : totalKwp?.toFixed(2)}
          </span>
          <span className="text-[8px] text-slate-500 font-bold">kWp</span>
        </div>
      </div>

      {/* Área total */}
      <div className="flex items-center gap-2 px-4 py-2.5 lg:py-1.5 shrink-0">
        <Maximize2 size={9} className="text-slate-600" />
        <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Área</span>
        <span className={cn(
          "text-[11px] font-mono font-bold tabular-nums",
          isEmpty ? "text-slate-600" : "text-slate-400"
        )}>
          {isEmpty ? '---' : totalArea?.toFixed(1)} m²
        </span>
      </div>
    </div>
  );
};
