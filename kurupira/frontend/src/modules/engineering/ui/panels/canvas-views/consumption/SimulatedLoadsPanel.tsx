import React, { useState, useMemo } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { LoadItem } from '@/core/state/slices/clientSlice';
import { Pencil, Trash2, Plus, Zap } from 'lucide-react';


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
    <div className="flex flex-col h-full">
      
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
          <Zap size={10} className="text-amber-500/70" /> Inventário de Cargas
        </span>
        {totalCargasKwh > 0 && (
          <span className="text-[10px] font-mono font-black text-amber-500 tabular-nums">
            +{totalCargasKwh.toFixed(0)} kWh
          </span>
        )}
      </div>

      {/* ── BIBLIOTECA (SELECT COMPACTO) ──────────────────────────── */}
      <select
        value=""
        onChange={e => {
          const idx = Number(e.target.value);
          if (!isNaN(idx)) applyPreset(idx);
        }}
        className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-1.5 text-[10px] text-slate-400 font-mono uppercase tracking-tight focus:border-amber-500/50 outline-none transition-all mb-3 cursor-pointer"
      >
        <option value="">⚡ Selecionar carga comum...</option>
        {LOAD_PRESETS.map((p, i) => (
          <option key={p.name} value={i}>{p.name} — {p.power}W</option>
        ))}
      </select>

      {/* ── FORMULÁRIO DE ADIÇÃO (Compacto / Empilhado) ───────────── */}
      <div className="flex flex-col gap-2 mb-3 p-2.5 bg-slate-950 border border-slate-800 rounded-sm">
        <input 
          placeholder="Nome da carga"
          value={form.name} 
          onChange={e => setForm(f => ({...f, name: e.target.value}))}
          className="w-full h-7 bg-transparent border border-slate-800 rounded-sm px-2 text-[10px] text-slate-200 focus:outline-none focus:border-sky-500/50 font-mono uppercase tracking-tight" 
        />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-600 font-bold uppercase text-center">W</label>
            <input 
              type="number" min={1}
              value={form.power || ''} 
              onChange={e => setForm(f => ({...f, power: Number(e.target.value)}))}
              className="w-full h-7 bg-transparent border border-slate-800 rounded-sm px-1 text-[10px] text-sky-400 focus:outline-none focus:border-sky-500/50 font-mono text-center tabular-nums" 
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-600 font-bold uppercase text-center">H/Dia</label>
            <input 
              type="number" min={0.1} step={0.5}
              value={form.hoursPerDay || ''} 
              onChange={e => setForm(f => ({...f, hoursPerDay: Number(e.target.value)}))}
              className="w-full h-7 bg-transparent border border-slate-800 rounded-sm px-1 text-[10px] text-slate-300 focus:outline-none focus:border-sky-500/50 font-mono text-center" 
            />
          </div>
          <button
            onClick={handleAddItem}
            disabled={!form.name || !form.power || form.power <= 0}
            className="h-7 mt-auto bg-sky-600 hover:bg-sky-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all disabled:opacity-20 flex items-center justify-center gap-1"
          >
            <Plus size={10} /> Add
          </button>
        </div>
        {/* Impacto Preview */}
        {form.power! > 0 && form.hoursPerDay! > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
            <span className="text-[9px] text-slate-600 uppercase font-bold">Impacto:</span>
            <span className="text-[9px] font-mono font-black text-sky-500 tabular-nums">
              {calcKwh(form).toFixed(1)} kWh/mês
            </span>
          </div>
        )}
      </div>

      {/* ── LISTA DE CARGAS (Scroll interno) ──────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-slate-800 rounded-sm bg-slate-900">
        {simulatedItems.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">Nenhuma carga simulada</p>
          </div>
        ) : (
          simulatedItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 group transition-colors">
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
                    className="w-full bg-slate-950 border border-sky-500/50 rounded-sm px-1.5 py-0.5 text-[10px] text-sky-300 focus:outline-none font-mono"
                  />
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-slate-300 truncate uppercase tracking-tight">{item.name}</p>
                    <p className="text-[9px] text-slate-600 font-mono tabular-nums">
                      {item.power}W · {item.hoursPerDay}h{item.qty > 1 ? ` · ×${item.qty}` : ''}
                    </p>
                  </>
                )}
              </div>

              {/* kWh */}
              <span className="text-[10px] font-mono text-sky-500 tabular-nums font-black shrink-0">
                {calcKwh(item).toFixed(0)}
              </span>
              <span className="text-[8px] text-sky-600/50 font-bold uppercase shrink-0">kWh</span>

              {/* Actions */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                  className="p-0.5 hover:text-sky-400 text-slate-600 transition-colors"
                >
                  <Pencil size={9} />
                </button>
                <button 
                  onClick={() => removeLoadItem(item.id)}
                  className="p-0.5 hover:text-red-400 text-slate-600 transition-colors"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FOOTER (Total + Projeção) ─────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2.5">
        {totalCargasKwh > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Total Cargas</span>
            <span className="text-[10px] font-mono text-amber-500 tabular-nums font-black">
              +{totalCargasKwh.toFixed(1)} kWh/mês
            </span>
          </div>
        )}
        {projectionAvg !== undefined && (
          <div className="px-2.5 py-2 bg-slate-950 border border-sky-500/20 rounded-sm flex items-center justify-between">
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Projeção Média</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-mono font-black text-sky-500/80 tabular-nums">{projectionAvg.toFixed(1)}</span>
              <span className="text-[8px] text-slate-600 font-bold uppercase">kWh/mês</span>
            </div>
          </div>
        )}
        <p className="text-[8px] text-slate-700 italic leading-relaxed uppercase font-bold">
          * Recalculado com irradiância local TMY.
        </p>
      </div>
    </div>
  );
};
