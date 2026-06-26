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
  AlertTriangle, CheckCircle2, Maximize2, Grid3x3,
  LayoutDashboard, Trash2, X,
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
import { TopologyBlockNode } from './nodes/TopologyBlockNode';
import { OrthogonalEdge, type OrthogonalEdgeData } from './edges/OrthogonalEdge';
import { NodeInspector } from './NodeInspector';
import { applyDagreLayout } from './layout/dagreLayout';

// ─── React Flow type aliases ──────────────────────────────────────────────────
type RFNode = Node<TopologyNodeData, 'topology-block'>;
type RFEdge = Edge<OrthogonalEdgeData>;

// ─── Stable type maps ─────────────────────────────────────────────────────────
const NODE_TYPES = { 'topology-block': TopologyBlockNode } as const;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: EdgeTypes = { orthogonal: OrthogonalEdge as any };

// ─── uid ──────────────────────────────────────────────────────────────────────
let _seq = 0;
const uid = () => `topo-${Date.now()}-${++_seq}`;

// ─── Conversion utilities ─────────────────────────────────────────────────────
function toRFNode(n: TopologyNode): RFNode {
  return { id: n.id, type: 'topology-block', position: { x: n.x, y: n.y }, data: n.data, deletable: true };
}
function fromRFNode(n: RFNode): TopologyNode {
  return { id: n.id, kind: n.data.kind, x: Math.round(n.position.x), y: Math.round(n.position.y), data: n.data };
}
function toRFEdge(e: TopologyEdge): RFEdge {
  return {
    id: e.id, source: e.source, sourceHandle: e.sourceHandle,
    target: e.target, targetHandle: e.targetHandle,
    type: 'orthogonal',
    markerEnd: { type: MarkerType.ArrowClosed, width: 6, height: 6 },
    data: { domain: e.domain, waypoints: e.waypoints },
  };
}
function fromRFEdge(e: RFEdge): TopologyEdge {
  return {
    id: e.id,
    source: e.source, sourceHandle: e.sourceHandle ?? '',
    target: e.target, targetHandle: e.targetHandle ?? '',
    domain: e.data?.domain ?? 'DC',
    waypoints: e.data?.waypoints,
  };
}

// ─── Default node data ────────────────────────────────────────────────────────
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

