import React, { useState, useRef } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useUIStore } from '@/core/state/uiStore';
import { useSolarStore } from '@/core/state/solarStore';

// =============================================================================
// SEARCH ISLAND — Geocoding via Nominatim (OpenStreetMap)
// =============================================================================

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
}

export const SearchIsland: React.FC = () => {
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);
  const setCoordinates = useSolarStore(s => s.setCoordinates);

  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleChange = (value: string) => {
    setSearchQuery(value);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.length < 4) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=0&limit=5&countrycodes=br`;
        const res = await fetch(url, {
          signal: abortRef.current.signal,
          headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
        });
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setCoordinates(lat, lon);
    setSearchQuery(result.display_name);
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  };

  const showDropdown = isOpen && (isLoading || results.length > 0);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] select-none" style={{ minWidth: 320 }}>
      {/* Input pill */}
      <div className="flex items-center h-10 bg-slate-900/90 border border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md rounded-full overflow-hidden group transition-all hover:border-slate-700">
        <div className="flex items-center px-4 h-full gap-3 w-full">
          {isLoading
            ? <Loader2 size={14} className="text-indigo-400 animate-spin flex-shrink-0" />
            : <Search size={14} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors flex-shrink-0" />
          }
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            placeholder="Buscar endereço do projeto..."
            className="bg-transparent border-none outline-none text-[11px] font-medium text-slate-200 placeholder:text-slate-600 w-full"
          />
          {searchQuery && (
            <button onClick={handleClear} className="p-1 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
              <X size={10} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (
        <div className="mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {isLoading && results.length === 0 && (
            <div className="px-4 py-3 text-[10px] text-slate-500 font-mono flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Buscando…
            </div>
          )}
          {results.map(r => (
            <button
              key={r.place_id}
              onMouseDown={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left border-b border-slate-800/50 last:border-0"
            >
              <MapPin size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className="text-[10px] text-slate-300 font-mono leading-relaxed line-clamp-2">
                {r.display_name}
              </span>
            </button>
          ))}
          {!isLoading && results.length === 0 && searchQuery.length >= 4 && (
            <div className="px-4 py-3 text-[10px] text-slate-600 font-mono">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};
