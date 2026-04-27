import React from 'react';
import { type ModuleSpecs } from '@/core/schemas/equipment.schemas';
import { Package, Zap, Trash2, ShieldAlert, Plus, Minus } from 'lucide-react';
import { TechnicalDiagram } from './TechnicalDiagram';

interface PVArrayCardProps {
  arrayId: string;
  name: string;
  moduleBase: ModuleSpecs;
  quantity: number;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}

export const PVArrayCard: React.FC<PVArrayCardProps> = ({
  name,
  moduleBase,
  quantity,
  onUpdateQty,
  onRemove
}) => {
  const totalPmax = (quantity * moduleBase.power) / 1000;
  
  // Fórmulas NBR 16690
  const T_min = 10; // TODO: Puxar do clima
  const T_amb_max = 40; // TODO: Puxar do clima
  const NOCT = 45;
  
  const tempCoeffVoc = moduleBase.tempCoeff || -0.30;
  const tempCoeffPmax = moduleBase.tempCoeff || -0.30;

  const vocMaxUnit = moduleBase.voc * (1 + (tempCoeffVoc / 100) * (T_min - 25));
  const t_celula_max = T_amb_max + NOCT - 20;
  const vmpMinUnit = moduleBase.vmp * (1 + (tempCoeffPmax / 100) * (t_celula_max - 25));

  const nMax600 = Math.floor(600 * 0.95 / vocMaxUnit);
  const nMax1000 = Math.floor(1000 * 0.95 / vocMaxUnit);
  const nMin = Math.ceil(100 / vmpMinUnit); // Janela hipotética mínima de 100V

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 flex flex-col xl:flex-row relative group">
      
      {/* Botão Remover */}
      <button 
        onClick={onRemove}
        className="absolute -top-3 -right-3 w-8 h-8 bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-900/50 flex items-center justify-center transition-all z-10 shadow-lg"
      >
        <Trash2 size={14} />
      </button>

      {/* Info Principal do Arranjo */}
      <div className="p-6 border-b xl:border-b-0 xl:border-r border-slate-800/60 flex-1 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Package size={64} className="text-amber-500" />
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500/10 text-amber-500 p-2 border border-amber-500/20">
              <Zap size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{name}</span>
              <h3 className="text-lg font-mono font-black text-slate-100 tracking-tighter leading-tight mt-0.5">
                {totalPmax.toFixed(2)} <span className="text-sm text-slate-500">kWp</span>
              </h3>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{moduleBase.manufacturer}</span>
            <span className="text-xs font-mono font-bold text-slate-300 truncate mt-1">{moduleBase.model} ({moduleBase.power}W)</span>
          </div>
        </div>

        {/* Controle de Quantidade */}
        <div className="mt-6 flex items-center gap-4 bg-slate-950/50 p-2 border border-slate-800/40 w-fit">
          <button 
            onClick={() => onUpdateQty(Math.max(1, quantity - 1))}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Minus size={16} />
          </button>
          <div className="flex flex-col items-center min-w-[60px]">
            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Módulos</span>
            <span className="text-base font-mono font-black text-slate-100 leading-none">{quantity}</span>
          </div>
          <button 
            onClick={() => onUpdateQty(quantity + 1)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Engenharia e Limites */}
      <div className="p-6 flex-1 flex gap-6 bg-slate-900/20">
        
        {/* Curva I-V Mini */}
        <div className="w-[120px] shrink-0 border border-slate-800/40 bg-slate-950 p-3 hidden md:flex flex-col justify-center relative">
          <span className="absolute top-2 left-2 text-[7px] text-slate-600 font-black uppercase tracking-widest">I-V STC</span>
          <TechnicalDiagram voc={moduleBase.voc} isc={moduleBase.isc} vmp={moduleBase.vmp} imp={moduleBase.imp} />
        </div>

        {/* Ficha Dinâmica */}
        <div className="flex-1 flex flex-col justify-between">
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Voc Máx (10°C)</span>
              <span className="text-xs font-mono font-bold text-rose-300/90 tabular-nums">{vocMaxUnit.toFixed(1)} <span className="text-[7px] text-slate-600 font-black">V</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Vmp Crítico (70°C)</span>
              <span className="text-xs font-mono font-bold text-amber-300/90 tabular-nums">{vmpMinUnit.toFixed(1)} <span className="text-[7px] text-slate-600 font-black">V</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Isc Máx</span>
              <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">{(moduleBase.isc * 1.25).toFixed(2)} <span className="text-[7px] text-slate-600 font-black">A</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-bold mb-1">Área Total</span>
              <span className="text-xs font-mono font-bold text-slate-400 tabular-nums">{(quantity * (moduleBase.area || 2.5)).toFixed(1)} <span className="text-[7px] text-slate-600 font-black">m²</span></span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/40">
            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5">
              <ShieldAlert size={10} className="text-emerald-500" /> Compatibilidade de String
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 p-2 border border-slate-800/50 flex flex-col items-center">
                <span className="text-[7px] text-slate-600 uppercase font-black mb-1">Inversor 600V</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">{nMin} a {nMax600}</span>
              </div>
              <div className="bg-slate-950 p-2 border border-slate-800/50 flex flex-col items-center">
                <span className="text-[7px] text-slate-600 uppercase font-black mb-1">Inversor 1000V</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">{nMin} a {nMax1000}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
