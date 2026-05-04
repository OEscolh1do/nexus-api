import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import type { CanvasElement } from '../types';

const LOGO_PATHS: Record<string, string> = {
  branco:  '/logos/logo-branco.png',
  verde:   '/logos/logo-verde.png',
  simbolo: '/logos/simbolo-branco.png',
};

interface Props {
  element: CanvasElement;
}

export function LogoElement({ element }: Props) {
  const { variant = 'verde', objectFit = 'contain' } = element.props as Record<string, unknown>;
  const logoOverride = useSolarStore((s) => s.proposalData.logoOverride);
  const src = logoOverride ?? LOGO_PATHS[variant as string] ?? LOGO_PATHS.verde;

  return (
    <img
      src={src}
      alt="Logo"
      style={{ width: '100%', height: '100%', objectFit: objectFit as React.CSSProperties['objectFit'] }}
      draggable={false}
    />
  );
}
