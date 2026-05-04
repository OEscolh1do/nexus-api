import { A4_WIDTH, A4_HEIGHT } from './types';

interface Props {
  size: number;
}

export function GridOverlay({ size }: Props) {
  const majorSize = size * 4;
  const minorColor = 'rgba(148,163,184,0.25)';  // slate-400/25
  const majorColor = 'rgba(148,163,184,0.45)';  // slate-400/45

  // IDs únicos para evitar colisão se múltiplas instâncias existirem
  const minorId = `grid-minor-${size}`;
  const majorId = `grid-major-${size}`;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500 }}
      width={A4_WIDTH}
      height={A4_HEIGHT}
      aria-hidden="true"
    >
      <defs>
        {/* Minor grid: linhas finas a cada `size` px */}
        <pattern id={minorId} width={size} height={size} patternUnits="userSpaceOnUse">
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke={minorColor}
            strokeWidth={0.5}
          />
        </pattern>

        {/* Major grid: linhas mais fortes a cada 4×size px */}
        <pattern id={majorId} width={majorSize} height={majorSize} patternUnits="userSpaceOnUse">
          <rect width={majorSize} height={majorSize} fill={`url(#${minorId})`} />
          <path
            d={`M ${majorSize} 0 L 0 0 0 ${majorSize}`}
            fill="none"
            stroke={majorColor}
            strokeWidth={1}
          />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill={`url(#${majorId})`} />

      {/* Régua de referência nas bordas (pontos de 0,0) */}
      <line x1={0} y1={0} x2={A4_WIDTH} y2={0} stroke={majorColor} strokeWidth={1} />
      <line x1={0} y1={0} x2={0} y2={A4_HEIGHT} stroke={majorColor} strokeWidth={1} />
    </svg>
  );
}
