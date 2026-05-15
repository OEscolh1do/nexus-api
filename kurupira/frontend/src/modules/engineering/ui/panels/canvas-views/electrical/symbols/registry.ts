/**
 * registry.ts — Symbol registry da Layer 3 (Esquema Unifilar)
 *
 * NOTA: Este arquivo é .ts puro (sem JSX). Usa React.createElement para
 * evitar a necessidade de renomear para .tsx enquanto mantém compatibilidade
 * com importações existentes.
 */
import React, { type ComponentType, type SVGProps as ReactSVGProps } from 'react';
import { DynamicParametricBlock } from './DynamicParametricBlock';
import type { PortKey, InverterCatalogItem } from '@/core/schemas/inverterSchema';

// ── Tipos ────────────────────────────────────────────────────────────────────

type StaticSymbol = ComponentType<ReactSVGProps<SVGSVGElement>>;
type SymbolRenderer = StaticSymbol | ((props: ReactSVGProps<SVGSVGElement>) => React.ReactElement);

// ── Símbolos IEC 60617 estáticos (fallback) ──────────────────────────────────

const GenericInverterSymbol: StaticSymbol = (props) =>
  React.createElement(
    'svg',
    { viewBox: '0 0 80 80', ...props },
    React.createElement('rect', {
      key: 'body',
      x: 4, y: 4, width: 72, height: 72,
      fill: '#0f172a', stroke: '#334155', strokeWidth: 1.5, rx: 2,
    }),
    React.createElement(
      'text',
      {
        key: 'label',
        x: 40, y: 42,
        textAnchor: 'middle', dominantBaseline: 'middle',
        fill: '#475569', fontSize: 10, fontFamily: 'monospace',
      },
      'INV',
    ),
  );

const STATIC_SYMBOLS: Record<string, StaticSymbol> = {
  'inverter-default': GenericInverterSymbol,
  // Adicionar: 'inverter-string', 'inverter-micro', etc.
};

// ── API Pública ───────────────────────────────────────────────────────────────

/**
 * getSymbol
 *
 * Resolve o componente de símbolo correto para um inversor:
 * 1. `catalog[id].symbolConfig.type === 'parametric-block'` → DynamicParametricBlock
 * 2. `catalog[id].unifilarSymbolRef` → símbolo IEC estático correspondente
 * 3. Fallback garantido → 'inverter-default' (nunca retorna undefined)
 *
 * @param inverterId    — ID no catálogo (useCatalogStore)
 * @param catalog       — Array de InverterCatalogItem da store
 * @param activePortKey — Porta ativa para highlight (Sugiyama routing)
 */
export function getSymbol(
  inverterId: string,
  catalog: InverterCatalogItem[],
  activePortKey?: PortKey,
): SymbolRenderer {
  const inv = catalog.find((i) => i.id === inverterId);

  // Prioridade 1: config paramétrico PSB
  if (inv?.symbolConfig?.type === 'parametric-block') {
    const config = inv.symbolConfig;
    return (props: ReactSVGProps<SVGSVGElement>): React.ReactElement =>
      React.createElement(DynamicParametricBlock, {
        config,
        activePortKey,
        width: props.width as number | undefined,
        height: props.height as number | undefined,
        className: props.className,
      });
  }

  // Prioridade 2: símbolo estático referenciado pelo campo existente no banco
  const symbolKey = inv?.unifilarSymbolRef ?? 'inverter-default';
  return STATIC_SYMBOLS[symbolKey] ?? STATIC_SYMBOLS['inverter-default'];
}
