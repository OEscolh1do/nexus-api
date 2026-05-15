import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { useParametricSymbolBuilder } from '@/hooks/useParametricSymbolBuilder';
import type { ParametricSymbolConfig, PortKey } from '@/lib/types/parametricSymbol';

interface ParametricSymbolBuilderProps {
  /** Config inicial para edição (null = criação nova) */
  initialConfig?: ParametricSymbolConfig | null;
  /** Callback chamado com o JSON final quando o pai faz submit */
  onChange: (config: ParametricSymbolConfig | null) => void;
}

const POLARITY_COLORS = {
  positive: 'text-red-400 border-red-500/30 bg-red-500/5',
  negative: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  'ac-out': 'text-slate-400 border-slate-600 bg-slate-900/50',
};

/**
 * ParametricSymbolBuilder
 *
 * Componente de edição visual de portas do inversor para o Sumaúma.
 * Estado completamente local (useState via hook) — não usa Zustand.
 * Renderiza um preview SVG simplificado do bloco e os controles de porta.
 */
export default function ParametricSymbolBuilder({
  initialConfig,
  onChange,
}: ParametricSymbolBuilderProps) {
  const { config, addMpptPair, removeMpptPair, updateLabel, reset, toJSON } =
    useParametricSymbolBuilder(initialConfig);

  // Notifica o pai em cada mudança para manter o formData sincronizado
  const handleAddMppt = () => {
    addMpptPair();
    onChange(toJSON());
  };

  const handleRemove = (mpptIndex: number) => {
    removeMpptPair(mpptIndex);
    onChange(toJSON());
  };

  const handleLabelChange = (key: PortKey, label: string) => {
    updateLabel(key, label);
    onChange(toJSON());
  };

  // Agrupamento de portas para exibição
  const portEntries = Object.entries(config.ports) as [PortKey, typeof config.ports[string]][];
  const mpptIndices = [
    ...new Set(
      portEntries
        .filter(([, p]) => p.mpptIndex !== undefined)
        .map(([, p]) => p.mpptIndex as number)
    ),
  ].sort((a, b) => a - b);

  const mpptCount = mpptIndices.length;
  const W = 80;
  const H = Math.max(80, mpptCount * 28 + 32);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Símbolo Paramétrico
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleAddMppt}
            className="flex items-center gap-1 rounded-sm border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Adicionar MPPT
          </button>
          <button
            type="button"
            onClick={() => { reset(); onChange(null); }}
            className="flex items-center gap-1 rounded-sm border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Preview SVG */}
        <div className="shrink-0 rounded-sm border border-slate-700 bg-slate-950 p-3">
          <svg
            viewBox={`-20 0 ${W + 40} ${H}`}
            width={W + 40}
            height={H}
            className="overflow-visible"
          >
            {/* Corpo */}
            <rect x={0} y={0} width={W} height={H} fill="#0f172a" stroke="#334155" strokeWidth={1.5} rx={2} />
            <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="middle" fill="#334155" fontSize={9} fontFamily="monospace">
              INV
            </text>

            {/* Pinos MPPT (esquerda) */}
            {mpptIndices.map((idx, i) => {
              const offset = (i + 1) / (mpptCount + 1);
              const yPos = offset * H;
              return (
                <g key={idx}>
                  <line x1={-14} y1={yPos - 5} x2={0} y2={yPos - 5} stroke="#ef4444" strokeWidth={1} />
                  <circle cx={-14} cy={yPos - 5} r={3} fill="#0f172a" stroke="#ef4444" strokeWidth={1.2} />
                  <line x1={-14} y1={yPos + 5} x2={0} y2={yPos + 5} stroke="#3b82f6" strokeWidth={1} />
                  <circle cx={-14} cy={yPos + 5} r={3} fill="#0f172a" stroke="#3b82f6" strokeWidth={1.2} />
                  <text x={-18} y={yPos} textAnchor="end" dominantBaseline="middle" fill="#475569" fontSize={7} fontFamily="monospace">
                    M{idx}
                  </text>
                </g>
              );
            })}

            {/* Pino CA (direita) */}
            <line x1={W} y1={H / 2} x2={W + 14} y2={H / 2} stroke="#94a3b8" strokeWidth={1} />
            <circle cx={W + 14} cy={H / 2} r={3} fill="#0f172a" stroke="#94a3b8" strokeWidth={1.2} />
            <text x={W + 18} y={H / 2} textAnchor="start" dominantBaseline="middle" fill="#475569" fontSize={7} fontFamily="monospace">
              CA
            </text>
          </svg>
        </div>

        {/* Lista de portas */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Portas MPPT */}
          {mpptIndices.map((idx) => {
            const posKey = `mppt_${idx}_pos` as PortKey;
            const negKey = `mppt_${idx}_neg` as PortKey;
            const posPort = config.ports[posKey];
            const negPort = config.ports[negKey];

            return (
              <div key={idx} className="rounded-sm border border-slate-800 bg-slate-900 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">MPPT {idx}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="rounded-sm p-0.5 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {posPort && (
                    <div className={`flex items-center gap-1 rounded-sm border px-1.5 py-1 ${POLARITY_COLORS.positive}`}>
                      <span className="text-[9px] shrink-0">+</span>
                      <input
                        type="text"
                        value={posPort.label}
                        onChange={(e) => handleLabelChange(posKey, e.target.value)}
                        maxLength={20}
                        className="w-full bg-transparent text-[10px] font-mono outline-none placeholder:text-slate-700"
                        placeholder="label+"
                      />
                    </div>
                  )}
                  {negPort && (
                    <div className={`flex items-center gap-1 rounded-sm border px-1.5 py-1 ${POLARITY_COLORS.negative}`}>
                      <span className="text-[9px] shrink-0">−</span>
                      <input
                        type="text"
                        value={negPort.label}
                        onChange={(e) => handleLabelChange(negKey, e.target.value)}
                        maxLength={20}
                        className="w-full bg-transparent text-[10px] font-mono outline-none placeholder:text-slate-700"
                        placeholder="label−"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pino CA fixo */}
          {config.ports['ac_out'] && (
            <div className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 ${POLARITY_COLORS['ac-out']}`}>
              <span className="text-[9px] font-mono text-slate-500 shrink-0">AC OUT</span>
              <input
                type="text"
                value={config.ports['ac_out'].label}
                onChange={(e) => handleLabelChange('ac_out', e.target.value)}
                maxLength={20}
                className="flex-1 bg-transparent text-[10px] font-mono text-slate-400 outline-none"
              />
              <span className="text-[9px] text-slate-600 shrink-0">fixo • offset 0.5</span>
            </div>
          )}

          {mpptCount === 0 && (
            <p className="text-[10px] text-slate-600 italic px-1">
              Nenhuma porta MPPT configurada. Clique em "Adicionar MPPT".
            </p>
          )}
        </div>
      </div>

      {/* Resumo técnico */}
      <div className="flex items-center gap-4 rounded-sm border border-slate-800 bg-slate-900/40 px-3 py-2">
        <span className="text-[10px] text-slate-500">
          <span className="font-mono text-slate-300">{mpptCount}</span> MPPT(s)
        </span>
        <span className="text-[10px] text-slate-500">
          <span className="font-mono text-slate-300">{portEntries.length}</span> portas total
        </span>
        <span className="text-[10px] text-slate-600 font-mono">
          type: parametric-block
        </span>
      </div>
    </div>
  );
}
