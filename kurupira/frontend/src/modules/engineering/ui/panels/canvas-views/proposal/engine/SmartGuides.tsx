import type { GuideLines } from './types';
import { A4_WIDTH, A4_HEIGHT } from './types';

interface Props {
  guides: GuideLines;
}

export function SmartGuides({ guides }: Props) {
  if (guides.x.length === 0 && guides.y.length === 0) return null;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 600 }}
      width={A4_WIDTH}
      height={A4_HEIGHT}
      aria-hidden="true"
    >
      {/* Guias verticais (x fixo, linha de cima a baixo) */}
      {guides.x.map((x, i) => (
        <g key={`gx-${i}`}>
          <line
            x1={x} y1={0} x2={x} y2={A4_HEIGHT}
            stroke="#f43f5e"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
          {/* Diamante de ancoragem no topo */}
          <polygon
            points={`${x},4 ${x + 4},8 ${x},12 ${x - 4},8`}
            fill="#f43f5e"
            opacity={0.9}
          />
        </g>
      ))}

      {/* Guias horizontais (y fixo, linha da esquerda à direita) */}
      {guides.y.map((y, i) => (
        <g key={`gy-${i}`}>
          <line
            x1={0} y1={y} x2={A4_WIDTH} y2={y}
            stroke="#f43f5e"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.85}
          />
          {/* Diamante de ancoragem na esquerda */}
          <polygon
            points={`4,${y} 8,${y - 4} 12,${y} 8,${y + 4}`}
            fill="#f43f5e"
            opacity={0.9}
          />
        </g>
      ))}
    </svg>
  );
}
