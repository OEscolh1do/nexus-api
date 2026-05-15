import type {
  ParametricSymbolConfig,
  ParametricPort,
  PortKey,
} from '@/core/schemas/inverterSchema';

interface DynamicParametricBlockProps {
  config: ParametricSymbolConfig;
  /** Porta ativa — destacada visualmente durante o roteamento do Sugiyama */
  activePortKey?: PortKey;
  /** Dimensões externas do bloco SVG no canvas — defaults ao config.dimensions */
  width?: number;
  height?: number;
  className?: string;
}

// Tokens de cor por polaridade (alinhado com Layer 3 palette)
const POLARITY_COLORS: Record<ParametricPort['polarity'], string> = {
  positive: '#ef4444',   // stroke-red-500 — CC positivo
  negative: '#3b82f6',   // stroke-blue-500 — CC negativo
  'ac-out': '#94a3b8',   // stroke-slate-400 — CA
};

const PIN_RADIUS = 4;
const PIN_ACTIVE_RADIUS = 6;
const PIN_LABEL_OFFSET = 14;

/**
 * DynamicParametricBlock
 *
 * Renderiza um bloco SVG parametrizado a partir de um `ParametricSymbolConfig`.
 * Cada porta é posicionada via `side` e `offset` (0–1 ao longo do lado).
 * Compatível com a Layer 3 do ElectricalCanvasView.
 */
export function DynamicParametricBlock({
  config,
  activePortKey,
  width: externalW,
  height: externalH,
  className,
}: DynamicParametricBlockProps) {
  if (config.type !== 'parametric-block') return null;

  const W = externalW ?? config.dimensions.width;
  const H = externalH ?? config.dimensions.height;
  const PADDING = 16; // espaço para labels/pinos fora do retângulo

  const viewW = W + PADDING * 2;
  const viewH = H + PADDING * 2;

  /** Converte side + offset → coordenadas absolutas no sistema de coordenadas SVG */
  function portToXY(port: ParametricPort): { x: number; y: number } {
    const bx = PADDING; // origem do retângulo
    const by = PADDING;
    switch (port.side) {
      case 'left':   return { x: bx,         y: by + port.offset * H };
      case 'right':  return { x: bx + W,     y: by + port.offset * H };
      case 'top':    return { x: bx + port.offset * W, y: by         };
      case 'bottom': return { x: bx + port.offset * W, y: by + H     };
    }
  }

  /** Posição do label relativa ao pino */
  function labelAnchor(port: ParametricPort): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
    const { x, y } = portToXY(port);
    switch (port.side) {
      case 'left':   return { x: x - PIN_LABEL_OFFSET, y, anchor: 'end' };
      case 'right':  return { x: x + PIN_LABEL_OFFSET, y, anchor: 'start' };
      case 'top':    return { x, y: y - PIN_LABEL_OFFSET, anchor: 'middle' };
      case 'bottom': return { x, y: y + PIN_LABEL_OFFSET, anchor: 'middle' };
    }
  }

  const portEntries = Object.entries(config.ports) as [PortKey, ParametricPort][];

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={viewW}
      height={viewH}
      className={className}
      role="img"
      aria-label={`Símbolo paramétrico — ${portEntries.length} portas`}
    >
      {/* Corpo do bloco */}
      <rect
        x={PADDING}
        y={PADDING}
        width={W}
        height={H}
        fill="#0f172a"
        stroke="#334155"
        strokeWidth={1.5}
        rx={2}
      />

      {/* Rótulo interno */}
      <text
        x={PADDING + W / 2}
        y={PADDING + H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#64748b"
        fontSize={10}
        fontFamily="monospace"
      >
        INV
      </text>

      {/* Portas */}
      {portEntries.map(([key, port]) => {
        const { x, y } = portToXY(port);
        const lbl = labelAnchor(port);
        const isActive = key === activePortKey;
        const color = POLARITY_COLORS[port.polarity];
        const r = isActive ? PIN_ACTIVE_RADIUS : PIN_RADIUS;

        return (
          <g key={key}>
            {/* Linha de conexão do pino ao corpo */}
            {port.side === 'left'   && <line x1={x} y1={y} x2={PADDING}     y2={y} stroke={color} strokeWidth={1.5} />}
            {port.side === 'right'  && <line x1={x} y1={y} x2={PADDING + W} y2={y} stroke={color} strokeWidth={1.5} />}
            {port.side === 'top'    && <line x1={x} y1={y} x2={x} y2={PADDING}     stroke={color} strokeWidth={1.5} />}
            {port.side === 'bottom' && <line x1={x} y1={y} x2={x} y2={PADDING + H} stroke={color} strokeWidth={1.5} />}

            {/* Pino */}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={isActive ? color : '#0f172a'}
              stroke={color}
              strokeWidth={isActive ? 2 : 1.5}
            />

            {/* Label */}
            <text
              x={lbl.x}
              y={lbl.y}
              textAnchor={lbl.anchor}
              dominantBaseline="middle"
              fill={isActive ? color : '#475569'}
              fontSize={8}
              fontFamily="monospace"
            >
              {port.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
