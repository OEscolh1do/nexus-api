import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ScrubbableNumberInputProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (val: number) => void;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Divisor de sensibilidade (quanto maior, mais lento o arraste). Default: 5 */
  sensitivity?: number;
}

export const ScrubbableNumberInput: React.FC<ScrubbableNumberInputProps> = ({
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onCommit,
  icon,
  prefix,
  suffix,
  className,
  sensitivity = 5
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(0);

  useEffect(() => {
    if (!isEditing && !isDragging.current) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    
    // Se clicou no input, não bloqueia (para edição). 
    // Mas aqui toda a div escuta.
    e.preventDefault(); 
    isDragging.current = true;
    startX.current = e.clientX;
    startVal.current = value;
    
    document.body.style.cursor = 'ew-resize';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX.current;
      
      if (Math.abs(deltaX) < 3) return;
      
      let nextVal = startVal.current + Math.round(deltaX / sensitivity) * step;
      
      if (nextVal > max) nextVal = max;
      if (nextVal < min) nextVal = min;
      
      setLocalValue(nextVal);
      // Feedback em tempo real
      onCommit(nextVal);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const deltaX = upEvent.clientX - startX.current;
      document.body.style.cursor = '';
      isDragging.current = false;
      
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      // Se soltou praticamente no mesmo lugar, entra no modo de digitação
      if (Math.abs(deltaX) < 3) {
        setIsEditing(true);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onCommit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onCommit(localValue);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setLocalValue(value);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center h-[26px] bg-slate-900 border border-slate-800 rounded px-2 gap-1.5 transition-colors relative group/scrub",
        !isEditing && "cursor-ew-resize hover:bg-slate-800 hover:border-slate-700 hover:shadow-[inset_0_0_8px_rgba(255,255,255,0.02)]",
        className
      )}
      onPointerDown={handlePointerDown}
      title="Arraste ↔ para alterar valor, ou clique para digitar exato"
    >
      {/* Ícone fixo com cor ajustável pelo pai */}
      {icon && <div className="shrink-0 pointer-events-none flex items-center">{icon}</div>}
      
      {/* Texto de Contexto (Ex: NW, S) */}
      {prefix && !isEditing && (
        <span className="text-[10px] font-black text-sky-400 pointer-events-none select-none tracking-widest shrink-0 min-w-[14px] text-center">
          {prefix}
        </span>
      )}

      {isEditing ? (
        <input
          autoFocus
          type="number"
          className="bg-transparent border-none outline-none text-[12px] font-mono font-bold text-sky-400 w-full p-0 m-0 h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          value={localValue}
          onChange={(e) => setLocalValue(Number(e.target.value))}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
        />
      ) : (
        <div className="flex items-baseline pointer-events-none select-none min-w-0 flex-1 justify-between">
          <div className="flex items-baseline">
            <span className="text-[12px] font-mono font-black text-slate-300 tabular-nums group-hover/scrub:text-white transition-colors">
              {localValue}
            </span>
            {suffix && <span className="text-[10px] text-slate-600 font-mono ml-0.5">{suffix}</span>}
          </div>
          <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest opacity-0 group-hover/scrub:opacity-100 transition-opacity">
            Drag ↔
          </span>
        </div>
      )}
    </div>
  );
};
