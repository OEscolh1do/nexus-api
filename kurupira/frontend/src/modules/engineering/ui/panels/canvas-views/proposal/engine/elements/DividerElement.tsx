import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
}

export function DividerElement({ element }: Props) {
  const { color = '#e2e8f0', thickness = 1 } = element.props as Record<string, unknown>;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: `${thickness}px`,
          backgroundColor: color as string,
        }}
      />
    </div>
  );
}
