import { useState } from 'react';
import { Plus, Trash2, RotateCcw, Layers, GripVertical } from 'lucide-react';
import { useParametricSymbolBuilder } from '@/hooks/useParametricSymbolBuilder';
import type { ParametricSymbolConfig, PortKey } from '@/lib/types/parametricSymbol';

interface ParametricSymbolBuilderProps {
  initialConfig?: ParametricSymbolConfig | null;
  onChange: (config: ParametricSymbolConfig | null) => void;
}

const POLARITY_COLORS = {
  positive: '#ef4444',
  negative: '#3b82f6',
  'ac-out': '#10b981',
};

export default function ParametricSymbolBuilder({
  initialConfig,
  onChange,
}: ParametricSymbolBuilderProps) {
  const [focusedPort, setFocusedPort] = useState<string | null>(null);
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const { config, addMpptPair, removeMpptPair, updateLabel, updateOffset, updateDimensions, reorderMppt, reset } =
    useParametricSymbolBuilder(initialConfig, onChange);

  const handleAddMppt = () => {
    addMpptPair();
  };

  const handleRemove = (mpptIndex: number) => {
    removeMpptPair(mpptIndex);
  };

  const portEntries = Object.entries(config.ports) as [PortKey, any][];
  // Ordenar por offset (topo→base) para que a lista espelhe a ordem visual do SVG.
  // Após drag-to-reorder os offsets trocam; a ordenação por índice numérico
  // não refletiria a nova sequência.
  const mpptIndices = [
    ...new Set(
      portEntries
        .filter(([, p]) => p.mpptIndex !== undefined)
        .map(([, p]) => p.mpptIndex as number)
    ),
  ].sort((a, b) => {
    const offA = config.ports[`mppt_${a}_pos` as PortKey]?.offset ?? 0;
    const offB = config.ports[`mppt_${b}_pos` as PortKey]?.offset ?? 0;
    return offA - offB;
  });

  const mpptCount = mpptIndices.length;
  // Usar dimensões reais do config (editáveis pelo usuário)
  const W = config.dimensions.width;
  const H = config.dimensions.height;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Layers className="h-4 w-4 text-slate-500" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
             Símbolo Unifilar (IEC 60617)
           </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddMppt}
            className="flex items-center gap-1 rounded-sm border border-slate-700 bg-slate-800 px-3 py-1.5 text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-all uppercase"
          >
            <Plus className="h-3 w-3" />
            Add MPPT
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-sm border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-[9px] font-bold text-slate-600 hover:text-slate-400 transition-all uppercase"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* Preview SVG - Identidade Total com a Ficha Técnica */}
        <div className="w-full max-w-[280px] rounded-sm border border-slate-800/50 bg-slate-900/30 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <svg
            viewBox={`-25 -10 ${W + 50} ${H + 20}`}
            width={W + 50}
            height={H + 20}
            className="overflow-visible drop-shadow-2xl"
          >
            {/* Sombra de Profundidade (Fidelidade Ficha Técnica) */}
            <rect x={2} y={2} width={W} height={H} fill="black" opacity={0.2} rx={2} />
            
            {/* Corpo Principal */}
            <rect x={0} y={0} width={W} height={H} fill="#0f172a" stroke="#334155" strokeWidth={1.5} rx={2} />
            
            {/* Divisor Diagonal */}
            <line x1={0} y1={H} x2={W} y2={0} stroke="#334155" strokeWidth={1} opacity={0.6} />
            
            {/* Símbolo CC (=) */}
            <g transform={`translate(${W * 0.28}, ${H * 0.28})`}>
              <line x1={-4} y1={-1.5} x2={4} y2={-1.5} stroke="#475569" strokeWidth={1.2} />
              <line x1={-4} y1={1.5} x2={4} y2={1.5} stroke="#475569" strokeWidth={1.2} />
            </g>

            {/* Símbolo CA (~) */}
            <g transform={`translate(${W * 0.72}, ${H * 0.72})`}>
              <path d="M-4,0 C-4,-4 -1,-4 0,0 C1,4 4,4 4,0" fill="none" stroke="#475569" strokeWidth={1.2} />
            </g>

            {/* Pinos MPPT (ESQUERDA) — usa offset real do config */}
            {mpptIndices.map((idx, i) => {
              const posKey = `mppt_${idx}_pos` as PortKey;
              const negKey = `mppt_${idx}_neg` as PortKey;
              // Usa offset armazenado no porto (editado pelo slider); fallback uniforme
              const storedOffset = config.ports[posKey]?.offset ?? (i + 1) / (mpptCount + 1);
              const y = storedOffset * H;

              const isPosFocused = focusedPort === posKey;
              const isNegFocused = focusedPort === negKey;
              const PIN_GAP = Math.max(4, H * 0.04); // espaçamento dinâmico +/−

              return (
                <g key={idx}>
                  {/* Positivo */}
                  <line x1={-12} y1={y - PIN_GAP} x2={0} y2={y - PIN_GAP} stroke={POLARITY_COLORS.positive} strokeWidth={isPosFocused ? 2 : 1.2} className="transition-all" />
                  <circle
                    cx={-12} cy={y - PIN_GAP} r={isPosFocused ? 3.5 : 2.5}
                    fill="#0f172a" stroke={POLARITY_COLORS.positive} strokeWidth={1.5}
                    className="transition-all"
                  />
                  {isPosFocused && <circle cx={-12} cy={y - PIN_GAP} r={6} fill={POLARITY_COLORS.positive} opacity={0.3} className="animate-pulse" />}

                  {/* Negativo */}
                  <line x1={-12} y1={y + PIN_GAP} x2={0} y2={y + PIN_GAP} stroke={POLARITY_COLORS.negative} strokeWidth={isNegFocused ? 2 : 1.2} className="transition-all" />
                  <circle
                    cx={-12} cy={y + PIN_GAP} r={isNegFocused ? 3.5 : 2.5}
                    fill="#0f172a" stroke={POLARITY_COLORS.negative} strokeWidth={1.5}
                    className="transition-all"
                  />
                  {isNegFocused && <circle cx={-12} cy={y + PIN_GAP} r={6} fill={POLARITY_COLORS.negative} opacity={0.3} className="animate-pulse" />}

                  <text x={-18} y={y} textAnchor="end" fontSize={6} fill="#475569" fontWeight="bold" dominantBaseline="middle" className="font-mono">MPPT {idx}</text>
                </g>
              );
            })}

            {/* Porta CA (DIREITA) */}
            <g>
              <line x1={W} y1={H / 2} x2={W + 12} y2={H / 2} stroke={POLARITY_COLORS['ac-out']} strokeWidth={focusedPort === 'ac_out' ? 2 : 1.2} className="transition-all" />
              <circle 
                cx={W + 12} cy={H / 2} r={focusedPort === 'ac_out' ? 3.5 : 2.5} 
                fill="#0f172a" stroke={POLARITY_COLORS['ac-out']} strokeWidth={1.5}
                className="transition-all"
              />
              {focusedPort === 'ac_out' && <circle cx={W + 12} cy={H / 2} r={6} fill={POLARITY_COLORS['ac-out']} opacity={0.3} className="animate-pulse" />}
              <text x={W + 16} y={H / 2} textAnchor="start" fontSize={6} fill="#475569" fontWeight="bold" dominantBaseline="middle" className="font-mono">AC</text>
            </g>
          </svg>
          <p className="text-[7px] text-slate-700 text-center mt-6 font-mono uppercase tracking-[0.3em]">PSB-ENGINE v2.0</p>
        </div>

        {/* Form Controls - Sobriedade Técnica */}
        <div className="w-full space-y-3">

          {/* ── Dimensões do Bloco ───────────────────────────────────────────── */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/20 p-3 space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Dimensões do Bloco (SVG)</span>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1">
                <label className="text-[7px] text-slate-600 uppercase font-bold">Largura (px)</label>
                <input
                  type="number"
                  min={40} max={300}
                  value={config.dimensions.width}
                  onChange={(e) => updateDimensions(parseInt(e.target.value) || 80, config.dimensions.height)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:border-sky-500/30 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] text-slate-600 uppercase font-bold">Altura (px)</label>
                <input
                  type="number"
                  min={60} max={500}
                  value={config.dimensions.height}
                  onChange={(e) => updateDimensions(config.dimensions.width, parseInt(e.target.value) || 120)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:border-sky-500/30 outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Canais MPPT ─────────────────────────────────────────────────── */}
          {mpptIndices.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/10 p-6 flex flex-col items-center gap-2 text-center">
              <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Plus className="h-4 w-4 text-slate-600" />
              </div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                Nenhum canal MPPT
              </p>
              <p className="text-[8px] text-slate-700 font-mono">
                Clique em "Add MPPT" para configurar as entradas CC do inversor.
              </p>
            </div>
          )}

          {mpptIndices.map((idx) => {
            const posKey = `mppt_${idx}_pos` as PortKey;
            const negKey = `mppt_${idx}_neg` as PortKey;
            const isMpptFocused = focusedPort === posKey || focusedPort === negKey;
            const isDragSrc = dragSrcIdx === idx;
            const currentOffset = config.ports[posKey]?.offset ?? 0.5;

            return (
              <div
                key={idx}
                draggable
                onDragStart={() => setDragSrcIdx(idx)}
                onDragEnd={() => setDragSrcIdx(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragSrcIdx !== null && dragSrcIdx !== idx) reorderMppt(dragSrcIdx, idx);
                  setDragSrcIdx(null);
                }}
                className={`rounded-lg border p-3 transition-all duration-300 cursor-default
                  ${isMpptFocused ? 'bg-slate-900/60 border-slate-700 shadow-xl' : 'bg-slate-900/20 border-slate-800'}
                  ${isDragSrc ? 'opacity-40 scale-[0.98]' : ''}
                  ${dragSrcIdx !== null && !isDragSrc ? 'border-dashed border-slate-600' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                   <div className="flex items-center gap-2">
                      <GripVertical className="h-3 w-3 text-slate-700 cursor-grab active:cursor-grabbing shrink-0" />
                      <div className={`h-1.5 w-1.5 rounded-full ${isMpptFocused ? 'bg-sky-400' : 'bg-slate-700'}`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Canal MPPT {idx}</span>
                   </div>
                   <button type="button" onClick={() => handleRemove(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3 w-3" />
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[7px] text-slate-600 uppercase font-bold">Terminal (+)</label>
                    <input
                      type="text"
                      value={config.ports[posKey]?.label || ''}
                      onFocus={() => setFocusedPort(posKey)}
                      onBlur={() => setFocusedPort(null)}
                      onChange={(e) => updateLabel(posKey, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-red-400 focus:border-red-500/30 outline-none transition-all"
                      placeholder="label+"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[7px] text-slate-600 uppercase font-bold">Terminal (-)</label>
                    <input
                      type="text"
                      value={config.ports[negKey]?.label || ''}
                      onFocus={() => setFocusedPort(negKey)}
                      onBlur={() => setFocusedPort(null)}
                      onChange={(e) => updateLabel(negKey, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-sky-400 focus:border-sky-500/30 outline-none transition-all"
                      placeholder="label-"
                    />
                  </div>
                </div>
                {/* Slider de posição vertical */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[7px] text-slate-600 uppercase font-bold">Posição Vertical no Bloco</label>
                    <span className="text-[7px] font-mono text-sky-400">{Math.round(currentOffset * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05} max={0.95} step={0.01}
                    value={currentOffset}
                    onFocus={() => setFocusedPort(posKey)}
                    onBlur={() => setFocusedPort(null)}
                    onChange={(e) => updateOffset(idx, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-sky-400
                      [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-[6px] text-slate-700 font-mono">
                    <span>Topo</span><span>Base</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* AC Port Card */}
          <div className={`rounded-lg border p-3 transition-all duration-300 ${focusedPort === 'ac_out' ? 'bg-slate-900/60 border-slate-700 shadow-xl' : 'bg-slate-900/20 border-slate-800'}`}>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                   <div className={`h-1.5 w-1.5 rounded-full ${focusedPort === 'ac_out' ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Saída Alternada (AC)</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] text-slate-600 uppercase font-bold">Label</label>
                  <input
                    type="text"
                    value={config.ports.ac_out?.label || ''}
                    onFocus={() => setFocusedPort('ac_out')}
                    onBlur={() => setFocusedPort(null)}
                    onChange={(e) => updateLabel('ac_out', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] font-mono text-emerald-400 focus:border-emerald-500/30 outline-none transition-all"
                  />
                </div>
          </div>
        </div>
      </div>
    </div>
  );
}
