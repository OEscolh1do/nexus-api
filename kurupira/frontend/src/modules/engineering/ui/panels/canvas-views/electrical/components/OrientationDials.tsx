import React, { useRef } from 'react';
import { ScrubbableNumberInput } from './ScrubbableNumberInput';

// ─────────────────────────────────────────────────────────────────────────────
// DIAL DE AZIMUTE (Bússola 360°)
// ─────────────────────────────────────────────────────────────────────────────
interface AzimuthDialProps {
  value: number;
  onChange: (val: number) => void;
}

const AzimuthDial: React.FC<AzimuthDialProps> = ({ value, onChange }) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getAngle = (e: React.PointerEvent | PointerEvent) => {
    if (!dialRef.current) return value;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    
    // Mapeamento: Topo = 0, Direita = 90, Baixo = 180, Esquerda = 270
    let compassAngle = Math.round((angle + 90 + 360) % 360);
    // Snap magnético de 5 em 5 graus para facilidade de uso
    compassAngle = Math.round(compassAngle / 5) * 5;
    if (compassAngle === 360) compassAngle = 0;
    
    return compassAngle;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    onChange(getAngle(e));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    onChange(getAngle(e));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 group/dial">
      <div 
        ref={dialRef}
        className="w-14 h-14 rounded-full border-[3px] border-slate-800 bg-slate-950 relative cursor-pointer shadow-inner touch-none hover:border-slate-700 transition-colors"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Arraste ou clique na borda para definir Azimute"
      >
        {/* Marcadores Cardeais */}
        <span className="absolute top-[2px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-600 pointer-events-none">N</span>
        <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-600 pointer-events-none">S</span>
        <span className="absolute left-[3px] top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600 pointer-events-none">W</span>
        <span className="absolute right-[3px] top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-600 pointer-events-none">E</span>

        {/* Círculo guia interior */}
        <div className="absolute inset-2 rounded-full border border-slate-800/50 pointer-events-none" />

        {/* Agulha Magnética */}
        <div 
          className="absolute inset-0 pointer-events-none transition-transform duration-75"
          style={{ transform: `rotate(${value}deg)` }}
        >
          {/* Ponto indicador */}
          <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-3 h-3 bg-sky-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          {/* Haste */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[2px] h-[45%] bg-gradient-to-b from-sky-500 to-transparent" />
        </div>
        
        {/* Mostrador Numérico Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-0.5">
          <span className="text-[11px] font-black text-white tabular-nums bg-slate-950/90 px-1 rounded shadow-sm">
            {value}°
          </span>
        </div>
      </div>
      <div className="w-[60px] h-[26px]">
        <ScrubbableNumberInput
          value={value}
          min={0}
          max={360}
          step={1}
          onCommit={onChange}
          suffix="°"
          sensitivity={10}
          className="h-full border-slate-800 bg-slate-950/60"
        />
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// DIAL DE INCLINAÇÃO (Side-View 90°)
// ─────────────────────────────────────────────────────────────────────────────
interface InclinationDialProps {
  value: number;
  onChange: (val: number) => void;
}

const InclinationDial: React.FC<InclinationDialProps> = ({ value, onChange }) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const getAngle = (e: React.PointerEvent | PointerEvent) => {
    if (!dialRef.current) return value;
    const rect = dialRef.current.getBoundingClientRect();
    
    // O pivot do painel fica no canto inferior esquerdo
    const cx = rect.left + rect.width * 0.25;
    const cy = rect.top + rect.height * 0.75;
    
    const dx = e.clientX - cx;
    const dy = e.clientY - cy; // dy é negativo para cima da tela
    
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    
    // No JS, 0° é a direita (dx>0, dy=0), -90° é pra cima (dx=0, dy<0).
    // Queremos 0° horizontal, 90° vertical.
    let tilt = -angle;
    
    // Clamp e tolerâncias
    if (tilt < 0 && tilt > -45) tilt = 0; // se arrastar pra baixo do piso
    if (tilt < -45 || tilt > 135) return value; // ignorar quadrantes absurdos
    if (tilt > 90) tilt = 90;
    
    tilt = Math.round(tilt / 5) * 5;
    return tilt;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    onChange(getAngle(e));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    onChange(getAngle(e));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 group/dial">
      <div 
        ref={dialRef}
        className="w-14 h-14 rounded-lg border-[3px] border-slate-800 bg-slate-950 relative cursor-pointer shadow-inner touch-none hover:border-slate-700 transition-colors overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Arraste para cima/baixo para definir Inclinação"
      >
        {/* Linha do Chão (0°) */}
        <div className="absolute bottom-[25%] left-[15%] right-[10%] h-[2px] bg-slate-700 pointer-events-none" />
        
        {/* Linha da Parede (90°) */}
        <div className="absolute bottom-[25%] left-[25%] top-[15%] w-[2px] bg-slate-800 pointer-events-none" />
        
        {/* Arco de Medição */}
        <div className="absolute bottom-[25%] left-[25%] w-6 h-6 border-t-[2px] border-r-[2px] border-slate-800/80 rounded-tr-full pointer-events-none" />

        {/* Representação do Painel Solar */}
        <div 
          className="absolute bottom-[25%] left-[25%] w-[65%] h-[3px] bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] pointer-events-none transition-transform duration-75 origin-bottom-left"
          style={{ transform: `rotate(-${value}deg)` }}
        >
          {/* Células do painelzinho */}
          <div className="absolute inset-x-1 inset-y-0 flex justify-between gap-px opacity-30">
            <div className="flex-1 bg-black h-full" />
            <div className="flex-1 bg-black h-full" />
            <div className="flex-1 bg-black h-full" />
          </div>
        </div>

        {/* Mostrador Numérico */}
        <div className="absolute top-1 right-1 pointer-events-none">
          <span className="text-[10px] font-black text-emerald-400 tabular-nums bg-slate-950/80 px-1 rounded shadow-sm">
            {value}°
          </span>
        </div>
      </div>
      <div className="w-[60px] h-[26px]">
        <ScrubbableNumberInput
          value={value}
          min={0}
          max={90}
          step={1}
          onCommit={onChange}
          suffix="°"
          sensitivity={10}
          className="h-full border-slate-800 bg-slate-950/60"
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export const OrientationDials: React.FC<{
  azimuth: number;
  inclination: number;
  onAzimuthChange: (v: number) => void;
  onInclinationChange: (v: number) => void;
}> = ({ azimuth, inclination, onAzimuthChange, onInclinationChange }) => {
  return (
    <div className="flex justify-center gap-8 px-3 py-3 border-b border-slate-800/40 bg-slate-900/20">
      <AzimuthDial value={azimuth} onChange={onAzimuthChange} />
      <InclinationDial value={inclination} onChange={onInclinationChange} />
    </div>
  );
};
