import React from 'react';
import { useCatalogStore } from '@/modules/engineering/store/useCatalogStore';
import { X, ChevronRight, Zap, Activity, Box, Weight, Maximize2 } from 'lucide-react';

import { type ModuleCatalogItem } from '@/core/schemas/moduleSchema';

interface ComparisonDrawerProps {
  ids: string[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onSelect: (item: ModuleCatalogItem) => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  ids,
  onClose,
  onRemove,
  onSelect
}) => {
  const { modules } = useCatalogStore();
  const comparingModules = modules.filter(m => ids.includes(m.id));

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-amber-500/30 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-none text-slate-950">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest leading-none">Matriz de Comparação Técnica</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Análise detalhada de {ids.length} hardwares selecionados</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparingModules.map(item => (
            <div key={item.id} className="bg-slate-900/40 border border-slate-800/60 p-5 flex flex-col relative group">
              <button 
                onClick={() => onRemove(item.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors z-10"
              >
                <X size={12} />
              </button>

              <div className="mb-6">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{item.manufacturer}</span>
                <h4 className="text-lg font-black text-amber-500 uppercase tracking-tighter leading-tight mt-1">{item.electrical.pmax}Wp</h4>
                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{item.model}</p>
              </div>

              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <ComparisonItem label="Eficiência" value={`${((item.electrical.efficiency || 0) * 100).toFixed(2)}%`} icon={<Activity size={10} />} />
                  <ComparisonItem label="Voc" value={`${item.electrical.voc.toFixed(1)}V`} icon={<Zap size={10} />} />
                  <ComparisonItem label="Isc" value={`${item.electrical.isc.toFixed(1)}A`} icon={<Activity size={10} />} />
                  <ComparisonItem label="Vmp" value={`${item.electrical.vmp.toFixed(1)}V`} icon={<Zap size={10} />} />
                </div>
                
                <div className="pt-4 border-t border-slate-800/40 grid grid-cols-2 gap-4">
                   <ComparisonItem label="Peso" value={`${item.physical.weightKg || item.physical.weightKg || 25}kg`} icon={<Weight size={10} />} />
                   <ComparisonItem label="Área" value={`${((item.physical.widthMm * item.physical.heightMm) / 1000000).toFixed(2)}m²`} icon={<Maximize2 size={10} />} />
                </div>
              </div>

              <button 
                onClick={() => onSelect(item)}
                className="mt-8 w-full py-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-950/20 text-slate-300 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
              >
                ADOTAR ESTE HARDWARE <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}

          {/* Slots Vazios */}
          {Array.from({ length: 3 - comparingModules.length }).map((_, i) => (
            <div key={`empty-${i}`} className="border-2 border-dashed border-slate-900 flex flex-col items-center justify-center p-8 opacity-20">
               <Box size={32} className="text-slate-700 mb-2" />
               <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Aguardando Seleção</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ComparisonItem: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1">
      <div className="text-slate-600">{icon}</div>
      <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-mono font-bold text-slate-200 tracking-tight">{value}</span>
  </div>
);
