interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Fill below the line */
  fill?: boolean;
}

/**
 * Minimal SVG sparkline — no external deps.
 * Renders a polyline over the provided values array.
 */
export default function Sparkline({
  values,
  width = 80,
  height = 24,
  color = '#60a5fa',
  fill = true,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padY = 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y] as [number, number];
  });

  const polyline = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const fillPath =
    fill && points.length > 0
      ? `M${points[0][0].toFixed(1)},${height} ` +
        points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') +
        ` L${points[points.length - 1][0].toFixed(1)},${height} Z`
      : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {fillPath && (
        <path d={fillPath} fill={color} fillOpacity={0.12} strokeWidth={0} />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
