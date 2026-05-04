import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
}

export function WatermarkElement({ element }: Props) {
  const {
    text = 'CONFIDENCIAL',
    opacity = 0.08,
    angle = -45,
    fontSize = 72,
    color = '#000000',
  } = element.props as Record<string, unknown>;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: color as string,
          opacity: opacity as number,
          transform: `rotate(${angle}deg)`,
          whiteSpace: 'nowrap',
          letterSpacing: '0.1em',
          userSelect: 'none',
        }}
      >
        {text as string}
      </span>
    </div>
  );
}
