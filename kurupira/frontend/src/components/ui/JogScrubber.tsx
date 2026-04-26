import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface JogScrubberProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  sensitivity?: number;
  className?: string;
}

/**
 * JogScrubber: Componente de interface de engenharia para ajuste de valores via arrasto lateral infinito.
 * Inspirado em interfaces de softwares CAD e editores de vídeo.
 */
export const JogScrubber: React.FC<JogScrubberProps> = ({
  value,
  onChange,
  min = -100,
  max = 10000,
  step = 1,
  sensitivity = 0.3,

  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(value);
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Calcula o delta em pixels e converte para o valor baseado na sensibilidade
    const deltaX = e.clientX - startX;
    const rawDeltaValue = deltaX * sensitivity;
    
    // Aplica o step para manter precisão técnica
    const steppedDelta = Math.round(rawDeltaValue / step) * step;
    let newValue = startValue + steppedDelta;
    
    // Respeita os limites
    newValue = Math.max(min, Math.min(max, newValue));
    
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Efeito de movimento da régua (parallax)
  // Usamos o valor atual para deslocar as marcações visuais
  const offset = (value * 8) % 100;

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "relative h-10 w-full bg-slate-950 border border-slate-800 rounded-sm cursor-ew-resize overflow-hidden select-none group touch-none",
        isDragging && "border-sky-500/50 ring-1 ring-sky-500/20",
        className
      )}
      title="Clique e arraste para os lados para ajustar"
    >
      {/* Ruler Lines Container (Scrolling background) */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
        style={{ 
          transform: `translateX(${-offset}px)`,
          width: '200%',
          left: '-50%'
        }}
      >
        <div className="flex items-center gap-4">
          {Array.from({ length: 60 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "w-[1.5px] bg-slate-800 transition-colors group-hover:bg-slate-700",
                i % 5 === 0 ? "h-4 bg-slate-700" : "h-2 opacity-50",
                isDragging && "bg-sky-500/30"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Center Fixed Marker */}
      <div className={cn(
        "absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 z-10 transition-all",
        isDragging ? "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] h-full" : "bg-sky-500/50 h-3/4 self-center"
      )} />
      
      {/* Interaction Label (Visible only on hover/drag) */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase tracking-[0.2em] transition-all pointer-events-none",
        isDragging ? "text-sky-400 opacity-100 translate-y-3" : "text-slate-600 opacity-0 group-hover:opacity-40"
      )}>
        {isDragging ? 'Ajustando...' : 'Arraste Lateral'}
      </div>
    </div>
  );
};
