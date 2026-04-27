import React from 'react';
import { Search, Upload, Package } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import { NeonorteLoader } from '@/components/ui/NeonorteLoader';

interface HardwareLibraryPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredModules: any[];
  activeModuleModels: string[];
  isLoading: boolean;
  onSelect: (item: any) => void;
  onHover: (item: any | null) => void;
  comparingIds: string[];
  onToggleCompare: (id: string) => void;
  onUploadPan: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HardwareLibraryPanel: React.FC<HardwareLibraryPanelProps> = ({
  searchTerm,
  setSearchTerm,
  filteredModules,
  activeModuleModels,
  isLoading,
  onSelect,
  onHover,
  comparingIds,
  onToggleCompare,
  onUploadPan
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="w-[30%] min-w-[320px] max-w-[400px] bg-slate-900/40 border-r border-slate-800/60 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-800/60 bg-slate-950/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] flex items-center gap-2">
            <Package size={12} className="text-amber-500" /> Biblioteca de Hardware
          </span>
          <input 
            type="file" 
            accept=".pan" 
            onChange={onUploadPan} 
            ref={fileInputRef} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:text-amber-500 text-slate-400 text-[8px] font-black uppercase tracking-widest transition-colors group"
          >
            <Upload size={10} className="group-hover:-translate-y-0.5 transition-transform" />
            PAN
          </button>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={14} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="BUSCAR MODELO..."
            className="bg-slate-950 border border-slate-800 rounded-none px-9 py-2 text-[10px] text-slate-300 font-mono uppercase tracking-widest focus:outline-none focus:border-amber-500/50 w-full transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <NeonorteLoader size="panel" message="Carregando..." />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="flex flex-col gap-3">
            {filteredModules.map(item => (
              <ModuleCard 
                key={item.id}
                item={item}
                isSelected={activeModuleModels.includes(item.model)}
                minQty={1} // The concept of minQty is handled per array now
                estGen={0} // Handled per array
                onSelect={onSelect}
                onMouseEnter={() => onHover(item)}
                onMouseLeave={() => onHover(null)}
                searchTerm={searchTerm}
                isComparing={comparingIds.includes(item.id)}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
