import { useMemo } from 'react';
import type { ParametricSymbolConfig } from '@/lib/types/parametricSymbol';

interface ParametricSymbolPreviewProps {
  config: ParametricSymbolConfig;
  className?: string;
}

const POLARITY_COLORS: Record<string, string> = {
  positive: '#ef4444',
  negative: '#3b82f6',
  'ac-out': '#94a3b8',
};

/** Mínimo de separação vertical entre labels no mesmo lado (px SVG) */
const MIN_LABEL_GAP = 8;

/**
 * ParametricSymbolPreview
 *
 * Renderização read-only do bloco paramétrico de inversor (IEC 60617).
 * Aplica:
 *  • Separação visual ±PIN_GAP entre par pos/neg de cada MPPT (mesma lógica do builder)
 *  • Evitação de colisão de labels por varredura linear por lado
 */
export default function ParametricSymbolPreview({
  config,
  className = '',
}: ParametricSymbolPreviewProps) {
  const { dimensions, ports } = config;
  const W = dimensions.width;
  const H = dimensions.height;

  // ── Pré-computação de posições com pin-gap + collision avoidance ───────────
  const portData = useMemo(() => {
    const PIN_GAP = Math.max(4, H * 0.04);

    const items = Object.entries(ports).map(([key, port]) => {
      const isLeft = port.side === 'left';
      const isRight = port.side === 'right';
      const isTop = port.side === 'top';
      const isBottom = port.side === 'bottom';

      // Posição do pino na borda do bloco (antes do gap)
      let py = isTop ? 0 : isBottom ? H : port.offset * H;
      const px = isLeft ? 0 : isRight ? W : port.offset * W;

      // Separa visualmente positivo e negativo do mesmo par MPPT
      if (key.endsWith('_pos')) py -= PIN_GAP;
      else if (key.endsWith('_neg')) py += PIN_GAP;

      // Ponta exterior do fio do pino
      const px2 = isLeft ? -12 : isRight ? W + 12 : px;
      const py2 = isTop ? -12 : isBottom ? H + 12 : py;

      // Ancoragem inicial do label
      const labelX = isLeft ? px2 - 4 : isRight ? px2 + 4 : px2;
      let labelY = isTop ? py2 - 6 : isBottom ? py2 + 10 : py2 + 2;

      return {
        key,
        port,
        px,
        py,
        px2,
        py2,
        labelX,
        labelY,
        color: POLARITY_COLORS[port.polarity] ?? '#475569',
      };
    });

    // ── Evitar colisão por lado (varredura linear de cima para baixo) ─────
    (['left', 'right', 'top', 'bottom'] as const).forEach((side) => {
      const sideItems = items
        .filter((p) => p.port.side === side)
        .sort((a, b) => a.labelY - b.labelY);

      for (let i = 1; i < sideItems.length; i++) {
        const prev = sideItems[i - 1];
        const curr = sideItems[i];
        if (curr.labelY - prev.labelY < MIN_LABEL_GAP) {
          curr.labelY = prev.labelY + MIN_LABEL_GAP;
        }
      }
    });

    return items;
  }, [ports, W, H]);

  return (
    <div
      className={`flex items-center justify-center bg-slate-900/30 rounded-sm border border-slate-800/50 p-4 ${className}`}
    >
      <svg
        viewBox={`-30 -10 ${W + 60} ${H + 20}`}
        width={W + 80}
        height={H + 30}
        className="overflow-visible drop-shadow-2xl"
      >
        {/* Sombra de profundidade */}
        <rect x={2} y={2} width={W} height={H} fill="black" opacity={0.2} rx={2} />

        {/* Corpo principal */}
        <rect
          x={0} y={0} width={W} height={H}
          fill="#0f172a" stroke="#334155" strokeWidth={1.5} rx={2}
        />

        {/* Divisor diagonal CC→CA (IEC 60617) */}
        <line
          x1={0} y1={H} x2={W} y2={0}
          stroke="#334155" strokeWidth={1} opacity={0.6}
        />

        {/* Símbolo CC (=) — quadrante superior esquerdo */}
        <g transform={`translate(${W * 0.28}, ${H * 0.28})`}>
          <line x1={-4} y1={-1.5} x2={4} y2={-1.5} stroke="#475569" strokeWidth={1.2} />
          <line x1={-4} y1={1.5} x2={4} y2={1.5} stroke="#475569" strokeWidth={1.2} />
        </g>

        {/* Símbolo CA (~) — quadrante inferior direito */}
        <g transform={`translate(${W * 0.72}, ${H * 0.72})`}>
          <path
            d="M-4,0 C-4,-4 -1,-4 0,0 C1,4 4,4 4,0"
            fill="none"
            stroke="#475569"
            strokeWidth={1.2}
          />
        </g>

        {/* Portas — posições já corrigidas com PIN_GAP + collision avoidance */}
        {portData.map(({ key, port, px, py, px2, py2, labelX, labelY, color }) => (
          <g key={key}>
            <line
              x1={px} y1={py} x2={px2} y2={py2}
              stroke={color} strokeWidth={1.2}
            />
            <circle
              cx={px2} cy={py2} r={2.5}
              fill="#0f172a" stroke={color} strokeWidth={1.5}
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor={
                port.side === 'left' ? 'end'
                : port.side === 'right' ? 'start'
                : 'middle'
              }
              fill="#475569"
              fontSize={6}
              fontFamily="monospace"
              opacity={0.7}
              fontWeight="bold"
            >
              {port.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