// ─── Palette ──────────────────────────────────────────────────────────────────
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
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded-sm border cursor-grab active:cursor-grabbing select-none text-[9px] font-mono font-bold transition-opacity hover:opacity-100 opacity-75 ${meta.colorClass}`}
    >
      <span className="text-[10px] leading-none">{meta.icon}</span>
      <span className="truncate">{meta.shortLabel}</span>
    </div>
  );
}

// ─── Validation badge ─────────────────────────────────────────────────────────
function ValidationBadge({ issues }: { issues: ValidationIssue[] }) {
  const errors   = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
        <CheckCircle2 className="h-3 w-3" />
        Topologia válida
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
  config:    TopologyConfig | null;
  onChange:  (c: TopologyConfig) => void;
  readOnly?: boolean;
}

function Inner({ config, onChange, readOnly = false }: InnerProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();

  // ── Initialise once from config ───────────────────────────────────────
  const initNodes = useMemo<RFNode[]>(() => (config?.nodes ?? []).map(toRFNode), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initEdges = useMemo<RFEdge[]>(() => (config?.edges ?? []).map(toRFEdge), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes] = useNodesState<RFNode>(initNodes);
  const [edges, setEdges] = useEdgesState<RFEdge>(initEdges);

  // ── UI state ──────────────────────────────────────────────────────────
  const [issues,        setIssues]        = useState<ValidationIssue[]>([]);
  const [showGrid,      setShowGrid]      = useState(true);
  const [showMini,      setShowMini]      = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectError,    setConnectError]    = useState<string | null>(null);
  const [clearConfirm,    setClearConfirm]    = useState(false);
  const connectErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync external config → state ─────────────────────────────────────
  const configRef = useRef(config);
  useEffect(() => {
    if (config === configRef.current) return;
    configRef.current = config;
    setNodes((config?.nodes ?? []).map(toRFNode));
    setEdges((config?.edges ?? []).map(toRFEdge));
  }, [config, setNodes, setEdges]);

  // ── Emit + revalidate ─────────────────────────────────────────────────
  const emit = useCallback((nextNodes: RFNode[], nextEdges: RFEdge[]) => {
    const topo: TopologyConfig = {
      type: 'topology', version: 1,
      nodes: nextNodes.map(fromRFNode),
      edges: nextEdges.map(fromRFEdge),
    };
    setIssues(validateTopology(topo));
    onChange(topo);
  }, [onChange]);

  // ── Node / edge change handlers ───────────────────────────────────────
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

  // ── Selection tracking ────────────────────────────────────────────────
  const onSelectionChange = useCallback(({ nodes: sNodes, edges: sEdges }: OnSelectionChangeParams) => {
    setSelectedNodeId(sNodes.length === 1 ? sNodes[0].id : null);
    setSelectedEdgeId(sEdges.length === 1 && sNodes.length === 0 ? sEdges[0].id : null);
  }, []);

  // ── Connection handling ───────────────────────────────────────────────
  const isValidConnection = useCallback((connOrEdge: Edge | Connection): boolean => {
    const { source, sourceHandle, target, targetHandle } = connOrEdge;
    const srcNode = nodes.find(n => n.id === source);
    const tgtNode = nodes.find(n => n.id === target);
    if (!srcNode || !tgtNode || source === target) return false;
    return getPortDomain(srcNode.data.kind, sourceHandle ?? '') ===
           getPortDomain(tgtNode.data.kind, targetHandle ?? '');
  }, [nodes]);

  // Show a brief error banner when the user drops a connection on an incompatible port
  const onConnectEnd = useCallback((_event: MouseEvent | TouchEvent, state: { isValid?: boolean | null }) => {
    if (state.isValid === false) {
      if (connectErrorTimer.current) clearTimeout(connectErrorTimer.current);
      setConnectError('Conexão inválida — domínios CC e CA são incompatíveis');
      connectErrorTimer.current = setTimeout(() => setConnectError(null), 2800);
    }
  }, []);

  const onConnect: OnConnect = useCallback((conn: Connection) => {
    const srcNode = nodes.find(n => n.id === conn.source);
    if (!srcNode) return;
    const domain = getPortDomain(srcNode.data.kind, conn.sourceHandle ?? '');
    const newEdge: RFEdge = {
      ...conn, id: uid(), type: 'orthogonal',
      markerEnd: { type: MarkerType.ArrowClosed, width: 6, height: 6 },
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
      id: uid(), type: 'topology-block',
      position: { x: Math.round(position.x), y: Math.round(position.y) },
      data: defaultData(kind),
    };
    setNodes(nds => {
      const next = [...nds, newNode];
      emit(next, edges);
      return next;
    });
  }, [screenToFlowPosition, emit, edges, setNodes]);

  // ── Inspector: node data update ───────────────────────────────────────
  const handleNodeUpdate = useCallback((id: string, patch: Partial<TopologyNodeData>) => {
    setNodes(nds => {
      const next = nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n);
      emit(next, edges);
      return next;
    });
  }, [emit, edges, setNodes]);

  // ── Inspector: delete node ────────────────────────────────────────────
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

  // ── Inspector: delete edge ────────────────────────────────────────────
  const handleEdgeDelete = useCallback((id: string) => {
    setSelectedEdgeId(null);
    setEdges(eds => {
      const next = eds.filter(e => e.id !== id);
      emit(nodes, next);
      return next;
    });
  }, [emit, nodes, setEdges]);

  // ── Dagre auto-layout ─────────────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    setNodes(nds => {
      const laid = applyDagreLayout(nds, edges, {
        direction: 'LR', rankSep: 60, nodeSep: 20, nodeWidth: 96, nodeHeight: 32,
      }) as RFNode[];
      emit(laid, edges);
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
      return laid;
    });
  }, [edges, emit, fitView, setNodes]);

  // ── Clear canvas ──────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setClearConfirm(false);
    emit([], []);
  }, [emit, setNodes, setEdges]);

  // ── Derived values ────────────────────────────────────────────────────
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) : null;
  const isEmpty = nodes.length === 0;

  return (
    <div className="flex h-full w-full relative">
      {/* ── Clear confirm modal ─────────────────────────────────────── */}
      {clearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col gap-4 w-72 bg-slate-900 border border-slate-700 rounded-sm shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 flex items-center justify-center rounded bg-red-500/10 border border-red-500/20">
                  <Trash2 className="h-3 w-3 text-red-400" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">Limpar Canvas</span>
              </div>
              <button onClick={() => setClearConfirm(false)} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Isso removerá <span className="text-red-400 font-bold">todos os nós e conexões</span> do diagrama. Ação irreversível.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={() => setClearConfirm(false)}
                className="px-3 py-1.5 rounded border border-slate-700 text-[10px] font-black text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded bg-red-700 text-[10px] font-black text-white hover:bg-red-600 transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                <Trash2 className="h-2.5 w-2.5" />
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left palette ───────────────────────────────────────────── */}
      {!readOnly && (
        <aside className="flex flex-col w-32 flex-shrink-0 border-r border-slate-800 bg-slate-950 overflow-y-auto">
          <div className="px-2 py-2 border-b border-slate-800">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Componentes</span>
          </div>
          <div className="flex flex-col gap-2 p-2">
            {PALETTE_GROUPS.map(g => (
              <div key={g.label} className="flex flex-col gap-0.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-600 px-1">{g.label}</span>
                {g.kinds.map(k => <PaletteItem key={k} kind={k} />)}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Canvas ─────────────────────────────────────────────────── */}
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
          onConnectEnd={onConnectEnd as any}
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
          defaultEdgeOptions={{ type: 'orthogonal', markerEnd: { type: MarkerType.ArrowClosed, width: 6, height: 6 }, style: { strokeWidth: 1 } }}
        >
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={16} size={0.8} color="#1e293b" />}

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

          {/* Top-right toolbar */}
          <Panel position="top-right" className="flex items-center gap-1.5">
            {!readOnly && (
              <>
                <button
                  onClick={handleAutoLayout}
                  title="Auto-layout (Dagre LR)"
                  disabled={nodes.length < 2}
                  className="flex h-7 items-center gap-1.5 px-2 rounded-sm border border-slate-700 bg-slate-900 text-[9px] font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-30"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  Organizar
                </button>
                <button
                  onClick={() => setClearConfirm(true)}
                  title="Limpar canvas"
                  disabled={isEmpty}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-900/50 transition-colors disabled:opacity-30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="w-px h-5 bg-slate-800 mx-0.5" />
              </>
            )}
            <button
              onClick={() => setShowGrid(g => !g)}
              title="Toggle grid"
              className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${showGrid ? 'border-sky-500/50 bg-sky-950/40 text-sky-400' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'}`}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowMini(m => !m)}
              title="Toggle minimap"
              className={`flex h-7 w-7 items-center justify-center rounded-sm border transition-colors ${showMini ? 'border-sky-500/50 bg-sky-950/40 text-sky-400' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'}`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              title="Fit view"
              className="flex h-7 px-2 items-center justify-center rounded-sm border border-slate-700 bg-slate-900 text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              ⊞ Fit
            </button>
          </Panel>

          {/* Validation badge */}
          {nodes.length > 0 && (
            <Panel position="bottom-right" className="mb-2 mr-2">
              <ValidationBadge issues={issues} />
            </Panel>
          )}

          {/* Edge inspector (bottom-left when edge selected) */}
          {selectedEdge && (
            <Panel position="bottom-left" className="mb-2 ml-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-slate-700 bg-slate-900 text-[10px] font-mono">
                <span
                  className="font-bold"
                  style={{ color: (selectedEdge.data?.domain ?? 'DC') === 'DC' ? '#f59e0b' : '#60a5fa' }}
                >
                  {selectedEdge.data?.domain ?? 'DC'}
                </span>
                <span className="text-slate-600">aresta selecionada</span>
                {!readOnly && (
                  <button
                    onClick={() => handleEdgeDelete(selectedEdge.id)}
                    className="ml-2 text-red-600 hover:text-red-400 transition-colors"
                    title="Remover aresta"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </Panel>
          )}

          {/* Empty state */}
          {isEmpty && !readOnly && (
            <Panel position="top-center" className="mt-12 pointer-events-none">
              <div className="text-center text-slate-700 font-bold text-xs tracking-widest uppercase">
                Arraste componentes da paleta para iniciar o diagrama de blocos
              </div>
            </Panel>
          )}

          {/* Connection domain error toast */}
          {connectError && (
            <Panel position="bottom-center" className="mb-4 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-red-500/40 bg-red-950/80 text-red-300 text-[10px] font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-400" />
                {connectError}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* ── Right inspector ─────────────────────────────────────────── */}
      {!readOnly && selectedNode && (
        <NodeInspector
          nodeId={selectedNode.id}
          data={selectedNode.data}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface BlockDiagramCanvasProps {
  config?:    TopologyConfig | null;
  onChange?:  (c: TopologyConfig) => void;
  readOnly?:  boolean;
  className?: string;
}

export default function BlockDiagramCanvas({
  config    = null,
  onChange  = () => {},
  readOnly  = false,
  className = '',
}: BlockDiagramCanvasProps) {
  return (
    <div className={`relative flex h-full w-full overflow-hidden rounded-sm border border-slate-800 bg-[#080f1a] ${className}`}>
      <ReactFlowProvider>
        <Inner config={config} onChange={onChange} readOnly={readOnly} />
      </ReactFlowProvider>
    </div>
  );
}

export type { TopologyConfig, TopologyNode, TopologyEdge } from '@/lib/types/topology';
