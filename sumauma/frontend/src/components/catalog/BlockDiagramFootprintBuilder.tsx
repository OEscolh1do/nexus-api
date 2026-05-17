import { useState, useMemo } from 'react';
import { Plus, Trash2, Cpu, Zap, GripVertical } from 'lucide-react';
import type { BlockDiagramFootprint, MPPTChannel } from '@/hooks/useCatalog';

interface BlockDiagramFootprintBuilderProps {
  initialFootprint: BlockDiagramFootprint | null;
  inverterId?: string;
  onChange: (footprint: BlockDiagramFootprint) => void;
}

const DEFAULT_FOOTPRINT: Omit<BlockDiagramFootprint, 'inverterId'> = {
  mpptChannels: [{ mpptIndex: 1, inputCount: 2 }],
  acOutput: { label: 'CA OUT', phase: 'tri' },
};

export default function BlockDiagramFootprintBuilder({
  initialFootprint,
  inverterId,
  onChange,
}: BlockDiagramFootprintBuilderProps) {
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [dragSrcMpptIndex, setDragSrcMpptIndex] = useState<number | null>(null);
  const [footprint, setFootprint] = useState<BlockDiagramFootprint>(() => ({
    ...(initialFootprint || DEFAULT_FOOTPRINT),
    inverterId: inverterId ?? initialFootprint?.inverterId ?? '',
  }));

  const update = (newFp: BlockDiagramFootprint) => {
    setFootprint(newFp);
    onChange(newFp);
  };

  const addMppt = () => {
    const nextIdx =
      Math.max(0, ...footprint.mpptChannels.map((m: MPPTChannel) => m.mpptIndex)) + 1;
    update({
      ...footprint,
      mpptChannels: [...footprint.mpptChannels, { mpptIndex: nextIdx, inputCount: 2 }],
    });
  };

  const removeMppt = (idx: number) => {
    update({
      ...footprint,
      mpptChannels: footprint.mpptChannels.filter((m: MPPTChannel) => m.mpptIndex !== idx),
    });
  };

  const updateMppt = (idx: number, patch: Partial<MPPTChannel>) => {
    update({
      ...footprint,
      mpptChannels: footprint.mpptChannels.map((m: MPPTChannel) => {
        if (m.mpptIndex !== idx) return m;
        const merged = { ...m, ...patch };
        // Ao mudar inputCount, redimensionar inputLabels preservando labels existentes
        if ('inputCount' in patch && patch.inputCount !== undefined) {
          const newCount = Math.max(1, patch.inputCount);
          const oldLabels = m.inputLabels ?? [];
          merged.inputLabels = Array.from({ length: newCount }, (_, i) =>
            oldLabels[i] ?? `E${i + 1}`
          );
        }
        return merged;
      }),
    });
  };

  const reorderMpptChannel = (fromMpptIndex: number, toMpptIndex: number) => {
    if (fromMpptIndex === toMpptIndex) return;
    const channels = [...footprint.mpptChannels];
    const fromPos = channels.findIndex((c) => c.mpptIndex === fromMpptIndex);
    const toPos   = channels.findIndex((c) => c.mpptIndex === toMpptIndex);
    if (fromPos === -1 || toPos === -1) return;
    // Move o canal para a posição de destino
    const [moved] = channels.splice(fromPos, 1);
    channels.splice(toPos, 0, moved);
    update({ ...footprint, mpptChannels: channels });
  };

  const updateInputLabel = (mpptIdx: number, inputIdx: number, label: string) => {
    update({
      ...footprint,
      mpptChannels: footprint.mpptChannels.map((m: MPPTChannel) => {
        if (m.mpptIndex !== mpptIdx) return m;
        const labels = [...(m.inputLabels ?? Array.from({ length: m.inputCount }, (_, i) => `E${i + 1}`))];
        labels[inputIdx] = label;
        return { ...m, inputLabels: labels };
      }),
    });
  };

  // ── Layout do preview SVG ───────────────────────────────────────────────────

  interface PinPos {
    x: number;
    mpptIndex: number;
    focusKey: string;
    label: string;
    isFirst: boolean;
  }

  const { pinPositions, groupCenters, svgW } = useMemo(() => {
    const pins: PinPos[] = [];
    let curX = 18;

    footprint.mpptChannels.forEach((mppt: MPPTChannel) => {
      const focusKey = `mppt-${mppt.mpptIndex}`;
      for (let i = 0; i < mppt.inputCount; i++) {
        pins.push({
          x: curX,
          mpptIndex: mppt.mpptIndex,
          focusKey,
          label: mppt.inputLabels?.[i] ?? `E${i + 1}`,
          isFirst: i === 0,
        });
        curX += 22;
      }
      curX += 12; // separação entre grupos MPPT
    });

    // Centro horizontal de cada grupo MPPT (para label)
    const starts: Record<number, number> = {};
    const ends: Record<number, number> = {};
    pins.forEach((p) => {
      if (!(p.mpptIndex in starts)) starts[p.mpptIndex] = p.x;
      ends[p.mpptIndex] = p.x;
    });
    const centers: Record<number, number> = {};
    Object.keys(starts).forEach((k) => {
      const idx = Number(k);
      centers[idx] = (starts[idx] + ends[idx]) / 2;
    });

    return { pinPositions: pins, groupCenters: centers, svgW: Math.max(100, curX + 8) };
  }, [footprint.mpptChannels]);

  const H = 80;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-slate-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Diagrama de Blocos (Layer 2)
          </p>
        </div>
        <button
          type="button"
          onClick={addMppt}
          className="flex items-center gap-1 rounded-sm border border-slate-700 bg-slate-800 px-3 py-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-all uppercase"
        >
          <Plus className="h-3 w-3" />
          Add Canal
        </button>
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* Preview SVG */}
        <div className="w-full max-w-[420px] rounded-sm border border-slate-800/50 bg-slate-900/30 p-8 flex flex-col items-center justify-center relative overflow-auto">
          <svg
            viewBox={`-10 -10 ${svgW + 50} ${H + 30}`}
            width={svgW + 50}
            height={H + 30}
            className="overflow-visible drop-shadow-2xl"
          >
            {/* Sombra */}
            <rect x={12} y={12} width={svgW} height={40} fill="black" opacity={0.2} rx={2} />

            {/* Corpo do inversor */}
            <rect
              x={10} y={10} width={svgW} height={40}
              fill="#0f172a" stroke="#334155" strokeWidth={1.5} rx={2}
            />
            <line
              x1={10} y1={50} x2={svgW + 10} y2={10}
              stroke="#334155" strokeWidth={1} opacity={0.3}
            />
            <text
              x={svgW / 2 + 10} y={30}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={7} fill="#1e293b" fontWeight="bold" fontFamily="monospace"
            >
              INVERSOR
            </text>

            {/* Pinos CC — um por entrada física, agrupados por MPPT */}
            {pinPositions.map((pin, i) => {
              const isFocused = focusedItem === pin.focusKey;
              const strokeColor = isFocused ? '#38bdf8' : '#334155';
              const dotColor = isFocused ? '#38bdf8' : '#475569';
              return (
                <g key={i}>
                  <line
                    x1={pin.x} y1={50} x2={pin.x} y2={60}
                    stroke={strokeColor} strokeWidth={isFocused ? 2 : 1.2}
                    className="transition-all"
                  />
                  <rect
                    x={pin.x - 3} y={60} width={6} height={6} rx={1}
                    fill="#0f172a" stroke={dotColor} strokeWidth={1.5}
                    className="transition-all"
                  />
                  {isFocused && (
                    <rect
                      x={pin.x - 5} y={58} width={10} height={10} rx={1}
                      fill="#38bdf8" opacity={0.15} className="animate-pulse"
                    />
                  )}
                  {/* Label individual de cada entrada */}
                  <text
                    x={pin.x} y={70}
                    textAnchor="middle" fontSize={5}
                    fill={isFocused ? '#38bdf8' : '#334155'}
                    fontFamily="monospace"
                  >
                    {pin.label}
                  </text>
                  {/* Label do grupo MPPT — só no primeiro pino */}
                  {pin.isFirst && (
                    <text
                      x={groupCenters[pin.mpptIndex]} y={80}
                      textAnchor="middle" fontSize={6}
                      fill={isFocused ? '#38bdf8' : '#475569'}
                      fontWeight="bold" fontFamily="monospace"
                    >
                      MPPT {pin.mpptIndex}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Pino CA — borda direita */}
            <g>
              <line
                x1={svgW + 10} y1={30} x2={svgW + 25} y2={30}
                stroke={focusedItem === 'ac-out' ? '#10b981' : '#334155'}
                strokeWidth={focusedItem === 'ac-out' ? 2 : 1.2}
                className="transition-all"
              />
              <circle
                cx={svgW + 25} cy={30}
                r={focusedItem === 'ac-out' ? 4.5 : 3.5}
                fill="#0f172a"
                stroke={focusedItem === 'ac-out' ? '#10b981' : '#475569'}
                strokeWidth={1.5}
                className="transition-all"
              />
              {focusedItem === 'ac-out' && (
                <circle cx={svgW + 25} cy={30} r={8} fill="#10b981" opacity={0.2} className="animate-pulse" />
              )}
              <text
                x={svgW + 32} y={30}
                fontSize={7} fill="#475569" fontWeight="bold"
                dominantBaseline="middle" fontFamily="monospace"
              >
                {footprint.acOutput.phase === 'tri' ? '3φ' : '1φ'}
              </text>
            </g>
          </svg>
          <p className="text-[7px] text-slate-700 text-center mt-6 font-mono uppercase tracking-[0.3em]">
            HARDWARE ENGINE v2.0
          </p>
        </div>

        {/* Form Controls */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Entradas CC */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">
              Entradas CC (DC)
            </h4>
            {footprint.mpptChannels.map((mppt: MPPTChannel) => {
              const isDragSrc = dragSrcMpptIndex === mppt.mpptIndex;
              return (
              <div
                key={mppt.mpptIndex}
                draggable
                onDragStart={() => setDragSrcMpptIndex(mppt.mpptIndex)}
                onDragEnd={() => setDragSrcMpptIndex(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragSrcMpptIndex !== null && dragSrcMpptIndex !== mppt.mpptIndex) {
                    reorderMpptChannel(dragSrcMpptIndex, mppt.mpptIndex);
                  }
                  setDragSrcMpptIndex(null);
                }}
                className={`rounded-lg border p-3 transition-all duration-300 cursor-default
                  ${focusedItem === `mppt-${mppt.mpptIndex}`
                    ? 'bg-slate-900/60 border-slate-700 shadow-xl'
                    : 'bg-slate-900/20 border-slate-800'}
                  ${isDragSrc ? 'opacity-40 scale-[0.98]' : ''}
                  ${dragSrcMpptIndex !== null && !isDragSrc ? 'border-dashed border-slate-600' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-slate-700 cursor-grab active:cursor-grabbing shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      Canal #{mppt.mpptIndex}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMppt(mppt.mpptIndex)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[7px] text-slate-600 uppercase font-bold">
                      MPPT Index
                    </label>
                    <input
                      type="number"
                      value={mppt.mpptIndex}
                      onFocus={() => setFocusedItem(`mppt-${mppt.mpptIndex}`)}
                      onBlur={() => setFocusedItem(null)}
                      onChange={(e) =>
                        updateMppt(mppt.mpptIndex, { mpptIndex: parseInt(e.target.value) || 1 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-sky-400 focus:border-sky-500/30 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] text-slate-600 uppercase font-bold">
                      Entradas (pinos CC)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={mppt.inputCount}
                      onFocus={() => setFocusedItem(`mppt-${mppt.mpptIndex}`)}
                      onBlur={() => setFocusedItem(null)}
                      onChange={(e) =>
                        updateMppt(mppt.mpptIndex, {
                          inputCount: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:border-sky-500/30 outline-none"
                    />
                  </div>
                </div>

                {/* ── Labels das entradas individuais ───────────────────── */}
                {mppt.inputCount > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <label className="text-[7px] text-slate-600 uppercase font-bold block">
                      Labels das Entradas (MC4)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: mppt.inputCount }, (_, i) => {
                        const label = mppt.inputLabels?.[i] ?? `E${i + 1}`;
                        return (
                          <input
                            key={i}
                            type="text"
                            value={label}
                            maxLength={6}
                            onFocus={() => setFocusedItem(`mppt-${mppt.mpptIndex}`)}
                            onBlur={() => setFocusedItem(null)}
                            onChange={(e) => updateInputLabel(mppt.mpptIndex, i, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[9px] font-mono text-sky-300 focus:border-sky-500/30 outline-none text-center"
                            placeholder={`E${i + 1}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>

          {/* Saída CA */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">
              Saída CA (AC)
            </h4>
            <div
              className={`rounded-lg border p-3 transition-all duration-300 ${
                focusedItem === 'ac-out'
                  ? 'bg-slate-900/60 border-slate-700 shadow-xl'
                  : 'bg-slate-900/20 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                <Zap className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Terminal Principal
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[7px] text-slate-600 uppercase font-bold">Label</label>
                  <input
                    type="text"
                    value={footprint.acOutput.label}
                    onFocus={() => setFocusedItem('ac-out')}
                    onBlur={() => setFocusedItem(null)}
                    onChange={(e) =>
                      update({
                        ...footprint,
                        acOutput: { ...footprint.acOutput, label: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-emerald-400 focus:border-emerald-500/30 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] text-slate-600 uppercase font-bold">Fases</label>
                  <select
                    value={footprint.acOutput.phase}
                    onFocus={() => setFocusedItem('ac-out')}
                    onBlur={() => setFocusedItem(null)}
                    onChange={(e) =>
                      update({
                        ...footprint,
                        acOutput: {
                          ...footprint.acOutput,
                          phase: e.target.value as 'mono' | 'tri',
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:border-emerald-500/30 outline-none"
                  >
                    <option value="mono">1φ — Monofásico</option>
                    <option value="tri">3φ — Trifásico</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
