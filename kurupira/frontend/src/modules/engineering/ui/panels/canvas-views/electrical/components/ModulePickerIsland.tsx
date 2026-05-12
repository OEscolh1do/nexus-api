import React from 'react';
import { Sun, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleOption {
  id: string;
  manufacturer: string;
  model: string;
  power: number;
  voc?: number;
  isc?: number;
}

interface ModulePickerIslandProps {
  options: ModuleOption[];
  selectedValue?: string;
  defaultModule?: ModuleOption;
  onSelect: (model?: string) => void;
  onClose: () => void;
}

export const ModulePickerIsland: React.FC<ModulePickerIslandProps> = ({
  options,
  selectedValue,
  defaultModule,
  onSelect,
  onClose,
}) => {
  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="p-2 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecionar Módulo</span>
        <Sun size={12} className="text-amber-500/50" />
      </div>

      <div className="max-h-[320px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Opção Padrão */}
        <button
          onClick={() => { onSelect(undefined); onClose(); }}
          className={cn(
            "w-full text-left px-3 py-2 transition-all border-l-2",
            !selectedValue 
              ? "bg-amber-500/10 border-amber-500" 
              : "border-transparent hover:bg-slate-800/50"
          )}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-black text-slate-200 uppercase">
                {defaultModule?.manufacturer?.split(' ')[0] || 'Projeto'} {defaultModule?.power}W
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate max-w-[160px]">
                Configuração Padrão do Projeto
              </div>
            </div>
            {!selectedValue && <Check size={12} className="text-amber-500" />}
          </div>
        </button>

        <div className="h-px bg-slate-800 my-1 mx-2" />

        {/* Lista de Módulos */}
        {options.map((m) => {
          const isSelected = selectedValue === m.model;
          if (m.model === defaultModule?.model) return null;

          return (
            <button
              key={m.id}
              onClick={() => { onSelect(m.model); onClose(); }}
              className={cn(
                "w-full text-left px-3 py-2 transition-all border-l-2 group",
                isSelected 
                  ? "bg-sky-500/10 border-sky-500" 
                  : "border-transparent hover:bg-slate-800/50"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-slate-200 uppercase">
                      {m.manufacturer?.split(' ')[0]} {m.power}W
                    </span>
                    {m.voc && (
                      <span className="text-[8px] font-mono text-slate-600 bg-slate-800 px-1 rounded">
                        {m.voc}V
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                    {m.model}
                  </div>
                </div>
                {isSelected && <Check size={12} className="text-sky-500" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-2 bg-slate-950/50 border-t border-slate-800 flex items-center gap-2">
        <Info size={10} className="text-slate-600" />
        <span className="text-[8px] leading-tight text-slate-500 italic">
          A troca de módulo recalcula instantaneamente as perdas e limites elétricos deste MPPT.
        </span>
      </div>
    </div>
  );
};
