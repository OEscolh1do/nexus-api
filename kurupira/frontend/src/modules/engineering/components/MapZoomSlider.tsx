import React from 'react';
import { useMap } from 'react-leaflet';
import { Minus, Plus, ZoomIn } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { selectZoom } from '@/core/state/solarSelectors';

/**
 * MAP ZOOM SLIDER
 * 
 * Controle deslizante horizontal para zoom de alta precisão.
 * Posicionado no rodapé central do mapa.
 */
export const MapZoomSlider: React.FC = () => {
  const map = useMap();
  const storeZoom = useSolarStore(selectZoom);
  const setZoom = useSolarStore(s => s.setZoom);

  const minZoom = 12;
  const maxZoom = 24;

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = Number(e.target.value);
    setZoom(newZoom);
    map.setZoom(newZoom);
  };

  const increment = () => {
    const next = Math.min(storeZoom + 1, maxZoom);
    setZoom(next);
    map.setZoom(next);
  };

  const decrement = () => {
    const prev = Math.max(storeZoom - 1, minZoom);
    setZoom(prev);
    map.setZoom(prev);
  };

  // Porcentagem visual para o preenchimento da barra
  const percentage = ((storeZoom - minZoom) / (maxZoom - minZoom)) * 100;

  return (
    <div className="absolute bottom-10 lg:bottom-14 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1.5 lg:gap-2 group transition-all">
      {/* Label de Telemetria de Zoom */}
      <div className="px-2 py-0.5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-full hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mb-1">
        <ZoomIn size={10} className="text-indigo-400" />
        <span className="text-[10px] font-mono font-black text-indigo-100 tracking-tighter">
          NÍVEL {storeZoom.toFixed(1)}
        </span>
      </div>

      {/* Frame do Slider */}
      <div className="flex items-center gap-2 lg:gap-4 bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 px-3 lg:px-4 py-1.5 lg:py-2.5 rounded-full shadow-2xl ring-1 ring-white/5">
        
        <button 
          onClick={decrement}
          disabled={storeZoom <= minZoom}
          className="p-1 text-slate-500 hover:text-white transition-colors disabled:opacity-20"
        >
          <Minus size={12} className="lg:w-[14px] lg:h-[14px]" strokeWidth={3} />
        </button>

        <div className="relative flex items-center w-32 lg:w-48 h-6">
          {/* Track customizada */}
          <div className="absolute inset-x-0 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Input Range Nativo (Invisível mas funcional) */}
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.1}
            value={storeZoom}
            onChange={handleZoomChange}
            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {/* Handle Visual (Knob) */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)] pointer-events-none transition-all duration-75"
            style={{ left: `calc(${percentage}% - 7px)` }}
          />
        </div>

        <button 
          onClick={increment}
          disabled={storeZoom >= maxZoom}
          className="p-1 text-slate-500 hover:text-white transition-colors disabled:opacity-20"
        >
          <Plus size={12} className="lg:w-[14px] lg:h-[14px]" strokeWidth={3} />
        </button>

      </div>
    </div>
  );
};
