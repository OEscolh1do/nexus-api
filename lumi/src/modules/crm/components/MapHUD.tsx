import React from 'react';
import { Search, Globe, Map as MapIcon, Plus, Minus, Navigation, PencilRuler, Eraser, Loader2, Target } from 'lucide-react';

interface MapHUDProps {
    // Search
    addressSearch: string;
    setAddressSearch: (val: string) => void;
    onSearch: () => void;
    isSearching: boolean;

    // Layers
    mapMode: 'streets' | 'hybrid';
    onToggleMapMode: (mode: 'streets' | 'hybrid') => void;

    // Zoom / Location
    onZoomIn: () => void;
    onZoomOut: () => void;
    onLocate: () => void;
    onCenterMarker: () => void;
    isLocating: boolean;

    // Drawing
    onStartDraw: () => void;
    onClearDraw: () => void;
    hasDrawnArea: boolean;
}

export const MapHUD: React.FC<MapHUDProps> = ({
    addressSearch, setAddressSearch, onSearch, isSearching,
    mapMode, onToggleMapMode,
    onZoomIn, onZoomOut, onLocate, onCenterMarker, isLocating,
    onStartDraw, onClearDraw, hasDrawnArea
}) => {
    return (
        <>
            {/* 1. HUD: Top Left - Search */}
            <div className="absolute top-4 left-4 z-[500] w-full max-w-xs pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/50 flex items-center p-2 gap-2 transition-all focus-within:ring-2 ring-neonorte-green/50 hover:bg-white group">
                    <Search size={16} className="text-slate-400 shrink-0 group-focus-within:text-neonorte-green transition-colors" />
                    <input 
                        type="text" 
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full placeholder:text-slate-400"
                        placeholder="Buscar endereço..."
                        value={addressSearch}
                        onChange={e => setAddressSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onSearch())}
                    />
                    {isSearching ? (
                        <Loader2 size={14} className="animate-spin text-neonorte-green shrink-0" />
                    ) : (
                        addressSearch && (
                            <button onClick={() => setAddressSearch('')} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Limpar</span>
                                {/* Small X icon or similar if needed, currently just clearing logic via UX pattern usually implies an X icon, 
                                    but standard input clear is fine. Adding standard clear cross for UX polish */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* 2. HUD: Top Right - Map Layer Toggle */}
            <div className="absolute top-4 right-4 z-[500] pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-md rounded-lg p-1 shadow-xl border border-white/50 flex gap-1">
                    <button 
                        onClick={() => onToggleMapMode('hybrid')} 
                        className={`p-2 rounded-md transition-all ${mapMode === 'hybrid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        title="Satélite"
                    >
                        <Globe size={18} />
                    </button>
                    <button 
                        onClick={() => onToggleMapMode('streets')} 
                        className={`p-2 rounded-md transition-all ${mapMode === 'streets' ? 'bg-neonorte-purple text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        title="Mapa"
                    >
                        <MapIcon size={18} />
                    </button>
                </div>
            </div>

            {/* 3. HUD: Bottom Right - Toolbar (Zoom, GPS, Draw) */}
            <div className="absolute bottom-6 right-4 z-[500] flex flex-col items-end gap-3 pointer-events-auto">
                
                {/* Vertical Toolbar Stack */}
                <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-xl border border-white/50 items-center">
                    
                    {/* Zoom Controls */}
                    <button onClick={onZoomIn} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors" title="Zoom In">
                        <Plus size={18} />
                    </button>
                    <button onClick={onZoomOut} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors" title="Zoom Out">
                        <Minus size={18} />
                    </button>
                    
                    <div className="w-5 h-[1px] bg-slate-200 my-0.5" />

                    {/* GPS */}
                    <button onClick={onLocate} className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors ${isLocating ? 'animate-spin text-neonorte-purple' : ''}`} title="Minha Localização">
                        <Navigation size={16} className={isLocating ? "" : "-rotate-45"} /> {/* Tweak icon rotation for visual balance */}
                    </button>

                    {/* Center on Marker */}
                    <button onClick={onCenterMarker} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors" title="Centralizar no Pin">
                        <Target size={18} />
                    </button>

                     <div className="w-5 h-[1px] bg-slate-200 my-0.5" />

                    {/* Draw Tools Integrated */}
                    <button 
                        onClick={onStartDraw} 
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${hasDrawnArea ? 'bg-slate-100 text-slate-400' : 'bg-neonorte-green text-white shadow-lg hover:scale-110 active:scale-95'}`}
                        title="Desenhar Área"
                    >
                        <PencilRuler size={16} />
                    </button>
                    
                    {hasDrawnArea && (
                        <button 
                            onClick={onClearDraw} 
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            title="Limpar Desenho"
                        >
                            <Eraser size={16} />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};
