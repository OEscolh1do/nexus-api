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
  /** Atualiza o offset vertical (0.05–0.95) de um par MPPT pelo mpptIndex */
  updateOffset: (mpptIndex: number, offset: number) => void;
  /** Atualiza as dimensões do bloco SVG */
  updateDimensions: (width: number, height: number) => void;
  /**
   * Troca os offsets de dois pares MPPT (drag-to-reorder).
   * Os metadados (label, polarity, mpptIndex) permanecem; apenas a posição vertical troca.
   */
  reorderMppt: (fromMpptIndex: number, toMpptIndex: number) => void;
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
 * @param onChange — Callback chamado imediatamente ao atualizar o estado (evita stale state)
 */
export function useParametricSymbolBuilder(
  initialConfig?: ParametricSymbolConfig | null,
  onChange?: (config: ParametricSymbolConfig | null) => void
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

  const updateConfig = useCallback(
    (updater: (prev: ParametricSymbolConfig) => ParametricSymbolConfig) => {
      setConfig((prev) => {
        const next = updater(prev);
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  const addMpptPair = useCallback(() => {
    updateConfig((prev: ParametricSymbolConfig) => {
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
  }, [updateConfig]);

  const removeMpptPair = useCallback((mpptIndex: number) => {
    updateConfig((prev: ParametricSymbolConfig) => {
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
  }, [updateConfig]);

  const updateLabel = useCallback((portKey: PortKey, label: string) => {
    updateConfig((prev: ParametricSymbolConfig) => ({
      ...prev,
      ports: {
        ...prev.ports,
        [portKey]: { ...prev.ports[portKey], label },
      },
    }));
  }, [updateConfig]);

  const updateOffset = useCallback((mpptIndex: number, offset: number) => {
    const clamped = Math.min(0.95, Math.max(0.05, offset));
    updateConfig((prev: ParametricSymbolConfig) => {
      const posKey: PortKey = `mppt_${mpptIndex}_pos`;
      const negKey: PortKey = `mppt_${mpptIndex}_neg`;
      const updated = { ...prev.ports };
      if (updated[posKey]) updated[posKey] = { ...updated[posKey], offset: clamped };
      if (updated[negKey]) updated[negKey] = { ...updated[negKey], offset: clamped };
      return { ...prev, ports: updated };
    });
  }, [updateConfig]);

  const updateDimensions = useCallback((width: number, height: number) => {
    updateConfig((prev: ParametricSymbolConfig) => ({
      ...prev,
      dimensions: {
        width: Math.max(40, Math.min(300, Math.round(width))),
        height: Math.max(60, Math.min(500, Math.round(height))),
      },
    }));
  }, [updateConfig]);

  const reorderMppt = useCallback((fromMpptIndex: number, toMpptIndex: number) => {
    if (fromMpptIndex === toMpptIndex) return;
    updateConfig((prev: ParametricSymbolConfig) => {
      const fromPosKey: PortKey = `mppt_${fromMpptIndex}_pos`;
      const fromNegKey: PortKey = `mppt_${fromMpptIndex}_neg`;
      const toPosKey: PortKey = `mppt_${toMpptIndex}_pos`;
      const toNegKey: PortKey = `mppt_${toMpptIndex}_neg`;

      const fromOffset = prev.ports[fromPosKey]?.offset ?? 0.5;
      const toOffset   = prev.ports[toPosKey]?.offset   ?? 0.5;

      const updated = { ...prev.ports };
      if (updated[fromPosKey]) updated[fromPosKey] = { ...updated[fromPosKey], offset: toOffset };
      if (updated[fromNegKey]) updated[fromNegKey] = { ...updated[fromNegKey], offset: toOffset };
      if (updated[toPosKey])   updated[toPosKey]   = { ...updated[toPosKey],   offset: fromOffset };
      if (updated[toNegKey])   updated[toNegKey]   = { ...updated[toNegKey],   offset: fromOffset };

      return { ...prev, ports: updated };
    });
  }, [updateConfig]);

  const reset = useCallback(() => {
    // Ao limpar, retornamos null para o onChange
    setConfig(INITIAL_CONFIG);
    onChange?.(null);
  }, [onChange]);

  const toJSON = useCallback((): ParametricSymbolConfig => config, [config]);

  return { config, addMpptPair, removeMpptPair, updateLabel, updateOffset, updateDimensions, reorderMppt, reset, toJSON };
}
