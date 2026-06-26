import { useCallback, useState, type ChangeEvent } from 'react';
import { Trash2, X, Plus, Minus } from 'lucide-react';
import {
  type TopologyNodeData,
  type NodeKind,
  type MpptChannelConfig,
  KIND_META,
} from '@/lib/types/topology';

// ─── Field descriptors per kind ───────────────────────────────────────────────

interface FieldDef {
  key:       keyof TopologyNodeData;
  label:     string;
  type:      'text' | 'number' | 'select';
  options?:  { value: string; label: string }[];
  min?:      number;
  max?:      number;
  step?:     number;
  unit?:     string;
}

const COMMON_FIELDS: FieldDef[] = [
  { key: 'label', label: 'Nome', type: 'text' },
];

const KIND_FIELDS: Partial<Record<NodeKind, FieldDef[]>> = {
  'pv-panel': [
    { key: 'powerW', label: 'Potência', type: 'number', min: 1, max: 1000, step: 1, unit: 'Wp' },
  ],
  'pv-string': [
    { key: 'powerW', label: 'Potência total', type: 'number', min: 1, max: 50000, step: 1, unit: 'Wp' },
  ],
  'string-combiner': [
    { key: 'inputCount', label: 'Entradas (strings)', type: 'number', min: 1, max: 16, step: 1 },
    { key: 'rating',     label: 'Corrente máx.', type: 'text', unit: 'A' },
  ],
  'dps-dc': [
    { key: 'rating', label: 'Tensão nominal', type: 'text', unit: 'V' },
  ],
  'fuse-dc': [
    { key: 'rating', label: 'Corrente nominal', type: 'text', unit: 'A' },
  ],
  'inverter': [
    { key: 'manufacturer', label: 'Fabricante',  type: 'text' },
    { key: 'model',        label: 'Modelo',      type: 'text' },
    { key: 'powerW',       label: 'Potência AC', type: 'number', min: 100, max: 500000, step: 100, unit: 'W' },
    {
      key: 'phase', label: 'Fase', type: 'select',
      options: [{ value: 'mono', label: 'Monofásico' }, { value: 'tri', label: 'Trifásico' }],
    },
  ],
  'mppt-input': [
    { key: 'rating', label: 'Vmax MPPT', type: 'text', unit: 'V' },
  ],
  'ac-breaker': [
    { key: 'rating', label: 'Corrente nominal', type: 'text', unit: 'A' },
    {
      key: 'phase', label: 'Fase', type: 'select',
      options: [{ value: 'mono', label: 'Monofásico' }, { value: 'tri', label: 'Trifásico' }],
    },
  ],
  'dps-ac': [
    { key: 'rating', label: 'Tensão nominal', type: 'text', unit: 'V' },
  ],
  'meter': [
    {
      key: 'phase', label: 'Fase', type: 'select',
      options: [{ value: 'mono', label: 'Monofásico' }, { value: 'tri', label: 'Trifásico' }],
    },
  ],
  'grid': [
    { key: 'nominalV', label: 'Tensão da rede', type: 'number', min: 110, max: 440, step: 1, unit: 'V' },
    {
      key: 'phase', label: 'Fase', type: 'select',
      options: [{ value: 'mono', label: 'Monofásico' }, { value: 'tri', label: 'Trifásico' }],
    },
  ],
};

// ─── Component props ─────────────────────────────────────────────────────────

export interface NodeInspectorProps {
  nodeId:   string;
  data:     TopologyNodeData;
  onUpdate: (id: string, patch: Partial<TopologyNodeData>) => void;
  onDelete: (id: string) => void;
  onClose:  () => void;
}

// ─── Individual field renderers ───────────────────────────────────────────────

interface FieldProps {
  def:     FieldDef;
  value:   unknown;
  onChange: (key: keyof TopologyNodeData, value: unknown) => void;
}

