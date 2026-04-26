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
    sm: { badge: '24px', logo: '14px', target: '10px', dot: '3px' },
    md: { badge: '38px', logo: '22px', target: '14px', dot: '5px' },
    lg: { badge: '48px', logo: '28px', target: '18px', dot: '7px' }
  };

  const current = sizes[size];

  return (
    <div className={cn("relative flex flex-col items-center select-none", className)}>
      {/* Badge com logo Neonorte */}
      <div
        className="flex items-center justify-center overflow-hidden relative z-20 animate-in zoom-in duration-500"
        style={{
          width: current.badge,
          height: current.badge,
          background: 'radial-gradient(circle at 30% 30%, #2D6A4F, #1B4332)',
          border: '2px solid #fff',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          boxShadow: '0 0 0 1.5px #4CAF50, 0 8px 16px rgba(0,0,0,0.4), inset 0 0 4px rgba(0,0,0,0.2)',
          marginBottom: '-1px'
        }}
      >
        <img
          src="/logos/simbolo-branco.png"
          alt="Neonorte"
          style={{
            width: current.logo,
            height: current.logo,
            objectFit: 'contain',
            transform: 'rotate(45deg)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
      </div>
      
      {/* Alvo de Precisão (Ancoragem/Crosshair) */}
      <div className="flex items-center justify-center relative" style={{ height: current.target, width: current.target, marginTop: '-2px' }}>
        {/* Anel Externo */}
        <div 
          className={cn("absolute inset-0 rounded-full border border-white/50 bg-[#4CAF50]/20", showPulse && "animate-pulse")}
        />
        
        {/* Crosshair */}
        <div className="absolute w-[1px] h-full bg-white/40" />
        <div className="absolute w-full h-[1px] bg-white/40" />
        
        {/* Ponto Central */}
        <div
          style={{
            width: current.dot,
            height: current.dot,
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            border: '1.5px solid #fff',
            boxShadow: '0 0 8px rgba(76,175,80,1)',
            zIndex: 2
          }}
        />
      </div>

      {/* Pulso de radar no chão (Opcional) */}
      {showPulse && (
        <div 
          className="absolute bottom-0 w-10 h-10 bg-[#4CAF50]/20 rounded-full -translate-y-1/2 scale-x-150 opacity-20 animate-ping"
          style={{ width: `calc(${current.badge} * 1.2)` }}
        />
      )}
    </div>
  );
};
