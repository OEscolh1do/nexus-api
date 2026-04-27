import React, { useState, useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { LoadItem } from '@/core/state/slices/clientSlice';
import { Pencil, Trash2, Plus, Zap, ChevronRight, Sparkles } from 'lucide-react';


// Library of common electrical loads with realistic engineering data
const LOAD_PRESETS = [
  { name: 'Ar-condicionado 12k BTU', power: 1200, hoursPerDay: 8 },
  { name: 'Geladeira Duplex', power: 150, hoursPerDay: 24 },
  { name: 'Chuveiro Elétrico', power: 5500, hoursPerDay: 0.5 },
  { name: 'Lavadora de Roupas', power: 500, hoursPerDay: 1 },
  { name: 'Micro-ondas', power: 1200, hoursPerDay: 0.2 },
  { name: 'Carregador VE', power: 7000, hoursPerDay: 4 },
  { name: 'Bomba de Piscina', power: 750, hoursPerDay: 6 },
  { name: 'Forno Elétrico', power: 1800, hoursPerDay: 0.5 },
];

const calcKwh = (item: Partial<LoadItem>) => {
  if (!item.power || !item.hoursPerDay || !item.daysPerMonth) return 0;
  const duty = item.dutyCycle ?? 1;
  const qty = item.qty ?? 1;
  return (item.power * duty * item.hoursPerDay * item.daysPerMonth * qty) / 1000;
};

interface SimulatedLoadsPanelProps {
  /** Compact mode for sidebar rendering */
  compact?: boolean;
  /** Total consumption average (kWh/month) for footer projection display */
  projectionAvg?: number;
}

export const SimulatedLoadsPanel: React.FC<SimulatedLoadsPanelProps> = ({ 
  compact: _compact = false,
  projectionAvg,
}) => {
  const entities = useSolarStore(s => s.simulatedItems.entities);
  const simulatedItems = useMemo(() => Object.values(entities), [entities]);
  const addLoadItem = useSolarStore(s => s.addLoadItem);
  const updateLoadItem = useSolarStore(s => s.updateLoadItem);
  const removeLoadItem = useSolarStore(s => s.removeLoadItem);

  const totalCargasKwh = useMemo(() => {
    return simulatedItems.reduce((acc, item) => {
      const duty = item.dutyCycle ?? 1;
      const days = item.daysPerMonth ?? 30;
      return acc + ((item.power * duty * item.hoursPerDay * days * item.qty) / 1000);
    }, 0);
  }, [simulatedItems]);

  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Form State
  const defaultFormState: Partial<LoadItem> = {
    name: '',
    power: 0,
    hoursPerDay: 8,
    daysPerMonth: 30,
    qty: 1,
    dutyCycle: 1,
  };
  const [form, setForm] = useState<Partial<LoadItem>>(defaultFormState);

  const handleAddItem = () => {
    if (!form.name || !form.power || form.power <= 0) return;
    addLoadItem({
      id: crypto.randomUUID(),
      name: form.name,
      power: form.power,
      perfil: 'constante',
      hoursPerDay: form.hoursPerDay!,
      daysPerMonth: form.daysPerMonth!,
      qty: form.qty!,
      dutyCycle: form.dutyCycle!,
    } as LoadItem);
    setForm(defaultFormState);
  };

  const applyPreset = (presetIndex: number) => {
    const preset = LOAD_PRESETS[presetIndex];
    if (!preset) return;
    setForm({
      ...defaultFormState,
      name: preset.name,
      power: preset.power,
      hoursPerDay: preset.hoursPerDay,
    });
  };

  return (
    <div className="flex flex-col h-full gap-0">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
          <Zap size={10} className="text-amber-500/70" /> Inventário de Cargas
        </span>
        {totalCargasKwh > 0 && (
          <span className="text-[10px] font-mono font-black text-amber-500 tabular-nums">
            +{totalCargasKwh.toFixed(2)} kWh
          </span>
        )}
      </div>

      {/* ── SEÇÃO 1: ATALHO RÁPIDO ───────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={8} className="text-slate-600" />
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em]">Atalho Rápido</span>
        </div>
        <select
          value=""
          onChange={e => {
            const idx = Number(e.target.value);
            if (!isNaN(idx)) applyPreset(idx);
          }}
          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[10px] text-slate-400 font-mono uppercase tracking-tight focus:border-amber-500/50 outline-none transition-all cursor-pointer hover:border-slate-700"
        >
          <option value="">Selecionar modelo de carga...</option>
          {LOAD_PRESETS.map((p, i) => (
            <option key={p.name} value={i}>{p.name} — {p.power}W</option>
          ))}
        </select>
      </div>

      {/* ── SEÇÃO 2: NOVA CARGA ─────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Plus size={8} className="text-slate-600" />
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em]">Nova Carga</span>
        </div>
        <div className="flex flex-col gap-2 p-3 bg-slate-950 border border-slate-800 rounded-sm">
          <input
            placeholder="NOME DA CARGA (Ex: Ar Quarto)"
            value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="w-full h-8 bg-slate-900 border border-slate-800 rounded-sm px-2 text-[10px] text-slate-200 focus:outline-none focus:border-sky-500/50 font-mono uppercase tracking-tight transition-colors"
          />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-slate-600 font-black uppercase text-center tracking-widest">Potência (W)</label>
              <input
                type="number" min={1}
                value={form.power || ''}
                onChange={e => setForm(f => ({...f, power: Number(e.target.value)}))}
                className="w-full h-8 bg-slate-900 border border-slate-800 rounded-sm px-1 text-[10px] text-sky-400 focus:outline-none focus:border-sky-500/50 font-mono text-center tabular-nums font-bold transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] text-slate-600 font-black uppercase text-center tracking-widest">Uso (H/Dia)</label>
              <input
                type="number" min={0.1} step={0.5}
                value={form.hoursPerDay || ''}
                onChange={e => setForm(f => ({...f, hoursPerDay: Number(e.target.value)}))}
                className="w-full h-8 bg-slate-900 border border-slate-800 rounded-sm px-1 text-[10px] text-slate-300 focus:outline-none focus:border-sky-500/50 font-mono text-center tabular-nums transition-colors"
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={!form.name || !form.power || form.power <= 0}
              className="h-8 mt-auto bg-sky-600 hover:bg-sky-500 text-slate-950 text-[9px] font-black uppercase tracking-[0.15em] rounded-sm transition-all disabled:opacity-20 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus size={10} strokeWidth={3} /> Add
            </button>
          </div>
          {/* Impacto Preview */}
          {form.power! > 0 && form.hoursPerDay! > 0 && (
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
              <span className="text-[8px] text-slate-600 uppercase font-black tracking-widest flex items-center gap-1">
                <ChevronRight size={8} className="text-emerald-600" /> Incremento:
              </span>
              <span className="text-[10px] font-mono font-black text-emerald-400 tabular-nums">
                +{calcKwh(form).toFixed(2)} kWh/mês
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── SEÇÃO 3: CARGAS ATIVAS ────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Zap size={8} className="text-slate-600" />
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.15em]">Cargas Ativas</span>
          </div>
          {simulatedItems.length > 0 && (
            <span className="text-[8px] font-mono text-slate-600 tabular-nums">{simulatedItems.length} item{simulatedItems.length > 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-slate-800 rounded-sm bg-slate-900/50">
          {simulatedItems.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center opacity-30">
              <div className="w-8 h-8 border border-dashed border-slate-600 rounded-full flex items-center justify-center mb-2">
                <Zap size={14} className="text-slate-600" />
              </div>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic">Inventário Vazio</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {simulatedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-800/60 last:border-0 hover:bg-sky-500/[0.03] group transition-all">
                  {/* Indicador Lego */}
                  <div className="w-1 self-stretch bg-sky-500/20 group-hover:bg-sky-500 transition-colors rounded-full" />

                  {/* Nome */}
                  <div className="flex-1 min-w-0">
                    {editingItem === item.id ? (
                      <input
                        autoFocus
                        defaultValue={item.name}
                        onBlur={(e) => {
                          updateLoadItem(item.id, { name: e.target.value });
                          setEditingItem(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            updateLoadItem(item.id, { name: (e.target as HTMLInputElement).value });
                            setEditingItem(null);
                          }
                        }}
                        className="w-full bg-slate-950 border border-sky-500/50 rounded-sm px-2 py-0.5 text-[10px] text-sky-300 focus:outline-none font-mono uppercase"
                      />
                    ) : (
                      <>
                        <p className="text-[10px] font-black text-slate-200 truncate uppercase tracking-wider mb-0.5">{item.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono tabular-nums flex items-center gap-1.5">
                          <span className="text-sky-500/70">{item.power}W</span>
                          <span className="opacity-30">|</span>
                          <span>{item.hoursPerDay}h/dia</span>
                          {item.qty > 1 && (
                            <>
                              <span className="opacity-30">|</span>
                              <span className="text-amber-500/60">×{item.qty} un</span>
                            </>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  {/* kWh */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[11px] font-mono text-sky-400 tabular-nums font-black leading-none mb-0.5">
                      {calcKwh(item).toFixed(2)}
                    </span>
                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">kWh/mês</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                      className="w-6 h-6 flex items-center justify-center hover:text-sky-400 text-slate-600 transition-colors bg-slate-950 border border-slate-800 rounded-sm"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={() => removeLoadItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center hover:text-red-400 text-slate-600 transition-colors bg-slate-950 border border-slate-800 rounded-sm"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER (Total + Projeção) ───────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
        {totalCargasKwh > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Total Cargas</span>
            <span className="text-[10px] font-mono text-amber-500 tabular-nums font-black">
              +{totalCargasKwh.toFixed(2)} kWh/mês
            </span>
          </div>
        )}
        {projectionAvg !== undefined && (
          <div className="px-2.5 py-2 bg-slate-950 border border-sky-500/20 rounded-sm flex items-center justify-between">
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Projeção Média</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-mono font-black text-sky-400 tabular-nums">{projectionAvg.toFixed(2)}</span>
              <span className="text-[8px] text-slate-600 font-bold uppercase">kWh/mês</span>
            </div>
          </div>
        )}
        <p className="text-[8px] text-slate-700 italic leading-relaxed uppercase font-bold">
          * Recalculado com irradiançia local TMY.
        </p>
      </div>
    </div>
  );
};

