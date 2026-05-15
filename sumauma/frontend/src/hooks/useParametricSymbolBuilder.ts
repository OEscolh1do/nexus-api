import { useState, useCallback } from 'react';
import type {
  ParametricSymbolConfig,
  ParametricPort,
  PortKey,
} from '@/lib/types/parametricSymbol';

// ── Estado inicial: bloco vazio sem portas ───────────────────────────────────

const INITIAL_CONFIG: ParametricSymbolConfig = {
  type: 'parametric-block',
  dimensions: { width: 80, height: 120 },
  ports: {},
};

// ── Utilitários ──────────────────────────────────────────────────────────────

/** Redistribui os offsets das portas CC (lado esquerdo) uniformemente */
function redistributeLeftOffsets(
  ports: Record<string, ParametricPort>
): Record<string, ParametricPort> {
  const leftKeys = Object.keys(ports).filter((k) => ports[k].side === 'left');
  const count = leftKeys.length;
  if (count === 0) return ports;

  const updated = { ...ports };
  leftKeys.forEach((key, idx) => {
    updated[key] = { ...updated[key], offset: (idx + 1) / (count + 1) };
  });
  return updated;
}

/** Gera a próxima chave de MPPT disponível */
function nextMpptIndex(ports: Record<string, ParametricPort>): number {
  const indices = Object.keys(ports)
    .filter((k) => k.startsWith('mppt_'))
    .map((k) => {
      const m = k.match(/^mppt_(\d+)_/);
      return m ? parseInt(m[1], 10) : -1;
    });
  return indices.length > 0 ? Math.max(...indices) + 1 : 1;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseParametricSymbolBuilderReturn {
  config: ParametricSymbolConfig;
  addMpptPair: () => void;
  removeMpptPair: (mpptIndex: number) => void;
  updateLabel: (portKey: PortKey, label: string) => void;
  reset: () => void;
  /** JSON pronto para persistir via PATCH */
  toJSON: () => ParametricSymbolConfig;
}

/**
 * useParametricSymbolBuilder
 *
 * Hook de estado local para o `<ParametricSymbolBuilder />`.
 * Gerencia a adição/remoção de pares de pinos MPPT e o pino CA fixo.
 *
 * @param initialConfig — Configuração existente (edição) ou undefined (criação)
 */
export function useParametricSymbolBuilder(
  initialConfig?: ParametricSymbolConfig | null
): UseParametricSymbolBuilderReturn {
  const [config, setConfig] = useState<ParametricSymbolConfig>(() => {
    if (initialConfig?.type === 'parametric-block') return initialConfig;

    // Se não há config, inicializa com pino CA fixo
    return {
      ...INITIAL_CONFIG,
      ports: {
        ac_out: {
          side: 'right',
          offset: 0.5,
          label: 'CA',
          polarity: 'ac-out',
        },
      } as Record<string, ParametricPort>,
    };
  });

  const addMpptPair = useCallback(() => {
    setConfig((prev: ParametricSymbolConfig) => {
      const idx = nextMpptIndex(prev.ports);
      const posKey: PortKey = `mppt_${idx}_pos`;
      const negKey: PortKey = `mppt_${idx}_neg`;

      const newPorts: Record<string, ParametricPort> = {
        ...prev.ports,
        [posKey]: {
          side: 'left',
          offset: 0.5,
          label: `MPPT ${idx}+`,
          polarity: 'positive',
          mpptIndex: idx,
        },
        [negKey]: {
          side: 'left',
          offset: 0.5,
          label: `MPPT ${idx}−`,
          polarity: 'negative',
          mpptIndex: idx,
        },
      };

      return {
        ...prev,
        ports: redistributeLeftOffsets(newPorts),
      };
    });
  }, []);

  const removeMpptPair = useCallback((mpptIndex: number) => {
    setConfig((prev: ParametricSymbolConfig) => {
      const filtered = Object.fromEntries(
        Object.entries(prev.ports).filter(
          ([, port]) => (port as ParametricPort).mpptIndex !== mpptIndex
        )
      ) as Record<string, ParametricPort>;

      return {
        ...prev,
        ports: redistributeLeftOffsets(filtered),
      };
    });
  }, []);

  const updateLabel = useCallback((portKey: PortKey, label: string) => {
    setConfig((prev: ParametricSymbolConfig) => ({
      ...prev,
      ports: {
        ...prev.ports,
        [portKey]: { ...prev.ports[portKey], label },
      },
    }));
  }, []);

  const reset = useCallback(() => setConfig(INITIAL_CONFIG), []);

  const toJSON = useCallback((): ParametricSymbolConfig => config, [config]);

  return { config, addMpptPair, removeMpptPair, updateLabel, reset, toJSON };
}
