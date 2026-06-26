import '@xyflow/react/dist/style.css';

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type DragEvent,
} from 'react';
import {
  ReactFlow,
  Background, BackgroundVariant,
  MiniMap,
  Panel,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeChange,
  type EdgeChange,
  type EdgeTypes,
  type OnSelectionChangeParams,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import {
  AlertTriangle, CheckCircle2, ChevronLeft, LayoutDashboard,
  Maximize2, Grid3x3, RefreshCw,
} from 'lucide-react';

import {
  type TopologyConfig,
  type TopologyNode,
  type TopologyEdge,
  type TopologyNodeData,
  type NodeKind,
  type PortDomain,
  KIND_META,
  getPortDomain,
  validateTopology,
  type ValidationIssue,
} from '@/lib/types/topology';
import { UnifileNode } from './nodes/UnifileNode';
import { OrthogonalEdge, type OrthogonalEdgeData } from './edges/OrthogonalEdge';
import { NodeInspector } from './NodeInspector';
import { CableInspector } from './CableInspector';
import { applyDagreLayout } from './layout/dagreLayout';
import { edgeAnnotationLabel } from './generateUnifilar';

// ─── Types ────────────────────────────────────────────────────────────────────
type RFNode = Node<TopologyNodeData, 'unfile-node'>;
type RFEdge = Edge<OrthogonalEdgeData>;

// ─── Stable maps ──────────────────────────────────────────────────────────────
const NODE_TYPES = { 'unfile-node': UnifileNode } as const;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: EdgeTypes = { orthogonal: OrthogonalEdge as any };

// ─── uid ──────────────────────────────────────────────────────────────────────
let _seq = 0;
const uid = () => `uni-${Date.now()}-${++_seq}`;

// ─── Conversions ──────────────────────────────────────────────────────────────
function toRFNode(n: TopologyNode): RFNode {
  return { id: n.id, type: 'unfile-node', position: { x: n.x, y: n.y }, data: n.data, deletable: true };
}
function fromRFNode(n: RFNode): TopologyNode {
  return { id: n.id, kind: n.data.kind, x: Math.round(n.position.x), y: Math.round(n.position.y), data: n.data };
}
function toRFEdge(e: TopologyEdge): RFEdge {
  return {
    id: e.id, source: e.source, sourceHandle: e.sourceHandle,
    target: e.target, targetHandle: e.targetHandle,
    type: 'orthogonal',
    markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
    data: {
      domain: e.domain,
      waypoints: e.waypoints,
      label: edgeAnnotationLabel(e),
    },
  };
}
function fromRFEdge(e: RFEdge, topoCfg: TopologyConfig): TopologyEdge {
  // Recover annotation fields from the source topo edge (label is derived, not canonical)
  const orig = topoCfg.edges.find(x => x.id === e.id);
  return {
    id: e.id,
    source: e.source, sourceHandle: e.sourceHandle ?? '',
    target: e.target, targetHandle: e.targetHandle ?? '',
    domain: e.data?.domain ?? 'DC',
    waypoints: e.data?.waypoints,
    cableSection: orig?.cableSection,
    nominalA:     orig?.nominalA,
    nominalV:     orig?.nominalV,
  };
}

// ─── Palette (same structure as block diagram) ────────────────────────────────
const PALETTE_GROUPS: { label: string; kinds: NodeKind[] }[] = [
  { label: 'Geração CC',     kinds: ['pv-panel', 'pv-string', 'string-combiner'] },
  { label: 'Proteção CC',    kinds: ['dps-dc', 'fuse-dc'] },
  { label: 'Inversão',       kinds: ['inverter'] },
  { label: 'Proteção CA',    kinds: ['ac-breaker', 'dps-ac'] },
  { label: 'Medição / Rede', kinds: ['meter', 'grid'] },
];
const DND_TYPE = 'application/x-topology-node-kind';

function PaletteItem({ kind }: { kind: NodeKind }) {
  const meta = KIND_META[kind];
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData(DND_TYPE, kind); e.dataTransfer.effectAllowed = 'copy'; }}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border cursor-grab active:cursor-grabbing select-none text-[10px] font-mono font-bold transition-opacity hover:opacity-100 opacity-75 ${meta.colorClass}`}
    >
      <span className="text-[12px] leading-none">{meta.icon}</span>
      <span className="truncate">{meta.shortLabel}</span>
    </div>
  );
}

function defaultData(kind: NodeKind): TopologyNodeData {
  const meta = KIND_META[kind];
  const base: TopologyNodeData = {
    kind, label: meta.label,
    domain: meta.domain === 'mixed' ? 'DC' : (meta.domain as PortDomain),
  };
  if (kind === 'inverter')        return { ...base, mpptCount: 2, phase: 'mono' };
  if (kind === 'string-combiner') return { ...base, inputCount: 2 };
  return base;
}

// ─── Validation badge ─────────────────────────────────────────────────────────
function ValidationBadge({ issues }: { issues: ValidationIssue[] }) {
  const errors   = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
        <CheckCircle2 className="h-3 w-3" />Topologia válida
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 max-w-xs">
      {errors.map((iss, i) => (
        <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded-sm bg-red-950/80 border border-red-500/30 text-red-400 text-[10px] font-bold">
          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-px" />{iss.message}
        </div>
      ))}
      {warnings.map((iss, i) => (
        <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded-sm bg-amber-950/80 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
          <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-px" />{iss.message}
        </div>
      ))}
    </div>
  );
}

// ─── Inner canvas ─────────────────────────────────────────────────────────────
interface InnerProps {
  config:       TopologyConfig | null;
  onChange:     (c: TopologyConfig) => void;
  onBack?:      () => void;
  onRegenerate?: () => void;
  readOnly?:    boolean;
}

function Inner({ config, onChange, onBack, onRegenerate, readOnly = false }: InnerProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Keep a ref to the canonical config so fromRFEdge can recover annotation fields
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const initNodes = useMemo<RFNode[]>(() => (config?.nodes ?? []).map(toRFNode), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initEdges = useMemo<RFEdge[]>(() => (config?.edges ?? []).map(toRFEdge), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes] = useNodesState<RFNode>(initNodes);
  const [edges, setEdges] = useEdgesState<RFEdge>(initEdges);
  const [issues,         setIssues]         = useState<ValidationIssue[]>([]);
  const [showGrid,       setShowGrid]       = useState(true);
  const [showMini,       setShowMini]       = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Sync external config → state
  const prevConfig = useRef(config);
  useEffect(() => {
    if (config === prevConfig.current) return;
    prevConfig.current = config;
    setNodes((config?.nodes ?? []).map(toRFNode));
    setEdges((config?.edges ?? []).map(toRFEdge));
  }, [config, setNodes, setEdges]);

  // ── Emit ──────────────────────────────────────────────────────────────
  const emit = useCallback((nextNodes: RFNode[], nextEdges: RFEdge[]) => {
    const cfg = configRef.current;
    const topo: TopologyConfig = {
      type: 'topology', version: 1,
      nodes: nextNodes.map(fromRFNode),
      edges: nextEdges.map(e => fromRFEdge(e, cfg ?? { type: 'topology', version: 1, nodes: [], edges: [] })),
    };
    setIssues(validateTopology(topo));
    onChange(topo);
  }, [onChange]);

  // ── Change handlers ───────────────────────────────────────────────────
  const onNodesChange: OnNodesChange<RFNode> = useCallback((changes: NodeChange<RFNode>[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, [setNodes]);

  const onEdgesChange: OnEdgesChange<RFEdge> = useCallback((changes: EdgeChange<RFEdge>[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [setEdges]);

  const onNodeDragStop = useCallback((_e: unknown, _n: unknown, moved: RFNode[]) => {
    setNodes(nds => {
      const next = nds.map(n => moved.find(m => m.id === n.id) ?? n);
      emit(next, edges);
      return next;
    });
  }, [emit, edges, setNodes]);

  const onNodesDelete = useCallback((deleted: RFNode[]) => {
    const ids = new Set(deleted.map(n => n.id));
    setSelectedNodeId(s => (s && ids.has(s) ? null : s));
    setNodes(nds => {
      const next = nds.filter(n => !ids.has(n.id));
      setEdges(eds => {
        const nextE = eds.filter(e => !ids.has(e.source) && !ids.has(e.target));
        emit(next, nextE);
        return nextE;
      });
      return next;
    });
  }, [emit, setNodes, setEdges]);

  const onEdgesDelete = useCallback((deleted: RFEdge[]) => {
    const ids = new Set(deleted.map(e => e.id));
    setSelectedEdgeId(s => (s && ids.has(s) ? null : s));
    setEdges(eds => {
      const next = eds.filter(e => !ids.has(e.id));
      emit(nodes, next);
      return next;
    });
  }, [emit, nodes, setEdges]);

  const onSelectionChange = useCallback(({ nodes: sN, edges: sE }: OnSelectionChangeParams) => {
    setSelectedNodeId(sN.length === 1 ? sN[0].id : null);
    setSelectedEdgeId(sE.length === 1 && sN.length === 0 ? sE[0].id : null);
  }, []);

  // ── Connection ────────────────────────────────────────────────────────
  const isValidConnection = useCallback((connOrEdge: Edge | Connection): boolean => {
    const { source, sourceHandle, target, targetHandle } = connOrEdge;
    const srcNode = nodes.find(n => n.id === source);
    const tgtNode = nodes.find(n => n.id === target);
    if (!srcNode || !tgtNode || source === target) return false;
    return getPortDomain(srcNode.data.kind, sourceHandle ?? '') ===
           getPortDomain(tgtNode.data.kind, targetHandle ?? '');
  }, [nodes]);

  const onConnect: OnConnect = useCallback((conn: Connection) => {
    const srcNode = nodes.find(n => n.id === conn.source);
    if (!srcNode) return;
    const domain = getPortDomain(srcNode.data.kind, conn.sourceHandle ?? '');
    const newEdge: RFEdge = {
      ...conn, id: uid(), type: 'orthogonal',
      markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
      data: { domain },
      source: conn.source!, target: conn.target!,
    };
    setEdges(eds => {
      const next = addEdge(newEdge, eds);
      emit(nodes, next);
      return next;
    });
  }, [nodes, emit, setEdges]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────
  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData(DND_TYPE) as NodeKind | '';
    if (!kind || !(kind in KIND_META)) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode: RFNode = {
      id: uid(), type: 'unfile-node',
      position: { x: Math.round(position.x), y: Math.round(position.y) },
      data: defaultData(kind),
    };
    setNodes(nds => {
      const next = [...nds, newNode];
      emit(next, edges);
      return next;
    });
  }, [screenToFlowPosition, emit, edges, setNodes]);

  // ── Node inspector ────────────────────────────────────────────────────
  const handleNodeUpdate = useCallback((id: string, patch: Partial<TopologyNodeData>) => {
    setNodes(nds => {
      const next = nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n);
      emit(next, edges);
      return next;
    });
  }, [emit, edges, setNodes]);

  const handleNodeDelete = useCallback((id: string) => {
    setSelectedNodeId(null);
    setNodes(nds => {
      const next = nds.filter(n => n.id !== id);
      setEdges(eds => {
        const nextE = eds.filter(e => e.source !== id && e.target !== id);
        emit(next, nextE);
        return nextE;
      });
      return next;
    });
  }, [emit, setNodes, setEdges]);

  // ── Cable inspector (edge annotations) ───────────────────────────────
  const handleCableUpdate = useCallback((
    edgeId: string,
    patch: Partial<Pick<TopologyEdge, 'cableSection' | 'nominalA' | 'nominalV'>>,
  ) => {
    const cfg = configRef.current;
    if (!cfg) return;
    // Update the canonical topology edge and re-emit
    const updatedEdges: TopologyEdge[] = (cfg.edges ?? []).map(e =>
      e.id === edgeId ? { ...e, ...patch } : e,
    );
    const updatedTopo: TopologyConfig = { ...cfg, edges: updatedEdges };
    configRef.current = updatedTopo;
    // Rebuild RF edges with refreshed labels
    const nextRF = updatedEdges.map(toRFEdge);
    setEdges(nextRF);
    setIssues(validateTopology(updatedTopo));
    onChange(updatedTopo);
  }, [onChange, setEdges]);

  const handleEdgeDelete = useCallback((id: string) => {
    setSelectedEdgeId(null);
    setEdges(eds => {
      const next = eds.filter(e => e.id !== id);
      emit(nodes, next);
      return next;
    });
  }, [emit, nodes, setEdges]);

  // ── Auto-layout ───────────────────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    setNodes(nds => {
      const laid = applyDagreLayout(nds, edges, {
        direction: 'LR', rankSep: 110, nodeSep: 50, nodeWidth: 96, nodeHeight: 76,
      }) as RFNode[];
      emit(laid, edges);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      return laid;
    });
  }, [edges, emit, fitView, setNodes]);

  // ── Derived ───────────────────────────────────────────────────────────
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedEdgeCfg = selectedEdgeId
    ? (configRef.current?.edges ?? []).find(e => e.id === selectedEdgeId) ?? null
    : null;
  const isEmpty = nodes.length === 0;

  return (
    <div className="flex h-full w-full">
      {/* ── Left palette ────────────────────────────────────────── */}
      {!readOnly && (
        <aside className="flex flex-col w-40 flex-shrink-0 border-r border-slate-800 bg-slate-950 overflow-y-auto">
          <div className="px-2 py-2 border-b border-slate-800">
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-600">Unifilar</span>
          </div>
          <div className="flex flex-col gap-3 p-2">
            {PALETTE_GROUPS.map(g => (
              <div key={g.label} className="flex flex-col gap-1">
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600 px-1">{g.label}</span>
                {g.kinds.map(k => <PaletteItem key={k} kind={k} />)}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Canvas ──────────────────────────────────────────────── */}
      <div className="flex-1 relative min-w-0" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          isValidConnection={isValidConnection}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          connectionRadius={18}
          snapToGrid
          snapGrid={[8, 8]}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          deleteKeyCode={['Backspace', 'Delete']}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          className="bg-[#080f1a]"
          defaultEdgeOptions={{ type: 'orthogonal', markerEnd: { type: MarkerType.ArrowClosed, width: 8, height: 8 } }}
        >
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />}

          {showMini && (
            <MiniMap
              nodeColor={n => {
                const k = (n.data as TopologyNodeData).kind;
                return KIND_META[k].domain === 'DC' ? '#f59e0b' : '#60a5fa';
              }}
              className="!bg-slate-900 !border !border-slate-800"
              maskColor="rgba(0,0,0,0.6)"
            />
          )}

          {/* Top-left nav */}
          <Panel position="top-left" className="flex items-center gap-1.5">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-7 items-center gap-1.5 px-2 rounded-sm border border-slate-700 bg-slate-900 text-[9px] font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                Diagrama de Blocos
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Regenerar a partir do diagrama de blocos"
                className="flex h-7 items-center gap-1.5 px-2 rounded-sm border border-violet-800/50 bg-violet-950/40 text-[9px] font-bold text-violet-400 hover:text-violet-200 hover:border-violet-600/50 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerar
              </button>
            )}
          </Panel>

          {/* Top-right toolbar */}
          <Panel position="top-right" className="flex items-center gap-1.5">
            {!readOnly && (
              <>
                <button
                  onClick={handleAutoLayout}
                  disabled={nodes.length < 2}
                  className="flex h-7 items-center gap-1.5 px-2 rounded-sm border border-slate-700 bg-slate-900 text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  Organizar
                </button>
                <div className="w-px h-5 bg-slate-800 mx-0.5" />
              </>
            )}
            <button
              onClick={() => setShowGrid(g => !g)}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${showGrid ? 'border-violet-500/50 bg-violet-950/40 text-violet-400' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'}`}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowMini(m => !m)}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${showMini ? 'border-violet-500/50 bg-violet-950/40 text-violet-400' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'}`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              className="flex h-7 px-2 items-center justify-center rounded-sm border border-slate-700 bg-slate-900 text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              ⊞ Fit
            </button>
          </Panel>

          {/* Validation */}
          {nodes.length > 0 && (
            <Panel position="bottom-right" className="mb-2 mr-2">
              <ValidationBadge issues={issues} />
            </Panel>
          )}

          {/* Empty state */}
          {isEmpty && !readOnly && (
            <Panel position="top-center" className="mt-12 pointer-events-none">
              <div className="text-center text-slate-700 font-bold text-xs tracking-widest uppercase">
                Gere o unifilar a partir do diagrama de blocos, ou arraste componentes da paleta
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* ── Right inspector: node or cable ────────────────────── */}
      {!readOnly && selectedNode && (
        <NodeInspector
          nodeId={selectedNode.id}
          data={selectedNode.data}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
      {!readOnly && !selectedNode && selectedEdgeCfg && (
        <CableInspector
          edge={selectedEdgeCfg}
          onUpdate={handleCableUpdate}
          onDelete={handleEdgeDelete}
          onClose={() => setSelectedEdgeId(null)}
        />
      )}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface UnifileCanvasProps {
  config?:       TopologyConfig | null;
  onChange?:     (c: TopologyConfig) => void;
  onBack?:       () => void;
  onRegenerate?: () => void;
  readOnly?:     boolean;
  className?:    string;
}

export default function UnifileCanvas({
  config      = null,
  onChange    = () => {},
  onBack,
  onRegenerate,
  readOnly    = false,
  className   = '',
}: UnifileCanvasProps) {
  return (
    <div className={`relative flex h-full w-full overflow-hidden rounded-sm border border-slate-800 bg-[#080f1a] ${className}`}>
      <ReactFlowProvider>
        <Inner
          config={config}
          onChange={onChange}
          onBack={onBack}
          onRegenerate={onRegenerate}
          readOnly={readOnly}
        />
      </ReactFlowProvider>
    </div>
  );
}
