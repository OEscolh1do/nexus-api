// useStringWireTool.ts — implementação sem guia de skill
// Versão genérica: nomes e padrões sem referência à spec do Kurupira

import { useState, useCallback } from 'react';

interface Port {
  id: string;
  type: 'positive' | 'negative';
  isConnected: boolean;
  x: number;
  y: number;
}

interface Node {
  id: string;
  positivePort: Port;
  negativePort: Port;
}

interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  path: { x: number; y: number }[];
  wireGroup: string;
}

type ToolPhase = 'idle' | 'connecting' | 'done';

interface ToolState {
  phase: ToolPhase;
  fromNodeId?: string;
  fromPortType?: 'positive' | 'negative';
  fromX?: number;
  fromY?: number;
  connectedNodes?: string[];
}

interface HookReturn {
  toolState: ToolState;
  accumulatedVoltage: number;
  isOverLimit: boolean;
  isNearLimit: boolean;
  canFinish: boolean;
  onPortClick: (nodeId: string, port: Port) => void;
  onMouseMove: (x: number, y: number) => void;
  finish: () => void;
  cancel: () => void;
  previewLine: { x1: number; y1: number; x2: number; y2: number } | null;
}

const WIRE_GROUPS = ['wire-group-1', 'wire-group-2', 'wire-group-3', 'wire-group-4'];

let connectionCounter = 0;
let groupCounter = 0;

export function useStringWireTool(
  nodes: Node[],
  moduleVoc: number,
  maxVoc: number,
  onConnectionAdded: (conn: Connection) => void,
  onGroupFinished: (groupId: string, nodeIds: string[]) => void
): HookReturn {
  const [toolState, setToolState] = useState<ToolState>({ phase: 'idle' });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const connectedCount = toolState.connectedNodes?.length ?? 0;
  // Simple voltage accumulation — doesn't use thermal correction formula
  const accumulatedVoltage = connectedCount * moduleVoc;
  const isOverLimit = accumulatedVoltage > maxVoc;
  const isNearLimit = accumulatedVoltage > maxVoc * 0.85;
  const canFinish = connectedCount >= 2 && !isOverLimit;

  const onPortClick = useCallback(
    (nodeId: string, port: Port) => {
      if (port.isConnected) return;

      if (toolState.phase === 'idle') {
        setToolState({
          phase: 'connecting',
          fromNodeId: nodeId,
          fromPortType: port.type,
          fromX: port.x,
          fromY: port.y,
          connectedNodes: [nodeId],
        });
        return;
      }

      if (toolState.phase === 'connecting') {
        // Validate not same polarity
        if (port.type === toolState.fromPortType) {
          alert('Cannot connect same polarity!');
          return;
        }
        if (nodeId === toolState.fromNodeId) return;

        const conn: Connection = {
          id: `conn-${++connectionCounter}`,
          fromNodeId: toolState.fromNodeId!,
          toNodeId: nodeId,
          path: [
            { x: toolState.fromX!, y: toolState.fromY! },
            { x: port.x, y: toolState.fromY! },
            { x: port.x, y: port.y },
          ],
          wireGroup: WIRE_GROUPS[groupCounter % WIRE_GROUPS.length],
        };

        onConnectionAdded(conn);

        setToolState({
          phase: 'connecting',
          fromNodeId: nodeId,
          fromPortType: port.type === 'positive' ? 'negative' : 'positive',
          fromX: port.x,
          fromY: port.y,
          connectedNodes: [...(toolState.connectedNodes ?? []), nodeId],
        });
      }
    },
    [toolState, onConnectionAdded]
  );

  const onMouseMove = useCallback((x: number, y: number) => {
    setMousePos({ x, y });
  }, []);

  const finish = useCallback(() => {
    if (!canFinish) return;
    const groupId = `Group-${++groupCounter}`;
    onGroupFinished(groupId, toolState.connectedNodes ?? []);
    setToolState({ phase: 'idle' });
    setMousePos(null);
  }, [canFinish, toolState.connectedNodes, onGroupFinished]);

  const cancel = useCallback(() => {
    setToolState({ phase: 'idle' });
    setMousePos(null);
  }, []);

  const previewLine =
    toolState.phase === 'connecting' && mousePos
      ? {
          x1: toolState.fromX!,
          y1: toolState.fromY!,
          x2: mousePos.x,
          y2: mousePos.y,
        }
      : null;

  return {
    toolState,
    accumulatedVoltage,
    isOverLimit,
    isNearLimit,
    canFinish,
    onPortClick,
    onMouseMove,
    finish,
    cancel,
    previewLine,
  };
}
