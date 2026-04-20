import React from 'react';
import { Search, X } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';

// =============================================================================
// SEARCH ISLAND (D3 — Simplified Global Search)
// =============================================================================
//
// Pílula centralizada no topo focada exclusivamente na busca de endereços.
// Design minimalista com Glassmorphism.
// =============================================================================

export const SearchIsland: React.FC = () => {
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center h-10 bg-slate-900/90 border border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md rounded-full z-[1100] animate-in fade-in slide-in-from-top-2 duration-300 select-none overflow-hidden min-w-[280px] group transition-all hover:border-slate-700">
      <div className="flex items-center px-4 h-full gap-3 w-full">
        <Search size={14} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar endereço do projeto..."
          className="bg-transparent border-none outline-none text-[11px] font-medium text-slate-200 placeholder:text-slate-600 w-full"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')} 
            className="p-1 hover:bg-slate-800 rounded-full transition-colors shrink-0"
          >
            <X size={10} className="text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
};
