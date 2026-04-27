// useStringWireTool.ts — implementação com guia da skill arranjo-layer-dev
// Segue exatamente os padrões da spec: state machine, fórmula Voc, portos, cores rotativas

import { useState, useCallback, useRef } from 'react';

// ── Tipos stub ────────────────────────────────────────────────────────────────

export interface Port {
  id: string;
  polarity: '+' | '-';
  connected: boolean;
  /** Canvas position in px */
  positionPx: { x: number; y: number };
}

export interface ArrangementNode {
  id: string;
  ports: { positive: Port; negative: Port };
  stringGroupId?: string;
  arrangementId: string;
}

export interface StringEdge {
  id: string;
  sourceNodeId: string;
  sourcePortPolarity: '+' | '-';
  targetNodeId: string;
  targetPortPolarity: '+' | '-';
  pathPx: [number, number][];
  stringGroupId: string;
}

export interface ModuleModel {
  vocStc: number;
  tempCoeffVoc: number; // per °C, negative value e.g. -0.0029
}

// ── Máquina de estados ────────────────────────────────────────────────────────

type ToolState =
  | { phase: 'idle' }
  | {
      phase: 'dragging';
      sourceNodeId: string;
      sourcePortPolarity: '+' | '-';
      sourcePosPx: { x: number; y: number };
      currentPosPx: { x: number; y: number };
      /** node IDs connected so far, in series order */
      chainNodeIds: string[];
      pathPx: [number, number][];
    }
  | { phase: 'completed' };

// ── String color rotation ─────────────────────────────────────────────────────

const STRING_COLORS = [
  'indigo-900',
  'sky-900',
  'emerald-900',
  'amber-900',
  'violet-900',
] as const;

function getStringColor(index: number): (typeof STRING_COLORS)[number] {
  return STRING_COLORS[index % STRING_COLORS.length];
}

// ── Orthogonal path builder ───────────────────────────────────────────────────

function buildOrthogonalPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): [number, number][] {
  // Simple L-shaped path: horizontal first, then vertical
  const mid = { x: to.x, y: from.y };
  return [
    [from.x, from.y],
    [mid.x, mid.y],
    [to.x, to.y],
  ];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseStringWireToolOptions {
  nodes: ArrangementNode[];
  existingEdges: StringEdge[];
  module: ModuleModel;
  tmin: number;          // minimum ambient temperature °C
  vocMaxHardware: number; // inverter max Voc input V
  existingStringCount: number;
  onEdgeCreated: (edge: StringEdge) => void;
  onStringFinalized: (stringGroupId: string, nodeIds: string[], colorToken: string) => void;
}

interface StringWireToolReturn {
  toolState: ToolState;
  vocAccumulated: number;
  vocStatus: 'ok' | 'warning' | 'error';
  blockedReason: string | null;
  onPortMouseDown: (nodeId: string, port: Port) => void;
  onPortMouseUp: (nodeId: string, port: Port) => void;
  onCanvasMouseMove: (posPx: { x: number; y: number }) => void;
  finalizeString: () => void;
  cancelString: () => void;
  previewPathPx: [number, number][] | null;
}

export function useStringWireTool(opts: UseStringWireToolOptions): StringWireToolReturn {
  const {
    nodes,
    existingEdges,
    module,
    tmin,
    vocMaxHardware,
    existingStringCount,
    onEdgeCreated,
    onStringFinalized,
  } = opts;

  const [toolState, setToolState] = useState<ToolState>({ phase: 'idle' });
  const [previewEnd, setPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  const currentStringIndexRef = useRef(existingStringCount);

  // Voc accumulated: N × Voc_STC × (1 + tempCoeffVoc × (Tmin − 25))
  const chainLength =
    toolState.phase === 'dragging' ? toolState.chainNodeIds.length + 1 : 0;

  const vocAccumulated =
    chainLength * module.vocStc * (1 + module.tempCoeffVoc * (tmin - 25));

  const vocStatus: 'ok' | 'warning' | 'error' =
    vocAccumulated > vocMaxHardware
      ? 'error'
      : vocAccumulated > 0.9 * vocMaxHardware
      ? 'warning'
      : 'ok';

  const checkPolarity = useCallback(
    (sourcePolarity: '+' | '-', targetPort: Port): string | null => {
      if (sourcePolarity === targetPort.polarity) {
        return 'Mesmo polo — curto-circuito';
      }
      if (targetPort.connected) {
        return 'Porto já conectado';
      }
      return null;
    },
    []
  );

  const blockedReason =
    toolState.phase === 'dragging' ? null : null; // evaluated at hover time

  const onPortMouseDown = useCallback(
    (nodeId: string, port: Port) => {
      if (toolState.phase !== 'idle') return;
      if (port.connected) return;

      const sourceNode = nodes.find((n) => n.id === nodeId);
      if (!sourceNode) return;

      setToolState({
        phase: 'dragging',
        sourceNodeId: nodeId,
        sourcePortPolarity: port.polarity,
        sourcePosPx: port.positionPx,
        currentPosPx: port.positionPx,
        chainNodeIds: [nodeId],
        pathPx: [[port.positionPx.x, port.positionPx.y]],
      });
    },
    [toolState.phase, nodes]
  );

  const onPortMouseUp = useCallback(
    (targetNodeId: string, targetPort: Port) => {
      if (toolState.phase !== 'dragging') return;

      const reason = checkPolarity(toolState.sourcePortPolarity, targetPort);
      if (reason) return; // blocked

      if (targetNodeId === toolState.sourceNodeId) return; // same node

      const path = buildOrthogonalPath(toolState.sourcePosPx, targetPort.positionPx);
      const stringGroupId = `S${currentStringIndexRef.current + 1}`;

      const edge: StringEdge = {
        id: `edge-${Date.now()}`,
        sourceNodeId: toolState.sourceNodeId,
        sourcePortPolarity: toolState.sourcePortPolarity,
        targetNodeId,
        targetPortPolarity: targetPort.polarity,
        pathPx: path,
        stringGroupId,
      };

      onEdgeCreated(edge);

      // Continue dragging from this node (series connection)
      setToolState({
        phase: 'dragging',
        sourceNodeId: targetNodeId,
        sourcePortPolarity: targetPort.polarity === '+' ? '-' : '+',
        sourcePosPx: targetPort.positionPx,
        currentPosPx: targetPort.positionPx,
        chainNodeIds: [...toolState.chainNodeIds, targetNodeId],
        pathPx: [...toolState.pathPx, [targetPort.positionPx.x, targetPort.positionPx.y]],
      });
    },
    [toolState, checkPolarity, onEdgeCreated]
  );

  const onCanvasMouseMove = useCallback(
    (posPx: { x: number; y: number }) => {
      if (toolState.phase !== 'dragging') return;
      setPreviewEnd(posPx);
      setToolState((prev) =>
        prev.phase === 'dragging'
          ? { ...prev, currentPosPx: posPx }
          : prev
      );
    },
    [toolState.phase]
  );

  const finalizeString = useCallback(() => {
    if (toolState.phase !== 'dragging') return;
    if (toolState.chainNodeIds.length < 2) return;

    const index = currentStringIndexRef.current;
    const stringGroupId = `S${index + 1}`;
    const colorToken = getStringColor(index);

    onStringFinalized(stringGroupId, toolState.chainNodeIds, colorToken);
    currentStringIndexRef.current += 1;
    setToolState({ phase: 'completed' });
    setTimeout(() => setToolState({ phase: 'idle' }), 100);
  }, [toolState, onStringFinalized]);

  const cancelString = useCallback(() => {
    setToolState({ phase: 'idle' });
    setPreviewEnd(null);
  }, []);

  const previewPathPx: [number, number][] | null =
    toolState.phase === 'dragging' && previewEnd
      ? buildOrthogonalPath(toolState.sourcePosPx, previewEnd)
      : null;

  return {
    toolState,
    vocAccumulated,
    vocStatus,
    blockedReason,
    onPortMouseDown,
    onPortMouseUp,
    onCanvasMouseMove,
    finalizeString,
    cancelString,
    previewPathPx,
  };
}
