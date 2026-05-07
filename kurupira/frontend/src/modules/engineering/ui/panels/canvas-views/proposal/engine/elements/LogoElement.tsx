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
  const { variant = 'verde', objectFit = 'contain', bgColor = '' } = element.props as Record<string, unknown>;
  const logoOverride = useSolarStore((s) => s.proposalData.logoOverride);

  // Variant "simbolo-circular": círculo colorido com o símbolo branco dentro
  // (replica o badge circular do cabeçalho da ProposalPageTechnical)
  if (variant === 'simbolo-circular') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: String(bgColor) || '#4CAF50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src="/logos/simbolo-branco.png"
          alt="Neonorte"
          style={{ width: '65%', height: '65%', objectFit: 'contain' }}
          draggable={false}
        />
      </div>
    );
  }

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
