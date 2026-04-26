import React from 'react';
import { cn } from '@/lib/utils';

interface NeonorteMarkerUIProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

/**
 * NEONORTE MARKER UI
 * Componente visual puro para o Pin de Identidade da Neonorte.
 * Usado no Mapa (Leaflet), Hub de Projetos e Propostas Técnicas.
 */
export const NeonorteMarkerUI: React.FC<NeonorteMarkerUIProps> = ({ 
  className, 
  size = 'md',
  showPulse = true
}) => {
  const sizes = {
    sm: { badge: '24px', logo: '14px', target: '10px', dot: '3px', rings: '28px' },
    md: { badge: '38px', logo: '22px', target: '14px', dot: '5px', rings: '42px' },
    lg: { badge: '48px', logo: '28px', target: '18px', dot: '7px', rings: '56px' }
  };

  const current = sizes[size];

  return (
    <div className={cn("relative flex flex-col items-center select-none opacity-90", className)}>
      
      {/* ── CAMADA 1: Anéis de Radar/Scan (Aesthetic de Engenharia) ── */}
      {showPulse && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] border border-emerald-500/20 rounded-full animate-ping duration-[3s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] border border-emerald-500/10 rounded-full animate-ping duration-[4s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] border border-emerald-500/5 rounded-full animate-ping duration-[5s]" />
        </div>
      )}

      {/* ── CAMADA 2: O Pin (Badge Principal) ── */}
      <div
        className="flex items-center justify-center relative z-20 animate-in zoom-in duration-500 hover:scale-110 transition-transform cursor-pointer"
        style={{
          width: current.badge,
          height: current.badge,
          background: 'radial-gradient(circle at 35% 35%, #10B981, #064E3B)',
          border: '1.5px solid rgba(255,255,255,0.9)',
          borderRadius: '50% 50% 50% 4px',
          transform: 'rotate(-45deg)',
          boxShadow: `
            0 0 0 1px rgba(16, 185, 129, 0.3),
            0 12px 24px -8px rgba(0,0,0,0.6),
            inset 0 2px 4px rgba(255,255,255,0.4),
            inset 0 -2px 6px rgba(0,0,0,0.3)
          `,
          marginBottom: '-2px'
        }}
      >
        <div 
          className="flex items-center justify-center"
          style={{ transform: 'rotate(45deg)' }}
        >
          <img
            src="/logos/simbolo-branco.png"
            alt="Neonorte"
            style={{
              width: current.logo,
              height: current.logo,
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
            }}
          />
        </div>
      </div>
      
      {/* ── CAMADA 3: Mira de Precisão (Ancoragem) ── */}
      <div className="flex items-center justify-center relative z-10" style={{ height: current.target, width: current.target }}>
        {/* Sombra de Contato no Solo */}
        <div className="absolute w-[200%] h-[40%] bg-black/40 blur-md rounded-[100%] scale-x-150 translate-y-1" />
        
        {/* Anel de Ancoragem */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full border border-emerald-400/50 bg-emerald-500/10 backdrop-blur-[1px]",
            showPulse && "animate-pulse"
          )}
        />
        
        {/* Crosshair (Fios de Cabelo) */}
        <div className="absolute w-[0.5px] h-full bg-emerald-300/40" />
        <div className="absolute w-full h-[0.5px] bg-emerald-300/40" />
        
        {/* Ponto Central (Laser Point) */}
        <div
          style={{
            width: current.dot,
            height: current.dot,
            background: 'radial-gradient(circle, #fff, #10B981)',
            borderRadius: '50%',
            boxShadow: '0 0 12px #10B981, 0 0 20px rgba(16,185,129,0.5)',
            zIndex: 5
          }}
        />
      </div>

      {/* ── CAMADA 4: Sombra de Projeção Tática ── */}
      {showPulse && (
        <div className="absolute -bottom-2 w-[100px] h-[100px] pointer-events-none opacity-20">
          <div className="w-full h-full border-2 border-emerald-500/30 rounded-full animate-ping [animation-duration:2.5s]" />
        </div>
      )}
    </div>
  );
};