function Field({ def, value, onChange }: FieldProps) {
  const base = 'w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1 text-[10px] font-mono text-slate-200 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20';

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = e.target.value;
    if (def.type === 'number') {
      const n = parseFloat(raw);
      onChange(def.key, isNaN(n) ? undefined : n);
    } else {
      onChange(def.key, raw || undefined);
    }
  };

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
        {def.label}{def.unit && <span className="ml-1 text-slate-700">({def.unit})</span>}
      </label>

      {def.type === 'select' ? (
        <select value={String(value ?? '')} onChange={handleChange} className={base}>
          {def.options!.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={def.type}
          value={value == null ? '' : String(value)}
          onChange={handleChange}
          min={def.min}
          max={def.max}
          step={def.step}
          className={base}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NodeInspector({ nodeId, data, onUpdate, onDelete, onClose }: NodeInspectorProps) {
  const meta       = KIND_META[data.kind];
  const kindFields = KIND_FIELDS[data.kind] ?? [];
  const allFields  = [...COMMON_FIELDS, ...kindFields];

  const handleFieldChange = useCallback((key: keyof TopologyNodeData, value: unknown) => {
    onUpdate(nodeId, { [key]: value });
  }, [nodeId, onUpdate]);

  // MPPT channels editor state (inverter only)
  const [mpptChannels, setMpptChannels] = useState<MpptChannelConfig[]>(
    data.mpptChannels ?? []
  );

  const handleMpptChannelsChange = useCallback((channels: MpptChannelConfig[]) => {
    setMpptChannels(channels);
    onUpdate(nodeId, { mpptChannels: channels, mpptCount: channels.length });
  }, [nodeId, onUpdate]);

  const addMpptChannel = useCallback(() => {
    const newChannel: MpptChannelConfig = {
      mpptIndex: mpptChannels.length,
      inputCount: 1,
      inputLabels: ['PV1'],
    };
    handleMpptChannelsChange([...mpptChannels, newChannel]);
  }, [mpptChannels, handleMpptChannelsChange]);

  const removeMpptChannel = useCallback(() => {
    if (mpptChannels.length > 1) {
      handleMpptChannelsChange(mpptChannels.slice(0, -1));
    }
  }, [mpptChannels, handleMpptChannelsChange]);

  const updateChannelInputCount = useCallback((chIndex: number, newCount: number) => {
    const updated = mpptChannels.map((ch, i) => {
      if (i !== chIndex) return ch;
      const labels = [...(ch.inputLabels ?? [])];
      while (labels.length < newCount) {
        labels.push(`PV${labels.length + 1}`);
      }
      return { ...ch, inputCount: newCount, inputLabels: labels.slice(0, newCount) };
    });
    handleMpptChannelsChange(updated);
  }, [mpptChannels, handleMpptChannelsChange]);

  const updateInputLabel = useCallback((chIndex: number, labelIndex: number, newLabel: string) => {
    const updated = mpptChannels.map((ch, i) => {
      if (i !== chIndex) return ch;
      const labels = [...(ch.inputLabels ?? [])];
      labels[labelIndex] = newLabel;
      return { ...ch, inputLabels: labels };
    });
    handleMpptChannelsChange(updated);
  }, [mpptChannels, handleMpptChannelsChange]);

  return (
    <aside className="flex flex-col w-48 flex-shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] leading-none">{meta.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">
            {meta.shortLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3 p-2 flex-1">
        {allFields.map(def => (
          <Field
            key={def.key}
            def={def}
            value={data[def.key]}
            onChange={handleFieldChange}
          />
        ))}

        {/* MPPT Channels Editor (inverter only) */}
        {data.kind === 'inverter' && (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              <label className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
                Canais MPPT
              </label>
              <div className="flex gap-1">
                <button
                  onClick={addMpptChannel}
                  className="p-0.5 rounded bg-sky-900/30 border border-sky-700/50 text-sky-400 hover:bg-sky-900/50 transition-colors"
                  title="Adicionar MPPT"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={removeMpptChannel}
                  disabled={mpptChannels.length <= 1}
                  className="p-0.5 rounded bg-slate-900/30 border border-slate-700/50 text-slate-400 hover:bg-slate-800/50 transition-colors disabled:opacity-30"
                  title="Remover último MPPT"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {mpptChannels.map((ch, chIndex) => (
              <div key={chIndex} className="flex flex-col gap-1.5 p-1.5 bg-slate-900/30 border border-slate-800/50 rounded-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-500 uppercase">MPPT {chIndex + 1}</span>
                  <select
                    value={ch.inputCount}
                    onChange={e => updateChannelInputCount(chIndex, Number(e.target.value))}
                    className="text-[9px] font-mono bg-slate-950 border border-slate-800 rounded-sm px-1 py-0.5 text-slate-300 outline-none focus:border-sky-500/50"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} entrada{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  {Array.from({ length: ch.inputCount }, (_, labelIndex) => (
                    <input
                      key={labelIndex}
                      type="text"
                      value={ch.inputLabels?.[labelIndex] ?? `PV${labelIndex + 1}`}
                      onChange={e => updateInputLabel(chIndex, labelIndex, e.target.value)}
                      placeholder={`PV${labelIndex + 1}`}
                      className="w-full text-[9px] font-mono bg-slate-950 border border-slate-800 rounded-sm px-1.5 py-0.5 text-slate-200 outline-none focus:border-sky-500/50"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Position info (read-only, debug) */}
        <div className="mt-auto pt-3 border-t border-slate-800/50">
          <div className="text-[8px] font-bold uppercase tracking-widest text-slate-700 mb-1">
            ID do nó
          </div>
          <div className="text-[8px] font-mono text-slate-700 break-all select-all">
            {nodeId}
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={() => onDelete(nodeId)}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-red-900/50 bg-red-950/30 px-2 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-950/60 hover:border-red-700/50 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Remover nó
        </button>
      </div>
    </aside>
  );
}
