import { useCallback, type ChangeEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { TopologyEdge, PortDomain } from '@/lib/types/topology';

// ─── Domain colour ────────────────────────────────────────────────────────────
const DOMAIN_COLOR: Record<PortDomain, string> = { DC: '#f59e0b', AC: '#60a5fa' };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CableInspectorProps {
  edge:     TopologyEdge;
  onUpdate: (id: string, patch: Partial<Pick<TopologyEdge, 'cableSection' | 'nominalA' | 'nominalV'>>) => void;
  onDelete: (id: string) => void;
  onClose:  () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputBase =
  'w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] font-mono text-slate-200 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20';

interface LabeledInputProps {
  label:    string;
  value:    string;
  unit?:    string;
  type?:    'text' | 'number';
  min?:     number;
  onChange: (v: string) => void;
}

function LabeledInput({ label, value, unit, type = 'text', min, onChange }: LabeledInputProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
        {label}{unit && <span className="ml-1 text-slate-700">({unit})</span>}
      </label>
      <input
        type={type}
        value={value}
        min={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={inputBase}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CableInspector({ edge, onUpdate, onDelete, onClose }: CableInspectorProps) {
  const color = DOMAIN_COLOR[edge.domain];

  const patch = useCallback(
    (field: keyof Pick<TopologyEdge, 'cableSection' | 'nominalA' | 'nominalV'>, raw: string) => {
      if (field === 'cableSection') {
        onUpdate(edge.id, { cableSection: raw || undefined });
      } else {
        const n = parseFloat(raw);
        onUpdate(edge.id, { [field]: isNaN(n) ? undefined : n });
      }
    },
    [edge.id, onUpdate],
  );

  return (
    <aside className="flex flex-col w-48 flex-shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Cabo {edge.domain}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3 p-2 flex-1">
        <LabeledInput
          label="Seção do cabo"
          unit="mm²"
          value={edge.cableSection ?? ''}
          onChange={v => patch('cableSection', v)}
        />
        <LabeledInput
          label="Corrente nominal"
          unit="A"
          type="number"
          min={0}
          value={edge.nominalA != null ? String(edge.nominalA) : ''}
          onChange={v => patch('nominalA', v)}
        />
        <LabeledInput
          label="Tensão nominal"
          unit="V"
          type="number"
          min={0}
          value={edge.nominalV != null ? String(edge.nominalV) : ''}
          onChange={v => patch('nominalV', v)}
        />

        {/* Domain (read-only) */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[8px] font-bold uppercase tracking-widest text-slate-600">Domínio</label>
          <div
            className="px-2 py-1 rounded-sm border border-slate-800 text-[10px] font-mono font-bold"
            style={{ color }}
          >
            {edge.domain === 'DC' ? 'Corrente Contínua (CC)' : 'Corrente Alternada (CA)'}
          </div>
        </div>

        {/* Edge ID */}
        <div className="mt-auto pt-3 border-t border-slate-800/50">
          <div className="text-[8px] font-bold uppercase tracking-widest text-slate-700 mb-1">ID da aresta</div>
          <div className="text-[8px] font-mono text-slate-700 break-all select-all">{edge.id}</div>
        </div>
      </div>

      {/* Delete */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={() => onDelete(edge.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-red-900/50 bg-red-950/30 px-2 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-950/60 hover:border-red-700/50 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Remover conexão
        </button>
      </div>
    </aside>
  );
}
