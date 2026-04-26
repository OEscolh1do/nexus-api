/**
 * =============================================================================
 * NeonorteLoader — Animação de Carregamento Breathing
 * =============================================================================
 *
 * Versão não incorporada (Pure React/SVG/CSS).
 * Implementa a estética premium da Neonorte com logo pulsante e anel giratório.
 *
 * =============================================================================
 */

import React from 'react';
import { useUIStore, LoadingContext } from '../../core/state/uiStore';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type NeonorteLoaderSize = 'fullscreen' | 'panel' | 'compact';

interface NeonorteLoaderProps {
  /** Variante de tamanho e contexto de exibição */
  size?: NeonorteLoaderSize;
  /** Contexto específico que este loader deve observar (ex: 'project-hub') */
  context?: LoadingContext;
  /** Mensagem exibida abaixo do símbolo (sobrescreve uiStore) */
  message?: string;
  /** Aplica backdrop blur + overlay escuro (só relevante no fullscreen/panel) */
  overlay?: boolean;
  /** Classe extra para o container raiz */
  className?: string;
  /** Força a exibição ignorando o Zustand */
  forceShow?: boolean;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export const NeonorteLoader: React.FC<NeonorteLoaderProps> = ({
  size = 'panel',
  context,
  overlay = true,
  className = '',
  message: messageProp,
  forceShow = false
}) => {
  // ── Zustand State ────────────────────────────────────────────────────────
  const isAppLoading = useUIStore(state => state.isAppLoading);
  const loadingContext = useUIStore(state => state.loadingContext);
  const loadingMessage = useUIStore(state => state.loadingMessage);

  // Um loader com context definido só aparece se o loadingContext bater
  const isContextMatch = !context || context === loadingContext;
  const isLoading = forceShow || (isAppLoading && isContextMatch);
  const message = messageProp || loadingMessage;

  if (!isLoading) return null;
  const wrapperClass = (() => {
    if (size === 'fullscreen') {
      return overlay
        ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md'
        : 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950';
    }
    if (size === 'panel') {
      return 'absolute inset-0 z-[500] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm';
    }
    // compact — inline, sem posicionamento absoluto
    return 'inline-flex flex-col items-center justify-center';
  })();

  const containerSize = size === 'compact' ? 'w-16 h-16' : 'w-48 h-48';
  const logoSize = size === 'compact' ? 'w-8 h-8' : 'w-24 h-24';

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className={`relative flex items-center justify-center ${containerSize}`}>
        
        {/* Anel Externo Giratório */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_1.5s_linear_infinite]" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#trail-gradient)"
            strokeWidth="1.2"
            strokeDasharray="80 180"
            strokeLinecap="round"
            filter="url(#glow)"
            className="opacity-90"
          />
        </svg>

        {/* Logo Central Breathing (Vibrante) */}
        <div className={`relative flex items-center justify-center animate-[vibrant-pulse_2s_ease-in-out_infinite] ${logoSize}`}>
          
          {/* Brilho de Fundo seguindo o formato da logo */}
          <img 
            src="/logos/simbolo-verde.png" 
            alt=""
            className="absolute inset-0 w-full h-full object-contain blur-xl opacity-60 scale-125 select-none pointer-events-none"
          />
          
          <img 
            src="/logos/simbolo-verde.png" 
            alt="Neonorte" 
            className="w-full h-full object-contain relative z-10"
          />
        </div>
      </div>

      {message && (
        <p className="mt-4 text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.3em] animate-pulse text-center px-4">
          {message}
        </p>
      )}

      {/* Animação vibrante customizada para a logo */}
      <style>{`
        @keyframes vibrant-pulse {
          0%, 100% { transform: scale(0.9); filter: drop-shadow(0 0 8px rgba(34,197,94,0.4)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 25px rgba(34,197,94,1)); }
        }
      `}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

export default NeonorteLoader;
